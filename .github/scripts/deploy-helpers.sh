#!/bin/bash

# Helper functions for deployment logic

# Check if an item is in an array
is_in_array() {
  local item="$1"
  shift
  local array=("$@")
  for element in "${array[@]}"; do
    if [ "$item" = "$element" ]; then
      return 0
    fi
  done
  return 1
}


# Get the appropriate workspace ID based on integration name
get_workspace_id() {
  local integration_name="$1"
  if [[ "$integration_name" == plus/* ]]; then
    echo "$PLUS_WORKSPACE_ID"
  else
    echo "$BOTPRESS_WORKSPACE_ID"
  fi
}

# Get integration definition data
get_integration_definition() {
  local integration_dir="$1"
  # First get the basic definition without authentication
  local temp_def=$(pnpm bp read --work-dir "integrations/$integration_dir" --json)
  local actual_name=$(echo "$temp_def" | jq -r ".name")
  
  # Get the appropriate workspace ID for this integration
  local workspace_id=$(get_workspace_id "$actual_name")
  
  # Login with the appropriate workspace ID
  pnpm bp login -y --token "$TOKEN_PAT" --workspace-id "$workspace_id"
  
  # Now read the definition with authentication
  pnpm bp read --work-dir "integrations/$integration_dir" --json
}

# Get actual integration name from definition
get_integration_name() {
  local integration_dir="$1"
  local integration_def=$(get_integration_definition "$integration_dir")
  echo "$integration_def" | jq -r ".name"
}


# Check if integration should be excluded
is_integration_excluded() {
  local integration_name="$1"
  is_in_array "$integration_name" "${EXCLUDE_INTEGRATIONS[@]}"
}

# Check if integration already exists
check_integration_exists() {
  local integration_dir="$1"
  bash ./.github/scripts/integration-exists.sh "$integration_dir"
}
