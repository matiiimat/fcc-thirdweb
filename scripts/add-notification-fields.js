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
    
    // Test with specific address first
    const testAddress = '0x6be82ef4ad6534a66e8e7568956c523bb1b5e6e0';
    
    // Add the new fields to the test player only
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
      console.log(`No player found with address ${testAddress} or fields already exist`);
    } else if (result.modifiedCount === 1) {
      console.log(`Successfully updated player ${testAddress} with notification trigger fields`);
    } else {
      console.log(`Player ${testAddress} found but no changes made (fields may already exist)`);
    }
    
    // Verify the update
    const updatedPlayer = await playersCollection.findOne({ ethAddress: testAddress });
    if (updatedPlayer) {
      console.log('Updated player fields:', {
        ethAddress: updatedPlayer.ethAddress,
        lastTrainingNotificationTrigger: updatedPlayer.lastTrainingNotificationTrigger,
        lastMatchNotificationTrigger: updatedPlayer.lastMatchNotificationTrigger
      });
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