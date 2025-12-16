export type LastReading = {
  book: string;
  chapter: number;
  translation?: string;
  verse?: number;
  updatedAt: string; // ISO
};

const LS_KEY = 'lastReading';

export async function saveLastReading(data: Omit<LastReading, 'updatedAt'>, userId?: string) {
  const payload: LastReading = { ...data, updatedAt: new Date().toISOString() };

  // TODO: replace with your backend call; userId identifies the account
  if (userId) {
    // await fetch('/api/reading', { method: 'PUT', body: JSON.stringify({ userId, payload }) });
  }

  // Local fallback so Resume works even when signed out
  localStorage.setItem(LS_KEY, JSON.stringify(payload));
}

export async function getLastReading(userId?: string): Promise<LastReading | null> {
  // TODO: replace with backend fetch if signed in
  if (userId) {
    // const res = await fetch(`/api/reading?userId=${encodeURIComponent(userId)}`);
    // if (res.ok) return (await res.json()) as LastReading;
  }
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LastReading;
    if (!parsed.book || !parsed.chapter) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function recordReadingSession(params: {
  userId?: string;
  book: string;
  chapter: number;
  verses_read?: number;
  duration_minutes?: number;
}) {
  // Backend persistence disabled: streaks/progress are local-only.
  // Intentionally no-op to avoid unnecessary network calls.
}

export async function saveVerseNote(params: { userId?: string; book: string; chapter: number; verse: number; note: string; }) {
  // Require userId - don't default to 1
  if (!params.userId) {
    console.warn('saveVerseNote: userId is required');
    return false;
  }

  try {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(params.userId),
        book: params.book,
        chapter: params.chapter,
        verse: params.verse,
        note_text: params.note,
      }),
    });
    if (!res.ok) console.warn('saveVerseNote failed', res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.warn('saveVerseNote error', e);
    return false;
  }
}

export async function getFavoriteVerses(userId?: string) {
  // Require userId for authenticated requests
  if (!userId) {
    console.warn('getFavoriteVerses: userId is recommended for authenticated requests');
    return [];
  }

  try {
    const res = await fetch(`/api/favorites?user_id=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const data = await res.json();
      return data.favorites || []; 
    }
  } catch {/* ignore */}
  return [];
}

export async function addFavoriteVerse(data: { userId?: string; book: string; reference: string; text: string; note?: string }) {
  // Require userId
  if (!data.userId) {
    console.warn('addFavoriteVerse: userId is required');
    return false;
  }

  const match = data.reference.match(/^(.*)\s+(\d+):(\d+)$/);
  const chapter = match ? parseInt(match[2], 10) : 1;
  const verse = match ? parseInt(match[3], 10) : 1;
  try {
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(data.userId),
        book: data.book,
        chapter,
        verse,
        verse_text: data.text,
        translation: 'web'
      })
    });
    if (res.ok) return true;
  } catch {/* ignore */}
  return false;
}

export async function deleteFavoriteVerse(params: { userId?: string; book: string; chapter: number; verse: number; translation?: string }) {
  // Require userId
  if (!params.userId) {
    console.warn('deleteFavoriteVerse: userId is required');
    return false;
  }

  try {
    const res = await fetch(`/api/favorites`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(params.userId),
        book: params.book,
        chapter: params.chapter,
        verse: params.verse,
        translation: (params.translation ?? 'web')
      })
    });
    if (res.ok) return true;
  } catch {/* ignore */}
  return false;
}

export async function getStreak(userId?: string) {
  // Require userId for authenticated requests
  if (!userId) {
    console.warn('getStreak: userId is required for authenticated requests');
    return { current_streak: 0, longest_streak: 0, last_read_date: null, total_days_read: 0 };
  }

  try {
    const res = await fetch(`/api/streak?user_id=${encodeURIComponent(userId)}`);
    if (res.ok) return await res.json();
  } catch {/* ignore */}
  return { current_streak: 0, longest_streak: 0, last_read_date: null, total_days_read: 0 };
}

export async function markStreakToday(userId?: string) {
  // Require userId
  if (!userId) {
    console.warn('markStreakToday: userId is required');
    return { current_streak: 0, longest_streak: 0, last_read_date: null, total_days_read: 0 };
  }

  try {
    const res = await fetch('/api/streak/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: parseInt(userId) })
    });
    if (res.ok) return await res.json();
  } catch {/* ignore */}
  return { current_streak: 0, longest_streak: 0, last_read_date: null, total_days_read: 0 };
}