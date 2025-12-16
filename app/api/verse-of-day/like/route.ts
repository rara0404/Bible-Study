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
      db.get(
        `SELECT 1 FROM verse_of_day_likes 
         WHERE user_id = ? AND book = ? AND chapter = ? AND verse = ? AND translation = ?`,
        [parseInt(userId), book, chapter, verse, translation],
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
            // Unlike
            db.run(
              `DELETE FROM verse_of_day_likes 
               WHERE user_id = ? AND book = ? AND chapter = ? AND verse = ? AND translation = ?`,
              [parseInt(userId), book, chapter, verse, translation],
              (deleteErr: Error | null) => {
                db.close();

                if (deleteErr) {
                  resolve(NextResponse.json(
                    { error: 'Database error' },
                    { status: 500 }
                  ));
                  return;
                }

                resolve(NextResponse.json({
                  liked: false
                }));
              }
            );
          } else {
            // Like
            db.run(
              `INSERT INTO verse_of_day_likes (user_id, book, chapter, verse, translation)
               VALUES (?, ?, ?, ?, ?)`,
              [parseInt(userId), book, chapter, verse, translation],
              (insertErr: Error | null) => {
                db.close();

                if (insertErr) {
                  resolve(NextResponse.json(
                    { error: 'Database error' },
                    { status: 500 }
                  ));
                  return;
                }

                resolve(NextResponse.json({
                  liked: true
                }));
              }
            );
          }
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await ensureDbInitialized();
    
    const userId = request.nextUrl.searchParams.get('user_id');
    const book = request.nextUrl.searchParams.get('book');
    const chapter = request.nextUrl.searchParams.get('chapter');
    const verse = request.nextUrl.searchParams.get('verse');
    const translation = request.nextUrl.searchParams.get('translation') || 'web';

    if (!userId || !book || !chapter || !verse) {
      return NextResponse.json(
        { error: 'user_id, book, chapter, and verse are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    return new Promise<NextResponse>((resolve) => {
      db.get(
        `SELECT 1 FROM verse_of_day_likes
         WHERE user_id = ? AND book = ? AND chapter = ? AND verse = ? AND translation = ?`,
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
            liked: !!row
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
