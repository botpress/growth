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
  
  # Read the integration name from package.json
  # Handle both cases: running from project root or from integrations directory
  local package_file
  if [ -f "integrations/$integration_dir/package.json" ]; then
    package_file="integrations/$integration_dir/package.json"
  elif [ -f "$integration_dir/package.json" ]; then
    package_file="$integration_dir/package.json"
  else
    echo "Error: Package.json file not found for integration: $integration_dir" >&2
    echo "Tried paths: integrations/$integration_dir/package.json and $integration_dir/package.json" >&2
    exit 1
  fi
  
  if [ -f "$package_file" ]; then
    local actual_name=$(jq -r '.integrationName // .name' "$package_file")
    echo "Debug: Found integration name from package.json: $actual_name" >&2
  else
    echo "Error: Package.json file not found: $package_file" >&2
    exit 1
  fi
  
  # Get the appropriate workspace ID for this integration
  local workspace_id=$(get_workspace_id "$actual_name")
  echo "Debug: Using workspace ID: $workspace_id for integration: $actual_name" >&2
  
  # Login with the appropriate workspace ID
  pnpm bp login -y --token "$TOKEN_PAT" --workspace-id "$workspace_id"
  
  # Return the package.json content as JSON (we don't need bp read anymore)
  cat "$package_file"
}

# Get actual integration name from definition
get_integration_name() {
  local integration_dir="$1"
  
  # Handle both cases: running from project root or from integrations directory
  local package_file
  if [ -f "integrations/$integration_dir/package.json" ]; then
    package_file="integrations/$integration_dir/package.json"
  elif [ -f "$integration_dir/package.json" ]; then
    package_file="$integration_dir/package.json"
  else
    echo "Error: Package.json file not found for integration: $integration_dir" >&2
    exit 1
  fi
  
  jq -r '.integrationName // .name' "$package_file"
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
