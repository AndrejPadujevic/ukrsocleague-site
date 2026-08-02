const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('--- UKRSOCLEAGUE Local Webapp Verification ---');

const ROOT = path.join(__dirname, '..');
const filesToCheck = [
  'index.html',
  'archive.htm',
  'history.htm',
  'manifest.htm',
  '404.html',
  'style.css',
  'sw.js',
  'js/config.js',
  'js/supabase-client.js',
  'js/votes.js',
  'js/comments.js',
  'js/bookmarks.js',
  'js/reader.js',
  'js/theme.js',
  'js/search.js',
  'js/engagement.js',
  'js/layout.js',
  'js/app-nav.js',
  'js/article-widgets.js',
  'js/archive-init.js',
  'js/archive-data.js'
];

let errors = 0;

filesToCheck.forEach(file => {
  const filePath = path.join(ROOT, file);
  if (!fs.existsSync(filePath)) {
    console.error(`[MISSING] File does not exist: ${file}`);
    errors++;
  } else {
    const stat = fs.statSync(filePath);
    if (stat.size === 0) {
      console.error(`[EMPTY] File is empty: ${file}`);
      errors++;
    } else {
      console.log(`[OK] ${file} (${stat.size} bytes)`);
    }
  }
});

// Check JS syntax
const jsFiles = filesToCheck.filter(f => f.endsWith('.js'));
jsFiles.forEach(file => {
  const filePath = path.join(ROOT, file);
  const code = fs.readFileSync(filePath, 'utf8');
  try {
    new Function(code);
    console.log(`[JS SYNTAX OK] ${file}`);
  } catch (e) {
    console.error(`[JS SYNTAX ERROR] ${file}: ${e.message}`);
    errors++;
  }
});

console.log('---------------------------------------------');
if (errors === 0) {
  console.log('SUCCESS: All local files exist, non-empty, and valid JS syntax.');
  process.exit(0);
} else {
  console.error(`FAILED with ${errors} error(s).`);
  process.exit(1);
}
