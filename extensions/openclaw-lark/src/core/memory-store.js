"use strict";
/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Pure in-memory token storage implementation.
 * 
 * Features:
 *   - Tokens stored only in process memory
 *   - No disk I/O overhead
 *   - Automatic cleanup on restart
 *   - User-level isolation ({appId}:{userOpenId})
 *   - Lazy expiration check
 */

import { larkLogger } from './lark-logger.js';
const log = larkLogger('core/memory-store');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const REFRESH_AHEAD_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// In-Memory Storage
// ---------------------------------------------------------------------------
/**
 * Token storage Map.
 * Key: `${appId}:${userOpenId}`
 * Value: StoredUAToken object
 */
const tokens = new Map();

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
 * 
 * @param {string} appId - Feishu application ID
 * @param {string} userOpenId - User's open_id
 * @returns {Promise<StoredUAToken | null>} Token object or null
 */
export async function getStoredToken(appId, userOpenId) {
  const key = accountKey(appId, userOpenId);
  const token = tokens.get(key);
  
  if (!token) {
    log.debug(`no token found for ${userOpenId}`);
    return null;
  }
  
  // Check expiration (lazy deletion)
  const now = Date.now();
  if (now > token.expiresAt) {
    log.info(`token expired for ${userOpenId}, removing from memory`);
    tokens.delete(key);
    return null;
  }
  
  log.debug(`token found for ${userOpenId} (expires: ${new Date(token.expiresAt).toISOString()})`);
  return token;
}

/**
 * Save token to in-memory storage.
 * 
 * Overwrites any existing entry for the same (appId, userOpenId).
 * Token exists only in process memory - NOT persisted to disk.
 * 
 * @param {StoredUAToken} token - Token data object
 * @returns {Promise<void>}
 */
export async function setStoredToken(token) {
  const key = accountKey(token.appId, token.userOpenId);
  tokens.set(key, token);
  
  log.info(`saved UAT to memory for ${token.userOpenId} (at:${maskToken(token.accessToken)}, expires: ${new Date(token.expiresAt).toISOString()})`);
}

/**
 * Remove a stored token from memory.
 * 
 * @param {string} appId - Feishu application ID
 * @param {string} userOpenId - User's open_id
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export async function removeStoredToken(appId, userOpenId) {
  const key = accountKey(appId, userOpenId);
  const deleted = tokens.delete(key);
  
  if (deleted) {
    log.info(`removed UAT from memory for ${userOpenId}`);
  } else {
    log.debug(`no UAT found for ${userOpenId}, nothing to remove`);
  }
  
  return deleted;
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
 * Clear all tokens from memory (for mode switch or testing).
 * 
 * @returns {Promise<number>} Number of tokens cleared
 */
export async function clearAllTokens() {
  const count = tokens.size;
  tokens.clear();
  log.info(`cleared ${count} tokens from memory`);
  return count;
}

/**
 * Get all tokens (for migration).
 * 
 * @returns {Promise<StoredUAToken[]>} Array of token objects
 */
export async function getAllTokens() {
  return Array.from(tokens.values());
}

/**
 * Get the number of tokens currently in memory.
 * 
 * @returns {Promise<number>} Token count
 */
export async function getTokenCount() {
  return tokens.size;
}

/**
 * Get memory usage statistics.
 * 
 * @returns {Promise<{count: number, estimatedSizeKB: number}>}
 */
export async function getMemoryStats() {
  const count = tokens.size;
  // Rough estimate: ~1KB per token (JSON serialized)
  const estimatedSizeKB = count * 1;
  
  return {
    count,
    estimatedSizeKB
  };
}

/**
 * Initialize memory store (no-op, but kept for API consistency).
 * 
 * @returns {Promise<void>}
 */
export async function initialize() {
  log.debug('memory store initialized');
}
