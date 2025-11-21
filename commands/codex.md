---
description: 在独立进程中运行 Codex CLI 执行任务
argument-hint: <任务描述>
model: haiku
---

分析 "任务描述" 内容与要求，然后使用 `mcp__plugin_headless-knight_runCLI__codex` 工具来启动独立 Codex CLI 进程，传入参数包括：
- `prompt`: string，任务描述，可以是任意长度的多段文本，必填参数
- `systemPrompt`: string，系统提示词，用于约束 Codex CLI 的行为，可选
- `model`: string，指定使用哪个模型，取值为"gpt-5.1-codex"、"gpt-5.1"、"gpt-5-mini"、"gpt-5-nano"或"o3"等 OpenAI 的 GPT 系列模型的代号，可选，默认为 gpt-5.1-codex
- `workDir`: string，工作目录，默认为当前目录，可选
- `env`: object，自定义环境变量，键值对，可选
