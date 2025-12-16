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
        `SELECT id, book, chapter, verse, translation, verse_text, created_at
         FROM favorites WHERE user_id = ? ORDER BY created_at DESC`,
        [parseInt(userId)],
        (err: Error | null, rows: any[]) => {
          db.close();

          if (err) {
            resolve(NextResponse.json(
              { error: 'Database error' },
              { status: 500 }
            ));
            return;
          }

          resolve(NextResponse.json({
            favorites: rows || []
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

    const { book, chapter, verse, translation = 'web', verse_text } = data;

    if (!book || chapter === undefined || verse === undefined) {
      return NextResponse.json(
        { error: 'book, chapter, and verse are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    return new Promise<NextResponse>((resolve) => {
      db.run(
        `INSERT INTO favorites (user_id, book, chapter, verse, translation, verse_text)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [parseInt(userId), book, chapter, verse, translation, verse_text],
        function(err: Error | null) {
          db.close();

          if (err) {
            if (err.message.includes('UNIQUE')) {
              resolve(NextResponse.json(
                { error: 'Verse is already favorited' },
                { status: 409 }
              ));
            } else {
              resolve(NextResponse.json(
                { error: 'Database error' },
                { status: 500 }
              ));
            }
            return;
          }

          resolve(NextResponse.json(
            { message: 'Favorite added successfully' },
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

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');
    const data = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const { book, chapter, verse, translation = 'web' } = data;

    if (!book || chapter === undefined || verse === undefined) {
      return NextResponse.json(
        { error: 'book, chapter, and verse are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    return new Promise<NextResponse>((resolve) => {
      db.run(
        `DELETE FROM favorites WHERE user_id = ? AND book = ? AND chapter = ? AND verse = ? AND translation = ?`,
        [parseInt(userId), book, chapter, verse, translation],
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
            { message: 'Favorite removed successfully' },
            { status: 200 }
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
