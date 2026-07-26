const fs = require('fs');
const filePath = 'C:/Users/86182/Desktop/learnEngish/server/database.js';
let content = fs.readFileSync(filePath, 'utf8');

// In initDatabase function, replace connection.query with dbConn.query (but not the first one that creates DB)
// First, find the initDatabase function
const initStart = content.indexOf('async function initDatabase()');
const moduleExport = content.indexOf('module.exports');

if (initStart !== -1 && moduleExport !== -1) {
	let initSection = content.substring(initStart, moduleExport);
	
	// Count connection.query occurrences - the first 2 are for CREATE DATABASE and USE, keep those as connection.query
	// All others should be dbConn.query
	let count = 0;
	initSection = initSection.replace(/connection\.query\(/g, (match) => {
		count++;
		if (count <= 2) return match; // Keep first 2 (CREATE DATABASE, USE)
		return 'dbConn.query(';
	});
	
	// Fix the connection.release to be after USE
	initSection = initSection.replace(
		/await connection\.query\(`USE \$\{dbConfig\.database\}`\);\s*\n\s*connection\.release\(\);/,
		"await connection.query(`USE ${dbConfig.database}`);\n\t\tconnection.release();"
	);
	
	// Replace the finally block - release dbConn instead of connection
	initSection = initSection.replace(
		/connection\.release\(\);\s*\}\s*$/,
		'}'
	);
	
	content = content.substring(0, initStart) + initSection + content.substring(moduleExport);
	
	fs.writeFileSync(filePath, content, 'utf8');
	console.log('SUCCESS: Updated initDatabase to use dbConn');
} else {
	console.log('ERROR: Could not find initDatabase');
}
