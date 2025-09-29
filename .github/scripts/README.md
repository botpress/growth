# Deployment Test Scripts

This directory contains test scripts for the deployment workflow that allow you to test the complete process without actually deploying integrations.

## Available Test Scripts

### 1. Local Test (No Authentication Required)
```bash
./test-deployment-local.sh
```
- **Purpose**: Test the deployment logic locally without requiring any authentication
- **Features**: 
  - Mocks authentication and integration existence checks
  - Shows what would happen for each integration
  - No external dependencies required
- **Use Case**: Quick local testing of the deployment logic

### 2. Full Test (With Authentication)
```bash
./test-deployment.sh <force_flag> <token_pat> <plus_workspace_id> <botpress_workspace_id>
```
- **Purpose**: Test the complete workflow with real authentication
- **Features**:
  - Performs actual authentication with Botpress
  - Checks real integration existence
  - Logs all actions without deploying
- **Use Case**: Testing authentication and real integration state

### 3. GitHub Actions Test
- **Workflow**: `.github/workflows/test-deployment.yml`
- **Trigger**: Manual workflow dispatch
- **Purpose**: Test in GitHub Actions environment
- **Features**: Same as full test but runs in CI environment

## Usage Examples

### Local Testing
```bash
# Run local test (no setup required)
cd .github/scripts
./test-deployment-local.sh
```

### Full Testing with Real Authentication
```bash
# Run full test with your credentials
cd .github/scripts
./test-deployment.sh false "your_token_here" "plus_workspace_id" "botpress_workspace_id"
```

### GitHub Actions Testing
1. Go to the "Actions" tab in your GitHub repository
2. Select "Test Deployment Workflow"
3. Click "Run workflow"
4. Optionally set the "force" parameter

## What the Tests Show

The test scripts will show you:

- ✅ **Which integrations would be deployed** (and why)
- ⏭️ **Which integrations would be skipped** (and why)
- 🔐 **Authentication status** for each integration
- 📊 **Integration existence status**
- 🏢 **Workspace ID assignments**
- 📋 **Integration details** (name, directory, etc.)

## Output Example

```
🧪 Starting TEST deployment process...
Force flag: false
Excluded integrations: hitl-salesforce

🔍 Processing integration: apollo
📋 Integration details:
   - Directory: apollo
   - Actual name: apollo
🔐 Authenticating and checking if integration exists...
📊 Integration apollo exists check result: 1
⏭️  Would skip integration: apollo
   - Reason: Integration already exists (use force=true to override)
---
```

## Benefits

- **Safe Testing**: No actual deployments are made
- **Complete Workflow**: Tests the entire process including authentication
- **Debugging**: Shows exactly what would happen for each integration
- **Validation**: Confirms your deployment logic works correctly
- **CI/CD Ready**: Can be run in GitHub Actions for automated testing
