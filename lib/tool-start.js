const { readStdin, log, parseToolUse } = require('./utils');

const ModuleName = 'ToolStartHook';

/**
 * 向 CCCore 发送工具开始使用的事件
 */
async function sendToolStartEvent(sessionId, toolName) {
	return new Promise((resolve) => {
		const http = require('http');
		const ccCoreHost = process.env.CCCORE_HOST || 'localhost';
		const ccCorePort = parseInt(process.env.CCCORE_HTTP_PORT || '3579');
		const DefaultTimeout = 500;

		const postData = JSON.stringify({
			sessionId,
			toolName,
			eventType: 'start',
			timestamp: Date.now(),
		});

		const options = {
			hostname: ccCoreHost,
			port: ccCorePort,
			path: '/api/tool-event',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(postData),
			},
		};

		const req = http.request(options, (res) => {
			let data = '';
			res.on('data', (chunk) => {
				data += chunk;
			});
			res.on('end', () => {
				try {
					const response = JSON.parse(data);
					resolve(response);
				}
				catch (error) {
					resolve(null);
				}
			});
		});
		req.on('error', (error) => {
			resolve(null);
		});
		req.setTimeout(DefaultTimeout, () => {
			req.destroy();
			resolve(null);
		});
		req.write(postData);
		req.end();
	});
}

const main = async () => {
	const data = await readStdin();

	// 获取 session_id 和工具名称
	const { sessionId, toolInfo } = parseToolUse(data);
	log('LOG', ModuleName, `开始: ${toolInfo} (${sessionId})`);

	// 发送事件到 CCCore
	await sendToolStartEvent(sessionId, toolInfo);

	process.exit(0);
};

main().catch(err => {
	log('ERROR', ModuleName, err.message);
	console.error('Hook 执行错误: ', err.message);
	process.exit(1);
});
