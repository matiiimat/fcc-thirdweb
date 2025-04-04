import mongoose from 'mongoose';
import connectDB from '../../lib/mongodb';

/**
 * Creates indexes for MongoDB collections to optimize query performance
 */
export async function createDatabaseIndexes() {
  try {
    // Connect to the database using the correct function name
    await connectDB();
    
    // Create indexes for the Players collection
    const playersCollection = mongoose.connection.collection('players');
    await playersCollection.createIndex({ ethAddress: 1 }, { unique: true });
    await playersCollection.createIndex({ team: 1 });
    await playersCollection.createIndex({ playerId: 1 }, { unique: true });
    await playersCollection.createIndex({ lastTrainingDate: 1 });
    await playersCollection.createIndex({ lastGameDate: 1 });
    await playersCollection.createIndex({ lastConnectionDate: 1 });
    
    // Create indexes for the Teams collection
    const teamsCollection = mongoose.connection.collection('teams');
    await teamsCollection.createIndex({ teamName: 1 }, { unique: true });
    await teamsCollection.createIndex({ captainAddress: 1 });
    await teamsCollection.createIndex({ players: 1 });
    await teamsCollection.createIndex({ isPublic: 1 });
    
    // Create indexes for the Matches collection (if it exists)
    const matchesCollection = mongoose.connection.collection('matches');
    await matchesCollection.createIndex({ homeTeam: 1 });
    await matchesCollection.createIndex({ awayTeam: 1 });
    await matchesCollection.createIndex({ date: 1 });
    await matchesCollection.createIndex({ isCompleted: 1 });
    
    // Create indexes for game-related collections
    const trainingCollection = mongoose.connection.collection('trainings');
    if (trainingCollection) {
      await trainingCollection.createIndex({ playerId: 1 });
      await trainingCollection.createIndex({ date: 1 });
    }
    
    const soloMatchesCollection = mongoose.connection.collection('solomatches');
    if (soloMatchesCollection) {
      await soloMatchesCollection.createIndex({ playerId: 1 });
      await soloMatchesCollection.createIndex({ date: 1 });
    }
    
    console.log('Database indexes created successfully');
    return true;
  } catch (error) {
    console.error('Error creating database indexes:', error);
    return false;
  }
} 