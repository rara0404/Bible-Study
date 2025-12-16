import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';
import { ensureDbInitialized } from '@/lib/db-utils';

const dbPath = path.join(process.cwd(), 'bible_study.db');

function getDb() {
  return new sqlite3.Database(dbPath);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await ensureDbInitialized();
    
    const data = await request.json();
    const { username, password } = data;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    return new Promise<NextResponse>((resolve) => {
      db.get(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password],
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
              { error: 'Invalid username or password' },
              { status: 401 }
            ));
            return;
          }

          resolve(NextResponse.json({
            user_id: row.id,
            username: row.username,
            token: `user_${row.id}`
          }, { status: 200 }));
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
