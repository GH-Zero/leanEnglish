const fs = require('fs');
const filePath = 'C:/Users/86182/Desktop/learnEngish/server/routes/user.js';
let content = fs.readFileSync(filePath, 'utf8');

// Add await before updateDailyRecord calls
content = content.replace(/\t\t\tupdateDailyRecord\(/g, '\t\t\tawait updateDailyRecord(');
// Add await before updateStreak calls  
content = content.replace(/\t\t\tupdateStreak\(/g, '\t\t\tawait updateStreak(');

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS');
