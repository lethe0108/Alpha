/**
 * 消息接收 Hook - 分析用户需求
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

interface MessageEvent {
  type: string;
  content: string;
  channel: string;
  sender: string;
  timestamp: string;
}

interface ImprovementLog {
  patterns: Record<string, number>;
  lastAnalyzed: string;
  totalMessages: number;
}

const LOG_FILE = join(
  homedir(),
  ".openclaw",
  "workspace",
  "memory",
  "self-evolution-improvements.json"
);

const IMPROVEMENT_THRESHOLD = 10;

function loadLog(): ImprovementLog {
  if (existsSync(LOG_FILE)) {
    try {
      return JSON.parse(readFileSync(LOG_FILE, "utf-8"));
    } catch {
      // 解析失败
    }
  }
  return {
    patterns: {},
    lastAnalyzed: new Date().toISOString(),
    totalMessages: 0,
  };
}

function saveLog(log: ImprovementLog): void {
  const dir = join(homedir(), ".openclaw", "workspace", "memory");
  writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

function analyzeMessage(content: string): string[] {
  const patterns: string[] = [];

  // 识别潜在的技能需求
  const skillPatterns: Record<string, RegExp> = {
    搜索: /搜索|查找|查询|search/i,
    分析: /分析|统计|计算|analyze/i,
    生成: /生成|创建|制作|generate/i,
    转换: /转换|格式化|transform/i,
    监控: /监控|定时|提醒|monitor/i,
    集成: /集成|连接|同步|integrate/i,
    自动化: /自动化|自动|批量|automate/i,
  };

  for (const [skill, pattern] of Object.entries(skillPatterns)) {
    if (pattern.test(content)) {
      patterns.push(skill);
    }
  }

  return patterns;
}

function shouldSuggestSkill(log: ImprovementLog): boolean {
  // 检查是否有某个模式达到阈值
  for (const count of Object.values(log.patterns)) {
    if (count >= IMPROVEMENT_THRESHOLD) {
      return true;
    }
  }
  return false;
}

function getTopPattern(log: ImprovementLog): [string, number] | null {
  let topPattern: [string, number] | null = null;
  let maxCount = 0;

  for (const [pattern, count] of Object.entries(log.patterns)) {
    if (count > maxCount) {
      maxCount = count;
      topPattern = [pattern, count];
    }
  }

  return topPattern;
}

const handler = async (event: any) => {
  if (event.type !== "message:received") {
    return;
  }

  const message: MessageEvent = event.context?.message;
  if (!message || !message.content) {
    return;
  }

  // 分析消息
  const patterns = analyzeMessage(message.content);

  if (patterns.length === 0) {
    return;
  }

  // 加载日志
  const log = loadLog();

  // 更新模式计数
  for (const pattern of patterns) {
    log.patterns[pattern] = (log.patterns[pattern] || 0) + 1;
  }
  log.totalMessages += 1;
  log.lastAnalyzed = new Date().toISOString();

  // 保存日志
  saveLog(log);

  // 检查是否建议创建技能
  if (shouldSuggestSkill(log)) {
    const topPattern = getTopPattern(log);
    if (topPattern) {
      const [patternName, count] = topPattern;
      event.messages.push(
        `🧬 [自我进化] 检测到您经常使用"${patternName}"相关功能（${count}次）。建议创建专门的技能来优化体验。输入"创建技能"开始。`
      );

      // 重置该模式计数，避免重复提醒
      log.patterns[patternName] = 0;
      saveLog(log);
    }
  }

  console.log(`[self-evolution] Analyzed message, found patterns: ${patterns.join(", ")}`);
};

export default handler;
