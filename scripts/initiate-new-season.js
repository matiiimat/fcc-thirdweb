// This script initiates a new season and resets the leaderboard
import { MongoClient, ObjectId } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uri = "mongodb+srv://mathieulr21:CHBTkLgXd9Hq2llV@fcc-test-cluster.ofxet.mongodb.net/?retryWrites=true&w=majority&appName=fcc-test-cluster";

// Main function to initiate a new season
async function initiateNewSeason() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const seasonCollection = db.collection('seasons');
    
    // Find the current active season
    const currentSeason = await seasonCollection.findOne({
      status: { $in: ['ongoing', 'registration'] }
    }, { sort: { seasonNumber: -1 } });
    
    if (!currentSeason) {
      console.log('No active season found. Creating a new season...');
      
      // Create a new season
      const result = await seasonCollection.insertOne({
        name: 'Season 1',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        status: 'registration',
        minTeams: 8,
        maxTeams: 20,
        registeredTeams: [],
        matchDayInterval: 7,
        currentMatchDay: 0,
        totalMatchDays: 0,
        seasonNumber: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Created new season:', result.insertedId);
      
      // Activate the season
      await activateSeason(db, result.insertedId);
    } else {
      console.log('Found active season:', currentSeason._id);
      
      // Complete the current season
      if (currentSeason.status === 'ongoing') {
        await seasonCollection.updateOne(
          { _id: currentSeason._id },
          { $set: { status: 'completed', updatedAt: new Date() } }
        );
        console.log('Marked current season as completed');
      }
      
      // Create a new season
      const newSeasonNumber = (currentSeason.seasonNumber || 0) + 1;
      const result = await seasonCollection.insertOne({
        name: `Season ${newSeasonNumber}`,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        status: 'registration',
        minTeams: 8,
        maxTeams: 20,
        registeredTeams: [],
        matchDayInterval: 7,
        currentMatchDay: 0,
        totalMatchDays: 0,
        seasonNumber: newSeasonNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Created new season:', result.insertedId);
      
      // Activate the season
      await activateSeason(db, result.insertedId);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

async function activateSeason(db, seasonId) {
  console.log('Activating season...');
  
  const seasonCollection = db.collection('seasons');
  const teamCollection = db.collection('teams');
  const playerCollection = db.collection('players');
  
  // Get the season
  const season = await seasonCollection.findOne({ _id: seasonId });
  
  if (!season) {
    throw new Error('Season not found');
  }
  
  // Reset team standings
  await teamCollection.updateMany({}, {
    $set: {
      'stats.gamesPlayed': 0,
      'stats.wins': 0,
      'stats.draws': 0,
      'stats.losses': 0,
      'stats.goalsFor': 0,
      'stats.goalsAgainst': 0,
      'stats.goalDifference': 0,
      'stats.points': 0,
      'stats.cleanSheets': 0,
    }
  });
  
  console.log('Reset team standings');
  
  // Update player contracts
  await playerCollection.updateMany(
    { 'contract.status': 'active' },
    { $inc: { 'contract.seasonEnds': 1 } }
  );
  
  console.log('Updated active player contracts');
  
  // Check for expired contracts
  const playersWithExpiredContracts = await playerCollection.find({
    'contract.status': 'active',
    'contract.seasonEnds': { $lte: season.seasonNumber }
  }).toArray();
  
  console.log(`Found ${playersWithExpiredContracts.length} expired contracts`);
  
  // Mark contracts as expired
  for (const player of playersWithExpiredContracts) {
    await playerCollection.updateOne(
      { _id: player._id },
      { 
        $set: { 
          'contract.status': 'expired',
          'contract.endDate': new Date()
        }
      }
    );
  }
  
  // Set season as ongoing
  await seasonCollection.updateOne(
    { _id: seasonId },
    { $set: { status: 'ongoing', updatedAt: new Date() } }
  );
  
  console.log('Season activated successfully');
}

// Delete a specific player
async function deletePlayer(playerId) {
  let client;
  
  try {
    console.log(`Deleting player ${playerId}...`);
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db();
    const playerCollection = db.collection('players');
    
    // Find the player
    const player = await playerCollection.findOne({ playerId });
    
    if (!player) {
      console.log('Player not found');
      return;
    }
    
    // Delete the player
    await playerCollection.deleteOne({ playerId });
    
    console.log('Player deleted successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Check if a player ID was provided as a command line argument
const playerIdToDelete = process.argv[2];

// Run the appropriate function
if (playerIdToDelete) {
  deletePlayer(playerIdToDelete).catch(console.error);
} else {
  initiateNewSeason().catch(console.error);
}

// Export functions for potential reuse
export { initiateNewSeason, deletePlayer };