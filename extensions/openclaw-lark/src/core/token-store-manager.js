"use strict";
/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Token storage manager.
 * 
 * Provides unified API for token storage with configurable backend:
 *   - memory: Pure in-memory storage (no persistence)
 *   - persistent: File/Keychain-based encrypted storage
 * 
 * Features:
 *   - Configuration-driven backend selection
 *   - Runtime mode switching (optional)
 *   - Data migration between modes
 *   - Unified API regardless of backend
 */

import { larkLogger } from './lark-logger.js';
import { OAUTH_STORAGE_CONFIG, isValidStorageMode, getValidStorageMode } from '../config/oauth-config.js';
import * as memoryStore from './memory-store.js';
import * as persistentStore from './persistent-store.js';

const log = larkLogger('core/token-store-manager');

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
/**
 * Current storage mode.
 * @type {'memory' | 'persistent'}
 */
let currentMode = OAUTH_STORAGE_CONFIG.DEFAULT_MODE;

/**
 * Current active backend.
 * @type {Object}
 */
let activeBackend = null;

/**
 * Whether the store has been initialized.
 * @type {boolean}
 */
let initialized = false;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize the storage manager.
 * 
 * Loads configuration and selects appropriate backend.
 * 
 * @param {Object} config - Configuration object
 * @returns {Promise<void>}
 */
export async function initialize(config = {}) {
  if (initialized) {
    log.debug('already initialized, skipping');
    return;
  }
  
  // Get storage mode from config
  const storageMode = config.oauth?.storage?.mode || OAUTH_STORAGE_CONFIG.DEFAULT_MODE;
  
  // Validate and normalize mode
  const validMode = getValidStorageMode(storageMode);
  if (validMode !== storageMode) {
    log.warn(`Invalid storage mode "${storageMode}", using default "${OAUTH_STORAGE_CONFIG.DEFAULT_MODE}"`);
  }
  
  currentMode = validMode;
  
  // Select backend
  activeBackend = currentMode === 'memory' ? memoryStore : persistentStore;
  
  // Initialize the backend
  await activeBackend.initialize();
  
  initialized = true;
  
  log.info(`Token storage initialized: ${currentMode}`);
}

/**
 * Ensure the store is initialized.
 * 
 * @param {Object} config - Configuration object
 * @returns {Promise<void>}
 */
async function ensureInitialized(config = {}) {
  if (!initialized) {
    await initialize(config);
  }
}

// ---------------------------------------------------------------------------
// Public API - Unified credential operations
// ---------------------------------------------------------------------------

/**
 * Get stored token for a given (appId, userOpenId) pair.
 * 
 * @param {string} appId - Feishu application ID
 * @param {string} userOpenId - User's open_id
 * @param {Object} config - Configuration object
 * @returns {Promise<StoredUAToken | null>} Token object or null
 */
export async function getStoredToken(appId, userOpenId, config = {}) {
  await ensureInitialized(config);
  return activeBackend.getStoredToken(appId, userOpenId);
}

/**
 * Save token to storage.
 * 
 * @param {StoredUAToken} token - Token data object
 * @param {Object} config - Configuration object
 * @returns {Promise<void>}
 */
export async function setStoredToken(token, config = {}) {
  await ensureInitialized(config);
  return activeBackend.setStoredToken(token);
}

/**
 * Remove a stored token from storage.
 * 
 * @param {string} appId - Feishu application ID
 * @param {string} userOpenId - User's open_id
 * @param {Object} config - Configuration object
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export async function removeStoredToken(appId, userOpenId, config = {}) {
  await ensureInitialized(config);
  return activeBackend.removeStoredToken(appId, userOpenId);
}

/**
 * Check token status (valid/needs_refresh/expired).
 * 
 * @param {StoredUAToken} token - Token object
 * @returns {'valid' | 'needs_refresh' | 'expired'} Token status
 */
export function tokenStatus(token) {
  // tokenStatus is the same for both backends
  return persistentStore.tokenStatus(token);
}

// ---------------------------------------------------------------------------
// Mode Switching
// ---------------------------------------------------------------------------

/**
 * Switch storage mode at runtime.
 * 
 * @param {string} newMode - New storage mode ('memory' or 'persistent')
 * @param {boolean} migrate - Whether to migrate existing tokens
 * @param {Object} config - Configuration object
 * @returns {Promise<void>}
 */
export async function switchStorageMode(newMode, migrate = false, config = {}) {
  await ensureInitialized(config);
  
  const validMode = getValidStorageMode(newMode);
  if (validMode !== newMode) {
    log.warn(`Invalid storage mode "${newMode}", using "${validMode}"`);
  }
  
  if (validMode === currentMode) {
    log.debug(`Already in ${validMode} mode, nothing to do`);
    return;
  }
  
  log.info(`Switching storage mode: ${currentMode} → ${validMode}`);
  
  // Migrate data if requested
  if (migrate) {
    await migrateTokens(currentMode, validMode);
  }
  
  // Switch backend
  currentMode = validMode;
  activeBackend = currentMode === 'memory' ? memoryStore : persistentStore;
  
  // Initialize new backend
  await activeBackend.initialize();
  
  log.info(`Storage mode switched to: ${currentMode}`);
}

/**
 * Migrate tokens between storage modes.
 * 
 * @param {string} fromMode - Source mode
 * @param {string} toMode - Target mode
 * @returns {Promise<number>} Number of tokens migrated
 */
async function migrateTokens(fromMode, toMode) {
  log.info(`Migrating tokens from ${fromMode} to ${toMode}`);
  
  // Get source backend
  const sourceBackend = fromMode === 'memory' ? memoryStore : persistentStore;
  
  // Get all tokens from source
  const tokens = await sourceBackend.getAllTokens();
  
  if (tokens.length === 0) {
    log.info('No tokens to migrate');
    return 0;
  }
  
  // Get target backend
  const targetBackend = toMode === 'memory' ? memoryStore : persistentStore;
  
  // Write to target
  let migrated = 0;
  for (const token of tokens) {
    try {
      await targetBackend.setStoredToken(token);
      migrated++;
    } catch (error) {
      log.error(`Failed to migrate token for ${token.userOpenId}: ${error.message}`);
    }
  }
  
  log.info(`Migrated ${migrated}/${tokens.length} tokens`);
  return migrated;
}

// ---------------------------------------------------------------------------
// Monitoring & Debugging
// ---------------------------------------------------------------------------

/**
 * Get current storage mode.
 * 
 * @returns {'memory' | 'persistent'} Current mode
 */
export function getCurrentMode() {
  return currentMode;
}

/**
 * Get storage statistics.
 * 
 * @returns {Promise<{mode: string, tokenCount: number, backend: Object}>}
 */
export async function getStats() {
  await ensureInitialized();
  
  const stats = await activeBackend.getMemoryStats();
  
  return {
    mode: currentMode,
    tokenCount: stats.count,
    backend: stats
  };
}

/**
 * Clear all tokens from storage.
 * 
 * @param {Object} config - Configuration object
 * @returns {Promise<number>} Number of tokens cleared
 */
export async function clearAllTokens(config = {}) {
  await ensureInitialized(config);
  return activeBackend.clearAllTokens();
}

/**
 * Get all tokens (for debugging).
 * 
 * @param {Object} config - Configuration object
 * @returns {Promise<StoredUAToken[]>} Array of token objects
 */
export async function getAllTokens(config = {}) {
  await ensureInitialized(config);
  return activeBackend.getAllTokens();
}

/**
 * Check if the store is initialized.
 * 
 * @returns {boolean} True if initialized
 */
export function isInitialized() {
  return initialized;
}

/**
 * Reset the store (for testing).
 * 
 * @returns {void}
 */
export function reset() {
  currentMode = OAUTH_STORAGE_CONFIG.DEFAULT_MODE;
  activeBackend = null;
  initialized = false;
  log.debug('store reset');
}
