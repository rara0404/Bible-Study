import { useState, useEffect } from "react";
import { VerseOfTheDay } from "./components/VerseOfTheDay";
import { StreakTracker } from "./components/StreakTracker";
import { BookSelector } from "./components/BookSelector";
import { BibleReader } from "./components/BibleReader";
import { Favorites } from "./components/Favorites";
// Removed TranslationSelector import from here
// import { TranslationSelector, useTranslationSelection } from "./components/TranslationSelector";
// import { BibleTranslations } from "./services/bibleApi";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { Book, Home, BookOpen, Calendar, Flame, Moon, Sun, Heart, Menu } from "lucide-react";
import { getLastReading } from "./services/readingProgress";
import "./styles/scrollbar.css";

type ViewMode = 'home' | 'books' | 'read' | 'favorites';

const navigationItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'books', label: 'Bible', icon: Book },
  { id: 'read', label: 'Read', icon: BookOpen },
  { id: 'favorites', label: 'Favorites', icon: Heart },
] as const;

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [currentBook, setCurrentBook] = useState<string>('');
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  // If you use the TranslationSelector hook, keep using it:
  // const { selectedTranslation, handleTranslationChange } = useTranslationSelection();
  const [selectedTranslation, setSelectedTranslation] = useState<string>('web');
  const [isNavOpen, setIsNavOpen] = useState<boolean>(false);

  // If you have auth, set this to the signed-in user's id
  const userId: string | undefined = undefined;

  const resumeReading = async () => {
    const last = await getLastReading(userId);
    if (last?.book && last?.chapter) {
      setCurrentBook(last.book);
      setCurrentChapter(last.chapter);
      if (last.translation) setSelectedTranslation(last.translation);
      setViewMode('read');
      // Optionally, scroll to verse on render
      // setTimeout(() => document.querySelector(`[data-verse="${last.verse}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
    } else {
      // fallback: open book selector
      setViewMode('books');
    }
  };

  const handleBookSelect = (book: string, chapter: number) => {
    setCurrentBook(book);
    setCurrentChapter(chapter);
    setViewMode('read');
  };

  const handleNavigateToVerse = (book: string, chapter: number, verse: number) => {
    setCurrentBook(book);
    setCurrentChapter(chapter);
    setViewMode('read');

  };

  function formatAddedDate(value?: string) {
    if (!value) return 'Just now';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'Just now';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Book className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Bible Study
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Growing in faith together
                </p>
              </div>
            </div>

            {/* Right side: hamburger only (removed header translation selector) */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setIsNavOpen(v => !v)}
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                {isNavOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsNavOpen(false)}
                    />
                    {/* Align menu with main content */}
                    <div className="absolute mt-2 z-50 w-56 h-64 rounded-xl bg-white shadow-xl"
                         style={{
                           right: '1rem', // matches px-4 padding (change to '2rem' if using px-8)
                         }}>
                      <ul className="py-4 px-2">
                        {navigationItems.map(item => (
                          <li key={item.id}>
                            <button
                              className="w-full flex items-center gap-3 px-3 py-3 text-base text-gray-800 hover:bg-gray-100 rounded-xl"
                              onClick={() => {
                                if (item.id === 'read') {
                                  resumeReading();
                                } else {
                                  setViewMode(item.id as ViewMode);
                                }
                                setIsNavOpen(false);
                              }}
                            >
                              <item.icon className="w-5 h-5 text-gray-500" />
                              {item.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {viewMode === 'home' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <Card className="overflow-hidden rounded-3xl border-0 shadow-xl relative">
              <CardContent className="p-0">
                <div className="relative h-48 md:h-64 lg:h-30">
                  {/* Full-bleed image */}
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1759149784774-d113f3258cdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVuJTIwYmlibGUlMjBwZWFjZWZ1bCUyMHJlYWRpbmd8ZW58MXx8fHwxNzU5MjAwMTgwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Open Bible"
                    className="absolute inset-0 w-full h-full object-cover block"
                  />
                  {/* Full-bleed gradient overlay */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-900/70 to-purple-900/70" />
                  {/* Centered content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                      Welcome to Bible Study
                    </h2>
                    <p className="text-lg md:text-xl mb-6 opacity-90 text-white">
                      Discover God's word through daily reading and reflection
                    </p>
                    <Button 
                      size="lg"
                      onClick={() => setViewMode('books')}
                      className="bg-white text-blue-900 hover:bg-gray-100"
                    >
                      Start Reading
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                <VerseOfTheDay translation={selectedTranslation} />
                
                {/* Quick Actions */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Start</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-16 flex flex-col gap-2"
                        onClick={() => {
                          setCurrentBook('John');
                          setCurrentChapter(3);
                          setViewMode('read');
                        }}
                      >
                        <BookOpen className="w-5 h-5" />
                        <span>John 3:16</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-16 flex flex-col gap-2"
                        onClick={() => {
                          setCurrentBook('Psalms');
                          setCurrentChapter(23);
                          setViewMode('read');
                        }}
                      >
                        <BookOpen className="w-5 h-5" />
                        <span>Psalm 23</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <StreakTracker />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'books' && (
          <BookSelector 
            onSelectBook={handleBookSelect}
            currentBook={currentBook}
            currentChapter={currentChapter}
          />
        )}

        {viewMode === 'read' && currentBook && (
          <div className="relative z-0">
            {/* Removed the top "Bible Reader + Translation" toolbar */}
            <BibleReader
              book={currentBook}
              chapter={currentChapter}
              translation={selectedTranslation}
              onNavigate={(book, chapter) => {
                setCurrentBook(book);
                setCurrentChapter(chapter);
              }}
              onTranslationChange={setSelectedTranslation}
            />
          </div>
        )}

        {viewMode === 'favorites' && (
          <Favorites 
            onNavigateToVerse={handleNavigateToVerse}
          />
        )}
      </main>
    </div>
  );
}