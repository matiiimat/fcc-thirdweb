import { NextResponse } from 'next/server';
import { createDatabaseIndexes } from '../../lib/db/indexes';

export async function GET() {
  try {
    const result = await createDatabaseIndexes();
    
    if (result) {
      return NextResponse.json({ success: true, message: 'Database indexes created successfully' });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to create database indexes' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in init route:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during initialization' },
      { status: 500 }
    );
  }
} 