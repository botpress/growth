const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Prevent recursive execution when called from nested pnpm install
if (process.env.SETUP_INTEGRATIONS_RUNNING === 'true') {
  console.log('Skipping setup-integrations (already running in parent process)');
  process.exit(0);
}

const integrationsDir = path.join(__dirname, '..', 'integrations');
if (!fs.existsSync(integrationsDir)) {
  console.error('No integrations directory found');
  process.exit(0);
}

// Load workspace packages to skip them
const workspacePackages = new Set();
const workspaceFile = path.join(__dirname, '..', 'pnpm-workspace.yaml');
if (fs.existsSync(workspaceFile)) {
  const yaml = fs.readFileSync(workspaceFile, 'utf8');
  const packages = yaml.match(/packages:\s*\n\s*-\s*'([^']+)'/g);
  if (packages) {
    packages.forEach((line) => {
      const match = line.match(/'([^']+)'/);
      if (match) {
        // Extract the directory name from patterns like 'integrations/brevo-hitl'
        const parts = match[1].split('/');
        if (parts.length > 1 && parts[0] === 'integrations') {
          workspacePackages.add(parts[1]);
        }
      }
    });
  }
}

const dirs = fs.readdirSync(integrationsDir).filter((d) => {
  const full = path.join(integrationsDir, d);
  return fs.statSync(full).isDirectory();
});

for (const dir of dirs) {
  // Skip workspace packages as they're managed by pnpm workspace
  if (workspacePackages.has(dir)) {
    console.log(`\n==> Skipping ${dir} (managed by pnpm workspace)`);
    continue;
  }
  const cwd = path.join(integrationsDir, dir);
  console.log(`\n==> Installing dependencies for ${dir}`);
  try {
    execSync('pnpm install --no-frozen-lockfile', {
      cwd,
      stdio: 'inherit',
      env: { ...process.env, SETUP_INTEGRATIONS_RUNNING: 'true' }
    });
  } catch (err) {
    console.error(`Failed to install dependencies for ${dir}`);
    console.error(err);
    process.exit(1);
  }

  console.log(`\n==> Building ${dir}`);
  try {
    execSync('pnpm exec bp build', {
      cwd,
      stdio: 'inherit',
      env: { ...process.env, SETUP_INTEGRATIONS_RUNNING: 'true' }
    });
  } catch (err) {
    console.error(`Failed to build ${dir}`);
    console.error(err);
    process.exit(1);
  }
}
