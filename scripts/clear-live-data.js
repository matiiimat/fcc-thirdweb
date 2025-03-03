import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please provide MONGODB_URI environment variable');
  process.exit(1);
}

async function clearAllCollections() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully');

    // Get all collections
    const collections = await mongoose.connection.db.collections();

    // Clear each collection
    for (const collection of collections) {
      console.log(`Clearing collection: ${collection.collectionName}`);
      await collection.deleteMany({});
    }

    console.log('All collections cleared successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Add a confirmation prompt
console.log('\x1b[31m%s\x1b[0m', 'WARNING: This will delete all data from the database!');
console.log('To proceed, type "YES" and press Enter');

process.stdin.on('data', async (data) => {
  const input = data.toString().trim();
  if (input === 'YES') {
    await clearAllCollections();
  } else {
    console.log('Operation cancelled');
    process.exit(0);
  }
});