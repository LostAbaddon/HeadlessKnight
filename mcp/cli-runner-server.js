/**
 * Claude Code Runner MCP Server
 * 提供在独立进程中运行 Claude Code 的 MCP 工具
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const {
	runClaudeCode,
	runCodex,
	runGemini,
	runIFlow,
} = require('../lib/headless');
const { log } = require('../lib/utils');

const ModuleName = 'MCP';

// 创建 MCP 服务器
const server = new Server(
	{
		name: 'cli-runner',
		version: '1.0.0',
	},
	{
		capabilities: {
			tools: {},
		},
	}
);

const InputSchema = {
	type: 'object',
	properties: {
		prompt: {
			type: 'string',
			description: '任务描述，可以是任意长度的多段文本'
		},
		systemPrompt: {
			type: 'string',
			description: '系统提示，用于约束 Claude Code 的行为，可以不传'
		},
		workDir: {
			type: 'string',
			description: '工作目录，默认为当前目录'
		},
		model: {
			type: "string",
			description: '指定使用哪个模型，取值为"sonnet"、"haiku"或"opus"之一，默认为 sonnet'
		},
		env: {
			type: 'object',
			description: '自定义环境变量，键值对'
		}
	},
	required: ['prompt']
};
const ClaudeInputSchema = JSON.parse(JSON.stringify(InputSchema));
ClaudeInputSchema.properties.model.description = '指定使用哪个模型，取值为"sonnet"、"haiku"或"opus"之一，默认为 sonnet';
const CodexInputSchema = JSON.parse(JSON.stringify(InputSchema));
CodexInputSchema.properties.model.description = '指定使用哪个模型，取值为"gpt-5.1-codex"、"gpt-5.1"、"gpt-5-mini"、"gpt-5-nano"或"o3"等 OpenAI 的 GPT 系列模型的代号，可选，默认为 gpt-5.1-codex';
const GeminiInputSchema = JSON.parse(JSON.stringify(InputSchema));
GeminiInputSchema.properties.model.description = '指定使用哪个模型，取值为"gemini-3-pro-preview"、"gemini-2.5-flash"或"gemini-2.5-flash-lite"等 Gemini 系列模型的代号，可选，默认为 gemini-2.5-flash';
const IFlowInputSchema = JSON.parse(JSON.stringify(InputSchema));
IFlowInputSchema.properties.model.description = '指定使用哪个模型，取值为"GLM-4.6"、"Qwen3-Coder-Plus"、"DeepSeek-V3.2"、"MiniMax-M2"或"Kimi-K2-0905"等模型代号，可选，默认为 GLM-4.6';

const callCLIRunner = async (tag, runner, args) => {
	try {
		// 执行任务
		const result = await runner(args);
		log('INFO', ModuleName, tag + ' Process Finished.', result);

		// 返回结果
		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify({
						ok: true,
						reply: result.reply
					}, null, 2)
				}
			]
		};
	}
	catch (error) {
		log('ERROR', ModuleName, tag + ' Failed:', error.message || error.msg || error.data || error.toString());
		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify({
						ok: false,
						error: error.message
					}, null, 2)
				}
			],
			isError: true
		};
	}
};

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: 'claude',
				description: '向助手发出协助请求，适用于需要在隔离的独立环境中执行复杂编程任务、任务规划、文章撰写的场景。',
				inputSchema: ClaudeInputSchema
			},
			{
				name: 'codex',
				description: '向助手发出协助请求，适用于代码审核、逻辑推理、科学与哲学思考、深度分析、策略制定、市场分析等任务场景。',
				inputSchema: CodexInputSchema
			},
			{
				name: 'gemini',
				description: '向助手发出协助请求，适用于长文阅读理解、网络搜索、网页读取等任务场景。',
				inputSchema: GeminiInputSchema
			},
			{
				name: 'iflow',
				description: '向助手发出协助请求，适用中华文化理解、中文古文理解、中国特色作品创作、小红书与抖音的宣发文案编写、编写测试用例、信息检索等任务场景，同时也是其他专家助手的强力替补与协助，可以作为大部分认为的备选候补方案。',
				inputSchema: IFlowInputSchema
			},
		]
	};
});
// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	if (name === 'claude') {
		return await callCLIRunner('ClaudeCode', runClaudeCode, args);
	}

	if (name === 'codex') {
		return await callCLIRunner('CodexCLI', runCodex, args);
	}

	if (name === 'gemini') {
		return await callCLIRunner('GeminiCLI', runGemini, args);
	}

	if (name === 'iflow') {
		return await callCLIRunner('iFLow', runIFlow, args);
	}

	throw new Error(`未知工具: ${name}`);
});

// 启动服务器
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	log('INFO', ModuleName, 'Server 已启动');
}

main().catch(err => {
	log('ERROR', ModuleName, 'Error:', err.message || err.msg || err.data || err.toString());
});
