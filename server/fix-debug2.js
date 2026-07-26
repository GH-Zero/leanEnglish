const fs = require('fs');
const filePath = 'C:/Users/86182/Desktop/learnEngish/server/routes/speech.js';
let content = fs.readFileSync(filePath, 'utf8');

// Add debug to parseResult
const oldStr = "function parseResult(xml) {\n  const rawScore = xmlNumber(xml, 'total_score');";
const newStr = "function parseResult(xml) {\n  console.log('原始XML(前800):', xml.substring(0, 800));\n  const rawScore = xmlNumber(xml, 'total_score');\n  console.log('total_score原始值:', rawScore);";

if (content.includes(oldStr)) {
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESS: Added parseResult debug');
} else {
  console.log('NOT FOUND');
  const idx = content.indexOf("function parseResult(xml)");
  if (idx !== -1) {
    console.log('Found at:', idx);
    console.log('Context:', JSON.stringify(content.substring(idx, idx + 200)));
  }
}
