import { useState, useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { getChapter, getBookId, BibleApiError } from '../services/bibleApi';
import { StickyNote, AlertCircle, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import "./BibleReader.css";
import { saveLastReading, recordReadingSession } from "../services/readingProgress";
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
  onNavigate: (book: string, chapter: number) => void;
  onTranslationChange?: (value: string) => void;
}

interface Note {
  book: string;
  chapter: number;
  verse: number;
  note: string;
}

interface FavoriteVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  dateAdded: string;
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
  const { book, chapter, translation } = props;
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

  const userId: string | undefined = undefined;

  useEffect(() => {
    const savedNotes = localStorage.getItem('bibleNotes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    const savedFavorites = localStorage.getItem('bibleFavorites');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    const savedFontSize = localStorage.getItem('bibleFontSize');
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
  }, []);

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
            userId
          );
          recordReadingSession({ userId, book, chapter });
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

  const saveNote = () => {
    if (selectedVerse && noteText.trim()) {
      const newNote: Note = { book, chapter, verse: selectedVerse, note: noteText.trim() };
      const updatedNotes = notes.filter(n => !(n.book === book && n.chapter === chapter && n.verse === selectedVerse));
      updatedNotes.push(newNote);
      setNotes(updatedNotes);
      localStorage.setItem('bibleNotes', JSON.stringify(updatedNotes));
      setNoteText('');
      setSelectedVerse(null);
    }
  };

  const deleteNote = (verse: number) => {
    const updatedNotes = notes.filter(n => !(n.book === book && n.chapter === chapter && n.verse === verse));
    setNotes(updatedNotes);
    localStorage.setItem('bibleNotes', JSON.stringify(updatedNotes));
  };

  const getVerseNote = (verse: number): Note | undefined =>
    notes.find(n => n.book === book && n.chapter === chapter && n.verse === verse);

  const toggleFavorite = (verse: BibleVerse) => {
    const existingFavorite = favorites.find(f =>
      f.book === book && f.chapter === chapter && f.verse === verse.verse && f.translation === (translation || 'web')
    );
    let updatedFavorites: FavoriteVerse[];
    if (existingFavorite) {
      updatedFavorites = favorites.filter(f =>
        !(f.book === book && f.chapter === chapter && f.verse === verse.verse && f.translation === (translation || 'web'))
      );
    } else {
      const newFavorite: FavoriteVerse = {
        book,
        chapter,
        verse: verse.verse,
        text: verse.text,
        translation: translation || 'web',
        dateAdded: new Date().toISOString()
        // DO NOT add isVerseOfTheDay here!
      };
      updatedFavorites = [...favorites, newFavorite];
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('bibleFavorites', JSON.stringify(updatedFavorites));
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
    await saveLastReading({ book, chapter, translation: translation || 'web', verse }, userId);
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
      <Card className="chapter-card overflow-hidden">
        <CardHeader className="chapter-header sticky top-12 z-20 border-b bg-white/70 dark:bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 md:px-6 py- md:py-4">
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
                          <span
                            onClick={() => handleVerseClick(v.verse)}
                            className={`cursor-pointer rounded px-0.5 transition-colors
                              hover:bg-gray-100 dark:hover:bg-gray-800
                              ${isSelected ? 'bg-blue-50/70 dark:bg-blue-950' : ''}`}
                          >
                            <sup className="mr-1 text-[10px] align-super text-gray-500">{v.verse}</sup>
                            <span dangerouslySetInnerHTML={{ __html: italicizeQuotes(v.text) }} />
                          </span>
                          {isSelected && (
                            <div
                              className="absolute left-full top-1/2 -translate-y-1/2 ml-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-6 z-50"
                              style={{ minWidth: 320 }}
                            >
                              <div className="text-lg font-medium mb-4">{book} {chapter}:{v.verse}</div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mb-4 flex items-center gap-2"
                                onClick={() => {
                                  const verseObj = verses.find(verse => verse.verse === v.verse);
                                  if (verseObj) {
                                    toggleFavorite(verseObj);
                                  }
                                }}
                              >
                                <Heart className="w-5 h-5" />
                                {isFavorite(v) ? "Favorited" : "Add to Favorites"}
                              </Button>
                              <div className="mb-2 font-medium">Notes</div>
                              <Textarea
                                id="note-textarea"
                                placeholder="Add a note about this verse..."
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                rows={3}
                                className="w-full mb-2 bg-gray-50"
                              />
                              <Button
                                className="w-full bg-gray-900 text-white mt-2"
                                onClick={saveNote}
                              >
                                Save Note
                              </Button>
                            </div>
                          )}
                        </span>
                      );
                    })}
                  </p>
                ))}
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