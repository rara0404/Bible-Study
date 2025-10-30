import { useState, useEffect } from "react";
import type { MouseEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { getChapter, getBookId, BibleApiError, type BibleVerse as ApiBibleVerse } from "../services/bibleApi";
import { BookOpen, StickyNote, ChevronLeft, ChevronRight, Type, Minus, Plus, AlertCircle, Heart } from "lucide-react";
import "./BibleReader.css";

// Adapter interface to maintain compatibility
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

// Helper function to clean verse text and remove unwanted formatting
function cleanVerseText(text: string): string {
  return text
    .replace(/\bunrefined\b/gi, '') // Remove 'unrefined' text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing whitespace
}

export function BibleReader({ book, chapter, translation, onNavigate }: BibleReaderProps) {
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedNotes = localStorage.getItem('bibleNotes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
    
    const savedFavorites = localStorage.getItem('bibleFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    
    const savedFontSize = localStorage.getItem('bibleFontSize');
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize));
    }
  }, []);

  useEffect(() => {
    const fetchChapterData = async () => {
      setLoading(true);
      setError(null);
      setSelectedVerse(null);
      setNoteText('');

      try {
        const bookId = getBookId(book);
        if (!bookId) {
          throw new Error(`Unknown book: ${book}`);
        }

        const response = await getChapter(bookId, chapter, translation);
        
        // Convert API response to our local format
        const convertedVerses: BibleVerse[] = response.verses.map((apiVerse: ApiBibleVerse) => ({
          book: apiVerse.book_name,
          chapter: apiVerse.chapter,
          verse: apiVerse.verse,
          text: cleanVerseText(apiVerse.text.trim()) // Clean and remove unwanted formatting
        }));

        setVerses(convertedVerses);
      } catch (err) {
        if (err instanceof BibleApiError) {
          setError(err.message);
        } else {
          setError('Failed to load chapter. Please try again.');
        }
        console.error('Error fetching chapter:', err);
        setVerses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [book, chapter, translation]);

  const saveNote = () => {
    if (selectedVerse && noteText.trim()) {
      const newNote: Note = {
        book,
        chapter,
        verse: selectedVerse,
        note: noteText.trim()
      };

      const updatedNotes = notes.filter(
        (n: Note) => !(n.book === book && n.chapter === chapter && n.verse === selectedVerse)
      );
      updatedNotes.push(newNote);

      setNotes(updatedNotes);
      localStorage.setItem('bibleNotes', JSON.stringify(updatedNotes));
      setNoteText('');
      setSelectedVerse(null);
    }
  };

  const deleteNote = (verse: number) => {
    const updatedNotes = notes.filter(
      (n: Note) => !(n.book === book && n.chapter === chapter && n.verse === verse)
    );
    setNotes(updatedNotes);
    localStorage.setItem('bibleNotes', JSON.stringify(updatedNotes));
  };

  const getVerseNote = (verse: number): Note | undefined => {
    return notes.find((n: Note) => n.book === book && n.chapter === chapter && n.verse === verse);
  };

  const toggleFavorite = (verse: BibleVerse) => {
    const existingFavorite = favorites.find((f: FavoriteVerse) => 
      f.book === book && f.chapter === chapter && f.verse === verse.verse && f.translation === (translation || 'web')
    );

    let updatedFavorites: FavoriteVerse[];
    
    if (existingFavorite) {
      // Remove from favorites
      updatedFavorites = favorites.filter((f: FavoriteVerse) => 
        !(f.book === book && f.chapter === chapter && f.verse === verse.verse && f.translation === (translation || 'web'))
      );
    } else {
      // Add to favorites
      const newFavorite: FavoriteVerse = {
        book: book, // Use the book prop instead of verse.book
        chapter: chapter, // Use the chapter prop instead of verse.chapter
        verse: verse.verse,
        text: verse.text,
        translation: translation || 'web',
        dateAdded: new Date().toISOString()
      };
      updatedFavorites = [...favorites, newFavorite];
    }
    
    setFavorites(updatedFavorites);
    localStorage.setItem('bibleFavorites', JSON.stringify(updatedFavorites));
  };

  const isFavorite = (verse: BibleVerse): boolean => {
    return favorites.some((f: FavoriteVerse) => 
      f.book === book && f.chapter === chapter && f.verse === verse.verse && f.translation === (translation || 'web')
    );
  };

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 24);
    setFontSize(newSize);
    localStorage.setItem('bibleFontSize', newSize.toString());
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 12);
    setFontSize(newSize);
    localStorage.setItem('bibleFontSize', newSize.toString());
  };

  const handleVerseClick = (verse: number) => {
    if (selectedVerse === verse) {
      setSelectedVerse(null);
      setNoteText('');
    } else {
      setSelectedVerse(verse);
      const existingNote = getVerseNote(verse);
      setNoteText(existingNote?.note || '');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {book} Chapter {chapter}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={decreaseFontSize}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1 px-2">
                  <Type className="w-4 h-4" />
                  <span className="text-sm font-medium">{fontSize}px</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={increaseFontSize}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate(book, Math.max(1, chapter - 1))}
                disabled={chapter <= 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate(book, chapter + 1)}
                disabled={loading}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
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
                      // Trigger refetch by calling the effect
                      const fetchChapterData = async () => {
                        setLoading(true);
                        try {
                          const response = await getChapter(bookId, chapter);
                          const convertedVerses: BibleVerse[] = response.verses.map((apiVerse: ApiBibleVerse) => ({
                            book: apiVerse.book_name,
                            chapter: apiVerse.chapter,
                            verse: apiVerse.verse,
                            text: apiVerse.text.trim()
                          }));
                          setVerses(convertedVerses);
                        } catch (err) {
                          if (err instanceof BibleApiError) {
                            setError(err.message);
                          } else {
                            setError('Failed to load chapter. Please try again.');
                          }
                        } finally {
                          setLoading(false);
                        }
                      };
                      fetchChapterData();
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
            <>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex gap-4">
                    <Skeleton className="h-6 w-8 rounded" />
                    <Skeleton className="h-16 flex-1" />
                  </div>
                ))}
              </div>

              <div 
                className={`space-y-4 bible-font-${fontSize}`}
              >
                {verses.map((verse: BibleVerse) => {
                  const hasNote = getVerseNote(verse.verse);
                  const isSelected = selectedVerse === verse.verse;
                  const isFav = isFavorite(verse);
                  
                  return (
                    <div key={verse.verse} className="space-y-2">
                      <div
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800' 
                            : hasNote
                            ? 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => handleVerseClick(verse.verse)}
                      >
                        <div className="flex gap-4">
                          <Badge variant="outline" className="flex-shrink-0 h-6">
                            {verse.verse}
                          </Badge>
                          <p className="leading-relaxed flex-1">
                            {verse.text}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(verse);
                              }}
                              className={`p-1 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                isFav ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-400'
                              }`}
                              title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                            </button>
                            {hasNote && (
                              <StickyNote className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {hasNote && !isSelected && (
                        <div className="ml-12 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 italic">
                              "{hasNote.note}"
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e: any) => {
                                e.stopPropagation();
                                deleteNote(verse.verse);
                              }}
                              className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 h-6 w-6 p-0"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : !error && (
            <div className="text-center py-8 text-gray-500">
              No verses found for this chapter.
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVerse && (
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <StickyNote className="w-5 h-5" />
              Add Note to {book} {chapter}:{selectedVerse}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Write your thoughts, reflections, or study notes here..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={saveNote} disabled={!noteText.trim()}>
                Save Note
              </Button>
              <Button variant="outline" onClick={() => {
                setSelectedVerse(null);
                setNoteText('');
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}