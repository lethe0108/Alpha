"use strict";
/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * UAT (User Access Token) Persistent Storage
 *
 * Features:
 *   - Tokens persisted to disk (encrypted)
 *   - Survives Gateway restarts
 *   - Platform-specific storage:
 *     - macOS: Keychain Access
 *     - Linux: AES-256-GCM encrypted files
 *     - Windows: AES-256-GCM encrypted files
 *   - User-level isolation ({appId}:{userOpenId})
 *   - Lazy expiration check
 *
 * Storage:
 *   - Encrypted files/Keychain
 *   - Key format: "{appId}:{userOpenId}"
 *   - Value: StoredUAToken object
 *
 * Token Lifecycle:
 *   - Saved on authorization success
 *   - Checked for expiration on every get
 *   - Lazily deleted when expired
 *   - NOT proactively refreshed (re-authorize on expiry)
 */

import { larkLogger } from './lark-logger.js';
import darwinBackend from './backends/darwin-backend.js';
import linuxBackend from './backends/linux-backend.js';
import win32Backend from './backends/win32-backend.js';

const log = larkLogger('core/token-store');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const KEYCHAIN_SERVICE = 'openclaw-feishu-uat';
const REFRESH_AHEAD_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Platform Selection
// ---------------------------------------------------------------------------
function createBackend() {
  switch (process.platform) {
    case 'darwin':
      log.debug('using macOS Keychain backend');
      return darwinBackend;
    case 'linux':
      log.debug('using Linux encrypted file backend');
      return linuxBackend;
    case 'win32':
      log.debug('using Windows encrypted file backend');
      return win32Backend;
    default:
      log.warn(`unsupported platform "${process.platform}", using Linux backend as fallback`);
      return linuxBackend;
  }
}

const backend = createBackend();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function accountKey(appId, userOpenId) {
  return `${appId}:${userOpenId}`;
}

/**
 * Mask a token for safe logging.
 * @param {string} token - Token to mask
 * @returns {string} Masked token
 */
function maskToken(token) {
  if (token.length <= 8) return '****';
  return `****${token.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get stored token for a given (appId, userOpenId) pair.
 * 
 * Returns null when:
 *   - No entry exists
 *   - Token is expired (lazy deletion)
 *   - Payload is unparseable
 * 
 * @param {string} appId - Feishu application ID
 * @param {string} userOpenId - User's open_id
 * @returns {Promise<StoredUAToken | null>} Token object or null
 */
export async function getStoredToken(appId, userOpenId) {
  const key = accountKey(appId, userOpenId);
  
  try {
    const data = await backend.loadToken(key);
    
    if (!data) {
      log.debug(`no token found for ${userOpenId}`);
      return null;
    }

    const token = JSON.parse(data);
    
    // Check expiration (lazy deletion)
    const now = Date.now();
    if (now > token.expiresAt) {
      log.info(`token expired for ${userOpenId}, removing from storage`);
      await backend.removeToken(key);
      return null;
    }
    
    log.debug(`token found for ${userOpenId} (expires: ${new Date(token.expiresAt).toISOString()})`);
    return token;
    
  } catch (err) {
    log.error(`failed to load token: ${err.message}`);
    return null;
  }
}

/**
 * Persist a UAT to storage.
 * 
 * Overwrites any existing entry for the same (appId, userOpenId).
 * 
 * @param {StoredUAToken} token - Token data object
 * @returns {Promise<void>}
 */
export async function setStoredToken(token) {
  const key = accountKey(token.appId, token.userOpenId);
  const payload = JSON.stringify(token);
  
  await backend.saveToken(key, payload);
  
  log.info(`saved UAT for ${token.userOpenId} (at:${maskToken(token.accessToken)}, expires: ${new Date(token.expiresAt).toISOString()})`);
}

/**
 * Remove a stored UAT from storage.
 * 
 * @param {string} appId - Feishu application ID
 * @param {string} userOpenId - User's open_id
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export async function removeStoredToken(appId, userOpenId) {
  const key = accountKey(appId, userOpenId);
  
  try {
    const deleted = await backend.removeToken(key);
    
    if (deleted) {
      log.info(`removed UAT for ${userOpenId}`);
    } else {
      log.debug(`no UAT found for ${userOpenId}, nothing to remove`);
    }
    
    return deleted;
  } catch (err) {
    log.error(`failed to remove token: ${err.message}`);
    return false;
  }
}

/**
 * Determine the freshness of a stored token.
 *
 * - `"valid"`         – access_token is still good (expires > 5 min from now)
 * - `"needs_refresh"` – access_token expired/expiring but refresh_token is valid
 * - `"expired"`       – both tokens are expired; re-authorization required
 *
 * @param {StoredUAToken} token - Token object
 * @returns {'valid' | 'needs_refresh' | 'expired'} Token status
 */
export function tokenStatus(token) {
  const now = Date.now();
  
  if (now < token.expiresAt - REFRESH_AHEAD_MS) {
    return 'valid';
  }
  
  if (token.refreshExpiresAt && now < token.refreshExpiresAt) {
    return 'needs_refresh';
  }
  
  return 'expired';
}

/**
 * Get metadata for all stored tokens (for debugging).
 * 
 * @returns {Promise<Array<{userOpenId: string, appId: string, expiresAt: number, scope: string}>>}
 */
export async function getAllTokens() {
  if (typeof backend.listTokens === 'function') {
    const tokens = await backend.listTokens();
    return tokens.map(t => ({
      userOpenId: t.userOpenId,
      appId: t.appId,
      expiresAt: t.expiresAt,
      scope: t.scope,
      grantedAt: t.grantedAt
    }));
  }
  
  log.warn('listTokens not supported by backend');
  return [];
}

/**
 * Get the number of tokens currently in storage (for monitoring).
 * 
 * @returns {Promise<number>} Token count
 */
export async function getTokenCount() {
  if (typeof backend.countTokens === 'function') {
    return backend.countTokens();
  }
  
  const tokens = await getAllTokens();
  return tokens.length;
}
