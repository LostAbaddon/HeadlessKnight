# HeadlessKnight - 无头骑士

- 版本：1.1.3

让 Claude Code 具备调用 Claude Code、Gemini CLI、Codex CLI 等 AI CLI 工具能力的 Claude Code 插件。

**完美解决长文本、多段任务描述的参数传递问题！**

---

## 🌟 v1.0.0 新特性

- ✅ **MCP 服务架构**：从 Bash 脚本迁移到 MCP 服务，提供类型安全的 JSON-RPC 接口
- ✅ **Slash Commands**：新增 `/claude`、`/gemini`、`/codex` 命令
- ✅ **完美的参数传递**：支持任意长度、多段、包含特殊字符的文本，无需担心 shell 转义
- ✅ **简化的调用链路**：直接调用 MCP 工具，减少中间层
- ✅ **向后兼容**：保留原有脚本作为参考

---

## 功能特性

- **独立进程运行**：在子进程中运行 AI CLI 工具，完全隔离环境
- **MCP 服务**：通过 Model Context Protocol 提供稳定可靠的工具接口
- **Slash Commands**：快捷的命令行界面，简单易用
- **环境变量管理**：自动传递和管理 API Key、代理等环境变量
- **并行执行**：支持同时运行多个独立任务
- **结果捕获**：自动捕获和解析执行结果（JSON 格式）
- **灵活配置**：支持自定义工作目录、权限模式、工具限制等
- **工具调用监控**：通过 PreToolUse 和 PostToolUse hooks 实时监控工具调用
- **任务完成提醒**：支持配置任务完成后的系统通知（延迟时间可自定义）
- **Context7 集成**：自动获取最新的第三方库文档
- **Unix Socket 通信**：与 CCCore 的通信采用高效的 Unix Socket 方式
- **中文标点规范**：内置中文标点符号使用规范 Skill，确保中文输出的专业性

---

## 支持的工具

| 工具 | MCP 服务 | Slash Command | Skill | 特性 |
|------|---------|--------------|-------|------|
| **Claude Code** | `claude` | `/claude` | `run-claude` | 所有无头模式功能、会话恢复 |
| **Gemini CLI** | `gemini` | `/gemini` | `run-gemini` | 扩展系统、多目录支持 |
| **Codex CLI** | `codex` | `/codex` | `run-codex` | 沙箱模式、结构化输出、o3 模型 |
| **iFlow** | `iflow` | `/iflow` | `run-iflow` | 中华文化理解、中文古文理解、测试用例生成 |

## 辅助工具

| 类型 | 名称 | 说明 | 特性 |
|------|------|------|------|
| **Slash Command** | `/commit [目标目录]` | 生成符合约定式提交规范的提交信息 | 自动分析所有文件改动，以功能为单位生成提交信息 |
| **Slash Command** | `/search <搜索目的>` | 网络搜索 | 调用 search-specialist Agent |
| **Slash Command** | `/translate <翻译内容>` | 翻译文本/文件/网页 | 调用 translator Agent，支持任意语言互译 |
| **Skill** | `commit` | 生成提交信息 | 约定式提交规范、功能维度分析 |
| **Skill** | `chinese-output` | 中文标点规范 | 全角标点使用、中英文混排规则 |

## 专业 Agent

| Agent | 说明 | 特性 |
|-------|------|------|
| **prompt-engineer** | 提示词工程专家 | 高级提示词编写技巧、思维链、宪法式 AI |
| **search-specialist** | 网络研究专员 | 高级搜索技术、结果筛选、多源验证 |
| **translator** | 专业翻译官 | 优雅流畅的翻译、支持任意语言互译 |

---

## 安装

### 方式 1：通过 Marketplace

```bash
# 添加 marketplace
/plugin marketplace add /path/to/SkillMarketplace

# 安装插件
/plugin install headless-knight@local-marketplace
```

### 方式 2：手动安装

```bash
# 克隆到插件目录
cd ~/.claude/plugins
git clone https://github.com/lostabaddon/HeadlessKnight.git headless-knight

# 重启 Claude Code
```

---

## 快速开始

### 方式 1：使用 Slash Commands（最简单）

```
/claude 分析 src/auth.js 的安全问题

/gemini 为 src/utils.js 生成单元测试

/codex 使用 o3 模型重构代码

/iflow 为这个项目生成详细的测试用例

/commit 生成提交信息

/search Claude Code 最新文档

/translate README.md 翻译成英文
```

### 方式 2：通过 Skill

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

### 方式 3：直接调用 MCP 工具

```javascript
// 使用 MCP 工具
mcp__plugin_headless-knight_cli-runner__claude

// 参数（JSON 格式，完美支持长文本）
{
	"prompt": "这是一个很长很长的任务描述\n\n可以分多段\n\n包含特殊字符 \"引号\" $变量 `命令`\n\n完全不用担心转义问题",
	"workDir": ".",
	"model": "sonnet"
}
```

---

## 配置

### 环境变量

| 变量名 | 说明 | 是否必需 |
|--------|------|---------|
| `ANTHROPIC_API_KEY` | Claude API 密钥 | ✅ （使用 Claude Code） |
| `GEMINI_API_KEY` | Gemini API 密钥 | ✅ （使用 Gemini CLI） |
| `OPENAI_API_KEY` | OpenAI API 密钥 | ✅ （使用 Codex CLI） |
| `CLAUDE_CODE_COMMAND` | Claude Code 启动命令 | ❌ （默认 `claude`） |
| `GEMINI_CLI_COMMAND` | Gemini CLI 启动命令 | ❌ （默认 `gemini`） |
| `OPENAI_CODEX_COMMAND` | Codex CLI 启动命令 | ❌ （默认 `codex`） |
| `IFLOW_COMMAND` | iFlow 启动命令 | ❌ （默认 `iflow`） |
| `HTTP_PROXY` | HTTP 代理 | ❌ |
| `HTTPS_PROXY` | HTTPS 代理 | ❌ |
| `ALL_PROXY` | HTTPS 代理 | ❌ |
| `CCCORE_HOST` | CCCore 服务主机 | ❌ (默认 `localhost`) |
| `CCCORE_HTTP_PORT` | CCCore HTTP 端口 | ❌ (默认 `3579`) |
| `CCCORE_SOCKET_PATH` | CCCore Unix Socket 路径 | ❌ （默认 `/tmp/cccore.sock`） |

---

## MCP 工具参考

### claude

**工具**：`mcp__plugin_headless-knight_cli-runner__claude`

**参数**：
- `prompt` （必需）：任务描述
- `systemPrompt`：系统提示
- `workDir`：工作目录
- `model`：模型名称（`sonnet` / `haiku` / `opus`）
- `env`：自定义环境变量（键值对对象）

### gemini

**工具**：`mcp__plugin_headless-knight_cli-runner__gemini`

**参数**：
- `prompt` （必需）：任务描述
- `systemPrompt`：系统提示
- `workDir`：工作目录
- `model`：模型名称（`gemini-3-pro-preview` / `gemini-2.5-flash` / `gemini-2.5-flash-lite`）
- `env`：自定义环境变量（键值对对象）

### codex

**工具**：`mcp__plugin_headless-knight_cli-runner__codex`

**参数**：
- `prompt` （必需）：任务描述
- `systemPrompt`：系统提示
- `workDir`：工作目录
- `model`：模型名称（`gpt-5.1-codex` / `gpt-5.1` / `gpt-5-mini` / `gpt-5-nano` / `o3` 等）
- `env`：自定义环境变量（键值对对象）

### iflow

**工具**：`mcp__plugin_headless-knight_cli-runner__iflow`

**参数**：
- `prompt` （必需）：任务描述
- `systemPrompt`：系统提示
- `workDir`：工作目录
- `model`：模型名称（`GLM-4.6` / `Qwen3-Coder-Plus` / `DeepSeek-V3.2` / `Kimi-K2-0905` / `MiniMax M2` 等）
- `env`：自定义环境变量（键值对对象）

---

## Hooks

插件提供了以下 hooks：

| Hook | 说明 | 功能 |
|------|------|------|
| **SessionStart** | 会话启动时触发 | 初始化会话环境 |
| **UserPromptSubmit** | 用户提交提示词时触发 | 记录用户操作和开始时间 |
| **PreToolUse** | 工具调用前触发 | 监控工具调用开始，通过 Unix Socket 发送事件到 CCCore |
| **PostToolUse** | 工具调用后触发 | 监控工具调用结束，通过 Unix Socket 发送事件到 CCCore |
| **Stop** | 任务停止时触发 | 计算任务用时，通过 Unix Socket 发送完成提醒 |

---

## Skills

| Skill | 说明 | 适用场景 |
|-------|------|---------|
| **run-claude** | 调用 Claude Code | 复杂编程任务、任务规划、文稿撰写 |
| **run-codex** | 调用 Codex CLI | 代码审核、逻辑推理、深度分析、策略制定 |
| **run-gemini** | 调用 Gemini CLI | 长文阅读理解、网络搜索、网页读取、文章翻译 |
| **run-iflow** | 调用 iFlow | 中华文化理解、中文古文理解、测试用例、信息检索 |
| **commit** | 生成提交信息 | Git 提交时生成规范的 commit message |
| **chinese-output** | 中文标点规范 | 输出中文内容、中英文混排、中文标点符号使用 |

---

## Marketplace

本项目已上架至[自建 Marketplace](https://github.com/lostabaddon/CCMarketplace)，其中还会不断更新和上架更多 Plugin，敬请期待！

---

## 相关项目

- **[CCCore](https://github.com/lostabaddon/CCCore)**：沟通 Claude Code 与 Chrome Extension 的强大后台
- **[CCExtension](https://github.com/lostabaddon/CCExtension)**：Claude Code 的 UI 组件，会有越来越多的功能哦！
- **[InfoCollector](https://github.com/lostabaddon/InfoCollector)**：收集资料与深度调查的 Plugin，配合本插件的 GeminiCLI，威力强大！
- **[ComplexMissionManager](https://github.com/lostabaddon/ComplexMissionManager)**：大型任务的并行拆解与执行的插件，配合本插件，威力强大！

---

## 许可证

本项目采用 [MIT License](./LICENSE) 许可证。

---

## 更新日志

### v1.1.3 （2025-11-21）
- 🔄 **模型更新**：更新默认模型版本（Gemini 3 Pro Preview、GPT-5.1 Codex、MiniMax M2）
- ✨ **新增 Agent**：新增 5 个代码审查专家 Agent（代码质量、文档准确性、性能、安全、测试覆盖率）
- 🔧 **搜索优化**：优化搜索工具优先级列表，新增更多搜索选项
- 📊 **日志增强**：工具调用日志现在显示具体模型名称和任务提示

### v1.1.2 （2025-11-18）
- 📝 **文档优化**：补充中文标点符号使用示例，提高规范的实用性和可读性
- 🔧 **搜索工具优化**：明确搜索工具优先级顺序，完善调用逻辑与失败重试机制
- 🎯 **会话支持**：on-stop 提醒支持会话标识传递

### v1.1.1 （2025-11-15）
- ⚡ **通信优化**：将 CCCore 通信方式从 HTTP 改为 Unix Socket，提升性能和可靠性
- 🎨 **工具监控增强**：优化工具使用信息显示格式，新增 TodoWrite、Edit 等工具的解析支持
- 🔧 **配置管理**：移除开发环境强制开关，优化配置读取逻辑

### v1.1.0 （2025-11-15）
- ✨ **新增 Skill**：新增 `chinese-output` Skill，提供专业的中文标点符号使用规范
- ✨ **新增 Skill**：新增 `commit` Skill，用于生成符合约定式提交规范的提交信息
- 📝 **文档完善**：调整 Gemini 模型使用说明，移除不适用场景
- 🔧 **工具优化**：完善搜索工具调用逻辑与失败重试机制

### v1.0.3 （2025-11-08）
- ✨ 新增 PreToolUse 和 PostToolUse hooks 实现工具调用监控
- ✨ 支持从 CCCore 动态获取任务完成提醒配置（开关和延迟时间）
- ✨ 新增工具调用信息解析函数，统一处理各类工具调用事件

### v1.0.2 （2025-11-07）
- ✨ 新增 `/commit` 命令：自动生成符合约定式提交规范的提交信息
- ✨ 新增 `/search` 命令：调用 search-specialist Agent 进行网络搜索
- ✨ 新增 `/translate` 命令：调用 translator Agent 进行翻译

### v1.0.1 （2025-11-07）
- ✨ 新增对 iFlow 的支持

### v1.0.0 （2025-11-06）
- ✅ 统一的 MCP 服务架构
- ✅ 3 个 Slash Commands
- ✅ 支持 Claude Code、Gemini CLI、Codex CLI
- ✅ 通过 Bash 脚本调用
- ✅ 基本的独立进程运行能力

---

**HeadlessKnight - 让 AI CLI 工具的并行执行变得简单可靠！** 🚀
