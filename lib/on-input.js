/**
 * 记录用户输入，以配合 Stop Hook
 */

const fs = require('fs').promises;
const path = require('path');
const { readStdin, log } = require('./utils');

const ModuleName = 'InputHook';
const EncodingFormat = 'utf8';
const ActionRecordFileName = 'action_record.json';

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

	// 保存行动记录
	try {
		await fs.writeFile(actionRecordFilePath, JSON.stringify(actionRecord, '\t', '\t'), EncodingFormat);
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