import React, { useState, useEffect } from 'react';
import { studySessionsApi, StudySession } from '../services/api';
import './StudyJournal.css';

const StudyJournal: React.FC = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSession, setNewSession] = useState<StudySession>({
    title: '',
    scripture_reference: '',
    notes: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await studySessionsApi.getAll();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load study sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.title.trim()) return;

    try {
      await studySessionsApi.create(newSession);
      setNewSession({ title: '', scripture_reference: '', notes: '' });
      setIsCreating(false);
      loadSessions(); // Reload the list
    } catch (error) {
      console.error('Failed to create study session:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this study session?')) {
      try {
        await studySessionsApi.delete(id);
        loadSessions(); // Reload the list
      } catch (error) {
        console.error('Failed to delete study session:', error);
      }
    }
  };

  if (loading) {
    return <div className="study-journal-loading">Loading study sessions...</div>;
  }

  return (
    <div className="study-journal">
      <div className="study-journal-header">
        <h2>📖 Study Journal</h2>
        <button 
          className="btn-primary"
          onClick={() => setIsCreating(true)}
        >
          + New Study Session
        </button>
      </div>

      {isCreating && (
        <div className="study-session-form">
          <h3>New Study Session</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                value={newSession.title}
                onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                placeholder="e.g., Faith and Doubt in Matthew 14"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="scripture">Scripture Reference</label>
              <input
                id="scripture"
                type="text"
                value={newSession.scripture_reference}
                onChange={(e) => setNewSession({ ...newSession, scripture_reference: e.target.value })}
                placeholder="e.g., Matthew 14:22-33"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={newSession.notes}
                onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                placeholder="Your study notes and reflections..."
                rows={6}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Save Study Session
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="study-sessions-list">
        {sessions.length === 0 ? (
          <div className="empty-state">
            <p>No study sessions yet. Create your first one!</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="study-session-card">
              <div className="session-header">
                <h3>{session.title}</h3>
                <button 
                  className="btn-danger"
                  onClick={() => handleDelete(session.id!)}
                >
                  🗑️
                </button>
              </div>
              
              {session.scripture_reference && (
                <div className="scripture-ref">
                  📖 {session.scripture_reference}
                </div>
              )}
              
              {session.notes && (
                <div className="session-notes">
                  {session.notes}
                </div>
              )}
              
              <div className="session-meta">
                Created: {new Date(session.created_at!).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudyJournal;