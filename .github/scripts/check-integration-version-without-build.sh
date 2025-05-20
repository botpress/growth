#!/bin/bash

if [ -z "$1" ]; then
  echo "Error: integration name is not provided" >&2 
  exit 1
fi

integration=$1
integration_path="integrations/$integration"

definition_file="$integration_path/integration.definition.ts"
if [ ! -f "$definition_file" ]; then
  echo "Error: integration definition file not found at $definition_file" >&2
  exit 1
fi

version=$(grep -o "version: ['\"].*['\"]" "$definition_file" | head -1 | sed "s/version: ['\"]//g" | sed "s/['\"]//g")
name=$(grep -o "name: ['\"].*['\"]" "$definition_file" | head -1 | sed "s/name: ['\"]//g" | sed "s/['\"]//g" | sed "s/.*\\///g")

if [[ "$name" == *integrationName* ]] || [ -z "$name" ]; then
  name=$(grep -o "\"integrationName\": ['\"].*['\"]" "$integration_path/package.json" | head -1 | sed "s/\"integrationName\": ['\"]//g" | sed "s/['\"]//g")
fi

if [ -n "$version" ] && [ -n "$name" ]; then
  exists=$(pnpm bp integrations ls --name "$name" --version-number "$version" --json | jq '[ .[] | select(.public) ] | length')
  echo $exists
else
  echo "Error: Could not extract version or name from integration" >&2
  exit 2
fi