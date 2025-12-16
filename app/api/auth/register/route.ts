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
      // Check if username already exists
      db.get(
        'SELECT id FROM users WHERE username = ?',
        [username],
        (err: Error | null, row: any) => {
          if (err) {
            db.close();
            resolve(NextResponse.json(
              { error: 'Database error' },
              { status: 500 }
            ));
            return;
          }

          if (row) {
            db.close();
            resolve(NextResponse.json(
              { error: 'Username already exists' },
              { status: 409 }
            ));
            return;
          }

          // Create new user
          db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, password],
            function(insertErr: Error | null) {
              if (insertErr) {
                db.close();
                resolve(NextResponse.json(
                  { error: 'Database error' },
                  { status: 500 }
                ));
                return;
              }

              const userId = this.lastID;

              // Initialize streak for new user
              db.run(
                'INSERT INTO streaks (user_id, current_streak, longest_streak, total_days_read) VALUES (?, 0, 0, 0)',
                [userId],
                (streakErr: Error | null) => {
                  db.close();

                  if (streakErr) {
                    resolve(NextResponse.json(
                      { error: 'Database error' },
                      { status: 500 }
                    ));
                    return;
                  }

                  resolve(NextResponse.json({
                    user_id: userId,
                    username: username,
                    token: `user_${userId}`
                  }, { status: 201 }));
                }
              );
            }
          );
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
