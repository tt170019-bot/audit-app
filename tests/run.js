// Runs every tests/*.test.js in its own process and propagates a non-zero
// exit code if any fail. Plain Node, no shell-specific syntax — works the
// same in bash (CI, macOS/Linux) and cmd.exe (Windows), unlike a bash `for`
// loop in a package.json script.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.test.js')).sort();

let failed = 0;
for (const file of files) {
  const full = path.join(dir, file);
  const result = spawnSync(process.execPath, [full], { stdio: 'inherit' });
  if (result.status !== 0) failed++;
}

console.log(`\n${files.length - failed}/${files.length} test files passed`);
process.exit(failed > 0 ? 1 : 0);
