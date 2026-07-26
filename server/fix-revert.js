const fs = require('fs');
const filePath = 'C:/Users/86182/Desktop/learnEngish/server/routes/speech.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Revert FRAME_SIZE back to 1280
content = content.replace('const FRAME_SIZE = 4096;', 'const FRAME_SIZE = 1280;');

// 2. Revert interval from 10ms back to 20ms (2x real-time, safe for xfyun)
content = content.replace('}, 10);', '}, 20);');

// 3. Increase timeout back to 20s
content = content.replace(
  "setTimeout(() => finish(504, { code: 504, message: '语音评测超时，请重试' }), 15000)",
  "setTimeout(() => finish(504, { code: 504, message: '语音评测超时，请重试' }), 20000)"
);

// 4. Remove debug logging - parseResult
content = content.replace("function parseResult(xml) {\n  console.log('原始XML(前800):', xml.substring(0, 800));\n  const rawScore = xmlNumber(xml, 'total_score');\n  console.log('total_score原始值:', rawScore);", "function parseResult(xml) {\n  const rawScore = xmlNumber(xml, 'total_score');");

// 5. Remove debug logging - ws.on message
content = content.replace(
  "        console.log('讯飞评测XML结果:', xml.substring(0, 500));\n        const result = parseResult(xml);\n        console.log('解析后的评分:', result);",
  "        const result = parseResult(xml);"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: Reverted all changes');
