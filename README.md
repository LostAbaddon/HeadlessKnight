# HeadlessKnight - 无头骑士

- 版本: 1.0.0

让 Claude Code 具备调用 Claude Code、Gemini CLI、Codex CLI 等 AI CLI 工具能力的 Claude Code 插件。

**完美解决长文本、多段任务描述的参数传递问题！**

---

## 🌟 v1.0.0 新特性

- ✅ **MCP 服务架构**: 从 Bash 脚本迁移到 MCP 服务，提供类型安全的 JSON-RPC 接口
- ✅ **Slash Commands**: 新增 `/claude`、`/gemini`、`/codex` 命令
- ✅ **完美的参数传递**: 支持任意长度、多段、包含特殊字符的文本，无需担心 shell 转义
- ✅ **简化的调用链路**: 直接调用 MCP 工具，减少中间层
- ✅ **向后兼容**: 保留原有脚本作为参考

---

## 功能特性

- **独立进程运行**: 在子进程中运行 AI CLI 工具，完全隔离环境
- **MCP 服务**: 通过 Model Context Protocol 提供稳定可靠的工具接口
- **Slash Commands**: 快捷的命令行界面，简单易用
- **环境变量管理**: 自动传递和管理 API Key、代理等环境变量
- **并行执行**: 支持同时运行多个独立任务
- **结果捕获**: 自动捕获和解析执行结果（JSON 格式）
- **灵活配置**: 支持自定义工作目录、权限模式、工具限制等

---

## 支持的工具

| 工具 | MCP 服务 | Slash Command | 特性 |
|------|---------|--------------|------|
| **Claude Code** | `claude` | `/claude` | 所有无头模式功能、会话恢复 |
| **Gemini CLI** | `gemini` | `/gemini` | 扩展系统、多目录支持 |
| **Codex CLI** | `codex` | `/codex` | 沙箱模式、结构化输出、o3 模型 |

---

## 安装

### 方式 1: 通过 Marketplace

```bash
# 添加 marketplace
/plugin marketplace add /path/to/SkillMarketplace

# 安装插件
/plugin install headless-knight@local-marketplace
```

### 方式 2: 手动安装

```bash
# 克隆到插件目录
cd ~/.claude/plugins
git clone https://github.com/lostabaddon/HeadlessKnight.git headless-knight

# 重启 Claude Code
```

---

## 快速开始

### 方式 1: 使用 Slash Commands（最简单）

```
/claude 分析 src/auth.js 的安全问题

/gemini 为 src/utils.js 生成单元测试

/codex 使用 o3 模型重构代码
```

### 方式 2: 通过 Skill

```
用 Claude Code 分析这个文件的安全性，重点关注：
1. SQL 注入风险
2. XSS 攻击防护
3. 权限验证漏洞
```

插件会自动：
1. 调用对应的 MCP 工具
2. 在独立进程中运行 AI CLI
3. 返回结构化结果

### 方式 3: 直接调用 MCP 工具

```javascript
// 使用 MCP 工具
mcp__plugin_headless-knight_cli-runner__claude

// 参数（JSON 格式，完美支持长文本）
{
	"prompt": "这是一个很长很长的任务描述\n\n可以分多段\n\n包含特殊字符 \"引号\" $变量 `命令`\n\n完全不用担心转义问题",
	"workDir": ".",
	"allowedTools": "Read,Write,Grep",
	"permissionMode": "acceptEdits",
	"maxTurns": 10
}
```

---

## 配置

### 环境变量

| 变量名 | 说明 | 是否必需 |
|--------|------|---------|
| `ANTHROPIC_API_KEY` | Claude API 密钥 | ✅ (使用 Claude Code) |
| `GEMINI_API_KEY` | Gemini API 密钥 | ✅ (使用 Gemini CLI) |
| `OPENAI_API_KEY` | OpenAI API 密钥 | ✅ (使用 Codex CLI) |
| `CLAUDE_CODE_COMMAND` | Claude Code 启动命令 | ❌ (默认 `claude`) |
| `GEMINI_CLI_COMMAND` | Gemini CLI 启动命令 | ❌ (默认 `gemini`) |
| `OPENAI_CODEX_COMMAND` | Codex CLI 启动命令 | ❌ (默认 `codex`) |
| `HTTP_PROXY` | HTTP 代理 | ❌ |
| `HTTPS_PROXY` | HTTPS 代理 | ❌ |
| `ALL_PROXY` | HTTPS 代理 | ❌ |

---

## MCP 工具参考

### claude

**工具**: `mcp__plugin_headless-knight_cli-runner__claude`

**参数**:
- `prompt` (必需): 任务描述
- `systemPrompt`: 系统提示
- `workDir`: 工作目录
- `model`: 模型名称

### gemini

**工具**: `mcp__plugin_headless-knight_cli-runner__gemini`

**参数**:
- `prompt` (必需): 任务描述
- `systemPrompt`: 系统提示
- `workDir`: 工作目录
- `model`: 模型名称

### codex

**工具**: `mcp__plugin_headless-knight_cli-runner__codex`

**参数**:
- `prompt` (必需): 任务描述
- `systemPrompt`: 系统提示
- `workDir`: 工作目录
- `model`: 模型名称

---

## Marketplace

本项目已上架至[自建 Marketplace](https://github.com/lostabaddon/CCMarketplace)，其中还会不断更新和上架更多 Plugin，敬请期待！

---

## 相关项目

- **[InfoCollector](https://github.com/lostabaddon/InfoCollector)**: 收集资料与深度调查的 Plugin，配合本插件的 GeminiCLI，威力强大！
- **[ComplexMissionManager](https://github.com/lostabaddon/ComplexMissionManager)**: 大型任务的并行拆解与执行的插件，配合本插件，威力强大！

---

## 许可证

本项目采用 [MIT License](LICENSE) 许可证。

---

## 更新日志

### v1.0.0 (2025-11-06)

- ✨ 统一的 MCP 服务架构
- ✨ 3 个 Slash Commands
- ✅ 支持 Claude Code、Gemini CLI、Codex CLI
- ✅ 通过 Bash 脚本调用
- ✅ 基本的独立进程运行能力

---

**HeadlessKnight - 让 AI CLI 工具的并行执行变得简单可靠！** 🚀
