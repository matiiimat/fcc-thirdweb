import { ClientSession, startSession } from 'mongoose';
import { NextResponse } from 'next/server';

type TransactionCallback<T> = (session: ClientSession) => Promise<T>;

export async function runTransaction<T>(callback: TransactionCallback<T>) {
  const session = await startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    
    if (result === undefined) {
      throw new Error('Transaction did not return a result');
    }
    
    return { data: result, error: null };
  } catch (error) {
    console.error('Transaction error:', error);
    return {
      data: null,
      error: NextResponse.json(
        { error: 'Transaction failed' },
        { status: 500 }
      )
    };
  } finally {
    await session.endSession();
  }
}