// This script updates existing players with usernames from the Farcaster context
// Run with: node scripts/update-player-usernames.js

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

async function updatePlayerUsernames() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const playersCollection = db.collection('players');
    
    // Find all players without a username field or with an empty username
    const players = await playersCollection.find({
      $or: [
        { username: { $exists: false } },
        { username: "" }
      ],
      // Exclude bots
      ethAddress: { $not: /^0xbot/ }
    }).toArray();
    
    console.log(`Found ${players.length} players without usernames`);
    
    // For now, we'll set the username to the playerName as a fallback
    // In a real scenario, you might want to fetch usernames from Farcaster API
    let updatedCount = 0;
    
    for (const player of players) {
      await playersCollection.updateOne(
        { _id: player._id },
        { $set: { username: player.playerName } }
      );
      updatedCount++;
      
      if (updatedCount % 100 === 0) {
        console.log(`Updated ${updatedCount} players...`);
      }
    }
    
    console.log(`Updated ${updatedCount} players with default usernames`);
    console.log('Migration complete');
    
  } catch (error) {
    console.error('Error updating player usernames:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

updatePlayerUsernames().catch(console.error);