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