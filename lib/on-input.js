/**
 * 记录用户输入，以配合 Stop Hook
 */

const fs = require('fs').promises;
const net = require('net');
const os = require('os');
const path = require('path');
const { cccoreSocket, readStdin, log } = require('./utils');

const ModuleName = 'InputHook';
const EncodingFormat = 'utf8';
const ActionRecordFileName = 'action_record.json';
const SocketTimeout = 500;

let ActionLoggerPath = process.env.ACTION_LOGGER_PATH;
if (!ActionLoggerPath) {
	ActionLoggerPath = path.join(os.homedir(), 'action-logger');
}
let LoggerFilePath;

// 获取当前时间的 YYYY-MM-DD 格式字符串
const getCurrentTimstampString = (timestamp, dateOnly = true) => {
	const now = timestamp ? new Date(timestamp) : new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	if (dateOnly) return `${year}-${month}-${day}`;
	const hour = String(now.getHours()).padStart(2, '0');
	const minute = String(now.getMinutes()).padStart(2, '0');
	const second = String(now.getSeconds()).padStart(2, '0');
	return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};
// 将日志数据转化为 LOG 记录
const formatLogEntry = (entry) => {
	let middleEntry = '';
	if (entry.source === 'Claude Code') {
		middleEntry = `| WORKSPACE: ${entry.workspace}
| SESSIONID: ${entry.sessionId || entry.sessionid}`;
	}
	else if (entry.source === 'Chrome') {
		middleEntry = `| TABID    : ${entry.tabId || entry.tabid}`;
	}
	else if (entry.source === 'CLI') {
		middleEntry = `| PID      : ${entry.pid}`;
	}

	const dateStr = getCurrentTimstampString(entry.timestamp, false);
	return `============================================================
| SOURCE   : ${entry.source}
| TIMESTAMP: ${dateStr}
${middleEntry}
============================================================

${entry.content}`;
};

// 读取 Session 操作日志
const readActionLog = async (actionRecordFilePath) => {
	let actionRecord = {};
	try {
		actionRecord = await fs.readFile(actionRecordFilePath, EncodingFormat);
		actionRecord = JSON.parse(actionRecord);
	}
	catch {
		actionRecord = {};
	}
	return actionRecord;
};
// 读取历史
const readActionHistory = async (filePath) => {
	let content;
	try {
		content = await fs.readFile(filePath, 'utf-8');
		content = (content || '').trim();
	}
	catch {
		content = '';
	}
	return content;
};
// 本地文件写入（降级方案）
const writeToLocalFile = async (data) => {
	let history = await readActionHistory(LoggerFilePath);
	const record = formatLogEntry(data);
	if (history) {
		history = history + '\n\n' + record;
	}
	else {
		history = record;
	}
	// 更新记录
	await fs.writeFile(LoggerFilePath, history, 'utf-8');
};

// 通过 Socket IPC 发送日志到 CCCore
const sendToCCCore = (action, data) => {
	return new Promise((res, rej) => {
		const socketPath = cccoreSocket();
		const socket = net.createConnection(socketPath);
		socket.on('connect', () => {
			const command = { action, data };
			socket.write(JSON.stringify(command) + '\n');
		});
		socket.on('data', (data) => {
			data = data.toString();
			socket.destroy();
			try {
				const response = JSON.parse(data);
				res(response);
			}
			catch {
				res(data);
			}
		});
		socket.on('error', (error) => {
			socket.destroy();
			rej(error.message);
		});

		setTimeout(() => {
			socket.destroy();
			rej(new Error('CCCore 响应超时'));
		}, SocketTimeout);
	});
};
// 发送输入事件
const sendUserInputEvent = async (sessionId, content) => {
	try {
		await sendToCCCore('USER_INPUT', { sessionId, content });
		return true;
	}
	catch {
		return false;
	}
};
// 发送输入事件
const sendToLogInputEvent = async (eventData) => {
	try {
		await sendToCCCore('ADD_LOG', eventData);
		return true;
	}
	catch (error) {
		log('LOG', ModuleName, `RemoteAddLog Failed: ${error.message || error.msg || error.data || error}`);
		return false;
	}
};

// 主函数
const main = async () => {
	try {
		const input = await readStdin();
		if (!input) return process.exit(0);
		const eventData = {
			source: 'Claude Code',
			workspace: input.cwd,
			sessionId: input.session_id,
			timestamp: Date.now(),
			content: input.prompt,
		};
		const actionRecordFilePath = path.join(__dirname, ActionRecordFileName);

		const Tasks = [];
		// 读取行动记录
		Tasks.push(readActionLog());
		// 让 CCCore 记录输入日志
		Tasks.push(sendToLogInputEvent(eventData));

		const [actionRecord, logged] = await Promise.all(Tasks);
		Tasks.splice(0);

		// 更新行动记录
		delete actionRecord[input.session_id];
		actionRecord[input.session_id] = {
			action: input.prompt,
			start: Date.now(),
		};

		// 如果需要
		if (!logged) {
			Tasks.push(writeToLocalFile(eventData));
		}

		// 通知CCCore
		log('LOG', ModuleName, `用户输入: ${input.prompt.replace(/\s+/g, '')}`);
		Tasks.push(sendUserInputEvent(input.session_id, input.prompt));
		// 保存行动记录
		Tasks.push(fs.writeFile(actionRecordFilePath, JSON.stringify(actionRecord, '\t', '\t'), EncodingFormat));

		await Promise.all(Tasks);
	}
	catch (err) {
		log('ERROR', ModuleName, err.message || err);
	}

	// 返回
	process.exit(0);
};

main().catch(err => {
	log('ERROR', ModuleName, err.message || err);
	process.exit(0);
});