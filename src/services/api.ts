const API_BASE_URL = 'http://localhost:5000/api';

export interface StudySession {
  id?: number;
  user_id?: number;
  title: string;
  scripture_reference?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PrayerRequest {
  id?: number;
  user_id?: number;
  title: string;
  description?: string;
  status?: 'active' | 'answered' | 'ongoing';
  created_at?: string;
}

export interface WeeklyProgress {
  current_week: {
    week_start: string;
    week_end: string;
    days_read: number;
    target_days: number;
    chapters_read: number;
    progress_percentage: number;
  };
  daily_status: Array<{
    reading_date: string;
    sessions_count: number;
  }>;
  streak: number;
}

export interface ReadingSession {
  reading_date: string;
  book: string;
  chapter: number;
  verses_read: number;
  duration_minutes: number;
}

// Study Sessions API
export const studySessionsApi = {
  getAll: async (): Promise<StudySession[]> => {
    const response = await fetch(`${API_BASE_URL}/study-sessions`);
    return response.json();
  },

  create: async (session: StudySession): Promise<{ id: number }> => {
    const response = await fetch(`${API_BASE_URL}/study-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    return response.json();
  },

  update: async (id: number, session: StudySession): Promise<void> => {
    await fetch(`${API_BASE_URL}/study-sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
  },

  delete: async (id: number): Promise<void> => {
    await fetch(`${API_BASE_URL}/study-sessions/${id}`, {
      method: 'DELETE',
    });
  },
};

// Prayer Requests API
export const prayerRequestsApi = {
  getAll: async (): Promise<PrayerRequest[]> => {
    const response = await fetch(`${API_BASE_URL}/prayer-requests`);
    return response.json();
  },

  create: async (request: PrayerRequest): Promise<{ id: number }> => {
    const response = await fetch(`${API_BASE_URL}/prayer-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.json();
  },

  updateStatus: async (id: number, status: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/prayer-requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: number): Promise<void> => {
    await fetch(`${API_BASE_URL}/prayer-requests/${id}`, {
      method: 'DELETE',
    });
  },
};

// Reading Goals and Progress API
export const readingProgressApi = {
  getWeeklyProgress: async (user_id?: number): Promise<WeeklyProgress> => {
    const response = await fetch(`${API_BASE_URL}/reading-goals?user_id=${user_id || 1}`);
    return response.json();
  },

  setWeeklyGoal: async (target_days: number, user_id?: number): Promise<void> => {
    await fetch(`${API_BASE_URL}/reading-goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_days, user_id: user_id || 1 }),
    });
  },

  recordReadingSession: async (
    book: string, 
    chapter: number, 
    verses_read?: number, 
    duration_minutes?: number,
    user_id?: number
  ): Promise<{ progress: WeeklyProgress }> => {
    const response = await fetch(`${API_BASE_URL}/reading-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        book, 
        chapter, 
        verses_read: verses_read || 1, 
        duration_minutes: duration_minutes || 0,
        user_id: user_id || 1 
      }),
    });
    return response.json();
  },

  getReadingStreak: async (user_id?: number): Promise<{ streak: number }> => {
    const response = await fetch(`${API_BASE_URL}/reading-streak?user_id=${user_id || 1}`);
    return response.json();
  },

  getReadingHistory: async (days?: number, user_id?: number): Promise<{
    reading_sessions: ReadingSession[];
    weekly_summaries: any[];
  }> => {
    const response = await fetch(`${API_BASE_URL}/reading-history?days=${days || 30}&user_id=${user_id || 1}`);
    return response.json();
  },
};