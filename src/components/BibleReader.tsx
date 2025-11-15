import { useState, useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { getChapter, getBookId, BibleApiError } from '../services/bibleApi';
import { StickyNote, AlertCircle, Heart, ChevronLeft, ChevronRight, X } from "lucide-react";
import "./BibleReader.css";
import { saveLastReading, recordReadingSession, saveVerseNote } from "../services/readingProgress";
import React from "react";
import { TranslationSelector } from "./TranslationSelector";

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface BibleReaderProps {
  book: string;
  chapter: number;
  translation?: string;
  userId?: number;
  onNavigate: (book: string, chapter: number) => void;
  onTranslationChange?: (value: string) => void;
}

interface Note {
  id?: number;
  book: string;
  chapter: number;
  verse: number;
  note: string;
}

interface FavoriteVerse {
  id?: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  dateAdded?: string;
  created_at?: string;
}

interface ApiBibleVerse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

function cleanVerseText(text: string): string {
  return text.replace(/\bunrefined\b/gi, '').replace(/\s+/g, ' ').trim();
}

// Add: italics for quoted sayings and paragraph grouping
function italicizeQuotes(text: string): string {
  // Curly quotes
  let out = text.replace(/“([^”]+)”/g, '<em>$1</em>');
  // Fallback ASCII quotes (avoid matching single apostrophes)
  out = out.replace(/"([^"]+)"/g, '<em>$1</em>');
  return out;
}

function groupVersesIntoParagraphs(verses: BibleVerse[], maxLen = 600): BibleVerse[][] {
  const groups: BibleVerse[][] = [];
  let current: BibleVerse[] = [];
  let length = 0;

  verses.forEach(v => {
    const l = v.text.length;
    // Start a new paragraph if current is long enough and we ended a sentence
    const endsSentence = /[.!?]["”']?\s*$/.test(v.text);
    if (current.length > 0 && (length + l > maxLen) && endsSentence) {
      groups.push(current);
      current = [];
      length = 0;
    }
    current.push(v);
    length += l + 1;
  });
  if (current.length) groups.push(current);
  return groups.length ? groups : [verses];
}

export function BibleReader(props: BibleReaderProps) {
  const { book, chapter, translation, userId } = props;
  const topRef = useRef<HTMLDivElement | null>(null);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      const savedFontSize = localStorage.getItem('bibleFontSize');
      if (savedFontSize) setFontSize(parseInt(savedFontSize));

      // Load notes from backend if userId available, otherwise fallback to localStorage
      if (userId) {
        try {
          const res = await fetch(`/api/notes?user_id=${userId}`);
          if (res.ok) {
            const data = await res.json();
            const loadedNotes = data.notes || [];
            setNotes(loadedNotes);
            // Sync to localStorage for offline access
            localStorage.setItem('bibleNotes', JSON.stringify(loadedNotes));
            return;
          }
        } catch (err) {
          console.error('Failed to load notes from server:', err);
        }
      }
      // Fallback to localStorage
      const savedNotes = localStorage.getItem('bibleNotes');
      if (savedNotes) setNotes(JSON.parse(savedNotes));
    };

    const loadFavorites = async () => {
      // Load favorites from backend if userId available, otherwise fallback to localStorage
      if (userId) {
        try {
          const res = await fetch(`/api/favorites?user_id=${userId}`);
          if (res.ok) {
            const data = await res.json();
            const loadedFavorites = data.favorites || [];
            setFavorites(loadedFavorites);
            // Sync to localStorage for offline access
            localStorage.setItem('bibleFavorites', JSON.stringify(loadedFavorites));
            return;
          }
        } catch (err) {
          console.error('Failed to load favorites from server:', err);
        }
      }
      // Fallback to localStorage
      const savedFavorites = localStorage.getItem('bibleFavorites');
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    };

    loadData();
    loadFavorites();
  }, [userId]);

  useEffect(() => {
    const fetchChapterData = async () => {
      setLoading(true);
      setError(null);
      try {
        const bookId = getBookId(book);
        if (!bookId) throw new Error(`Unknown book: ${book}`);
        const response = await getChapter(bookId, chapter, translation);
        if (response.verses && response.verses.length > 0) {
          const adaptedVerses: BibleVerse[] = response.verses.map(verse => ({
            book: verse.book_name,
            chapter: verse.chapter,
            verse: verse.verse,
            text: cleanVerseText(verse.text)
          }));
          setVerses(adaptedVerses);

          await saveLastReading(
            { book, chapter, translation: translation || 'web' },
            userId ? String(userId) : undefined
          );
          recordReadingSession({ userId: userId ? String(userId) : undefined, book, chapter });
        } else {
          setError('No verses found for this chapter.');
        }
      } catch (err) {
        if (err instanceof BibleApiError) {
          if (err.status === 404) {
            setError(`Chapter ${chapter} not found in ${book}.`);
          } else {
            setError(`Failed to load chapter: ${err.message}`);
          }
        } else {
          setError(`Failed to load chapter: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchChapterData();
  }, [book, chapter, translation]);

  // Probe if the next chapter exists for this book/translation; disable Next if not.
  useEffect(() => {
    let cancelled = false;
    const checkNext = async () => {
      const bookId = getBookId(book);
      if (!bookId) {
        if (!cancelled) setHasNext(false);
        return;
      }
      try {
        // Try to fetch the next chapter metadata; treat 404 as "no next".
        await getChapter(bookId, chapter + 1, translation);
        if (!cancelled) setHasNext(true);
      } catch (e) {
        if (!cancelled) {
          if (e instanceof BibleApiError && e.status === 404) setHasNext(false);
          else setHasNext(true); // network/other errors -> keep Next enabled
        }
      }
    };
    checkNext();
    return () => { cancelled = true; };
  }, [book, chapter, translation]);

  const saveNote = async () => {
    if (!selectedVerse) return;
    const trimmed = noteText.trim();
    if (!trimmed) {
      // Keep behavior simple: do nothing if empty (could also delete existing note)
      return;
    }
    const newNote: Note = { book, chapter, verse: selectedVerse, note: trimmed };
    const updatedNotes = notes.filter(n => !(n.book === book && n.chapter === chapter && n.verse === selectedVerse));
    updatedNotes.push(newNote);
    
    // Update state and localStorage immediately for instant UI feedback
    setNotes(updatedNotes);
    localStorage.setItem('bibleNotes', JSON.stringify(updatedNotes));
    setNoteText('');
    setSelectedVerse(null);

    // Persist to backend database if userId available
    if (userId) {
      try {
        console.log('[BibleReader] Saving note to API:', { userId, book, chapter, verse: selectedVerse, note_text: trimmed });
        const res = await fetch(`/api/notes?user_id=${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            book,
            chapter,
            verse: selectedVerse,
            note_text: trimmed
          })
        });
        console.log('[BibleReader] Save note response:', res.status, res.statusText);
        if (res.ok) {
          const data = await res.json();
          // Update the note with the ID from the backend
          newNote.id = data.id;
          setNotes(updatedNotes);
          localStorage.setItem('bibleNotes', JSON.stringify(updatedNotes));
        } else {
          const errorData = await res.json();
          console.error('[BibleReader] Save note error:', errorData);
        }
      } catch (err) {
        console.error('[BibleReader] Failed to save note to server:', err);
        // Note already saved to localStorage, so it persists
      }
    }
  };

  const deleteNote = async (verse: number) => {
    const noteToDelete = notes.find(n => n.book === book && n.chapter === chapter && n.verse === verse);
    
    // Update state and localStorage immediately for instant UI feedback
    const updatedNotes = notes.filter(n => !(n.book === book && n.chapter === chapter && n.verse === verse));
    setNotes(updatedNotes);
    localStorage.setItem('bibleNotes', JSON.stringify(updatedNotes));

    // Delete from backend if note has ID and userId is available
    if (noteToDelete?.id && userId) {
      try {
        await fetch(`/api/notes/${noteToDelete.id}?user_id=${userId}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete note from server:', err);
        // Note already removed from localStorage, so it persists
      }
    }
  };

  const getVerseNote = (verse: number): Note | undefined =>
    notes.find(n => n.book === book && n.chapter === chapter && n.verse === verse);

  const toggleFavorite = async (verse: BibleVerse) => {
    const existingFavorite = favorites.find(f =>
      f.book === book && f.chapter === chapter && f.verse === verse.verse && f.translation === (translation || 'web')
    );
    let updatedFavorites: FavoriteVerse[];
    
    if (existingFavorite) {
      // Remove favorite
      updatedFavorites = favorites.filter(f =>
        !(f.book === book && f.chapter === chapter && f.verse === verse.verse && f.translation === (translation || 'web'))
      );
      
      // Update state and localStorage immediately for instant UI feedback
      setFavorites(updatedFavorites);
      localStorage.setItem('bibleFavorites', JSON.stringify(updatedFavorites));

      // Call API to remove favorite if userId available
      if (userId) {
        try {
          console.log('[BibleReader] Removing favorite from API:', { userId, book, chapter, verse: verse.verse, translation });
          const response = await fetch(`/api/favorites?user_id=${userId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              book,
              chapter,
              verse: verse.verse,
              translation: translation || 'web'
            })
          });
          console.log('[BibleReader] Remove favorite response:', response.status, response.statusText);
        } catch (err) {
          console.error('[BibleReader] Failed to remove favorite from server:', err);
          // Favorite already removed from localStorage, so it persists
        }
      }
    } else {
      // Add favorite
      const newFavorite: FavoriteVerse = {
        book,
        chapter,
        verse: verse.verse,
        text: verse.text,
        translation: translation || 'web',
        dateAdded: new Date().toISOString()
      };
      updatedFavorites = [...favorites, newFavorite];
      
      // Update state and localStorage immediately for instant UI feedback
      setFavorites(updatedFavorites);
      localStorage.setItem('bibleFavorites', JSON.stringify(updatedFavorites));

      // Call API to add favorite if userId available
      if (userId) {
        try {
          console.log('[BibleReader] Adding favorite to API:', { userId, book, chapter, verse: verse.verse, translation });
          const response = await fetch(`/api/favorites?user_id=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              book,
              chapter,
              verse: verse.verse,
              verse_text: verse.text,
              translation: translation || 'web'
            })
          });
          console.log('[BibleReader] Add favorite response:', response.status, response.statusText);
          if (!response.ok) {
            const errorData = await response.json();
            console.error('[BibleReader] Add favorite error:', errorData);
          }
        } catch (err) {
          console.error('[BibleReader] Failed to add favorite to server:', err);
          // Favorite already added to localStorage, so it persists
        }
      }
    }
  };

  const isFavorite = (verse: BibleVerse): boolean =>
    favorites.some(f => f.book === book && f.chapter === chapter && f.verse === verse.verse && f.translation === (translation || 'web'));

  const handleVerseClick = async (verse: number) => {
    if (selectedVerse === verse) {
      setSelectedVerse(null);
      setNoteText('');
    } else {
      setSelectedVerse(verse);
      const existingNote = getVerseNote(verse);
      setNoteText(existingNote?.note || '');
    }
    await saveLastReading({ book, chapter, translation: translation || 'web', verse }, userId ? String(userId) : undefined);
  };

  // Smooth-scroll to the top of the reader when the chapter changes
  useEffect(() => {
    const el = topRef.current;
    if (!el) return;
    const headerOffset = 80; // app header + sticky chapter header (reduced)
    const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }, [book, chapter]);

  // Keyboard: ← previous, → next
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && chapter > 1 && !loading) {
        props.onNavigate(book, chapter - 1);
      } else if (e.key === "ArrowRight" && hasNext && !loading) {
        props.onNavigate(book, chapter + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [book, chapter, hasNext, loading, props]);

  return (
    <div className="bible-reader" ref={topRef}>
      {/* Back Button */}
      <Button
        variant="outline"
        className="mb-4"
        onClick={() => props.onNavigate(book, 0)}
      >
        ← Back to Chapters
      </Button>
  {/* Enhanced: single unified card with sticky header */}
  <Card className="chapter-card">
  <CardHeader className="chapter-header sticky top-12 z-20 border-b bg-white/70 dark:bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl font-bold truncate">
                  {book}
                </CardTitle>
                <span
                  className="inline-flex items-baseline gap-1 text-gray-700 dark:text-gray-200"
                  aria-label={`Chapter ${chapter}`}
                >
                  <span className="text-xl sm:text-2xl font-normal leading-none">
                    Chapter {chapter}
                  </span>
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Tap a verse to add a note or favorite it
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-xs text-gray-500">Translation</span>
              <TranslationSelector
                selectedTranslation={translation ?? "web"}
                onTranslationChange={(v) => props.onTranslationChange?.(v)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    const bookId = getBookId(book);
                    if (bookId) {
                      setError(null);
                      const refetch = async () => {
                        setLoading(true);
                        try {
                          const response = await getChapter(bookId, chapter, translation);
                          const converted: BibleVerse[] = response.verses.map((apiVerse: ApiBibleVerse) => ({
                            book: apiVerse.book_name,
                            chapter: apiVerse.chapter,
                            verse: apiVerse.verse,
                            text: cleanVerseText(apiVerse.text)
                          }));
                          setVerses(converted);
                        } catch (err) {
                          setError(err instanceof BibleApiError ? err.message : 'Failed to load chapter. Please try again.');
                        } finally {
                          setLoading(false);
                        }
                      };
                      refetch();
                    }
                  }}
                  className="ml-2 p-0 h-auto"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex gap-4">
                  <Skeleton className="h-6 w-8 rounded" />
                  <Skeleton className="h-16 flex-1" />
                </div>
              ))}
            </div>
          ) : !error && verses.length > 0 ? (
            <>
              {/* Paragraph mode: smaller font, verses inline */}
              <div className="space-y-5 text-[15px] sm:text-[16px] leading-7 text-gray-900 dark:text-gray-100">
                    {groupVersesIntoParagraphs(verses).map((para, idx) => (
                  <p key={idx} className="relative selection:bg-blue-100/70 dark:selection:bg-blue-900/40">
                    {para.map(v => {
                      const isSelected = selectedVerse === v.verse;
                      return (
                        <span key={v.verse} className="relative inline">
                          {/* Anchor at verse number for card positioning */}
                          <span className="relative inline-block align-baseline">
                            <sup className="mr-1 text-[10px] align-super text-gray-500">{v.verse}</sup>
                            {isSelected && (
                              <div
                                className="absolute left-0 top-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-50 verse-note-card"
                                role="dialog"
                                aria-label={`Notes for ${book} ${chapter}:${v.verse}`}
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div className="text-base sm:text-lg font-semibold">{book} {chapter}:{v.verse}</div>
                                  {/* Close card */}
                                  <button
                                    aria-label="Close notes"
                                    className="ml-3 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                    onClick={(e) => { e.stopPropagation(); setSelectedVerse(null); setNoteText(''); }}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>

                                {/* Display saved notes for this verse */}
                                {getVerseNote(v.verse) && (
                                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">SAVED NOTE</div>
                                    <div className="text-sm text-gray-800 dark:text-gray-200 mb-3 whitespace-pre-wrap">{getVerseNote(v.verse)?.note}</div>
                                    <button
                                      type="button"
                                      className="inline-flex items-center justify-center rounded-md px-3 h-8 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900 text-xs font-medium transition-colors"
                                      onClick={(e) => { e.stopPropagation(); deleteNote(v.verse); setNoteText(''); }}
                                    >
                                      Delete Note
                                    </button>
                                  </div>
                                )}

                                <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Add New Note</div>
                                <div className="verse-note-grid">
                                  <Textarea
                                    id="note-textarea"
                                    placeholder="Add a note about this verse..."
                                    value={noteText}
                                    onChange={e => setNoteText(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500 verse-note-textarea"
                                    autoFocus
                                  />
                                                            <div className="verse-note-footer w-full">
                                                              <button
                                                                type="button"
                                                                className="inline-flex items-center justify-center rounded-md px-6 h-10 bg-white text-black border-2 border-black no-hover transition-none"
                                                                onClick={(e) => { e.stopPropagation(); void saveNote(); }}
                                                              >
                                                                Save
                                                              </button>
                                                            </div>
                                </div>
                              </div>
                            )}
                          </span>

                          {/* Verse text click target */}
                          <span
                            onClick={() => handleVerseClick(v.verse)}
                            className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${isSelected ? 'bg-blue-50/70 dark:bg-blue-950' : ''}`}
                          >
                            <span dangerouslySetInnerHTML={{ __html: italicizeQuotes(v.text) }} />
                            {/* Heart icon only when this verse is selected */}
                            {isSelected && (
                              <button
                                aria-label={isFavorite(v) ? 'Remove from favorites' : 'Add to favorites'}
                                className={`ml-2 inline-flex items-center align-middle text-gray-400 hover:text-rose-500 transition-colors ${isFavorite(v) ? 'text-rose-500' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(v); }}
                              >
                                <Heart className="w-4 h-4" fill={isFavorite(v) ? 'currentColor' : 'none'} />
                              </button>
                            )}
                          </span>
                        </span>
                      );
                    })}
                  </p>
                ))}
              </div>

              {/* Bottom navigation: Previous / Next (balanced spacing with header) */}
              <div className="mt-10 pt-6 border-t flex flex-wrap items-center justify-between gap-4 px-0 md:px-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!loading && chapter > 1) props.onNavigate(book, chapter - 1);
                  }}
                  disabled={loading || chapter <= 1}
                  aria-label="Previous chapter"
                  className="min-w-40 h-11"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                <Button
                  variant="default"
                  onClick={() => {
                    if (!loading && hasNext) props.onNavigate(book, chapter + 1);
                  }}
                  disabled={loading || !hasNext}
                  aria-label="Next chapter"
                  className="min-w-40 h-11"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {error ? error : "No verses found."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}