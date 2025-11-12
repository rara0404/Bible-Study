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
  try {
    const res = await fetch('/api/reading-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: params.userId ?? 1,
        book: params.book,
        chapter: params.chapter,
        verses_read: params.verses_read ?? 1,
        duration_minutes: params.duration_minutes ?? 0,
      }),
    });
    if (!res.ok) {
      // Non-fatal for UX; log for diagnostics
      console.warn('recordReadingSession failed', res.status, await res.text());
    }
  } catch (e) {
    console.warn('recordReadingSession error', e);
  }
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
  const res = await fetch(`/api/favorite-verses?user_id=${encodeURIComponent(userId ?? '1')}`);
  if (!res.ok) return [];
  return (await res.json()) as Array<{ id: number; book: string; reference: string; text: string; note?: string; }>;
}

export async function addFavoriteVerse(data: { userId?: string; book: string; reference: string; text: string; note?: string }) {
  const res = await fetch('/api/favorite-verses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: data.userId ?? 1,
      book: data.book,
      reference: data.reference,
      text: data.text,
      note: data.note ?? ''
    }),
  });
  return res.ok;
}