const { execSync } = require('child_process');

try {
  const output = execSync('node node_modules/next/dist/bin/next.js build', {
    encoding: 'utf-8',
    stdio: 'pipe',
    cwd: process.cwd()
  });
  console.log(output);
} catch (error) {
  console.error('STDOUT:', error.stdout);
  console.error('STDERR:', error.stderr);
  console.error('Status:', error.status);
  process.exit(error.status || 1);
}
