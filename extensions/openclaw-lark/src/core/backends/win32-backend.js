"use strict";
/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Windows encrypted file backend for persistent token storage.
 * Uses AES-256-GCM encryption for token files.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { larkLogger } from '../lark-logger.js';

const log = larkLogger('core/backends/win32');

// Storage directory
const STORAGE_DIR = path.join(process.env.LOCALAPPDATA || process.env.APPDATA || '', 'openclaw-feishu-uat');

// Encryption key (in production, this should be derived from a master key)
const ENCRYPTION_KEY = crypto.randomBytes(32); // TODO: Use proper key derivation

/**
 * Ensure storage directory exists.
 */
async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true, mode: 0o700 });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Encrypt data using AES-256-GCM.
 * 
 * @param {string} data - Plain text data
 * @returns {string} Base64 encoded encrypted data with IV and authTag
 */
function encrypt(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag().toString('base64');
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('base64')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt data using AES-256-GCM.
 * 
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {string} Decrypted plain text
 */
function decrypt(encryptedData) {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Get file path for a token key.
 * 
 * @param {string} key - Account key
 * @returns {string} File path
 */
function getTokenFilePath(key) {
  // Sanitize key for filename
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(STORAGE_DIR, `${safeKey}.enc`);
}

/**
 * Save token to encrypted file.
 * 
 * @param {string} key - Account key
 * @param {string} data - JSON stringified token data
 * @returns {Promise<void>}
 */
export async function saveToken(key, data) {
  try {
    await ensureStorageDir();
    
    const filePath = getTokenFilePath(key);
    const encrypted = encrypt(data);
    
    await fs.writeFile(filePath, encrypted, { encoding: 'utf8', mode: 0o600 });
    log.debug(`saved token to file for ${key}`);
  } catch (error) {
    log.error(`failed to save token to file: ${error.message}`);
    throw error;
  }
}

/**
 * Load token from encrypted file.
 * 
 * @param {string} key - Account key
 * @returns {Promise<string | null>} JSON stringified token data or null
 */
export async function loadToken(key) {
  try {
    const filePath = getTokenFilePath(key);
    
    try {
      const encrypted = await fs.readFile(filePath, 'utf8');
      const decrypted = decrypt(encrypted);
      return decrypted;
    } catch (error) {
      if (error.code === 'ENOENT') {
        log.debug(`no token file found for ${key}`);
        return null;
      }
      throw error;
    }
  } catch (error) {
    log.error(`failed to load token from file: ${error.message}`);
    throw error;
  }
}

/**
 * Delete token file.
 * 
 * @param {string} key - Account key
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteToken(key) {
  try {
    const filePath = getTokenFilePath(key);
    await fs.unlink(filePath);
    log.debug(`deleted token file for ${key}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      log.debug(`no token file found for ${key}`);
      return false;
    }
    log.error(`failed to delete token file: ${error.message}`);
    throw error;
  }
}

/**
 * Get all tokens from storage directory.
 * 
 * @returns {Promise<Array<{key: string, data: string}>>}
 */
export async function getAllTokens() {
  try {
    await ensureStorageDir();
    
    const files = await fs.readdir(STORAGE_DIR);
    const tokens = [];
    
    for (const file of files) {
      if (file.endsWith('.enc')) {
        const filePath = path.join(STORAGE_DIR, file);
        try {
          const encrypted = await fs.readFile(filePath, 'utf8');
          const data = decrypt(encrypted);
          const key = file.replace('.enc', '');
          tokens.push({ key, data });
        } catch (error) {
          log.warn(`failed to read token file ${file}: ${error.message}`);
        }
      }
    }
    
    return tokens;
  } catch (error) {
    log.error(`failed to list token files: ${error.message}`);
    return [];
  }
}

/**
 * Initialize the backend.
 * 
 * @returns {Promise<void>}
 */
async function initialize() {
  await ensureStorageDir();
  log.debug('win32 file backend initialized');
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
