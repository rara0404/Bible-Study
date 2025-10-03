import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Heart, Share2 } from "lucide-react";
import { getVerse, BibleApiError } from "../services/bibleApi";

// Adapter interface to maintain compatibility
interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface VerseOfTheDayProps {
  translation?: string;
}

// Helper function to generate a consistent verse for each day
function getDayBasedSeed(): number {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  // Create a simple hash based on the date
  return year * 10000 + month * 100 + day;
}

// Popular verses for daily rotation
const popularVerses = [
  "john 3:16",
  "psalm 23:1",
  "romans 8:28",
  "jeremiah 29:11",
  "philippians 4:13",
  "psalm 46:1",
  "isaiah 41:10",
  "romans 12:2",
  "2 corinthians 5:17",
  "ephesians 2:8",
  "psalm 119:105",
  "proverbs 3:5",
  "matthew 6:26",
  "john 14:6",
  "1 corinthians 13:4",
  "psalm 27:1",
  "romans 6:23",
  "matthew 11:28",
  "1 john 4:19",
  "psalm 139:14",
  "isaiah 40:31",
  "matthew 5:16",
  "2 timothy 1:7",
  "psalm 34:8",
  "john 1:1",
  "romans 1:16",
  "galatians 2:20",
  "ephesians 6:10",
  "psalm 91:1",
  "1 peter 5:7"
];

export function VerseOfTheDay({ translation = "web" }: VerseOfTheDayProps) {
  const [verse, setVerse] = useState<BibleVerse | null>(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<BibleVerse[]>([]);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('bibleFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Get daily verse based on date
  const getDailyVerse = (): string => {
    const seed = getDayBasedSeed();
    const index = seed % popularVerses.length;
    return popularVerses[index];
  };

  const fetchDailyVerse = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dailyVerseReference = getDailyVerse();
      console.log('Fetching daily verse:', dailyVerseReference);
      
      const response = await getVerse(dailyVerseReference, translation);
      console.log('API Response:', response);
      
      if (response.verses && response.verses.length > 0) {
        const apiVerse = response.verses[0];
        const convertedVerse: BibleVerse = {
          book: response.book_name || apiVerse.book_name || "Unknown",
          chapter: apiVerse.chapter,
          verse: apiVerse.verse,
          text: apiVerse.text.trim()
        };
        
        setVerse(convertedVerse);
        
        // Check if this verse is already favorited
        const isAlreadyFavorited = favorites.some(fav => 
          fav.book === convertedVerse.book && 
          fav.chapter === convertedVerse.chapter && 
          fav.verse === convertedVerse.verse
        );
        setLiked(isAlreadyFavorited);
      } else {
        throw new Error('No verse data received from API');
      }
    } catch (err) {
      console.error('Error fetching verse of the day:', err);
      if (err instanceof BibleApiError) {
        setError(err.message);
      } else {
        setError('Failed to load verse of the day. Please try again.');
      }
      
      // Fallback verse if API fails
      setVerse({
        book: "John",
        chapter: 3,
        verse: 16,
        text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
      });
      setLiked(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyVerse();
  }, [translation]);

  // Update liked state when favorites change
  useEffect(() => {
    if (verse) {
      const isAlreadyFavorited = favorites.some(fav => 
        fav.book === verse.book && 
        fav.chapter === verse.chapter && 
        fav.verse === verse.verse
      );
      setLiked(isAlreadyFavorited);
    }
  }, [favorites, verse]);

  const toggleFavorite = () => {
    if (!verse) return;
    
    const updatedFavorites = liked 
      ? favorites.filter(fav => !(fav.book === verse.book && fav.chapter === verse.chapter && fav.verse === verse.verse))
      : [...favorites, { ...verse, translation }];
    
    setFavorites(updatedFavorites);
    setLiked(!liked);
    localStorage.setItem('bibleFavorites', JSON.stringify(updatedFavorites));
  };

  const handleShare = () => {
    if (!verse) return;
    
    const verseText = `"${verse.text}" - ${verse.book} ${verse.chapter}:${verse.verse}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Verse of the Day',
        text: verseText,
      });
    } else {
      navigator.clipboard.writeText(verseText);
    }
  };

  return (
    <TooltipProvider>
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50 border-blue-200/50 dark:border-blue-800/50">
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              Verse of the Day
            </h3>
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-3/4"></div>
              <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-1/2"></div>
              <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-1/4"></div>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDailyVerse}
                className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
              >
                Try Again
              </Button>
            </div>
          ) : verse ? (
            <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
              <blockquote className="border-l-4 border-blue-400 pl-4">
                <p className="text-lg leading-relaxed italic text-gray-700 dark:text-gray-300">
                  "{verse.text}"
                </p>
              </blockquote>
              
              <div className="flex items-center justify-between">
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                  {verse.book} {verse.chapter}:{verse.verse}
                </span>
                
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all duration-200"
                        onClick={toggleFavorite}
                      >
                        <Heart 
                          className={`w-4 h-4 transition-all duration-200 ${
                            liked ? 'fill-red-500 text-red-500' : ''
                          }`} 
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{liked ? 'Remove from favorites' : 'Add to favorites'}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                        onClick={handleShare}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy verse</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}