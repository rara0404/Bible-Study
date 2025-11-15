import { useState, useEffect } from "react";
import { VerseOfTheDay } from "./components/VerseOfTheDay";
import { StreakTracker } from "./components/StreakTracker";
import { BookSelector } from "./components/BookSelector";
import { BibleReader } from "./components/BibleReader";
import { Favorites } from "./components/Favorites";
import { AuthPage } from "./components/AuthPage";
import { RegisterPage } from "./components/RegisterPage";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { AppMenu, type AppView } from "./components/AppMenu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { Book, Home, BookOpen, Calendar, Flame, Moon, Sun, Heart, Menu, LogOut } from "lucide-react";
import { getLastReading } from "./services/readingProgress";
import "./styles/scrollbar.css";

type ViewMode = 'home' | 'books' | 'read' | 'favorites';
type AuthView = 'login' | 'register';

const navigationItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'books', label: 'Books', icon: Book },
  { id: 'read', label: 'Read', icon: BookOpen },
  { id: 'favorites', label: 'Favorites', icon: Heart },
] as const;

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string>('');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [currentBook, setCurrentBook] = useState<string>('');
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [selectedTranslation, setSelectedTranslation] = useState<string>('web');
  // When navigating "Back to Chapters" from the reader, open the BookSelector directly to that book
  const [openBookName, setOpenBookName] = useState<string | undefined>(undefined);

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    
    if (storedUserId && storedUsername) {
      setUserId(parseInt(storedUserId));
      setUsername(storedUsername);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (id: number, user: string) => {
    setUserId(id);
    setUsername(user);
    setIsAuthenticated(true);
  };

  const handleRegisterSuccess = (id: number, user: string) => {
    setUserId(id);
    setUsername(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    setUserId(null);
    setUsername('');
    setIsAuthenticated(false);
    setViewMode('home');
    setAuthView('login');
  };

  const resumeReading = async () => {
    const last = await getLastReading(userId);
    if (last?.book && last?.chapter) {
      setCurrentBook(last.book);
      setCurrentChapter(last.chapter);
      if (last.translation) setSelectedTranslation(last.translation);
      setViewMode('read');
    } else {
      setViewMode('books');
    }
  };

  const handleBookSelect = (book: string, chapter: number) => {
    setCurrentBook(book);
    setCurrentChapter(chapter);
    setOpenBookName(undefined); // clear pre-open request once a chapter is selected
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

  if (!isAuthenticated) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onRegisterSuccess={handleRegisterSuccess}
          onBackToLogin={() => setAuthView('login')}
        />
      );
    }

    return (
      <AuthPage
        onLogin={handleLogin}
        onShowRegister={() => setAuthView('register')}
      />
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-6xl mx-auto px-4 py-4 relative">
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
                  {username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AppMenu
                active={viewMode as AppView}
                onNavigate={(view: AppView) => {
                  if (view === 'read') {
                    resumeReading();
                  } else {
                    setViewMode(view as ViewMode);
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Logout"
                className="hover:bg-red-100 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-5 h-5 text-red-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-2">
        {viewMode === 'home' && (
          <div className="space-y-6">
          <Card className="relative overflow-hidden shadow-xl border-0">
            <CardContent className="p-0">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1759149784774-d113f3258cdc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVuJTIwYmlibGUlMjBwZWFjZWZ1bCUyMHJlYWRpbmd8ZW58MXx8fHwxNzU5MjAwMTgwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Open Bible"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 to-purple-900/70" />
              <div className="relative z-10 flex flex-col items-center justify-center h-48 md:h-60 lg:h-72 align-items-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Welcome to Bible Study
                </h2>
                <p className="text-lg md:text-xl mb-3 opacity-90 text-white">
                  Discover God's word through daily reading and reflection
                </p>
                <Button
                  size="lg"
                  onClick={() => setViewMode('books')}
                  className="bg-white text-blue-900 hover:bg-gray-100 "
                >
                  Start Reading
                </Button>
              </div>
            </CardContent>
          </Card>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <VerseOfTheDay translation={selectedTranslation} />
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
                <StreakTracker userId={userId ?? undefined} />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'books' && (
          <BookSelector 
            onSelectBook={handleBookSelect}
            currentBook={currentBook}
            currentChapter={currentChapter}
            openBookName={openBookName}
          />
        )}

        {viewMode === 'read' && currentBook && (
          <div className="relative z-0">
            <BibleReader
              book={currentBook}
              chapter={currentChapter}
              translation={selectedTranslation}
              userId={userId ?? undefined}
              onNavigate={(book, chapter) => {
                // Special signal: chapter 0 means "go to this book's chapters list"
                if (chapter === 0) {
                  setCurrentBook(book);
                  setOpenBookName(book);
                  setViewMode('books');
                  return;
                }
                setCurrentBook(book);
                setCurrentChapter(chapter);
              }}
              onTranslationChange={setSelectedTranslation}
            />
          </div>
        )}

        {viewMode === 'favorites' && (
          <Favorites 
            userId={userId ?? undefined}
            onNavigateToVerse={handleNavigateToVerse}
          />
        )}
      </main>
    </div>
  );
}