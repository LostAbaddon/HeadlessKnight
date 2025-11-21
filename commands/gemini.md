---
description: 在独立进程中运行 Gemini CLI 执行任务
argument-hint: <任务描述>
model: haiku
---

分析 "任务描述" 内容与要求，然后使用 `mcp__plugin_headless-knight_runCLI__gemini` 工具来启动独立 Gemini CLI 进程，传入参数包括：
- `prompt`: string，任务描述，可以是任意长度的多段文本，必填参数
- `systemPrompt`: string，系统提示词，用于约束 Gemini CLI 的行为，可选
- `model`: string，指定使用哪个模型，取值为"gemini-3-pro-preview"、"gemini-2.5-flash"或"gemini-2.5-flash-lite"之一，可选，默认为 gemini-3-pro-preview
- `workDir`: string，工作目录，默认为当前目录，可选
- `env`: object，自定义环境变量，键值对，可选
