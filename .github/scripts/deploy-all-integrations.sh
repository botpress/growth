#!/bin/bash

# Main deployment orchestrator for all integrations
# Usage: deploy-all-integrations.sh <force_flag> <token_pat> <plus_workspace_id> <botpress_workspace_id>

set -e

FORCE_FLAG="$1"
TOKEN_PAT="$2"
PLUS_WORKSPACE_ID="$3"
BOTPRESS_WORKSPACE_ID="$4"

if [ -z "$FORCE_FLAG" ] || [ -z "$TOKEN_PAT" ] || [ -z "$PLUS_WORKSPACE_ID" ] || [ -z "$BOTPRESS_WORKSPACE_ID" ]; then
  echo "Error: All parameters are required" >&2
  echo "Usage: deploy-all-integrations.sh <force_flag> <token_pat> <plus_workspace_id> <botpress_workspace_id>" >&2
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

# Make the integration-exists script executable
chmod +x ./.github/scripts/integration-exists.sh

echo "Starting deployment process..."
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
  
  echo "Processing integration: $integration_name"
  
  # Check if integration is completely excluded
  if is_integration_excluded "$integration_name"; then
    echo "Integration $integration_name is in exclude list, skipping deployment completely"
    continue
  fi
  
  # Get actual integration name for logging
  cd ..
  actual_integration_name=$(get_integration_name "$integration_name")
  cd integrations
  
  # Check if integration already exists
  cd ..
  exists=$(check_integration_exists "$integration_name")
  echo "Integration $integration_name exists check result: $exists"
  cd integrations
  
  # Deploy if needed
  if [ "$exists" = "0" ] || [ "$FORCE_FLAG" = "true" ]; then
    echo "Deploying integration: $integration_name"
    bash ./.github/scripts/deploy-integration.sh "$integration_name" "$FORCE_FLAG"
  else
    echo "Integration $integration_name already exists, skipping deployment (use force=true to override)"
  fi
  
  echo "---"
done

echo "Deployment completed successfully"
