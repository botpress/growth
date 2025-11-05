const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const integrationsDir = path.join(__dirname, '..', 'integrations');
if (!fs.existsSync(integrationsDir)) {
  console.error('No integrations directory found');
  process.exit(0);
}

// Check if pnpm-workspace.yaml exists and read workspace packages
const workspaceFile = path.join(__dirname, '..', 'pnpm-workspace.yaml');
let workspacePackages = [];
if (fs.existsSync(workspaceFile)) {
  const workspaceContent = fs.readFileSync(workspaceFile, 'utf8');
  const workspaceConfig = yaml.parse(workspaceContent);
  workspacePackages = workspaceConfig.packages || [];
}

const dirs = fs.readdirSync(integrationsDir).filter((d) => {
  const full = path.join(integrationsDir, d);
  return fs.statSync(full).isDirectory();
});

for (const dir of dirs) {
  const cwd = path.join(integrationsDir, dir);
  const relativePath = `integrations/${dir}`;

  // Check if this integration is in the workspace
  const isInWorkspace = workspacePackages.some(pattern => {
    // Simple pattern matching for 'integrations/brevo-hitl' or 'integrations/*'
    return pattern === relativePath ||
           pattern.replace('/*', `/${dir}`) === relativePath;
  });

  // Only run pnpm install for integrations NOT in the workspace
  if (!isInWorkspace) {
    console.log(`\n==> Installing dependencies for ${dir}`);
    try {
      // Use --ignore-scripts to prevent recursive postinstall execution
      execSync('pnpm install --no-frozen-lockfile --ignore-scripts', { cwd, stdio: 'inherit' });
    } catch (err) {
      console.error(`Failed to install dependencies for ${dir}`);
      console.error(err);
      process.exit(1);
    }
  } else {
    console.log(`\n==> Skipping install for ${dir} (in workspace)`);
  }

  console.log(`\n==> Building ${dir}`);
  try {
    execSync('pnpm exec bp build', { cwd, stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to build ${dir}`);
    console.error(err);
    process.exit(1);
  }
}

