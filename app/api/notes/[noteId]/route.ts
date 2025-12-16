import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'bible_study.db');

function getDb() {
  return new sqlite3.Database(dbPath);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
): Promise<NextResponse> {
  try {
    const { noteId } = await params;
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
        `SELECT id, user_id, book, chapter, verse, note_text, created_at, updated_at
         FROM notes WHERE id = ? AND user_id = ?`,
        [parseInt(noteId), parseInt(userId)],
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
              { error: 'Note not found' },
              { status: 404 }
            ));
            return;
          }

          resolve(NextResponse.json(row));
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
): Promise<NextResponse> {
  try {
    const { noteId } = await params;
    const userId = request.nextUrl.searchParams.get('user_id');
    const data = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    if (!data.note_text) {
      return NextResponse.json(
        { error: 'note_text is required' },
        { status: 400 }
      );
    }

    const db = getDb();

    return new Promise<NextResponse>((resolve) => {
      // Verify user owns the note
      db.get(
        'SELECT user_id FROM notes WHERE id = ?',
        [parseInt(noteId)],
        (err: Error | null, row: any) => {
          if (err || !row || row.user_id !== parseInt(userId)) {
            db.close();
            resolve(NextResponse.json(
              { error: 'Unauthorized - you do not own this note' },
              { status: 403 }
            ));
            return;
          }

          // Update the note
          db.run(
            `UPDATE notes SET note_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [data.note_text, parseInt(noteId)],
            (updateErr: Error | null) => {
              db.close();

              if (updateErr) {
                resolve(NextResponse.json(
                  { error: 'Database error' },
                  { status: 500 }
                ));
                return;
              }

              resolve(NextResponse.json(
                { message: 'Note updated successfully' }
              ));
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
): Promise<NextResponse> {
  try {
    const { noteId } = await params;
    const userId = request.nextUrl.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const db = getDb();

    return new Promise<NextResponse>((resolve) => {
      // Verify user owns the note
      db.get(
        'SELECT user_id FROM notes WHERE id = ?',
        [parseInt(noteId)],
        (err: Error | null, row: any) => {
          if (err || !row || row.user_id !== parseInt(userId)) {
            db.close();
            resolve(NextResponse.json(
              { error: 'Unauthorized - you do not own this note' },
              { status: 403 }
            ));
            return;
          }

          // Delete the note
          db.run(
            'DELETE FROM notes WHERE id = ?',
            [parseInt(noteId)],
            (deleteErr: Error | null) => {
              db.close();

              if (deleteErr) {
                resolve(NextResponse.json(
                  { error: 'Database error' },
                  { status: 500 }
                ));
                return;
              }

              resolve(NextResponse.json(
                { message: 'Note deleted successfully' }
              ));
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
