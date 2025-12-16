const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const integrationsDir = path.join(__dirname, '..', 'integrations');
if (!fs.existsSync(integrationsDir)) {
  console.error('No integrations directory found');
  process.exit(0);
}

const workspacePackages = new Set();
const workspaceFile = path.join(__dirname, '..', 'pnpm-workspace.yaml');
if (fs.existsSync(workspaceFile)) {
  const workspaceContent = fs.readFileSync(workspaceFile, 'utf8');
  // Match all package entries like: - 'integrations/apify'
  const packageMatches = workspaceContent.matchAll(/-\s*['"]integrations\/([^'"]+)['"]/g);
  for (const match of packageMatches) {
    workspacePackages.add(match[1]); // Extract just the directory name (e.g., 'apify')
  }
}

const dirs = fs.readdirSync(integrationsDir).filter((d) => {
  const full = path.join(integrationsDir, d);
  return fs.statSync(full).isDirectory();
});

for (const dir of dirs) {
  const cwd = path.join(integrationsDir, dir);
  
  // Skip pnpm install for directories in the workspace
  if (!workspacePackages.has(dir)) {
    console.log(`\n==> Installing dependencies for ${dir}`);
    try {
      execSync('pnpm install --no-frozen-lockfile --ignore-workspace', { cwd, stdio: 'inherit' });
    } catch (err) {
      console.error(`Failed to install dependencies for ${dir}`);
      console.error(err);
      process.exit(1);
    }
  } else {
    console.log(`\n==> Skipping pnpm install for ${dir} (managed by workspace)`);
  }

  // Check if integration has local path bpDependencies
  const pkgJsonPath = path.join(cwd, 'package.json');
  let needsBpAdd = false;
  if (fs.existsSync(pkgJsonPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    const bpDeps = pkgJson.bpDependencies || {};
    needsBpAdd = Object.values(bpDeps).some((v) => v.startsWith('../') || v.startsWith('./'));
  }

  console.log(`\n==> Building ${dir}`);
  try {
    if (needsBpAdd) {
      console.log(`Running bp add for ${dir} (has local bpDependencies)`);
      execSync('pnpm exec bp add -y', { cwd, stdio: 'inherit' });
    }
    execSync('pnpm exec bp build', { cwd, stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to build ${dir}`);
    console.error(err);
    process.exit(1);
  }
}

