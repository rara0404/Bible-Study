import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'bible_study.db');

function getDb() {
  return new sqlite3.Database(dbPath);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);
    const today = new Date().toISOString().split('T')[0];
    const db = getDb();

    return new Promise<NextResponse>((resolve) => {
      db.get(
        'SELECT * FROM streaks WHERE user_id = ?',
        [userIdNum],
        (err: Error | null, streak: any) => {
          if (err) {
            db.close();
            resolve(NextResponse.json(
              { error: 'Database error' },
              { status: 500 }
            ));
            return;
          }

          if (!streak) {
            db.close();
            resolve(NextResponse.json(
              { error: 'User not found' },
              { status: 404 }
            ));
            return;
          }

          const lastReadDate = streak.last_read_date;
          const currentStreak = streak.current_streak;
          const longestStreak = streak.longest_streak;

          let newCurrentStreak = currentStreak;
          let newLongestStreak = longestStreak;

          if (lastReadDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastReadDate === yesterdayStr) {
              newCurrentStreak = currentStreak + 1;
            } else {
              newCurrentStreak = 1;
            }

            if (newCurrentStreak > newLongestStreak) {
              newLongestStreak = newCurrentStreak;
            }
          }

          const totalDaysRead = (streak.total_days_read || 0) + (lastReadDate === today ? 0 : 1);

          db.run(
            `UPDATE streaks 
             SET current_streak = ?, longest_streak = ?, last_read_date = ?, total_days_read = ?, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ?`,
            [newCurrentStreak, newLongestStreak, today, totalDaysRead, userIdNum],
            (updateErr: Error | null) => {
              db.close();

              if (updateErr) {
                resolve(NextResponse.json(
                  { error: 'Database error' },
                  { status: 500 }
                ));
                return;
              }

              resolve(NextResponse.json({
                id: streak.id,
                user_id: streak.user_id,
                current_streak: newCurrentStreak,
                longest_streak: newLongestStreak,
                last_read_date: today,
                total_days_read: totalDaysRead
              }));
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
