// Test script for the trigger API
const testAddress = '0x6be82ef4ad6534a66e8e7568956c523bb1b5e6e0';

async function testTriggerAPI() {
  const baseUrl = 'http://fcc-test.vercel.app'; // Adjust if your app runs on a different port
  
  console.log('Testing Trigger API...\n');
  
  // Test training notification
  console.log('1. Testing training notification trigger:');
  try {
    const trainingResponse = await fetch(`${baseUrl}/api/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ethAddress: testAddress,
        type: 'training'
      })
    });
    
    const trainingResult = await trainingResponse.json();
    console.log('Training trigger response:', trainingResult);
    console.log('Status:', trainingResponse.status);
  } catch (error) {
    console.error('Training trigger error:', error.message);
  }
  
  console.log('\n2. Testing match notification trigger:');
  try {
    const matchResponse = await fetch(`${baseUrl}/api/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ethAddress: testAddress,
        type: 'match'
      })
    });
    
    const matchResult = await matchResponse.json();
    console.log('Match trigger response:', matchResult);
    console.log('Status:', matchResponse.status);
  } catch (error) {
    console.error('Match trigger error:', error.message);
  }
  
  console.log('\n3. Testing invalid type:');
  try {
    const invalidResponse = await fetch(`${baseUrl}/api/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ethAddress: testAddress,
        type: 'invalid'
      })
    });
    
    const invalidResult = await invalidResponse.json();
    console.log('Invalid type response:', invalidResult);
    console.log('Status:', invalidResponse.status);
  } catch (error) {
    console.error('Invalid type error:', error.message);
  }
  
  console.log('\n4. Testing missing ethAddress:');
  try {
    const missingResponse = await fetch(`${baseUrl}/api/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'training'
      })
    });
    
    const missingResult = await missingResponse.json();
    console.log('Missing ethAddress response:', missingResult);
    console.log('Status:', missingResponse.status);
  } catch (error) {
    console.error('Missing ethAddress error:', error.message);
  }
}

// Run the test
testTriggerAPI().catch(console.error);