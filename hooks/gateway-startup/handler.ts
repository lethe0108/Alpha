/**
 * Gateway 启动 Hook - 检查自我进化状态
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

interface EvolutionState {
  lastAssessment: string;
  assessmentCount: number;
  version: string;
}

const STATE_FILE = join(
  homedir(),
  ".openclaw",
  "workspace",
  "memory",
  "self-evolution-state.json"
);

const SCRIPT_PATH =
  "/usr/lib/node_modules/openclaw/skills/self-evolution/scripts/assess_capabilities.py";

function loadState(): EvolutionState {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    } catch {
      // 解析失败，返回默认状态
    }
  }
  return {
    lastAssessment: "1970-01-01T00:00:00.000Z",
    assessmentCount: 0,
    version: "2.0.0",
  };
}

function saveState(state: EvolutionState): void {
  const dir = join(homedir(), ".openclaw", "workspace", "memory");
  if (!existsSync(dir)) {
    // 目录不存在，尝试创建
    try {
      execSync(`mkdir -p "${dir}"`);
    } catch {
      return;
    }
  }
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function shouldRunAssessment(state: EvolutionState): boolean {
  const lastAssessment = new Date(state.lastAssessment);
  const now = new Date();
  const daysSinceLastAssessment =
    (now.getTime() - lastAssessment.getTime()) / (1000 * 60 * 60 * 24);

  // 超过 7 天执行一次评估
  return daysSinceLastAssessment >= 7;
}

function runAssessment(): void {
  try {
    console.log("[self-evolution] Running capability assessment...");
    execSync(`python3 "${SCRIPT_PATH}"`, {
      stdio: "inherit",
      timeout: 60000,
    });
    console.log("[self-evolution] Assessment completed");
  } catch (error) {
    console.error("[self-evolution] Assessment failed:", error);
  }
}

const handler = async (event: any) => {
  if (event.type !== "gateway:startup") {
    return;
  }

  console.log("[self-evolution-gateway-startup] Gateway started, checking evolution state...");

  const state = loadState();

  if (shouldRunAssessment(state)) {
    runAssessment();

    // 更新状态
    state.lastAssessment = new Date().toISOString();
    state.assessmentCount += 1;
    saveState(state);

    // 向用户发送通知
    event.messages.push(
      "🧬 [自我进化] Gateway 已启动，自动执行了能力评估。查看详细报告请查看 memory/events/ 目录。"
    );
  } else {
    console.log("[self-evolution] Assessment not needed yet");
  }
};

export default handler;
