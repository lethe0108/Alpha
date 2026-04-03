"use strict";
/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Configuration loader for OAuth storage.
 * 
 * This is a示例 file showing how to load configuration.
 * In production, this should integrate with your actual config system.
 */

import fs from 'fs/promises';
import path from 'path';
import { larkLogger } from '../core/lark-logger.js';

const log = larkLogger('config/config-loader');

/**
 * Default configuration.
 */
const DEFAULT_CONFIG = {
  oauth: {
    storage: {
      mode: 'persistent', // 'memory' or 'persistent'
      description: 'Token storage mode: memory=pure in-memory, persistent=file-based encryption'
    },
    autoRefresh: {
      enabled: false,
      refreshAheadMinutes: 5
    }
  }
};

/**
 * Configuration file paths to check.
 */
const CONFIG_PATHS = [
  path.join(process.cwd(), 'config.json'),
  path.join(process.env.HOME || '', '.openclaw', 'extensions', 'openclaw-lark', 'config.json'),
  path.join(process.env.HOME || '', '.config', 'openclaw', 'config.json')
];

/**
 * Load configuration from file.
 * 
 * @returns {Promise<Object>} Configuration object
 */
export async function loadConfig() {
  // Try each config path
  for (const configPath of CONFIG_PATHS) {
    try {
      const content = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(content);
      log.debug(`loaded config from ${configPath}`);
      return mergeConfig(DEFAULT_CONFIG, config);
    } catch (error) {
      if (error.code === 'ENOENT') {
        continue; // Try next path
      }
      if (error instanceof SyntaxError) {
        log.error(`invalid JSON in ${configPath}: ${error.message}`);
      } else {
        log.error(`failed to read config from ${configPath}: ${error.message}`);
      }
    }
  }
  
  // No config file found, use defaults
  log.debug('no config file found, using defaults');
  return DEFAULT_CONFIG;
}

/**
 * Save configuration to file.
 * 
 * @param {Object} config - Configuration object
 * @param {string} configPath - Path to save to
 * @returns {Promise<void>}
 */
export async function saveConfig(config, configPath) {
  try {
    const dir = path.dirname(configPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    log.info(`saved config to ${configPath}`);
  } catch (error) {
    log.error(`failed to save config: ${error.message}`);
    throw error;
  }
}

/**
 * Merge default config with user config.
 * 
 * @param {Object} defaults - Default configuration
 * @param {Object} user - User configuration
 * @returns {Object} Merged configuration
 */
function mergeConfig(defaults, user) {
  const result = { ...defaults };
  
  for (const key in user) {
    if (user.hasOwnProperty(key)) {
      if (typeof user[key] === 'object' && user[key] !== null && !Array.isArray(user[key])) {
        result[key] = mergeConfig(defaults[key] || {}, user[key]);
      } else {
        result[key] = user[key];
      }
    }
  }
  
  return result;
}

/**
 * Get storage mode from configuration.
 * 
 * @param {Object} config - Configuration object
 * @returns {string} Storage mode
 */
export function getStorageMode(config) {
  return config.oauth?.storage?.mode || DEFAULT_CONFIG.oauth.storage.mode;
}

/**
 * Validate storage mode.
 * 
 * @param {string} mode - Mode to validate
 * @returns {boolean} True if valid
 */
export function validateStorageMode(mode) {
  return ['memory', 'persistent'].includes(mode);
}
