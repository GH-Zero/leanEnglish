const fs = require('fs');
const filePath = 'C:/Users/86182/Desktop/learnEngish/server/routes/speech.js';
let content = fs.readFileSync(filePath, 'utf8');

// Add debug logging
const oldStr = "        const xml = Buffer.from(message.data.data, 'base64').toString('utf8');\n        const result = parseResult(xml);";
const newStr = "        const xml = Buffer.from(message.data.data, 'base64').toString('utf8');\n        console.log('讯飞评测XML结果:', xml.substring(0, 500));\n        const result = parseResult(xml);\n        console.log('解析后的评分:', result);";

if (content.includes(oldStr)) {
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESS: Added debug logging');
} else {
  console.log('NOT FOUND, searching...');
  const idx = content.indexOf("const xml = Buffer.from(message.data.data");
  if (idx !== -1) {
    console.log('Found at index:', idx);
    console.log('Context:', JSON.stringify(content.substring(idx - 50, idx + 150)));
  }
}
