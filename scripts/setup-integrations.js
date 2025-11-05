const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const integrationsDir = path.join(__dirname, '..', 'integrations');
if (!fs.existsSync(integrationsDir)) {
  console.error('No integrations directory found');
  process.exit(0);
}

const dirs = fs.readdirSync(integrationsDir).filter((d) => {
  const full = path.join(integrationsDir, d);
  return fs.statSync(full).isDirectory();
});

for (const dir of dirs) {
  const cwd = path.join(integrationsDir, dir);
  console.log(`\n==> Building ${dir}`);
  try {
    execSync('pnpm exec bp build', { cwd, stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to build ${dir}`);
    console.error(err);
    process.exit(1);
  }
}

