#!/bin/bash

# Test deployment script - runs through the complete workflow but logs instead of deploying
# Usage: test-deployment.sh <force_flag> <token_pat> <plus_workspace_id> <botpress_workspace_id>

set -e

FORCE_FLAG="$1"
TOKEN_PAT="$2"
PLUS_WORKSPACE_ID="$3"
BOTPRESS_WORKSPACE_ID="$4"

if [ -z "$FORCE_FLAG" ] || [ -z "$TOKEN_PAT" ] || [ -z "$PLUS_WORKSPACE_ID" ] || [ -z "$BOTPRESS_WORKSPACE_ID" ]; then
  echo "Error: All parameters are required" >&2
  echo "Usage: test-deployment.sh <force_flag> <token_pat> <plus_workspace_id> <botpress_workspace_id>" >&2
  exit 1
fi

# Export variables for use in other scripts
export TOKEN_PAT
export PLUS_WORKSPACE_ID
export BOTPRESS_WORKSPACE_ID

# Source the helper functions
source ./.github/scripts/deploy-helpers.sh

# Configuration
EXCLUDE_INTEGRATIONS=("hitl-salesforce")

echo "🧪 Starting TEST deployment process..."
echo "Force flag: $FORCE_FLAG"
echo "Excluded integrations: ${EXCLUDE_INTEGRATIONS[*]}"
echo ""

# Main deployment logic
cd integrations

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
  cd ..
  actual_integration_name=$(get_integration_name "$integration_name")
  cd integrations
  
  echo "📋 Integration details:"
  echo "   - Directory: $integration_name"
  echo "   - Actual name: $actual_integration_name"
  
  # Check if integration already exists
  cd ..
  echo "🔐 Authenticating and checking if integration exists..."
  exists=$(check_integration_exists "$integration_name")
  echo "📊 Integration $integration_name exists check result: $exists"
  cd integrations
  
  # Determine what would happen
  if [ "$exists" = "0" ] || [ "$FORCE_FLAG" = "true" ]; then
    echo "✅ Would deploy integration: $integration_name"
    echo "   - Reason: $([ "$exists" = "0" ] && echo "Integration doesn't exist" || echo "Force flag is true")"
    
    # Get workspace ID for this integration
    WORKSPACE_ID=$(get_workspace_id "$actual_integration_name")
    echo "   - Would use workspace ID: $WORKSPACE_ID"
    echo "   - Would authenticate with token: ${TOKEN_PAT:0:10}..."
    echo "   - Would run: npx @botpress/cli deploy $([ "$FORCE_FLAG" = "true" ] && echo "--force") --public --confirm"
  else
    echo "⏭️  Would skip integration: $integration_name"
    echo "   - Reason: Integration already exists (use force=true to override)"
  fi
  
  echo "---"
done

echo "🎉 TEST deployment completed successfully"
echo ""
echo "📝 Summary:"
echo "   - This was a test run - no actual deployments were made"
echo "   - All authentication and logic checks were performed"
echo "   - Use the actual deployment script to perform real deployments"
