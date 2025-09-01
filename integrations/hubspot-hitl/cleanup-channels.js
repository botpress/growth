#!/usr/bin/env node

/**
 * HubSpot Channel Cleanup Script
 * 
 * This script:
 * 1. Gets all custom channels from HubSpot
 * 2. Deletes each channel found
 * 
 * Usage: node cleanup-channels.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from test.env
function loadEnvFile() {
  const envPath = path.join(__dirname, 'test.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ test.env file not found. Please make sure it exists in the same directory.');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      // Handle both export and direct assignment formats
      const match = trimmedLine.match(/^(?:export\s+)?([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

// Load environment variables
loadEnvFile();

const HUBSPOT_DEVELOPER_API_KEY = process.env.HUBSPOT_DEVELOPER_API_KEY;
const HUBSPOT_APP_ID = process.env.HUBSPOT_APP_ID;

if (!HUBSPOT_DEVELOPER_API_KEY) {
  console.error('❌ HUBSPOT_DEVELOPER_API_KEY not found in test.env file');
  process.exit(1);
}

if (!HUBSPOT_APP_ID) {
  console.error('❌ HUBSPOT_APP_ID not found in test.env file');
  process.exit(1);
}

console.log('🔑 Using HubSpot Developer API Key:', HUBSPOT_DEVELOPER_API_KEY);
console.log('📱 Using HubSpot App ID:', HUBSPOT_APP_ID);

/**
 * Get all custom channels from HubSpot
 */
async function getAllChannels() {
  const url = `https://api.hubapi.com/conversations/v3/custom-channels/?hapikey=${HUBSPOT_DEVELOPER_API_KEY}&appId=${HUBSPOT_APP_ID}`;
  
  console.log('📡 Fetching all channels...');
  console.log('URL:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully fetched channels');
    console.log('📊 Response:', JSON.stringify(data, null, 2));
    
    return data.results || data || [];
  } catch (error) {
    console.error('❌ Error fetching channels:', error.message);
    throw error;
  }
}

/**
 * Delete a specific channel by ID
 */
async function deleteChannel(channelId) {
  const url = `https://api.hubapi.com/conversations/v3/custom-channels/${channelId}?hapikey=${HUBSPOT_DEVELOPER_API_KEY}&appId=${HUBSPOT_APP_ID}`;
  
  console.log(`🗑️  Deleting channel ${channelId}...`);
  console.log('URL:', url);
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    console.log(`✅ Successfully deleted channel ${channelId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting channel ${channelId}:`, error.message);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting HubSpot Channel Cleanup...\n');
  
  try {
    // Step 1: Get all channels
    const channels = await getAllChannels();
    
    if (!channels || channels.length === 0) {
      console.log('ℹ️  No channels found to delete.');
      return;
    }
    
    console.log(`\n📋 Found ${channels.length} channel(s) to delete:`);
    channels.forEach((channel, index) => {
      console.log(`  ${index + 1}. Channel ID: ${channel.id || channel.channelId || 'Unknown'}`);
      if (channel.name) console.log(`     Name: ${channel.name}`);
    });
    
    console.log('\n🗑️  Starting deletion process...\n');
    
    // Step 2: Delete each channel
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const channel of channels) {
      const channelId = channel.id || channel.channelId;
      
      if (!channelId) {
        console.log('⚠️  Skipping channel with no ID:', JSON.stringify(channel));
        failedCount++;
        continue;
      }
      
      const success = await deleteChannel(channelId);
      
      if (success) {
        deletedCount++;
      } else {
        failedCount++;
      }
      
      // Add a small delay between requests to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`✅ Successfully deleted: ${deletedCount} channel(s)`);
    console.log(`❌ Failed to delete: ${failedCount} channel(s)`);
    console.log(`📋 Total processed: ${channels.length} channel(s)`);
    
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
