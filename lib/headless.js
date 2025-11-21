const { spawnSync } = require('child_process');
const {
	log,
	prepareEnvironment
} = require('../lib/utils');

const ModuleName = 'Knight';

const DefaultClaudeCodeConfig = {
	model: "sonnet",
	workDir: ".",
	systemPrompt: "",
	prompt: "",
};
const DefaultCodexCodeConfig = {
	model: "gpt-5.1-codex",
	workDir: ".",
	systemPrompt: "",
	prompt: "",
};
const DefaultGeminiCodeConfig = {
	model: "gemini-3-pro-preview",
	workDir: ".",
	systemPrompt: "",
	prompt: "",
};
const DefaultIFlowCodeConfig = {
	model: "MiniMax-M2",
	workDir: ".",
	systemPrompt: "",
	prompt: "",
};

/**
 * 构建 ClaudeCodex 命令参数
 */
function buildClaudeCommandArgs(options) {
	const args = (options.env.CLAUDE_CODE_COMMAND || 'claude').split(/\s+/);
	const command = args[0];
	args.splice(0, 1);

	args.push("--output-format json");
	args.push("--dangerously-skip-permissions");
	args.push("--permission-mode bypassPermissions");
	args.push("--model " + options.model);
	if (!options.model.match(/haiku/i)) args.push("--fallback-model haiku");
	if (options.systemPrompt) args.push("--system-prompt " + JSON.stringify(options.systemPrompt));
	args.push('-p ' + JSON.stringify(options.prompt));

	return { command, args };
}
/**
 * 运行 Claude Code
 */
function runClaudeCode(options) {
	options.env = prepareEnvironment('claude', options.env || {});
	options = Object.assign({}, DefaultClaudeCodeConfig, options);

	log('INFO', ModuleName, `ClaudeCode(${options.model}) Start:`, options.prompt);
	const { command, args } = buildClaudeCommandArgs(options);
	const result = spawnSync(command, args, {
		stdio: ['pipe', 'pipe', 'pipe'],
		env: options.env,
		cwd: options.workDir || process.cwd(),
		windowsHide: true,
	});
	if (result.stdout) result.stdout = result.stdout.toString();
	if (result.stderr) result.stderr = result.stderr.toString();
	if (!result.stdout) {
		log('error', ModuleName, 'ClaudeCode Failed:', result.stderr || "ClaudeCode 运行时出错");
		throw new Error(result.stderr || "ClaudeCode 运行时出错");
	}

	const json = JSON.parse(result.stdout);
	if (json.is_error) {
		log('error', ModuleName, 'ClaudeCode Reply Failed:', result.stderr || "ClaudeCode 返回出错");
		throw new Error(result.stderr || "ClaudeCode 返回出错");
	}

	return {
		session_id: json.session_id,
		reply: json.result,
		usage: {
			input: json.usage?.input_tokens,
			output: json.usage?.output_tokens
		}
	}
}

/**
 * 构建 Codex 命令参数
 */
function buildCodexCommandArgs(options) {
	const args = (options.env.OPENAI_CODEX_COMMAND || 'codex').split(/\s+/);
	const command = args[0];
	args.splice(0, 1);

	const prompt = [];
	if (options.systemPrompt) prompt.push(`<requirement>\n${options.systemPrompt}\n</requirement>`);
	prompt.push(`<task>\n${options.prompt}\n</task>`);

	args.push("-m", options.model);
	args.push('-c', 'model_reasoning_effort="high"');
	args.push("-c", "model_reasoning_summary_format=experimental");
	args.push("--enable", "web_search_request");
	args.push("--dangerously-bypass-approvals-and-sandbox");
	args.push("exec");
	args.push("--sandbox", "workspace-write");
	args.push(JSON.stringify(prompt.join('\n')));
	args.push("--skip-git-repo-check");
	args.push("--json");

	return { command, args };
}
/**
 * 运行 Codex
 */
function runCodex(options) {
	options.env = prepareEnvironment('codex', options.env || {});
	options = Object.assign({}, DefaultCodexCodeConfig, options);

	log('INFO', ModuleName, `Codex(${options.model}) Start:`, options.prompt);
	const { command, args } = buildCodexCommandArgs(options);
	const result = spawnSync(command, args, {
		stdio: ['pipe', 'pipe', 'pipe'],
		env: options.env,
		cwd: options.workDir || process.cwd(),
		windowsHide: true,
	});
	if (result.stdout) result.stdout = result.stdout.toString();
	if (result.stderr) result.stderr = result.stderr.toString();
	if (!result.stdout) {
		log('error', ModuleName, 'Codex Failed:', result.stderr || "Codex 运行时出错");
		throw new Error(result.stderr || "Codex 运行时出错");
	}

	const list = JSON.parse('[' + result.stdout.replace(/\}\n\{"type":/gi, '},{"type":') + ']');
	const json = {
		reply: [],
		usage: {
			input: 0,
			output: 0,
		}
	};
	list.forEach(item => {
		if (item.type === 'thread.started') {
			json.session_id = item.thread_id;
		}
		else if (item.type === 'item.completed') {
			if (item.usage) {
				json.usage.input += item.usage.input_tokens || 0;
				json.usage.output += item.usage.output_tokens || 0;
			}
			else if (item.item) {
				json.reply.push(item.item.text);
			}
		}
	});
	json.reply = json.reply.join('\n\n');

	return json;
}

/**
 * 构建 Gemini 命令参数
 */
function buildGeminiCommandArgs(options) {
	const args = (options.env.GEMINI_CLI_COMMAND || 'gemini').split(/\s+/);
	const command = args[0];
	args.splice(0, 1);

	const prompt = [];
	if (options.systemPrompt) prompt.push(`<requirement>\n${options.systemPrompt}\n</requirement>`);
	prompt.push(`<task>\n${options.prompt}\n</task>`);

	args.push("--yolo=true");
	args.push("--output-format=json");
	args.push('--model=' + options.model);
	args.push(JSON.stringify(prompt.join('\n')));

	return { command, args };
}
/**
 * 运行 Gemini
 */
function runGemini(options) {
	options.env = prepareEnvironment('gemini', options.env || {});
	options = Object.assign({}, DefaultGeminiCodeConfig, options);

	log('INFO', ModuleName, `Gemini(${options.model}) Start:`, options.prompt);
	const { command, args } = buildGeminiCommandArgs(options);
	const result = spawnSync(command, args, {
		stdio: ['pipe', 'pipe', 'pipe'],
		env: options.env,
		cwd: options.workDir || process.cwd(),
		windowsHide: true,
	});
	if (result.stdout) result.stdout = result.stdout.toString();
	if (result.stderr) result.stderr = result.stderr.toString();
	if (!result.stdout) {
		log('error', ModuleName, 'Gemini Failed:', result.stderr || "Codex 运行时出错");
		throw new Error(result.stderr || "Codex 运行时出错");
	}

	const json = JSON.parse(result.stdout);
	const data = {
		session_id: null,
		reply: json.response,
		usage: {
			input: 0,
			output: 0,
		},
	};
	for (let model in json.stats.models) {
		const info = json.stats.models[model];
		data.usage.input += info.tokens.prompt || 0;
		data.usage.output += info.tokens.candidates || 0;
		data.usage.output += info.tokens.thoughts || 0;
	}

	return data;
}

/**
 * 构建 Gemini 命令参数
 */
function buildIFlowCommandArgs(options) {
	const args = (options.env.IFLOW_CLI_COMMAND || 'iflow').split(/\s+/);
	const command = args[0];
	args.splice(0, 1);

	const prompt = [];
	if (options.systemPrompt) prompt.push(`<requirement>\n${options.systemPrompt}\n</requirement>`);
	prompt.push(`<task>\n${options.prompt}\n</task>`);

	options.env.IFLOW_modelName = options.model;

	args.push("-y");
	args.push("-p " + JSON.stringify(prompt.join('\n')));

	return { command, args };
}
/**
 * 运行 IFlow
 */
function runIFlow(options) {
	options.env = prepareEnvironment('iflow', options.env || {});
	options = Object.assign({}, DefaultIFlowCodeConfig, options);

	log('INFO', ModuleName, `IFlow(${options.model}) Start:`, options.prompt);
	const { command, args } = buildIFlowCommandArgs(options);
	console.log(command, args);
	const result = spawnSync(command, args, {
		stdio: ['pipe', 'pipe', 'pipe'],
		env: options.env,
		cwd: options.workDir || process.cwd(),
		windowsHide: true,
	});
	if (result.stdout) result.stdout = result.stdout.toString();
	if (result.stderr) result.stderr = result.stderr.toString();
	if (!result.stdout) {
		log('error', ModuleName, 'Gemini Failed:', result.stderr || "Codex 运行时出错");
		throw new Error(result.stderr || "Codex 运行时出错");
	}

	const data = {
		session_id: null,
		reply: '',
		usage: {
			input: 0,
			output: 0,
		},
	};
	let start = -1, end = -1;
	result.stdout.replace(/\s*\n\s*<Execution\s*Info>\s*\{/gi, (m, pos) => {
		start = pos;
	});
	if (start >= 0) {
		result.stdout.replace(/\}\s*\n\s*<\/Execution\s*Info>\s*/g, (m, pos) => {
			if (pos < start) return;
			end = pos + m.length;
		});
	}
	if (end < 0) {
		result.stdout.replace(/\n+\{/g, (m, pos) => {
			start = pos;
		});
		if (start >= 0) {
			result.stdout.replace(/\}\n*/g, (m, pos) => {
				if (pos < start) return;
				end = pos + m.length;
			});
		}
	}
	if (end < 0) {
		data.reply = result.stdout.trim();
	}
	else {
		let json = result.stdout.substring(start, end).replace(/^\s*<Execution\s*Info>\s*|\s*<\/Execution\s*Info>\s*$/gi, '');
		data.reply = result.stdout.substring(0, start).trim();
		try {
			json = JSON.parse(json);
			data.session_id = json.session_id;
			data.usage.input = json.tokenUsage.input;
			data.usage.output = json.tokenUsage.output;
		}
		catch {}
	}

	return data;
}

module.exports = {
	runClaudeCode,
	runCodex,
	runGemini,
	runIFlow,
};
