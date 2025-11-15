const net = require('net');
const { readStdin, log, parseToolUse, cccoreSocket } = require('./utils');

const ModuleName = 'ToolStartHook';

/**
 * 向 CCCore 发送工具开始使用的事件
 */
async function sendToolStartEvent(sessionId, toolName) {
	return new Promise((resolve) => {
		const DefaultTimeout = 500;
		const socketPath = cccoreSocket();
		const socket = net.createConnection(socketPath);

		socket.on('connect', () => {
			const command = {
				action: 'TOOL_EVENT',
				data: {
					sessionId,
					toolName,
					eventType: 'start',
					timestamp: Date.now(),
				},
			};
			socket.write(JSON.stringify(command) + '\n');
		});

		socket.on('data', (chunk) => {
			try {
				const response = JSON.parse(chunk.toString());
				socket.destroy();
				resolve(response);
			}
			catch (error) {
				socket.destroy();
				resolve(null);
			}
		});

		socket.on('error', () => {
			socket.destroy();
			resolve(null);
		});

		setTimeout(() => {
			socket.destroy();
			resolve(null);
		}, DefaultTimeout);
	});
}

const main = async () => {
	const data = await readStdin();

	// 获取 session_id 和工具名称
	const { sessionId, toolInfo } = parseToolUse(data);
	log('LOG', ModuleName, `工具调用开始: ${toolInfo} (${sessionId})`);

	// 发送事件到 CCCore
	await sendToolStartEvent(sessionId, toolInfo);

	process.exit(0);
};

main().catch(err => {
	log('ERROR', ModuleName, err.message);
	console.error('Hook 执行错误: ', err.message);
	process.exit(1);
});
