"use strict";
/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * macOS Keychain backend for persistent token storage.
 * Uses security CLI to store encrypted tokens in Keychain Access.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { larkLogger } from '../lark-logger.js';

const execAsync = promisify(exec);
const log = larkLogger('core/backends/darwin');

const KEYCHAIN_SERVICE = 'openclaw-feishu-uat';

/**
 * Save token to macOS Keychain.
 * 
 * @param {string} key - Account key
 * @param {string} data - JSON stringified token data
 * @returns {Promise<void>}
 */
export async function saveToken(key, data) {
  try {
    // Delete existing entry if any
    try {
      await execAsync(`security delete-generic-password -s "${KEYCHAIN_SERVICE}" -a "${key}" 2>/dev/null`);
    } catch (e) {
      // Ignore if not found
    }
    
    // Add new entry
    const command = `security add-generic-password -s "${KEYCHAIN_SERVICE}" -a "${key}" -w "${data}"`;
    await execAsync(command);
    
    log.debug(`saved token to keychain for ${key}`);
  } catch (error) {
    log.error(`failed to save token to keychain: ${error.message}`);
    throw error;
  }
}

/**
 * Load token from macOS Keychain.
 * 
 * @param {string} key - Account key
 * @returns {Promise<string | null>} JSON stringified token data or null
 */
export async function loadToken(key) {
  try {
    const { stdout } = await execAsync(
      `security find-generic-password -s "${KEYCHAIN_SERVICE}" -a "${key}" -w`
    );
    return stdout.trim();
  } catch (error) {
    if (error.message.includes('not found')) {
      log.debug(`no token found in keychain for ${key}`);
      return null;
    }
    log.error(`failed to load token from keychain: ${error.message}`);
    throw error;
  }
}

/**
 * Delete token from macOS Keychain.
 * 
 * @param {string} key - Account key
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteToken(key) {
  try {
    await execAsync(`security delete-generic-password -s "${KEYCHAIN_SERVICE}" -a "${key}"`);
    log.debug(`deleted token from keychain for ${key}`);
    return true;
  } catch (error) {
    if (error.message.includes('not found')) {
      log.debug(`no token found in keychain for ${key}`);
      return false;
    }
    log.error(`failed to delete token from keychain: ${error.message}`);
    throw error;
  }
}

/**
 * Get all tokens from macOS Keychain.
 * 
 * @returns {Promise<Array<{key: string, data: string}>>}
 */
export async function getAllTokens() {
  try {
    // List all items for our service
    const { stdout } = await execAsync(
      `security dump-keychain | grep -A 5 "${KEYCHAIN_SERVICE}"`
    );
    
    // Parse output (simplified - in production would need robust parsing)
    const tokens = [];
    // ... parsing logic would go here
    
    return tokens;
  } catch (error) {
    log.error(`failed to list tokens from keychain: ${error.message}`);
    return [];
  }
}

/**
 * Initialize the backend (no-op for Keychain).
 * 
 * @returns {Promise<void>}
 */
async function initialize() {
  log.debug('darwin keychain backend initialized');
}

// Export as named and default
export { initialize };
export default {
  saveToken,
  loadToken,
  deleteToken,
  getAllTokens,
  initialize
};
