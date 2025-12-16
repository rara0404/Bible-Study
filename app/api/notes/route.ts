import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';
import { ensureDbInitialized } from '@/lib/db-utils';

const dbPath = path.join(process.cwd(), 'bible_study.db');

function getDb() {
  return new sqlite3.Database(dbPath);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await ensureDbInitialized();
    
    const userId = request.nextUrl.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const db = getDb();

    return new Promise<NextResponse>((resolve) => {
      db.all(
        `SELECT id, book, chapter, verse, content, created_at, updated_at
         FROM notes WHERE user_id = ? ORDER BY created_at DESC`,
        [parseInt(userId)],
        (err: Error | null, rows: any[]) => {
          db.close();

          if (err) {
            resolve(NextResponse.json(
              { error: err.message || 'Database error' },
              { status: 500 }
            ));
            return;
          }

          resolve(NextResponse.json({
            notes: rows || []
          }));
        }
      );
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as any).message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');
    const data = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const { book, chapter, verse, note_text } = data;

    if (!book || chapter === undefined || verse === undefined || !note_text) {
      return NextResponse.json(
        { error: 'book, chapter, verse, and note_text are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    return new Promise<NextResponse>((resolve) => {
      db.run(
        `INSERT INTO notes (user_id, book, chapter, verse, content)
         VALUES (?, ?, ?, ?, ?)`,
        [parseInt(userId), book, chapter, verse, note_text],
        function(err: Error | null) {
          db.close();

          if (err) {
            resolve(NextResponse.json(
              { error: 'Database error' },
              { status: 500 }
            ));
            return;
          }

          resolve(NextResponse.json(
            { id: this.lastID, message: 'Note added successfully' },
            { status: 201 }
          ));
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
