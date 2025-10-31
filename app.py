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
    
    # Verse interactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS verse_interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            verse_reference TEXT NOT NULL,
            verse_date DATE NOT NULL,
            favorited BOOLEAN DEFAULT 0,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, verse_date)
        )
    ''')
    
    # Favorite verses table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS favorite_verses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            reference TEXT NOT NULL,
            text TEXT NOT NULL,
            book TEXT NOT NULL,
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
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
    """Get Bible chapter via bible-api.com and record a reading session"""
    import urllib.request
    import urllib.error

    user_id = int(request.args.get('user_id', 1))
    translation = request.args.get('translation', 'web')  # bible-api.com "web" maps to World English Bible

    # Record the reading session (unique constraint prevents duplicate same-day rows)
    record_reading_session(user_id, book, chapter, verses_read=1, duration_minutes=0)

    # Proxy to bible-api.com parameterized chapter endpoint if available in your integration
    # Using test-api.js pattern: https://bible-api.com/data/<translation>/<bookId>/<chapter>
    # Book must be mapped to translation-specific ID; if you want a simple user-facing endpoint, accept bookId instead of name.
    try:
        # Minimal example: accept a pre-mapped 3-letter ID in "book" param; otherwise add a mapping layer here.
        # For consistency with your frontend, prefer receiving a bookId (e.g., JHN) from the client.
        url = f'https://bible-api.com/data/{translation}/{book}/{chapter}'
        with urllib.request.urlopen(url, timeout=10) as resp:
            status = resp.getcode()
            if status != 200:
                return jsonify({'error': f'Bible API error: HTTP {status}'}), status
            data = json.load(resp)
            return jsonify(data)
    except urllib.error.HTTPError as e:
        return jsonify({'error': f'Bible API error: HTTP {e.code}'}), e.code
    except Exception as e:
        return jsonify({'error': f'Failed to fetch chapter: {str(e)}'}), 500

# Missing: Verse interactions (for daily verse favorites/notes)
@app.route('/api/verse-interactions', methods=['GET', 'POST'])
def handle_verse_interactions():
    """Handle verse interactions - favorites and notes"""
    if request.method == 'GET':
        user_id = request.args.get('user_id', 1)
        date_filter = request.args.get('date')
        
        conn = get_db_connection()
        query = 'SELECT * FROM verse_interactions WHERE user_id = ?'
        params = [user_id]
        
        if date_filter:
            query += ' AND verse_date = ?'
            params.append(date_filter)
            
        interactions = conn.execute(query + ' ORDER BY created_at DESC', params).fetchall()
        conn.close()
        
        return jsonify([dict(interaction) for interaction in interactions])
    
    elif request.method == 'POST':
        data = request.get_json()
        user_id = data.get('user_id', 1)
        verse_reference = data.get('verse_reference')
        verse_date = data.get('verse_date', date.today().isoformat())
        favorited = data.get('favorited', False)
        note = data.get('note', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO verse_interactions (user_id, verse_reference, verse_date, favorited, note)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, verse_date) 
            DO UPDATE SET 
                verse_reference = excluded.verse_reference,
                favorited = excluded.favorited,
                note = excluded.note
        ''', (user_id, verse_reference, verse_date, favorited, note))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Verse interaction saved successfully'})

# Missing: Favorite verses management
@app.route('/api/favorite-verses', methods=['GET', 'POST'])
def handle_favorite_verses():
    """Handle favorite verses"""
    if request.method == 'GET':
        user_id = request.args.get('user_id', 1)
        
        conn = get_db_connection()
        favorites = conn.execute('''
            SELECT * FROM favorite_verses 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ''', (user_id,)).fetchall()
        conn.close()
        
        return jsonify([dict(fav) for fav in favorites])
    
    elif request.method == 'POST':
        data = request.get_json()
        user_id = data.get('user_id', 1)
        reference = data.get('reference')
        text = data.get('text')
        book = data.get('book')
        note = data.get('note', '')
        
        if not reference or not text or not book:
            return jsonify({'error': 'Reference, text, and book are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO favorite_verses (user_id, reference, text, book, note)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, reference, text, book, note))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Verse added to favorites successfully'})

@app.route('/api/favorite-verses/<int:favorite_id>', methods=['DELETE'])
def delete_favorite_verse(favorite_id):
    """Remove a verse from favorites"""
    conn = get_db_connection()
    
    # Get the favorite to update interaction table
    favorite = conn.execute(
        'SELECT * FROM favorite_verses WHERE id = ?', (favorite_id,)
    ).fetchone()
    
    if favorite:
        # Remove from favorites
        conn.execute('DELETE FROM favorite_verses WHERE id = ?', (favorite_id,))
        
        # Update interaction if it exists
        conn.execute('''
            UPDATE verse_interactions 
            SET favorited = 0 
            WHERE user_id = ? AND verse_reference = ?
        ''', (favorite['user_id'], favorite['reference']))
        
        conn.commit()
    
    conn.close()
    
    return jsonify({'message': 'Favorite verse removed successfully'})

# Missing: Daily verse of the day
@app.route('/api/verse-of-day', methods=['GET'])
def get_daily_verse():
    """Get the verse of the day"""
    today_str = date.today().isoformat()
    user_id = request.args.get('user_id', 1)
    
    # Check if user has interacted with today's verse
    conn = get_db_connection()
    interaction = conn.execute('''
        SELECT * FROM verse_interactions 
        WHERE user_id = ? AND verse_date = ?
    ''', (user_id, today_str)).fetchone()
    conn.close()
    
    # You'll need to implement your verse-of-day logic here
    # This is a placeholder response
    verse_data = {
        'book': 'John',
        'reference': 'John 3:16',
        'text': 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
        'translation': 'NIV',
        'date': today_str,
        'favorited': bool(interaction and interaction['favorited']) if interaction else False,
        'user_note': interaction['note'] if interaction else None
    }
    
    return jsonify(verse_data)

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)