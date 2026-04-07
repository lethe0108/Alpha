/**
 * 新会话 Hook - 检查学习机会
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

interface SessionContext {
  sessionEntry: string;
  previousSessionEntry?: string;
  commandSource: string;
  workspaceDir: string;
}

const MEMORY_DIR = join(homedir(), ".openclaw", "workspace", "memory", "events");

function getRecentTopics(): string[] {
  try {
    // 读取最近的记忆文件，提取主题
    const files = execSync(`ls -t "${MEMORY_DIR}" | head -5`, {
      encoding: "utf-8",
    })
      .trim()
      .split("\n")
      .filter((f) => f.endsWith(".json"));

    const topics: string[] = [];
    for (const file of files.slice(0, 3)) {
      try {
        const content = readFileSync(join(MEMORY_DIR, file), "utf-8");
        const data = JSON.parse(content);
        if (data.topic || data.query) {
          topics.push(data.topic || data.query);
        }
      } catch {
        // 忽略解析错误
      }
    }
    return topics;
  } catch {
    return [];
  }
}

function identifyLearningOpportunities(topics: string[]): string[] {
  const opportunities: string[] = [];

  // 基于主题识别学习机会
  const techKeywords: Record<string, string> = {
    AI: "人工智能和机器学习",
    Agent: "AI Agent 框架",
    API: "API 设计和开发",
    database: "数据库技术",
    frontend: "前端开发",
    backend: "后端开发",
    devops: "DevOps 和部署",
    security: "安全技术",
  };

  for (const topic of topics) {
    for (const [keyword, description] of Object.entries(techKeywords)) {
      if (topic.toLowerCase().includes(keyword.toLowerCase())) {
        opportunities.push(description);
      }
    }
  }

  return [...new Set(opportunities)]; // 去重
}

const handler = async (event: any) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log("[self-evolution-session-new] New session created, analyzing...");

  const context: SessionContext = event.context;

  // 获取最近的主题
  const recentTopics = getRecentTopics();

  if (recentTopics.length > 0) {
    const opportunities = identifyLearningOpportunities(recentTopics);

    if (opportunities.length > 0) {
      const suggestions = opportunities.slice(0, 2).join("、");
      event.messages.push(
        `💡 [自我进化] 根据您最近的对话，建议学习：${suggestions}。输入"学习新技术"开始。`
      );
    }
  }

  console.log("[self-evolution] Session analysis completed");
};

export default handler;
