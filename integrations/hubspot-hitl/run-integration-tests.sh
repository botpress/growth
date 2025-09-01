#!/bin/bash

# Run full integration flow tests for HubSpot HITL
echo "🧪 Running HubSpot HITL Full Integration Tests..."

# Check if environment file exists
if [ -f "test.env" ]; then
    echo "📋 Loading test environment variables..."
    export $(grep -v '^#' test.env | grep -v '^$' | xargs)
else
    echo "⚠️  No test.env file found. Make sure environment variables are set."
fi

# Run the specific integration test
echo "🚀 Starting full integration flow test..."
npx vitest run tests/e2e/full-integration-flow.test.ts --config vitest.e2e.config.ts

echo "✅ Integration tests completed!"
