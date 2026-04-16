import { NextResponse } from 'next/server';
import connectDB from '../../lib/mongodb';
import PlayerModel from '../../models/Player';

export async function GET() {
  try {
    await connectDB();
    
    // Create indexes for frequently queried fields
    await PlayerModel.collection.createIndex({ ethAddress: 1 }, { unique: true });
    
    // Add additional indexes based on your query patterns
    // For example, if you frequently query by other fields:
    // await PlayerModel.collection.createIndex({ username: 1 });
    // await PlayerModel.collection.createIndex({ level: -1 }); // For sorting by level descending
    
    return NextResponse.json({ success: true, message: 'Database indexes created successfully' });
  } catch (error) {
    console.error('Error creating database indexes:', error);
    return NextResponse.json(
      { error: 'Failed to create database indexes' },
      { status: 500 }
    );
  }
} 