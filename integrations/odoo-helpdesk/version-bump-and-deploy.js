#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const definitionFile = path.join(__dirname, 'integration.definition.ts');

// Read the file
let content = fs.readFileSync(definitionFile, 'utf8');

// Find and increment the version
// Matches version: 'x.x.x' or version: "x.x.x"
const versionRegex = /version:\s*['"]([\d]+)\.([\d]+)\.([\d]+)['"]/;
const match = content.match(versionRegex);

if (!match) {
  console.error('Could not find version in integration.definition.ts');
  process.exit(1);
}

const major = parseInt(match[1]);
const minor = parseInt(match[2]);
const patch = parseInt(match[3]);

const newVersion = `${major}.${minor}.${patch + 1}`;

// Replace the version
content = content.replace(versionRegex, `version: '${newVersion}'`);

// Write the file back
fs.writeFileSync(definitionFile, content, 'utf8');

console.log(`Version updated from ${match[1]}.${match[2]}.${match[3]} to ${newVersion}`);

// Run bp deploy -y
console.log('Running bp deploy -y...');
try {
  execSync('bp deploy -y', { stdio: 'inherit', cwd: __dirname });
  console.log('Deployment completed successfully!');
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}
