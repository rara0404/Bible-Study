import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';
import { ensureDatabaseInitialized } from '@/lib/db-init';

const dbPath = path.join(process.cwd(), 'bible_study.db');
let dbInitialized = false;

function getDb() {
  return new sqlite3.Database(dbPath);
}

async function initializeDb() {
  if (!dbInitialized) {
    try {
      await ensureDatabaseInitialized();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await initializeDb();
    
    const userId = request.nextUrl.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const db = getDb();

    return new Promise<NextResponse>((resolve) => {
      db.get(
        `SELECT id, user_id, current_streak, longest_streak, last_read_date, total_days_read 
         FROM streaks WHERE user_id = ?`,
        [parseInt(userId)],
        (err: Error | null, row: any) => {
          db.close();

          if (err) {
            resolve(NextResponse.json(
              { error: 'Database error' },
              { status: 500 }
            ));
            return;
          }

          if (!row) {
            resolve(NextResponse.json(
              { error: 'User not found' },
              { status: 404 }
            ));
            return;
          }

          resolve(NextResponse.json({
            id: row.id,
            user_id: row.user_id,
            current_streak: row.current_streak,
            longest_streak: row.longest_streak,
            last_read_date: row.last_read_date,
            total_days_read: row.total_days_read
          }));
        }
      );
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
