/**
 * 记录用户输入，以配合 Stop Hook
 */

const fs = require('fs').promises;
const net = require('net');
const path = require('path');
const { cccoreSocket, readStdin, log } = require('./utils');

const ModuleName = 'InputHook';
const EncodingFormat = 'utf8';
const ActionRecordFileName = 'action_record.json';

/**
 * 向 CCCore 发送输入事件
 */
async function sendUserInputEvent(sessionId, content) {
	return new Promise((resolve) => {
		const DefaultTimeout = 500;
		const socketPath = cccoreSocket();
		const socket = net.createConnection(socketPath);

		socket.on('connect', () => {
			const command = {
				action: 'USER_INPUT',
				data: { sessionId, content },
			};
			socket.write(JSON.stringify(command) + '\n');
		});
		socket.on('data', () => {
			resolve(true);
		});
		socket.on('error', () => {
			socket.destroy();
			resolve(false);
		});

		setTimeout(() => {
			socket.destroy();
			resolve(false);
		}, DefaultTimeout);
	});
}

// 主函数
const main = async () => {
	const input = await readStdin();
	if (!input) return process.exit(0);

	// 读取行动记录
	const actionRecordFilePath = path.join(__dirname, ActionRecordFileName);
	let actionRecord = {};
	try {
		actionRecord = await fs.readFile(actionRecordFilePath, EncodingFormat);
		actionRecord = JSON.parse(actionRecord);
	}
	catch {
		actionRecord = {};
	}

	// 更新行动记录
	delete actionRecord[input.session_id];
	actionRecord[input.session_id] = {
		action: input.prompt,
		start: Date.now(),
	};

	const Tasks = [];
	// 通知CCCore
	log('LOG', ModuleName, `用户输入: ${input.prompt.replace(/\s+/g, '')}`);
	Tasks.push(sendUserInputEvent(input.session_id, input.prompt));
	// 保存行动记录
	Tasks.push(fs.writeFile(actionRecordFilePath, JSON.stringify(actionRecord, '\t', '\t'), EncodingFormat));

	try {
		await Promise.all(Tasks);
	}
	catch (err) {
		log('ERROR', ModuleName, err);
	}

	// 返回
	process.exit(0);
};

main().catch(err => {
	log('ERROR', ModuleName, err);
	process.exit(0);
});