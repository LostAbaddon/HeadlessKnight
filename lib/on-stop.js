const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const { readStdin, log, cccoreSocket } = require('./utils');

const ModuleName = 'StopHook';
const EncodingFormat = 'utf-8';
const ActionRecordFileName = 'action_record.json';
const RecordExpire = 1000 * 3600 * 24;
const DefaultNotificationEnabled = true;
const DefaultNotificationDelay = 1000 * 30;

/**
 * 从 CCCore 获取 stop-reminder 配置
 */
async function getStopReminderConfig() {
	return new Promise((resolve) => {
		const DefaultTimeout = 500;
		const socketPath = cccoreSocket();
		const socket = net.createConnection(socketPath);

		socket.on('connect', () => {
			const command = {
				action: 'GET_CONFIG',
				data: { key: 'stop-reminder' },
			};
			socket.write(JSON.stringify(command) + '\n');
		});

		socket.on('data', (chunk) => {
			try {
				const response = JSON.parse(chunk.toString());
				socket.destroy();
				if (response.ok && response.data) {
					resolve(response.data);
				}
				else {
					resolve(null);
				}
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

/**
 * 通过 CCCore 发送提醒
 */
async function sendReminderViaCCCore(title, message, sessionId) {
	return new Promise((resolve) => {
		const DefaultTimeout = 500;
		const socketPath = cccoreSocket();
		const socket = net.createConnection(socketPath);

		socket.on('connect', () => {
			const command = {
				action: 'SEND_REMINDER',
				data: {
					title,
					message,
					sessionId,
					triggerTime: Date.now(), // 立即触发
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
/**
 * 本地系统级提醒
 */
function sendLocalNotification(title, message) {
	const { execSync } = require('child_process');
	const platform = os.platform();
	log('LOG', 'LocalReinder', 'START', platform);

	try {
		// macOS
		if (platform === 'darwin') {
			const escapedTitle = title.replace(/"/g, '\\"');
			const escapedMessage = message.replace(/"/g, '\\"');
			const script = `display dialog "${escapedMessage}" with title "${escapedTitle}" with icon caution buttons {"好的"} default button "好的"`;
			const cmd = `osascript -e '${script}'`;
			execSync(cmd, { stdio: 'pipe' });
		}
		// Windows
		else if (platform === 'win32') {
			const psScript = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

$template = @"
<toast>
	<visual>
		<binding template="ToastText02">
			<text id="1">${title.replace(/"/g, '""')}</text>
			<text id="2">${message.replace(/"/g, '""')}</text>
		</binding>
	</visual>
</toast>
"@

$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($template)
$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("HeadlessKnight")
$notifier.Show($toast)
			`.trim();

			execSync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, { windowsHide: true });
		}
		// Linux
		else if (platform === 'linux') {
			execSync(`notify-send "${title.replace(/"/g, '\\"')}" "${message.replace(/"/g, '\\"')}" --urgency=normal`);
		}
	}
	catch (error) {
		console.error(error);
		log('ERROR', 'LocalReminder', error);
	}
}
/**
 * 发送提醒（先尝试 CCCore，失败则使用本地系统提醒）
 */
async function sendReminder(title, message, sessionId) {
	// 先尝试通过 CCCore
	const result = await sendReminderViaCCCore(title, message, sessionId);

	// 如果 CCCore 不可用或返回错误或返回 fallback，则使用本地系统提醒
	if (!result || !result.ok || result.fallback) {
		sendLocalNotification(title, message);
	}
}

const main = async () => {
	const data = await readStdin();

	// 防止无限循环
	if (data.stop_hook_active === true) process.exit(0);

	// 从 CCCore 获取配置
	const config = await getStopReminderConfig();
	const notificationEnabled = config?.enabled ?? DefaultNotificationEnabled;
	const notificationDelay = config?.delay ?? DefaultNotificationDelay;
	log('LOG', ModuleName, `配置: enabled=${notificationEnabled}, delay=${notificationDelay}ms`);

	// 读取行动记录
	const actionRecordFilePath = path.join(__dirname, ActionRecordFileName);
	let actionRecord = {};
	try {
		actionRecord = await fs.promises.readFile(actionRecordFilePath, EncodingFormat);
		actionRecord = JSON.parse(actionRecord);
	}
	catch {
		process.exit(0);
	}

	// 运行时长
	const now = Date.now(), tasks = [];
	const record = actionRecord[data.session_id];
	if (record?.start) {
		const timeUsed = now - record.start;
		let action = record.action || '你布置的任务';
		if (action.length > 50) action = action.substring(0, 48) + '……';
		log('LOG', `任务用时: ${timeUsed / 1000}s, 详情: ${action}`);

		// 根据配置决定是否发送提醒
		if (notificationEnabled && timeUsed >= notificationDelay) {
			const timeUsedMinutes = Math.floor(timeUsed / 60000);
			const timeUsedSeconds = Math.floor((timeUsed % 60000) / 1000);
			const timeStr = timeUsedSeconds > 0
				? `${timeUsedMinutes} 分 ${timeUsedSeconds} 秒`
				: `${timeUsedMinutes} 分钟`;
			tasks.push(sendReminder('任务完成', `您委派的任务“${action}”已经完成了哦～\n用时 ${timeStr}`, data.session_id));
		}
		// record.start = (new Date(record.start)).toISOString();
	}
	// record.finish = (new Date()).toISOString();
	delete actionRecord[data.session_id];
	// 清理记录
	for (let sid in actionRecord) {
		const rec = actionRecord[sid];
		if (rec.start) {
			if (now - rec.start < RecordExpire) continue;
		}
		delete actionRecord[sid];
	}
	tasks.push(fs.promises.writeFile(actionRecordFilePath, JSON.stringify(actionRecord, '\t', '\t'), EncodingFormat));

	await Promise.all(tasks);

	process.exit(0);
};

main().catch(err => {
	log('ERROR', ModuleName, err.message);
	console.error('Hook 执行错误: ', err.message);
	process.exit(1);
});
