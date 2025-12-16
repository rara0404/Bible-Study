import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-utils';

export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json({ status: 'error', message: 'Database initialization failed' }, { status: 500 });
  }
  
  return NextResponse.json({ status: 'ok' });
}
