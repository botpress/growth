#!/bin/bash

# Local test script for deployment workflow
# This script simulates the deployment process without requiring actual tokens
# Usage: ./test-deployment-local.sh

set -e

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🧪 Starting LOCAL TEST deployment process..."
echo "Force flag: false (simulated)"
echo "Excluded integrations: hitl-salesforce"
echo ""

# Source the helper functions (we'll modify them for testing)
source "$SCRIPT_DIR/deploy-helpers.sh"

# Configuration
EXCLUDE_INTEGRATIONS=("hitl-salesforce")

# Mock the authentication function for testing
mock_get_workspace_id() {
  local integration_name="$1"
  if [[ "$integration_name" == plus/* ]]; then
    echo "MOCK_PLUS_WORKSPACE_ID"
  else
    echo "MOCK_BOTPRESS_WORKSPACE_ID"
  fi
}

# Override the get_workspace_id function for testing
get_workspace_id() {
  mock_get_workspace_id "$1"
}

# Mock the integration existence check
mock_check_integration_exists() {
  local integration_dir="$1"
  # Simulate some integrations existing and some not
  case "$integration_dir" in
    "apollo"|"brevo-hitl"|"email-notifier")
      echo "1"  # Exists
      ;;
    *)
      echo "0"  # Doesn't exist
      ;;
  esac
}

# Override the check function for testing
check_integration_exists() {
  mock_check_integration_exists "$1"
}

# Main deployment logic
cd "$PROJECT_ROOT/integrations"

for integration_dir in */; do
  if [ ! -d "$integration_dir" ]; then
    continue
  fi
  
  integration_name=${integration_dir%/}
  
  echo "🔍 Processing integration: $integration_name"
  
  # Check if integration is completely excluded
  if is_integration_excluded "$integration_name"; then
    echo "⏭️  Integration $integration_name is in exclude list, skipping deployment completely"
    continue
  fi
  
  # Get actual integration name for logging
  cd "$PROJECT_ROOT"
  actual_integration_name=$(get_integration_name "$integration_name")
  cd integrations
  
  echo "📋 Integration details:"
  echo "   - Directory: $integration_name"
  echo "   - Actual name: $actual_integration_name"
  
  # Check if integration already exists (mocked)
  cd "$PROJECT_ROOT"
  echo "🔐 Simulating authentication and checking if integration exists..."
  exists=$(check_integration_exists "$integration_name")
  echo "📊 Integration $integration_name exists check result: $exists"
  cd integrations
  
  # Determine what would happen
  if [ "$exists" = "0" ]; then
    echo "✅ Would deploy integration: $integration_name"
    echo "   - Reason: Integration doesn't exist"
    
    # Get workspace ID for this integration
    WORKSPACE_ID=$(get_workspace_id "$actual_integration_name")
    echo "   - Would use workspace ID: $WORKSPACE_ID"
    echo "   - Would authenticate with token: MOCK_TOKEN..."
    echo "   - Would run: npx @botpress/cli deploy --public --confirm"
  else
    echo "⏭️  Would skip integration: $integration_name"
    echo "   - Reason: Integration already exists (use force=true to override)"
  fi
  
  echo "---"
done

echo "🎉 LOCAL TEST deployment completed successfully"
echo ""
echo "📝 Summary:"
echo "   - This was a local test run - no actual deployments were made"
echo "   - All logic checks were performed with mocked data"
echo "   - Use the actual deployment script to perform real deployments"
echo ""
echo "🚀 To run the real test with actual authentication:"
echo "   bash ./.github/scripts/test-deployment.sh false 'YOUR_TOKEN' 'PLUS_WORKSPACE_ID' 'BOTPRESS_WORKSPACE_ID'"
