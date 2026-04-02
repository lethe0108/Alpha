"use strict";
/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Persistent token storage implementation.
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
 */

import { larkLogger } from './lark-logger.js';
import darwinBackend from './backends/darwin-backend.js';
import linuxBackend from './backends/linux-backend.js';
import win32Backend from './backends/win32-backend.js';

const log = larkLogger('core/persistent-store');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const REFRESH_AHEAD_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Platform Selection
// ---------------------------------------------------------------------------
/**
 * Create backend for current platform.
 * 
 * @returns {Object} Backend implementation
 */
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
      await backend.deleteToken(key);
      return null;
    }
    
    log.debug(`token found for ${userOpenId} (expires: ${new Date(token.expiresAt).toISOString()})`);
    return token;
  } catch (error) {
    if (error.message.includes('not found') || error.code === 'ENOENT') {
      log.debug(`no token found for ${userOpenId}`);
      return null;
    }
    
    if (error instanceof SyntaxError) {
      log.error(`failed to parse token data for ${userOpenId}: ${error.message}`);
      // Delete corrupted data
      await backend.deleteToken(key).catch(() => {});
      return null;
    }
    
    log.error(`failed to get token for ${userOpenId}: ${error.message}`);
    throw error;
  }
}

/**
 * Persist a UAT to storage.
 * 
 * Overwrites any existing entry for the same (appId, userOpenId).
 * Token is encrypted and saved to disk.
 * 
 * @param {StoredUAToken} token - Token data object
 * @returns {Promise<void>}
 */
export async function setStoredToken(token) {
  const key = accountKey(token.appId, token.userOpenId);
  const data = JSON.stringify(token);
  
  try {
    await backend.saveToken(key, data);
    log.info(`saved UAT to storage for ${token.userOpenId} (at:${maskToken(token.accessToken)}, expires: ${new Date(token.expiresAt).toISOString()})`);
  } catch (error) {
    log.error(`failed to save token for ${token.userOpenId}: ${error.message}`);
    throw error;
  }
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
    const deleted = await backend.deleteToken(key);
    
    if (deleted) {
      log.info(`removed UAT from storage for ${userOpenId}`);
    } else {
      log.debug(`no UAT found for ${userOpenId}, nothing to remove`);
    }
    
    return deleted;
  } catch (error) {
    log.error(`failed to remove token for ${userOpenId}: ${error.message}`);
    throw error;
  }
}

/**
 * Check token status (valid/needs_refresh/expired).
 * 
 * @param {StoredUAToken} token - Token object
 * @returns {'valid' | 'needs_refresh' | 'expired'} Token status
 */
export function tokenStatus(token) {
  const now = Date.now();
  
  if (now < token.expiresAt - REFRESH_AHEAD_MS) {
    return 'valid';
  }
  
  if (now < token.refreshExpiresAt) {
    return 'needs_refresh';
  }
  
  return 'expired';
}

/**
 * Clear all tokens from storage.
 * 
 * @returns {Promise<number>} Number of tokens cleared
 */
export async function clearAllTokens() {
  try {
    const tokens = await getAllTokens();
    const count = tokens.length;
    
    for (const token of tokens) {
      const key = accountKey(token.appId, token.userOpenId);
      await backend.deleteToken(key).catch(() => {});
    }
    
    log.info(`cleared ${count} tokens from storage`);
    return count;
  } catch (error) {
    log.error(`failed to clear tokens: ${error.message}`);
    throw error;
  }
}

/**
 * Get all tokens (for migration).
 * 
 * @returns {Promise<StoredUAToken[]>} Array of token objects
 */
export async function getAllTokens() {
  try {
    const tokenData = await backend.getAllTokens();
    return tokenData.map(({ data }) => JSON.parse(data));
  } catch (error) {
    log.error(`failed to get all tokens: ${error.message}`);
    return [];
  }
}

/**
 * Get the number of tokens currently in storage.
 * 
 * @returns {Promise<number>} Token count
 */
export async function getTokenCount() {
  const tokens = await getAllTokens();
  return tokens.length;
}

/**
 * Get storage statistics.
 * 
 * @returns {Promise<{count: number, platform: string}>}
 */
export async function getMemoryStats() {
  const count = await getTokenCount();
  
  return {
    count,
    platform: process.platform,
    backend: process.platform === 'darwin' ? 'keychain' : 'encrypted-file'
  };
}

/**
 * Initialize persistent store.
 * 
 * @returns {Promise<void>}
 */
export async function initialize() {
  await backend.initialize();
  log.info('persistent store initialized');
}
