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
  try {
    const res = await fetch('/api/verse-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: params.userId ?? 1,
        book: params.book,
        chapter: params.chapter,
        verse: params.verse,
        note: params.note,
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
  // Prefer backend favorites; fallback to localStorage
  try {
    const res = await fetch(`/api/favorite-verses?user_id=${encodeURIComponent(userId ?? '1')}`);
    if (res.ok) {
      const data = await res.json();
      return data as Array<{ id: number; book: string; chapter: number; verse: number; text: string; translation: string; created_at: string; }>; 
    }
  } catch {/* ignore */}
  const raw = localStorage.getItem('bibleFavorites');
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export async function addFavoriteVerse(data: { userId?: string; book: string; reference: string; text: string; note?: string }) {
  const match = data.reference.match(/^(.*)\s+(\d+):(\d+)$/);
  const chapter = match ? parseInt(match[2], 10) : 1;
  const verse = match ? parseInt(match[3], 10) : 1;
  try {
    const res = await fetch('/api/favorite-verses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: data.userId ?? 1,
        book: data.book,
        chapter,
        verse,
        text: data.text,
        translation: 'web'
      })
    });
    if (res.ok) return true;
  } catch {/* ignore */}
  // Fallback local
  const raw = localStorage.getItem('bibleFavorites');
  const list = raw ? (JSON.parse(raw) as any[]) : [];
  if (!list.some((v: any) => v.book === data.book && v.chapter === chapter && v.verse === verse)) {
    list.push({ book: data.book, chapter, verse, text: data.text, translation: 'web', dateAdded: new Date().toISOString() });
    localStorage.setItem('bibleFavorites', JSON.stringify(list));
  }
  return true;
}

export async function deleteFavoriteVerse(params: { userId?: string; book: string; chapter: number; verse: number; translation?: string }) {
  try {
    const q = new URLSearchParams({
      user_id: (params.userId ?? '1').toString(),
      book: params.book,
      chapter: params.chapter.toString(),
      verse: params.verse.toString(),
      translation: (params.translation ?? 'web')
    });
    const res = await fetch(`/api/favorite-verses?${q.toString()}`, { method: 'DELETE' });
    if (res.ok) return true;
  } catch {/* ignore */}
  // Fallback local removal
  const raw = localStorage.getItem('bibleFavorites');
  if (raw) {
    try {
      const list = JSON.parse(raw) as any[];
      const filtered = list.filter(v => !(v.book === params.book && v.chapter === params.chapter && v.verse === params.verse && (v.translation ?? 'web') === (params.translation ?? 'web')));
      localStorage.setItem('bibleFavorites', JSON.stringify(filtered));
    } catch {/* ignore */}
  }
  return true;
}

export async function getStreak(userId?: string) {
  try {
    const res = await fetch(`/api/streak?user_id=${encodeURIComponent(userId ?? '1')}`);
    if (res.ok) return await res.json();
  } catch {/* ignore */}
  const raw = localStorage.getItem('bibleStreakData');
  return raw ? JSON.parse(raw) : { currentStreak: 0, longestStreak: 0, lastReadDate: null, totalDaysRead: 0 };
}

export async function markStreakToday(userId?: string) {
  try {
    const res = await fetch('/api/streak/mark-today', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId ?? 1 })
    });
    if (res.ok) return await res.json();
  } catch {/* ignore */}
  // Local fallback
  const today = new Date().toDateString();
  const raw = localStorage.getItem('bibleStreakData');
  let data = raw ? JSON.parse(raw) : { currentStreak: 0, longestStreak: 0, lastReadDate: null, totalDaysRead: 0 };
  if (data.lastReadDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (data.lastReadDate === yesterday.toDateString()) data.currentStreak += 1; else data.currentStreak = 1;
    data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
    data.totalDaysRead += 1;
    data.lastReadDate = today;
    localStorage.setItem('bibleStreakData', JSON.stringify(data));
  }
  return data;
}