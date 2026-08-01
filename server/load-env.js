const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '.env');
if (fs.existsSync(file)) {
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const value = line.trim();
    if (!value || value.startsWith('#')) continue;
    const separator = value.indexOf('=');
    if (separator <= 0) continue;
    const key = value.slice(0, separator).trim();
    const raw = value.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) process.env[key] = raw;
  }
}