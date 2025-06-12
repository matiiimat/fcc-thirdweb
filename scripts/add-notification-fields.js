import { MongoClient } from 'mongodb';

// Use environment variable directly (should be set in production)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

async function addNotificationFields() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const playersCollection = db.collection('players');
    
    // Test with specific addresses
    const testAddresses = [
      '0x3c7c4ec24d84c3ee26992da886aa361d06169623'
    ];
    
    // Add the new fields to both test players
    for (const testAddress of testAddresses) {
      console.log(`\n🔍 Processing player: ${testAddress}`);
      
      const result = await playersCollection.updateOne(
        {
          ethAddress: testAddress,
          // Only update if the player doesn't have these fields yet
          $or: [
            { lastTrainingNotificationTrigger: { $exists: false } },
            { lastMatchNotificationTrigger: { $exists: false } }
          ]
        },
        {
          $set: {
            lastTrainingNotificationTrigger: null,
            lastMatchNotificationTrigger: null
          }
        }
      );
      
      if (result.matchedCount === 0) {
        console.log(`❌ No player found with address ${testAddress} or fields already exist`);
      } else if (result.modifiedCount === 1) {
        console.log(`✅ Successfully updated player ${testAddress} with notification trigger fields`);
      } else {
        console.log(`ℹ️  Player ${testAddress} found but no changes made (fields may already exist)`);
      }
      
      // Verify the update
      const updatedPlayer = await playersCollection.findOne({ ethAddress: testAddress });
      if (updatedPlayer) {
        console.log('📋 Updated player fields:', {
          playerName: updatedPlayer.playerName,
          ethAddress: updatedPlayer.ethAddress,
          lastTrainingNotificationTrigger: updatedPlayer.lastTrainingNotificationTrigger,
          lastMatchNotificationTrigger: updatedPlayer.lastMatchNotificationTrigger
        });
      } else {
        console.log(`❌ Player not found: ${testAddress}`);
      }
    }
    
  } catch (error) {
    console.error('Error updating players:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
addNotificationFields().catch(console.error);