from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import date

app = Flask(__name__)
CORS(app)

# API Routes
@app.route('/api/study-sessions', methods=['GET', 'POST'])
def handle_study_sessions():
    return jsonify({'error': 'Feature disabled. No database available.'}), 410

@app.route('/api/study-sessions/<int:session_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_single_study_session(session_id):
    return jsonify({'error': 'Feature disabled. No database available.'}), 410

@app.route('/api/prayer-requests', methods=['GET', 'POST'])
def handle_prayer_requests():
    return jsonify({'error': 'Feature disabled. No database available.'}), 410

@app.route('/api/prayer-requests/<int:request_id>', methods=['PUT', 'DELETE'])
def handle_single_prayer_request(request_id):
    return jsonify({'error': 'Feature disabled. No database available.'}), 410

@app.route('/api/reading-goals', methods=['GET', 'POST'])
def handle_reading_goals():
    return jsonify({'error': 'Feature disabled. No database available.'}), 410

@app.route('/api/reading-sessions', methods=['POST'])
def record_reading():
    return jsonify({'error': 'Feature disabled. No database available.'}), 410

@app.route('/api/reading-progress/weekly', methods=['GET'])
def get_weekly_reading_progress():
    return jsonify({'error': 'Feature disabled. No database available.'}), 410

@app.route('/api/reading-streak', methods=['GET'])
def legacy_get_user_reading_streak():
    return jsonify({'error': 'Feature disabled. No database available.'}), 410

@app.route('/api/reading-history', methods=['GET'])
def get_reading_history():
    return jsonify({'error': 'Feature disabled. No database available.'}), 410

# Auto-record reading when user views a chapter
@app.route('/api/bible/chapter/<book>/<int:chapter>', methods=['GET'])
def get_chapter_and_record(book, chapter):
    """Get Bible chapter via bible-api.com and record a reading session"""
    import urllib.request
    import urllib.error

    user_id = int(request.args.get('user_id', 1))
    translation = request.args.get('translation', 'web')  # bible-api.com "web" maps to World English Bible

    # No database: do not record reading sessions in DB

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
    return jsonify({'error': 'Feature disabled. No database available.'}), 410

# Favorite verses management (DB-backed)
@app.route('/api/favorite-verses', methods=['GET', 'POST', 'DELETE'])
def handle_favorite_verses():
    # With no database, this feature is disabled. Frontend should use localStorage fallback.
    return jsonify({'error': 'Favorites are disabled. No database available.'}), 410

@app.route('/api/streak', methods=['GET'])
def get_user_reading_streak():
    # With no database, this feature is disabled. Frontend should use local fallback.
    return jsonify({'error': 'Streaks are disabled. No database available.'}), 410

@app.route('/api/streak/mark-today', methods=['POST'])
def mark_streak_today():
    # With no database, this feature is disabled. Frontend should use local fallback.
    return jsonify({'error': 'Streaks are disabled. No database available.'}), 410

# Missing: Daily verse of the day
@app.route('/api/verse-of-day', methods=['GET'])
def get_daily_verse():
    """Get the verse of the day"""
    today_str = date.today().isoformat()
    # Notes-only backend: do not track verse interactions in DB
    
    # You'll need to implement your verse-of-day logic here
    # This is a placeholder response
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

@app.route('/api/verse-notes', methods=['GET', 'POST', 'DELETE'])
def verse_notes_handler():
    # With no database, this feature is disabled. Frontend should use localStorage fallback.
    return jsonify({'error': 'Notes are disabled. No database available.'}), 410

if __name__ == '__main__':
    app.run(debug=True, port=5000)