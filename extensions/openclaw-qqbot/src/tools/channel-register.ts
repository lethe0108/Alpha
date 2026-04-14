// channel.ts 的 registerChannelTool 函数修复片段
// 需要手动替换原文件中的对应部分

export function registerChannelTool(api: OpenClawPluginApi): void {
  // 使用 runtime.config.loadConfig() 获取全局配置
  const cfg = api.runtime?.config?.loadConfig?.() ?? api.config;
  if (!cfg) {
    console.log("[qqbot-channel-api] No config available, skipping");
    return;
  }

  const accountIds = listQQBotAccountIds(cfg);
  if (accountIds.length === 0) {
    console.log("[qqbot-channel-api] No QQBot accounts configured, skipping");
    return;
  }

  const firstAccountId = accountIds[0];
  const account = resolveQQBotAccount(cfg, firstAccountId);

  if (!account.appId || !account.clientSecret) {
    console.log("[qqbot-channel-api] Account not fully configured, skipping");
    return;
  }

  // 后续代码保持不变...
}