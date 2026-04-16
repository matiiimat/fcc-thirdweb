// Test script for the migration API
async function testMigrationAPI() {
  const baseUrl = 'http://fcc-test.vercel.app'; // Your deployed app URL
  
  console.log('Testing Migration API...\n');
  
  try {
    const response = await fetch(`${baseUrl}/api/migrate-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: 'migrate-notifications-2024'
      })
    });
    
    const result = await response.json();
    console.log('Migration response:', JSON.stringify(result, null, 2));
    console.log('Status:', response.status);
    
    if (result.success) {
      console.log('\n✅ Migration completed successfully!');
      console.log('Updated player:', result.player);
    } else {
      console.log('\n❌ Migration failed or no changes needed');
      console.log('Message:', result.message);
    }
    
  } catch (error) {
    console.error('Migration API error:', error.message);
  }
}

// Run the test
testMigrationAPI().catch(console.error);