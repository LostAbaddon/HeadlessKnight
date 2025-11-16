# HeadlessKnight - 无头骑士

- 版本: 1.1.1

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
- **工具调用监控**: 通过 PreToolUse 和 PostToolUse hooks 实时监控工具调用
- **任务完成提醒**: 支持配置任务完成后的系统通知（延迟时间可自定义）
- **Context7 集成**: 自动获取最新的第三方库文档

---

## 支持的工具

| 工具 | MCP 服务 | Slash Command | 特性 |
|------|---------|--------------|------|
| **Claude Code** | `claude` | `/claude` | 所有无头模式功能、会话恢复 |
| **Gemini CLI** | `gemini` | `/gemini` | 扩展系统、多目录支持 |
| **Codex CLI** | `codex` | `/codex` | 沙箱模式、结构化输出、o3 模型 |
| **iFlow** | `iflow` | `/iflow` | 中华文化理解、中文古文理解、测试用例生成 |

## 辅助命令

| Slash Command | 说明 | 特性 |
|--------------|------|------|
| `/commit [目标目录]` | 生成符合约定式提交规范的提交信息 | 自动分析所有文件改动，以功能为单位生成提交信息 |
| `/search <搜索目的>` | 网络搜索 | 调用 search-specialist Agent |
| `/translate <翻译内容>` | 翻译文本/文件/网页 | 调用 translator Agent，支持任意语言互译 |

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

/iflow 为这个项目生成详细的测试用例

/commit 生成提交信息

/search Claude Code 最新文档

/translate README.md 翻译成英文
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
| `IFLOW_COMMAND` | iFlow 启动命令 | ❌ (默认 `iflow`) |
| `HTTP_PROXY` | HTTP 代理 | ❌ |
| `HTTPS_PROXY` | HTTPS 代理 | ❌ |
| `ALL_PROXY` | HTTPS 代理 | ❌ |
| `CCCORE_HOST` | CCCore 服务主机 | ❌ (默认 `localhost`) |
| `CCCORE_HTTP_PORT` | CCCore HTTP 端口 | ❌ (默认 `3579`) |

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

### iflow

**工具**: `mcp__plugin_headless-knight_cli-runner__iflow`

**参数**:
- `prompt` (必需): 任务描述
- `systemPrompt`: 系统提示
- `workDir`: 工作目录
- `model`: 模型名称

---

## Hooks

插件提供了以下 hooks：

| Hook | 说明 | 功能 |
|------|------|------|
| **SessionStart** | 会话启动时触发 | 初始化会话环境 |
| **UserPromptSubmit** | 用户提交提示词时触发 | 记录用户操作和开始时间 |
| **PreToolUse** | 工具调用前触发 | 监控工具调用开始，发送事件到 CCCore |
| **PostToolUse** | 工具调用后触发 | 监控工具调用结束，发送事件到 CCCore |
| **Stop** | 任务停止时触发 | 计算任务用时，发送完成提醒 |

---

## Marketplace

本项目已上架至[自建 Marketplace](https://github.com/lostabaddon/CCMarketplace)，其中还会不断更新和上架更多 Plugin，敬请期待！

---

## 相关项目

- **[CCCore](https://github.com/lostabaddon/CCCore)**: 沟通 Claude Code 与 Chrome Extension 的强大后台
- **[CCExtension](https://github.com/lostabaddon/CCExtension)**: Claude Code 的 UI 组件，会有越来越多的功能哦！
- **[InfoCollector](https://github.com/lostabaddon/InfoCollector)**: 收集资料与深度调查的 Plugin，配合本插件的 GeminiCLI，威力强大！
- **[ComplexMissionManager](https://github.com/lostabaddon/ComplexMissionManager)**: 大型任务的并行拆解与执行的插件，配合本插件，威力强大！

---

## 许可证

本项目采用 [MIT License](LICENSE) 许可证。

---

## 更新日志

### v1.0.3 (2025-11-08)
- ✨ 新增 PreToolUse 和 PostToolUse hooks 实现工具调用监控
- ✨ 支持从 CCCore 动态获取任务完成提醒配置（开关和延迟时间）
- ✨ 新增工具调用信息解析函数，统一处理各类工具调用事件

### v1.0.2 (2025-11-07)
- ✨ 新增 `/commit` 命令：自动生成符合约定式提交规范的提交信息
- ✨ 新增 `/search` 命令：调用 search-specialist Agent 进行网络搜索
- ✨ 新增 `/translate` 命令：调用 translator Agent 进行翻译

### v1.0.1 (2025-11-07)
- ✨ 新增对 iFlow 的支持

### v1.0.0 (2025-11-06)
- ✅ 统一的 MCP 服务架构
- ✅ 3 个 Slash Commands
- ✅ 支持 Claude Code、Gemini CLI、Codex CLI
- ✅ 通过 Bash 脚本调用
- ✅ 基本的独立进程运行能力

---

**HeadlessKnight - 让 AI CLI 工具的并行执行变得简单可靠！** 🚀
