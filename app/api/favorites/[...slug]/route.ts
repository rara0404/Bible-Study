import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'bible_study.db');

function getDb() {
  return new sqlite3.Database(dbPath);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;
    const [book, chapter, verse] = slug;
    const userId = request.nextUrl.searchParams.get('user_id');
    const translation = request.nextUrl.searchParams.get('translation') || 'web';

    if (!userId || !book || !chapter || !verse) {
      return NextResponse.json(
        { error: 'User ID, book, chapter, and verse are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    return new Promise<NextResponse>((resolve) => {
      db.get(
        `SELECT 1 FROM favorites WHERE user_id = ? AND book = ? AND chapter = ? AND verse = ? AND translation = ?`,
        [parseInt(userId), book, parseInt(chapter), parseInt(verse), translation],
        (err: Error | null, row: any) => {
          db.close();

          if (err) {
            resolve(NextResponse.json(
              { error: 'Database error' },
              { status: 500 }
            ));
            return;
          }

          resolve(NextResponse.json({
            favorited: !!row
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
