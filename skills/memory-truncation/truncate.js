#!/usr/bin/env node
/**
 * Memory 硬截断保护 - 实现脚本
 * 
 * 基于 Claude Code 架构分析提取的截断机制
 * 用于 OpenClaw 系统的 MEMORY.md 大小保护
 */

const fs = require('fs');
const path = require('path');

// 核心常量 - 硬上限，不可突破
const MEMORY_CONSTANTS = {
  MAX_ENTRYPOINT_LINES: 200,
  MAX_ENTRYPOINT_BYTES: 25_000,
  MAX_TOPIC_FILE_LINES: 500,
  MAX_TOPIC_FILE_BYTES: 100_000,
};

/**
 * 截断入口点内容
 * @param {string} raw - 原始内容
 * @returns {object} - 截断结果
 */
function truncateEntrypointContent(raw) {
  const lines = raw.split('\n');
  const wasLineTruncated = lines.length > MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES;
  
  // 行数截断
  if (wasLineTruncated) {
    const truncated = lines.slice(0, MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES);
    truncated.push('\n... (truncated)');
    return {
      content: truncated.join('\n'),
      lineCount: MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES,
      byteCount: Buffer.byteLength(truncated.join('\n'), 'utf8'),
      wasLineTruncated: true,
      wasByteTruncated: false,
    };
  }
  
  // 字节截断
  const byteLength = Buffer.byteLength(raw, 'utf8');
  if (byteLength > MEMORY_CONSTANTS.MAX_ENTRYPOINT_BYTES) {
    let truncated = raw;
    while (Buffer.byteLength(truncated, 'utf8') > MEMORY_CONSTANTS.MAX_ENTRYPOINT_BYTES) {
      truncated = truncated.slice(0, -100);
    }
    truncated += '\n... (truncated)';
    return {
      content: truncated,
      lineCount: truncated.split('\n').length,
      byteCount: Buffer.byteLength(truncated, 'utf8'),
      wasLineTruncated: false,
      wasByteTruncated: true,
    };
  }
  
  // 无需截断
  return {
    content: raw,
    lineCount: lines.length,
    byteCount: byteLength,
    wasLineTruncated: false,
    wasByteTruncated: false,
  };
}

/**
 * 检查文件是否需要截断
 * @param {string} filePath - 文件路径
 * @returns {object} - 检查结果
 */
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const byteLength = Buffer.byteLength(content, 'utf8');
    
    const needsTruncation = 
      lines.length > MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES ||
      byteLength > MEMORY_CONSTANTS.MAX_ENTRYPOINT_BYTES;
    
    return {
      filePath,
      lineCount: lines.length,
      byteCount: byteLength,
      maxLines: MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES,
      maxBytes: MEMORY_CONSTANTS.MAX_ENTRYPOINT_BYTES,
      needsTruncation,
      lineOverflow: Math.max(0, lines.length - MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES),
      byteOverflow: Math.max(0, byteLength - MEMORY_CONSTANTS.MAX_ENTRYPOINT_BYTES),
    };
  } catch (error) {
    return {
      filePath,
      error: error.message,
    };
  }
}

/**
 * 执行截断
 * @param {string} filePath - 文件路径
 * @param {object} options - 选项
 * @returns {object} - 截断结果
 */
function truncateFile(filePath, options = {}) {
  const { backup = true, dryRun = false } = options;
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = truncateEntrypointContent(content);
    
    // 无需截断
    if (!result.wasLineTruncated && !result.wasByteTruncated) {
      return {
        filePath,
        truncated: false,
        message: 'File is within limits, no truncation needed.',
      };
    }
    
    // 备份原文件
    if (backup && !dryRun) {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      fs.writeFileSync(backupPath, content, 'utf-8');
    }
    
    // 写入截断后的内容
    if (!dryRun) {
      fs.writeFileSync(filePath, result.content, 'utf-8');
    }
    
    return {
      filePath,
      truncated: true,
      dryRun,
      originalLines: content.split('\n').length,
      originalBytes: Buffer.byteLength(content, 'utf8'),
      newLines: result.lineCount,
      newBytes: result.byteCount,
      wasLineTruncated: result.wasLineTruncated,
      wasByteTruncated: result.wasByteTruncated,
    };
  } catch (error) {
    return {
      filePath,
      error: error.message,
    };
  }
}

/**
 * 分离存储 - 将详细内容移至主题文件
 * @param {string} filePath - 主文件路径
 * @param {string} topicDir - 主题目录
 * @returns {object} - 分离结果
 */
function splitToTopicFiles(filePath, topicDir) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = truncateEntrypointContent(content);
    
    // 创建主题目录
    if (!fs.existsSync(topicDir)) {
      fs.mkdirSync(topicDir, { recursive: true });
    }
    
    // 生成主题文件名
    const date = new Date().toISOString().split('T')[0];
    const topicFile = path.join(topicDir, `detailed-${date}.md`);
    
    // 提取被截断的内容
    const lines = content.split('\n');
    let removedContent = '';
    
    if (result.wasLineTruncated) {
      removedContent = lines.slice(MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES).join('\n');
    } else if (result.wasByteTruncated) {
      // 字节截断时，需要找到截断位置
      let truncated = content;
      while (Buffer.byteLength(truncated, 'utf8') > MEMORY_CONSTANTS.MAX_ENTRYPOINT_BYTES) {
        truncated = truncated.slice(0, -100);
      }
      removedContent = content.slice(truncated.length);
    }
    
    // 写入主题文件
    if (removedContent) {
      const topicContent = `# Detailed Content - ${date}\n\n${removedContent}`;
      fs.writeFileSync(topicFile, topicContent, 'utf-8');
    }
    
    return {
      filePath,
      topicFile,
      truncated: result.wasLineTruncated || result.wasByteTruncated,
      removedBytes: Buffer.byteLength(removedContent, 'utf8'),
    };
  } catch (error) {
    return {
      filePath,
      error: error.message,
    };
  }
}

// CLI 支持
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const filePath = args[1];
  
  if (!command || !filePath) {
    console.log('Usage:');
    console.log('  node truncate.js check <file>     - 检查文件大小');
    console.log('  node truncate.js truncate <file>  - 执行截断');
    console.log('  node truncate.js split <file>     - 分离存储');
    process.exit(1);
  }
  
  switch (command) {
    case 'check':
      console.log(JSON.stringify(checkFile(filePath), null, 2));
      break;
    case 'truncate':
      console.log(JSON.stringify(truncateFile(filePath), null, 2));
      break;
    case 'split':
      const topicDir = args[2] || path.join(path.dirname(filePath), 'memory');
      console.log(JSON.stringify(splitToTopicFiles(filePath, topicDir), null, 2));
      break;
    default:
      console.log('Unknown command:', command);
      process.exit(1);
  }
}

// 导出模块
module.exports = {
  MEMORY_CONSTANTS,
  truncateEntrypointContent,
  checkFile,
  truncateFile,
  splitToTopicFiles,
};
