import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

async function migrateAllPlayersNotifications() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db();
    const playersCollection = db.collection('players');
    
    // Find all players that are NOT bots
    // Bots are identified by ethAddress starting with '0xbot' or playerId matching 'bot_\d+'
    const query = {
      $and: [
        { ethAddress: { $not: /^0xbot/ } },
        { playerId: { $not: /^bot_\d+$/ } }
      ]
    };
    
    console.log('🔍 Finding non-bot players...');
    const totalPlayers = await playersCollection.countDocuments(query);
    console.log(`📊 Found ${totalPlayers} non-bot players to migrate`);
    
    if (totalPlayers === 0) {
      console.log('✅ No players need migration');
      return;
    }
    
    // Update all non-bot players to add notification fields if they don't exist
    const updateResult = await playersCollection.updateMany(
      {
        ...query,
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
    
    console.log('📈 Migration Results:');
    console.log(`   • Players matched: ${updateResult.matchedCount}`);
    console.log(`   • Players modified: ${updateResult.modifiedCount}`);
    
    if (updateResult.modifiedCount > 0) {
      console.log('✅ Successfully migrated notification fields for all non-bot players');
    } else {
      console.log('ℹ️  All non-bot players already have notification fields');
    }
    
    // Verify the migration by checking a few players
    console.log('\n🔍 Verification - Sample of migrated players:');
    const samplePlayers = await playersCollection.find(
      query,
      { 
        projection: { 
          playerName: 1, 
          ethAddress: 1, 
          playerId: 1,
          lastTrainingNotificationTrigger: 1, 
          lastMatchNotificationTrigger: 1 
        } 
      }
    ).limit(5).toArray();
    
    samplePlayers.forEach((player, index) => {
      console.log(`   ${index + 1}. ${player.playerName} (${player.ethAddress})`);
      console.log(`      Training trigger: ${player.lastTrainingNotificationTrigger}`);
      console.log(`      Match trigger: ${player.lastMatchNotificationTrigger}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the migration
console.log('🚀 Starting notification fields migration for all non-bot players...');
console.log('📅 Started at:', new Date().toISOString());

migrateAllPlayersNotifications()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    console.log('📅 Completed at:', new Date().toISOString());
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });