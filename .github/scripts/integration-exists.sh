#!/bin/bash

# Source the helper functions
source ./.github/scripts/deploy-helpers.sh

if [ -z "$1" ]; then
  echo "Error: integration name is not provided" >&2 
  exit 1
fi
integration=$1

# Get the actual integration name from the definition file
cd ..
integration_path="integrations/$integration"
integration_def=$(pnpm bp read --work-dir $integration_path --json)
cd integrations

name=$(echo $integration_def | jq -r ".name")
version=$(echo $integration_def | jq -r ".version")

# Get the appropriate workspace ID for this integration
WORKSPACE_ID=$(get_workspace_id "$name")
echo "Using workspace ID: $WORKSPACE_ID for integration: $name (dir: $integration)" >&2

# Login with the appropriate workspace ID
pnpm bp login -y --token "$TOKEN_PAT" --workspace-id "$WORKSPACE_ID"

exists=$(pnpm bp integrations ls --name $name --version-number $version --json | jq '[ .[] | select(.public) ] | length') # 0 if not exists
echo $exists