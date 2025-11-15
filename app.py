from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import date
from database import (
    init_db, get_user, get_user_by_id, create_user,
    get_streak, update_streak, mark_streak_today,
    add_favorite, remove_favorite, get_favorites, is_favorite,
    add_note, update_note, delete_note, get_notes_for_verse, get_all_notes,
    get_note_by_id, verify_user_owns_note,
    toggle_verse_of_day_like as db_toggle_verse_like, 
    is_verse_of_day_liked as db_check_verse_like
)

app = Flask(__name__)
CORS(app)

# Initialize database on startup
init_db()

# Authentication Routes
@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate user and return user_id"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    user = get_user(username, password)
    
    if not user:
        return jsonify({'error': 'Invalid username or password'}), 401
    
    return jsonify({
        'user_id': user['id'],
        'username': user['username'],
        'token': f'user_{user["id"]}'  # Simple token format
    }), 200

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    if create_user(username, password):
        user = get_user(username, password)
        return jsonify({
            'user_id': user['id'],
            'username': user['username'],
            'token': f'user_{user["id"]}'
        }), 201
    else:
        return jsonify({'error': 'Username already exists'}), 409

@app.route('/api/user', methods=['GET'])
def get_current_user():
    """Get current user info"""
    user_id = request.args.get('user_id', type=int)
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    user = get_user_by_id(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user['id'],
        'username': user['username']
    }), 200

# Streak Routes
@app.route('/api/streak', methods=['GET'])
def get_user_reading_streak():
    """Get user reading streak"""
    user_id = request.args.get('user_id', type=int)
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    streak = get_streak(user_id)
    
    if not streak:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': streak['id'],
        'user_id': streak['user_id'],
        'current_streak': streak['current_streak'],
        'longest_streak': streak['longest_streak'],
        'last_read_date': streak['last_read_date'],
        'total_days_read': streak['total_days_read']
    }), 200

@app.route('/api/streak/update', methods=['POST'])
def update_user_streak():
    """Update user reading streak - marks today as read"""
    user_id = request.args.get('user_id', type=int)
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    # Use the new mark_streak_today function which handles all calculations
    streak = mark_streak_today(user_id)
    
    if not streak:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': streak['id'],
        'user_id': streak['user_id'],
        'current_streak': streak['current_streak'],
        'longest_streak': streak['longest_streak'],
        'last_read_date': streak['last_read_date'],
        'total_days_read': streak['total_days_read']
    }), 200

# Favorites Routes
@app.route('/api/favorites', methods=['GET'])
def get_user_favorites():
    """Get all favorite verses for a user"""
    user_id = request.args.get('user_id', type=int)
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    favorites = get_favorites(user_id)
    
    return jsonify({
        'favorites': [
            {
                'id': fav['id'],
                'book': fav['book'],
                'chapter': fav['chapter'],
                'verse': fav['verse'],
                'translation': fav['translation'],
                'verse_text': fav['verse_text'],
                'created_at': fav['created_at']
            }
            for fav in favorites
        ]
    }), 200

@app.route('/api/favorites', methods=['POST'])
def add_user_favorite():
    """Add a favorite verse"""
    user_id = request.args.get('user_id', type=int)
    data = request.get_json()
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    if not all(k in data for k in ['book', 'chapter', 'verse']):
        return jsonify({'error': 'book, chapter, and verse are required'}), 400
    
    success = add_favorite(
        user_id,
        data['book'],
        data['chapter'],
        data['verse'],
        data.get('translation', 'KJV'),
        data.get('verse_text')
    )
    
    if success:
        return jsonify({'message': 'Favorite added successfully'}), 201
    else:
        return jsonify({'error': 'Verse is already favorited'}), 409

@app.route('/api/favorites', methods=['DELETE'])
def remove_user_favorite():
    """Remove a favorite verse"""
    user_id = request.args.get('user_id', type=int)
    data = request.get_json()
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    if not all(k in data for k in ['book', 'chapter', 'verse']):
        return jsonify({'error': 'book, chapter, and verse are required'}), 400
    
    remove_favorite(
        user_id,
        data['book'],
        data['chapter'],
        data['verse'],
        data.get('translation', 'KJV')
    )
    
    return jsonify({'message': 'Favorite removed successfully'}), 200

@app.route('/api/favorites/<book>/<int:chapter>/<int:verse>', methods=['GET'])
def check_favorite(book, chapter, verse):
    """Check if a verse is favorited"""
    user_id = request.args.get('user_id', type=int)
    translation = request.args.get('translation', 'KJV')
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    favorited = is_favorite(user_id, book, chapter, verse, translation)
    
    return jsonify({'favorited': favorited}), 200

# Notes Routes
@app.route('/api/notes', methods=['GET'])
def get_user_notes():
    """Get all notes for a user"""
    user_id = request.args.get('user_id', type=int)
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    notes = get_all_notes(user_id)
    
    return jsonify({
        'notes': [
            {
                'id': note['id'],
                'book': note['book'],
                'chapter': note['chapter'],
                'verse': note['verse'],
                'note_text': note['note_text'],
                'created_at': note['created_at'],
                'updated_at': note['updated_at']
            }
            for note in notes
        ]
    }), 200

@app.route('/api/notes/<book>/<int:chapter>/<int:verse>', methods=['GET'])
def get_verse_notes(book, chapter, verse):
    """Get notes for a specific verse"""
    user_id = request.args.get('user_id', type=int)
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    notes = get_notes_for_verse(user_id, book, chapter, verse)
    
    return jsonify({
        'notes': [
            {
                'id': note['id'],
                'note_text': note['note_text'],
                'created_at': note['created_at'],
                'updated_at': note['updated_at']
            }
            for note in notes
        ]
    }), 200

@app.route('/api/notes', methods=['POST'])
def add_user_note():
    """Add a note for a verse"""
    user_id = request.args.get('user_id', type=int)
    data = request.get_json()
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    if not all(k in data for k in ['book', 'chapter', 'verse', 'note_text']):
        return jsonify({'error': 'book, chapter, verse, and note_text are required'}), 400
    
    note_id = add_note(
        user_id,
        data['book'],
        data['chapter'],
        data['verse'],
        data['note_text']
    )
    
    return jsonify({'id': note_id, 'message': 'Note added successfully'}), 201

@app.route('/api/notes/<int:note_id>', methods=['PUT'])
def update_user_note(note_id):
    """Update a note"""
    user_id = request.args.get('user_id', type=int)
    data = request.get_json()
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    if 'note_text' not in data:
        return jsonify({'error': 'note_text is required'}), 400
    
    # Verify user owns this note
    if not verify_user_owns_note(user_id, note_id):
        return jsonify({'error': 'Unauthorized - you do not own this note'}), 403
    
    update_note(note_id, data['note_text'])
    
    return jsonify({'message': 'Note updated successfully'}), 200

@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
def delete_user_note(note_id):
    """Delete a note"""
    user_id = request.args.get('user_id', type=int)
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    # Verify user owns this note
    if not verify_user_owns_note(user_id, note_id):
        return jsonify({'error': 'Unauthorized - you do not own this note'}), 403
    
    delete_note(note_id)
    return jsonify({'message': 'Note deleted successfully'}), 200
# Verse of the Day Like Routes
@app.route('/api/verse-of-day/like', methods=['POST'])
def toggle_verse_of_day_like_api():
    """Toggle like status for verse of the day"""
    user_id = request.args.get('user_id', type=int)
    data = request.get_json()
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    if not all(k in data for k in ['book', 'chapter', 'verse']):
        return jsonify({'error': 'book, chapter, and verse are required'}), 400
    
    liked = db_toggle_verse_like(
        user_id,
        data['book'],
        data['chapter'],
        data['verse'],
        data.get('translation', 'web')
    )
    
    return jsonify({'liked': liked}), 200

@app.route('/api/verse-of-day/like', methods=['GET'])
def check_verse_of_day_like_api():
    """Check if user has liked this verse of the day"""
    user_id = request.args.get('user_id', type=int)
    book = request.args.get('book')
    chapter = request.args.get('chapter', type=int)
    verse = request.args.get('verse', type=int)
    translation = request.args.get('translation', 'web')
    
    if not user_id or not book or not chapter or not verse:
        return jsonify({'error': 'user_id, book, chapter, and verse are required'}), 400
    
    liked = db_check_verse_like(user_id, book, chapter, verse, translation)
    
    return jsonify({'liked': liked}), 200


# Auto-record reading when user views a chapter
@app.route('/api/bible/chapter/<book>/<int:chapter>', methods=['GET'])
def get_chapter_and_record(book, chapter):
    """Get Bible chapter via bible-api.com and record a reading session"""
    import urllib.request
    import urllib.error

    user_id = int(request.args.get('user_id', 1))
    translation = request.args.get('translation', 'web')

    try:
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

@app.route('/api/verse-of-day', methods=['GET'])
def get_daily_verse():
    """Get the verse of the day"""
    today_str = date.today().isoformat()
    
    verse_data = {
        'book': 'John',
        'reference': 'John 3:16',
        'text': 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
        'translation': 'NIV',
        'date': today_str,
        'favorited': False,
        'user_note': None
    }
    
    return jsonify(verse_data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)