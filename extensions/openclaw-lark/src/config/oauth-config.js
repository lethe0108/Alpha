"use strict";
/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * OAuth storage configuration constants.
 */

/**
 * OAuth storage configuration
 */
export const OAUTH_STORAGE_CONFIG = {
  // Configuration key path
  CONFIG_KEY: 'oauth.storage.mode',
  
  // Default value (backward compatible - persistent mode)
  DEFAULT_MODE: 'persistent',
  
  // Valid modes
  VALID_MODES: ['memory', 'persistent'],
  
  // Configuration description
  DESCRIPTION: 'Token storage mode: memory=pure in-memory, persistent=file-based encryption'
};

/**
 * Validate storage mode
 * @param {string} mode - Mode to validate
 * @returns {boolean} True if valid
 */
export function isValidStorageMode(mode) {
  return OAUTH_STORAGE_CONFIG.VALID_MODES.includes(mode);
}

/**
 * Get storage mode with fallback to default
 * @param {string} mode - Mode to validate
 * @returns {string} Valid mode or default
 */
export function getValidStorageMode(mode) {
  if (isValidStorageMode(mode)) {
    return mode;
  }
  return OAUTH_STORAGE_CONFIG.DEFAULT_MODE;
}
