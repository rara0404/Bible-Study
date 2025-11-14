import sqlite3
import os
from datetime import datetime
from pathlib import Path

# Database file path
DB_PATH = Path(__file__).parent / "bible_study.db"

def init_db():
    """Initialize the database with required tables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Streaks table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS streaks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            current_streak INTEGER DEFAULT 0,
            longest_streak INTEGER DEFAULT 0,
            last_read_date DATE,
            total_days_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # Favorites table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book TEXT NOT NULL,
            chapter INTEGER NOT NULL,
            verse INTEGER NOT NULL,
            translation TEXT DEFAULT 'KJV',
            verse_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(user_id, book, chapter, verse, translation)
        )
    ''')
    
    # Notes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book TEXT NOT NULL,
            chapter INTEGER NOT NULL,
            verse INTEGER NOT NULL,
            note_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Get a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# User operations
def create_user(username: str, password: str) -> bool:
    """Create a new user."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (username, password)
            VALUES (?, ?)
        ''', (username, password))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        
        # Initialize streak record for new user
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO streaks (user_id)
            VALUES (?)
        ''', (user_id,))
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        return False

def get_user(username: str, password: str):
    """Get user by username and password."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM users WHERE username = ? AND password = ?
    ''', (username, password))
    user = cursor.fetchone()
    conn.close()
    return user

def get_user_by_id(user_id: int):
    """Get user by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    return user

# Streak operations
def get_streak(user_id: int):
    """Get streak data for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM streaks WHERE user_id = ?', (user_id,))
    streak = cursor.fetchone()
    conn.close()
    return streak

def update_streak(user_id: int, current_streak: int = None, longest_streak: int = None, 
                  last_read_date: str = None, total_days_read: int = None):
    """Update streak data for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    updates = []
    params = []
    
    if current_streak is not None:
        updates.append('current_streak = ?')
        params.append(current_streak)
    if longest_streak is not None:
        updates.append('longest_streak = ?')
        params.append(longest_streak)
    if last_read_date is not None:
        updates.append('last_read_date = ?')
        params.append(last_read_date)
    if total_days_read is not None:
        updates.append('total_days_read = ?')
        params.append(total_days_read)
    
    if updates:
        updates.append('updated_at = CURRENT_TIMESTAMP')
        params.append(user_id)
        
        query = f"UPDATE streaks SET {', '.join(updates)} WHERE user_id = ?"
        cursor.execute(query, params)
        conn.commit()
    
    conn.close()

# Favorites operations
def add_favorite(user_id: int, book: str, chapter: int, verse: int, translation: str = 'KJV', verse_text: str = None):
    """Add a favorite verse."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO favorites (user_id, book, chapter, verse, translation, verse_text)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, book, chapter, verse, translation, verse_text))
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        return False

def remove_favorite(user_id: int, book: str, chapter: int, verse: int, translation: str = 'KJV'):
    """Remove a favorite verse."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        DELETE FROM favorites
        WHERE user_id = ? AND book = ? AND chapter = ? AND verse = ? AND translation = ?
    ''', (user_id, book, chapter, verse, translation))
    conn.commit()
    conn.close()

def get_favorites(user_id: int):
    """Get all favorite verses for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC
    ''', (user_id,))
    favorites = cursor.fetchall()
    conn.close()
    return favorites

def is_favorite(user_id: int, book: str, chapter: int, verse: int, translation: str = 'KJV'):
    """Check if a verse is favorited."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT 1 FROM favorites
        WHERE user_id = ? AND book = ? AND chapter = ? AND verse = ? AND translation = ?
    ''', (user_id, book, chapter, verse, translation))
    result = cursor.fetchone()
    conn.close()
    return result is not None

# Notes operations
def add_note(user_id: int, book: str, chapter: int, verse: int, note_text: str):
    """Add a note for a verse."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO notes (user_id, book, chapter, verse, note_text)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, book, chapter, verse, note_text))
    conn.commit()
    note_id = cursor.lastrowid
    conn.close()
    return note_id

def update_note(note_id: int, note_text: str):
    """Update a note."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE notes SET note_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    ''', (note_text, note_id))
    conn.commit()
    conn.close()

def delete_note(note_id: int):
    """Delete a note."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM notes WHERE id = ?', (note_id,))
    conn.commit()
    conn.close()

def get_notes_for_verse(user_id: int, book: str, chapter: int, verse: int):
    """Get all notes for a specific verse."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM notes
        WHERE user_id = ? AND book = ? AND chapter = ? AND verse = ?
        ORDER BY created_at DESC
    ''', (user_id, book, chapter, verse))
    notes = cursor.fetchall()
    conn.close()
    return notes

def get_all_notes(user_id: int):
    """Get all notes for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC
    ''', (user_id,))
    notes = cursor.fetchall()
    conn.close()
    return notes

if __name__ == '__main__':
    init_db()
    print(f"Database initialized at {DB_PATH}")
    
    # Create default admin user
    if create_user("admin", "admin"):
        print("Default admin user created (username: admin, password: admin)")
    else:
        print("Admin user already exists")
