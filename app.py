from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import json
from datetime import datetime, date, timedelta
import calendar
import os

app = Flask(__name__)
CORS(app)

# Database setup
DATABASE = 'bible_study.db'

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Study sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS study_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            scripture_reference TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Prayer requests table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prayer_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Reading goals table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reading_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            goal_type TEXT DEFAULT 'weekly',
            target_days INTEGER DEFAULT 7,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Reading sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reading_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            book TEXT NOT NULL,
            chapter INTEGER NOT NULL,
            verses_read INTEGER DEFAULT 1,
            reading_date DATE NOT NULL,
            duration_minutes INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, book, chapter, reading_date)
        )
    ''')
    
    # Weekly progress tracking
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS weekly_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            week_start DATE NOT NULL,
            week_end DATE NOT NULL,
            days_read INTEGER DEFAULT 0,
            target_days INTEGER DEFAULT 7,
            chapters_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, week_start)
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def get_week_dates(date_obj=None):
    """Get start and end dates for the week containing the given date"""
    if date_obj is None:
        date_obj = date.today()
    
    # Get Monday of the week (start of week)
    days_since_monday = date_obj.weekday()
    week_start = date_obj - timedelta(days=days_since_monday)
    week_end = week_start + timedelta(days=6)
    
    return week_start, week_end

def record_reading_session(user_id, book, chapter, verses_read=1, duration_minutes=0):
    """Record a reading session for the user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    today = date.today()
    
    try:
        # Insert or update reading session
        cursor.execute('''
            INSERT INTO reading_sessions (user_id, book, chapter, verses_read, reading_date, duration_minutes)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, book, chapter, reading_date) 
            DO UPDATE SET 
                verses_read = verses_read + excluded.verses_read,
                duration_minutes = duration_minutes + excluded.duration_minutes
        ''', (user_id, book, chapter, verses_read, today, duration_minutes))
        
        # Update weekly progress
        week_start, week_end = get_week_dates(today)
        
        # Count unique reading days this week
        days_read = cursor.execute('''
            SELECT COUNT(DISTINCT reading_date) 
            FROM reading_sessions 
            WHERE user_id = ? AND reading_date BETWEEN ? AND ?
        ''', (user_id, week_start, week_end)).fetchone()[0]
        
        # Count chapters read this week
        chapters_read = cursor.execute('''
            SELECT COUNT(*) 
            FROM reading_sessions 
            WHERE user_id = ? AND reading_date BETWEEN ? AND ?
        ''', (user_id, week_start, week_end)).fetchone()[0]
        
        # Update weekly progress record
        cursor.execute('''
            INSERT INTO weekly_progress (user_id, week_start, week_end, days_read, chapters_read, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, week_start) 
            DO UPDATE SET 
                days_read = excluded.days_read,
                chapters_read = excluded.chapters_read,
                updated_at = CURRENT_TIMESTAMP
        ''', (user_id, week_start, week_end, days_read, chapters_read))
        
        conn.commit()
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"Error recording reading session: {e}")
        return False
    finally:
        conn.close()

def get_weekly_progress(user_id=1):
    """Get current week's reading progress"""
    conn = get_db_connection()
    today = date.today()
    week_start, week_end = get_week_dates(today)
    
    # Get or create weekly progress record
    progress = conn.execute('''
        SELECT * FROM weekly_progress 
        WHERE user_id = ? AND week_start = ?
    ''', (user_id, week_start)).fetchone()
    
    if not progress:
        # Create new weekly progress record
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO weekly_progress (user_id, week_start, week_end, days_read, target_days)
            VALUES (?, ?, ?, 0, 7)
        ''', (user_id, week_start, week_end))
        conn.commit()
        
        progress = conn.execute('''
            SELECT * FROM weekly_progress 
            WHERE user_id = ? AND week_start = ?
        ''', (user_id, week_start)).fetchone()
    
    # Get daily reading status for this week
    daily_status = conn.execute('''
        SELECT reading_date, COUNT(*) as sessions_count
        FROM reading_sessions 
        WHERE user_id = ? AND reading_date BETWEEN ? AND ?
        GROUP BY reading_date
        ORDER BY reading_date
    ''', (user_id, week_start, week_end)).fetchall()
    
    # Get reading streak
    streak = get_reading_streak(user_id)
    
    conn.close()
    
    return {
        'current_week': {
            'week_start': week_start.isoformat(),
            'week_end': week_end.isoformat(),
            'days_read': progress['days_read'],
            'target_days': progress['target_days'],
            'chapters_read': progress['chapters_read'],
            'progress_percentage': round((progress['days_read'] / progress['target_days']) * 100, 1)
        },
        'daily_status': [dict(day) for day in daily_status],
        'streak': streak
    }

def get_reading_streak(user_id=1):
    """Calculate current reading streak"""
    conn = get_db_connection()
    
    # Get all unique reading dates, ordered by date descending
    reading_dates = conn.execute('''
        SELECT DISTINCT reading_date 
        FROM reading_sessions 
        WHERE user_id = ? 
        ORDER BY reading_date DESC
    ''', (user_id,)).fetchall()
    
    conn.close()
    
    if not reading_dates:
        return 0
    
    today = date.today()
    yesterday = today - timedelta(days=1)
    streak = 0
    
    # Convert to date objects
    dates = [datetime.strptime(row[0], '%Y-%m-%d').date() for row in reading_dates]
    
    # Check if user read today or yesterday to continue streak
    if dates and (dates[0] == today or dates[0] == yesterday):
        current_date = dates[0]
        streak = 1
        
        # Count consecutive days
        for i in range(1, len(dates)):
            expected_date = current_date - timedelta(days=1)
            if dates[i] == expected_date:
                streak += 1
                current_date = dates[i]
            else:
                break
    
    return streak

# API Routes
@app.route('/api/study-sessions', methods=['GET', 'POST'])
def handle_study_sessions():
    if request.method == 'GET':
        conn = get_db_connection()
        sessions = conn.execute(
            'SELECT * FROM study_sessions ORDER BY created_at DESC'
        ).fetchall()
        conn.close()
        
        return jsonify([dict(session) for session in sessions])
    
    elif request.method == 'POST':
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO study_sessions (user_id, title, scripture_reference, notes) VALUES (?, ?, ?, ?)',
            (data.get('user_id', 1), data['title'], data.get('scripture_reference', ''), data.get('notes', ''))
        )
        conn.commit()
        session_id = cursor.lastrowid
        conn.close()
        
        return jsonify({'id': session_id, 'message': 'Study session created successfully'})

@app.route('/api/study-sessions/<int:session_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_single_study_session(session_id):
    conn = get_db_connection()
    
    if request.method == 'GET':
        session = conn.execute(
            'SELECT * FROM study_sessions WHERE id = ?', (session_id,)
        ).fetchone()
        conn.close()
        
        if session:
            return jsonify(dict(session))
        return jsonify({'error': 'Session not found'}), 404
    
    elif request.method == 'PUT':
        data = request.get_json()
        conn.execute(
            'UPDATE study_sessions SET title = ?, scripture_reference = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            (data['title'], data.get('scripture_reference', ''), data.get('notes', ''), session_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Study session updated successfully'})
    
    elif request.method == 'DELETE':
        conn.execute('DELETE FROM study_sessions WHERE id = ?', (session_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Study session deleted successfully'})

@app.route('/api/prayer-requests', methods=['GET', 'POST'])
def handle_prayer_requests():
    if request.method == 'GET':
        conn = get_db_connection()
        requests = conn.execute(
            'SELECT * FROM prayer_requests ORDER BY created_at DESC'
        ).fetchall()
        conn.close()
        
        return jsonify([dict(req) for req in requests])
    
    elif request.method == 'POST':
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO prayer_requests (user_id, title, description) VALUES (?, ?, ?)',
            (data.get('user_id', 1), data['title'], data.get('description', ''))
        )
        conn.commit()
        request_id = cursor.lastrowid
        conn.close()
        
        return jsonify({'id': request_id, 'message': 'Prayer request created successfully'})

@app.route('/api/prayer-requests/<int:request_id>', methods=['PUT', 'DELETE'])
def handle_single_prayer_request(request_id):
    conn = get_db_connection()
    
    if request.method == 'PUT':
        data = request.get_json()
        conn.execute(
            'UPDATE prayer_requests SET status = ? WHERE id = ?',
            (data['status'], request_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Prayer request updated successfully'})
    
    elif request.method == 'DELETE':
        conn.execute('DELETE FROM prayer_requests WHERE id = ?', (request_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Prayer request deleted successfully'})

@app.route('/api/reading-goals', methods=['GET', 'POST'])
def handle_reading_goals():
    """Handle reading goals - get current or create new"""
    if request.method == 'GET':
        user_id = request.args.get('user_id', 1)
        progress = get_weekly_progress(user_id)
        return jsonify(progress)
    
    elif request.method == 'POST':
        data = request.get_json()
        user_id = data.get('user_id', 1)
        target_days = data.get('target_days', 7)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        today = date.today()
        week_start, week_end = get_week_dates(today)
        
        # Update or create weekly goal
        cursor.execute('''
            INSERT INTO weekly_progress (user_id, week_start, week_end, target_days)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, week_start) 
            DO UPDATE SET target_days = excluded.target_days
        ''', (user_id, week_start, week_end, target_days))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Reading goal updated successfully'})

@app.route('/api/reading-sessions', methods=['POST'])
def record_reading():
    """Record a reading session"""
    data = request.get_json()
    
    user_id = data.get('user_id', 1)
    book = data.get('book')
    chapter = data.get('chapter')
    verses_read = data.get('verses_read', 1)
    duration_minutes = data.get('duration_minutes', 0)
    
    if not book or not chapter:
        return jsonify({'error': 'Book and chapter are required'}), 400
    
    success = record_reading_session(user_id, book, chapter, verses_read, duration_minutes)
    
    if success:
        # Return updated progress
        progress = get_weekly_progress(user_id)
        return jsonify({
            'message': 'Reading session recorded successfully',
            'progress': progress
        })
    else:
        return jsonify({'error': 'Failed to record reading session'}), 500

@app.route('/api/reading-progress/weekly', methods=['GET'])
def get_weekly_reading_progress():
    """Get weekly reading progress"""
    user_id = request.args.get('user_id', 1)
    progress = get_weekly_progress(user_id)
    return jsonify(progress)

@app.route('/api/reading-streak', methods=['GET'])
def get_user_reading_streak():
    """Get user's reading streak"""
    user_id = request.args.get('user_id', 1)
    streak = get_reading_streak(user_id)
    return jsonify({'streak': streak})

@app.route('/api/reading-history', methods=['GET'])
def get_reading_history():
    """Get user's reading history"""
    user_id = request.args.get('user_id', 1)
    days = int(request.args.get('days', 30))
    
    conn = get_db_connection()
    
    since_date = date.today() - timedelta(days=days)
    
    history = conn.execute('''
        SELECT reading_date, book, chapter, verses_read, duration_minutes
        FROM reading_sessions 
        WHERE user_id = ? AND reading_date >= ?
        ORDER BY reading_date DESC, created_at DESC
    ''', (user_id, since_date)).fetchall()
    
    # Get weekly summaries
    weekly_summaries = conn.execute('''
        SELECT week_start, week_end, days_read, target_days, chapters_read
        FROM weekly_progress 
        WHERE user_id = ? AND week_start >= ?
        ORDER BY week_start DESC
    ''', (user_id, since_date)).fetchall()
    
    conn.close()
    
    return jsonify({
        'reading_sessions': [dict(session) for session in history],
        'weekly_summaries': [dict(summary) for summary in weekly_summaries]
    })

# Auto-record reading when user views a chapter
@app.route('/api/bible/chapter/<book>/<int:chapter>', methods=['GET'])
def get_chapter_and_record(book, chapter):
    """Get Bible chapter and automatically record reading session"""
    user_id = request.args.get('user_id', 1)
    translation = request.args.get('translation', 'kjv')
    
    # Record the reading session
    record_reading_session(user_id, book, chapter, verses_read=1, duration_minutes=1)
    
    # Return chapter content (you'll need to implement this based on your Bible API)
    try:
        from services.bibleApi import fetchChapter
        chapter_data = fetchChapter(book, chapter, translation)
        return jsonify(chapter_data)
    except Exception as e:
        return jsonify({'error': 'Failed to fetch chapter'}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)