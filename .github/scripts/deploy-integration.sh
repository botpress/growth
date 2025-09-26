#!/bin/bash

# Deploy a single integration
# Usage: deploy-integration.sh <integration_dir> <force_flag>

set -e

INTEGRATION_DIR="$1"
FORCE_FLAG="$2"

if [ -z "$INTEGRATION_DIR" ]; then
  echo "Error: integration directory is required" >&2
  exit 1
fi

if [ -z "$FORCE_FLAG" ]; then
  echo "Error: force flag is required" >&2
  exit 1
fi

echo "Deploying integration: $INTEGRATION_DIR"

# Get the actual integration name from the definition file
cd ..
INTEGRATION_DEF=$(get_integration_definition "$INTEGRATION_DIR")
ACTUAL_INTEGRATION_NAME=$(echo "$INTEGRATION_DEF" | jq -r ".name")
cd integrations

# Get the appropriate workspace ID for this integration
WORKSPACE_ID=$(get_workspace_id "$ACTUAL_INTEGRATION_NAME")
echo "Using workspace ID: $WORKSPACE_ID for integration: $ACTUAL_INTEGRATION_NAME (dir: $INTEGRATION_DIR)"

# Login with the appropriate workspace ID
pnpm bp login -y --token "$TOKEN_PAT" --workspace-id "$WORKSPACE_ID"

cd "$INTEGRATION_DIR"

if [ "$FORCE_FLAG" = "true" ]; then
  npx @botpress/cli deploy --force --public --confirm
else
  npx @botpress/cli deploy --public --confirm
fi

cd ..

echo "Successfully deployed integration: $ACTUAL_INTEGRATION_NAME"
