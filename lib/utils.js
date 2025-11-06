const fs = require('fs');
const path = require('path');
const os = require('os');

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Log messages to file for debugging (only in development mode)
 */
function log(level, ...message) {
	(console[(level || 'log').toLowerCase()] || console.log)(...message);
	if (!IS_DEV) return;

	const timestamp = new Date().toISOString();
	message = message.map(item => JSON.stringify(item)).join(' ');
	const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

	const LOG_FILE = path.join(__dirname, 'cli.log');
	try {
		fs.appendFileSync(LOG_FILE, logMessage);
	}
	catch (error) {
		console.error('Failed to write to log file:', error.message);
	}
}

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

module.exports = {
	log,
	prepareEnvironment,
};