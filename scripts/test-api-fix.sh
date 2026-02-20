#!/bin/bash

# Qwen API Fix Verification Script
# Tests that the API properly handles missing/invalid configurations

echo "🧪 Testing Qwen API Fix..."
echo ""

# Test 1: Check if QwenClient validates configuration
echo "Test 1: Configuration validation"
node -e "
const { QwenClient } = require('./lib/llm/qwen-client');
const client = new QwenClient();
console.log('✅ QwenClient instantiated');
console.log('Is configured:', client.isConfigured());
console.log('');
"

# Test 2: Build the project to check for TypeScript errors
echo "Test 2: TypeScript compilation check"
npm run build 2>&1 | grep -E "(error|warning|Successfully)" | head -20
echo ""

# Test 3: Run the Qwen API test
echo "Test 3: Qwen API connectivity"
npx tsx test-qwen-api.ts
echo ""

echo "✅ All tests completed!"
