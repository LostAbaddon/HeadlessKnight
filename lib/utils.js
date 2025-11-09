const fs = require('fs');
const path = require('path');
const os = require('os');

const IS_DEV = true || process.env.NODE_ENV === 'development';

const wait = (delay=0) => new Promise(res => setTimeout(res, delay));

/**
 * Log messages to file for debugging (only in development mode)
 */
function log(level, module, ...message) {
	// (console[(level || 'log').toLowerCase()] || console.log)(`[${module}]`, ...message);
	if (!IS_DEV) return;

	const timestamp = new Date().toISOString();
	message = message.map(item => JSON.stringify(item)).join(', ');
	const logMessage = `[${timestamp}] [${module}:${level.toUpperCase()}] ${message}\n`;

	const LOG_FILE = path.join(__dirname, 'cli.log');
	try {
		fs.appendFileSync(LOG_FILE, logMessage);
	}
	catch (error) {
		console.error('Failed to write to log file:', error.message);
	}
}
/**
 * 读取 CC 日志，JSONL 格式
 */
const getSystemLog = async (transcriptPath, sessionId) => {
	if (!transcriptPath) return [];

	// 尝试三次，有可能 CC 正在创建或者写该文件
	let list;
	for (let i = 0; i < 3; i ++) {
		try {
			list = await fs.promises.readFile(transcriptPath, "utf8");
			break;
		}
		catch {
			list = null;
			await wait(100);
		}
	}
	if (!list) return [];
	return list.split('\n').map(line => {
		try {
			const json = JSON.parse(line);
			return json;
		}
		catch {
			return null;
		}
	}).filter(item => {
		if (!item) return false;
		return !sessionId || (item.sessionId === sessionId);
	});
};
const parseToolUse = (data) => {
	const sessionId = data.session_id;
	const toolName = data.tool_name || 'unknown';
	let toolInfo = toolName;
	if (toolName === 'Task') {
		toolInfo = `SubAgent(${data.tool_input.subagent_type})`;
	}
	else if (toolName === 'Bash') {
		toolInfo = `Shell(${data.tool_input.command})`;
	}
	else if (toolName === 'Glob') {
		toolInfo = `Seek(${data.tool_input.pattern})`;
	}
	else if (toolName === 'Grep') {
		toolInfo = `Filter(${data.tool_input.pattern})`;
	}
	else if (toolName === 'WebSearch') {
		toolInfo = `Search(${data.tool_input.query})`;
	}
	else if (toolName === 'WebFetch') {
		toolInfo = `Fetch(${data.tool_input.url})`;
	}
	else if (['Write', 'Read'].includes(toolName)) {
		toolInfo = `${toolName}(${data.tool_input.file_path})`;
	}
	else if (toolName.match(/^mcp__/i)) {
		let mcp = toolName.replace(/^mcp__/i, '');
		toolInfo = `Call(${mcp.replace(/_/g, ':')})`;
	}
	return { sessionId, toolInfo };
};

/**
 * 准备环境变量
 * 默认会从 home 目录下读取 headlessknight.env.json 文件
 */
function prepareEnvironment(cliName, customEnv = {}, defEnv={}) {
	customEnv = Object.assign({}, defEnv, customEnv);

	const env = {};
	const envFile = path.join(process.env.HOME || os.homedir(), 'headlessknight.env.json');
	if (fs.existsSync(envFile)) {
		try {
			let json = fs.readFileSync(envFile);
			json = JSON.parse(json);
			if (json.default) Object.assign(env, json.default);
			if (json[cliName]) Object.assign(env, json[cliName]);
		}
		catch (err) {
			console.error('Read ENV file failed:\n', err);
		}
	}

	const OLD_ENV = {...process.env};
	// for (let key in OLD_ENV) {
	// 	if (key.match(/api_?key|proxy/i)) {
	// 		if (env[key]) continue;
	// 		env[key] = OLD_ENV[key];
	// 	}
	// }

	return Object.assign({}, OLD_ENV, env, customEnv);
}

/**
 * 读取标准输入
 */
const readStdin = () => new Promise((resolve, reject) => {
	let data = '';
	process.stdin.on('data', chunk => {
		data += chunk;
	});
	process.stdin.on('end', () => {
		try {
			const json = JSON.parse(data);
			resolve(json);
		}
		catch {
			resolve(null);
		}
	});
	process.stdin.on('error', reject);
});

module.exports = {
	wait,
	log, getSystemLog, parseToolUse,
	prepareEnvironment,
	readStdin,
};
