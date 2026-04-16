/**
 * Test script for the notification checker API
 * This script simulates calling the check-cooldowns endpoint
 */

const fetch = require('node-fetch');

async function testNotificationChecker() {
  try {
    console.log('Testing notification checker API...');
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/notifications/check-cooldowns`;
    
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include auth header if CRON_SECRET is set
        ...(process.env.CRON_SECRET && {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        })
      }
    });
    
    const result = await response.json();
    
    console.log('\n=== Response ===');
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${result.success}`);
    console.log(`Processed: ${result.processed} players`);
    console.log(`Notifications sent: ${result.notifications?.filter(n => n.sent).length || 0}`);
    
    if (result.notifications && result.notifications.length > 0) {
      console.log('\n=== Notifications ===');
      result.notifications.forEach((notification, index) => {
        console.log(`${index + 1}. ${notification.playerName} (${notification.type}): ${notification.sent ? 'SENT' : 'FAILED'}`);
        if (notification.error) {
          console.log(`   Error: ${notification.error}`);
        }
      });
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n=== Errors ===');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (!response.ok) {
      console.error('\nAPI call failed:', result);
      process.exit(1);
    }
    
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testNotificationChecker();