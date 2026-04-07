# MCP 工具命名规范演示

## 命名格式
```
mcp__<server_name>__<tool_name>
```

## 示例

### 文件系统 MCP
```
mcp__filesystem__read_file
mcp__filesystem__write_file
mcp__filesystem__list_directory
mcp__filesystem__delete_file
```

### GitHub MCP
```
mcp__github__create_issue
mcp__github__create_pull_request
mcp__github__search_code
mcp__github__list_repositories
```

### Slack MCP
```
mcp__slack__send_message
mcp__slack__create_channel
mcp__slack__list_channels
mcp__slack__add_reaction
```

### Puppeteer MCP
```
mcp__puppeteer__screenshot
mcp__puppeteer__click
mcp__puppeteer__navigate
mcp__puppeteer__fill_form
```

## 命名规则
1. 前缀 `mcp__` 表示 MCP 工具
2. `server_name` 使用小写 + 下划线
3. `tool_name` 使用小写 + 下划线
4. 避免使用特殊字符

## 解析示例
```javascript
// 构建工具名
buildMcpToolName('github', 'create_issue')
// 返回: 'mcp__github__create_issue'

// 解析工具名
parseMcpToolName('mcp__filesystem__read_file')
// 返回: { serverName: 'filesystem', toolName: 'read_file' }
```