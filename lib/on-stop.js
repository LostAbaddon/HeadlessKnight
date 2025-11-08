const fs = require('fs');
const path = require('path');
const { readStdin, log, getSystemLog } = require('./utils');

const ModuleName = 'StopHook';
const EncodingFormat = 'utf-8';
const ActionRecordFileName = 'action_record.json';
const RecordExpire = 1000 * 3600 * 24;

const main = async () => {
	const data = await readStdin();

	// 防止无限循环
	if (data.stop_hook_active === true) process.exit(0);

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
	const now = Date.now();
	const record = actionRecord[data.session_id];
	if (record?.start) {
		const timeUsed = Date.now() - now;
		let action = record.action || '你布置的任务';
		if (action.length > 50) action = action.substring(0, 48) + '……';
		log('LOG', `任务用时: ${timeUsed / 1000}s, 详情: ${action}`);
	}
	delete actionRecord[data.session_id];
	// 清理记录
	for (let sid in actionRecord) {
		const rec = actionRecord[sic];
		if (rec.start) {
			if (now - rec.start < RecordExpire) continue;
		}
		delete actionRecord[sic];
	}
	await fs.promises.writeFile(actionRecordFilePath, JSON.stringify(actionRecord, '\t', '\t'), EncodingFormat);

	process.exit(0);
};

main().catch(err => {
	log('ERROR', ModuleName, err.message);
	console.error('Hook 执行错误: ', err.message);
	process.exit(1);
});