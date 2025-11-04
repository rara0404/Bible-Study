import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Heart, BookOpen, Trash2, Search } from "lucide-react";

interface FavoriteVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  dateAdded: string;
}

interface FavoritesProps {
  onNavigateToVerse?: (book: string, chapter: number, verse: number) => void;
}

export function Favorites({ onNavigateToVerse }: FavoritesProps) {
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedFavorites = localStorage.getItem('bibleFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const removeFavorite = (favorite: FavoriteVerse) => {
    const updatedFavorites = favorites.filter((f: FavoriteVerse) => 
      !(f.book === favorite.book && f.chapter === favorite.chapter && f.verse === favorite.verse && f.translation === favorite.translation)
    );
    setFavorites(updatedFavorites);
    localStorage.setItem('bibleFavorites', JSON.stringify(updatedFavorites));
  };

  const filteredFavorites = favorites
    .filter((favorite: FavoriteVerse) => 
      favorite.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      favorite.book.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const groupedFavorites = filteredFavorites.reduce((groups: Record<string, FavoriteVerse[]>, favorite) => {
    const key = `${favorite.book} ${favorite.chapter}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(favorite);
    return groups;
  }, {});

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (filteredFavorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No Favorite Verses Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Start adding verses to your favorites by clicking the heart icon next to any verse while reading.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Favorite Verses
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredFavorites.length} verse{filteredFavorites.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search favorites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {Object.keys(groupedFavorites).length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No favorites match your search.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFavorites).map(([chapter, chapterFavorites]) => (
            <Card key={chapter}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  {chapter}
                  <Badge variant="secondary" className="ml-auto">
                    {chapterFavorites.length} verse{chapterFavorites.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {chapterFavorites
                  .sort((a, b) => a.verse - b.verse)
                  .map((favorite) => (
                    <div 
                      key={`${favorite.book}-${favorite.chapter}-${favorite.verse}-${favorite.translation}`}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 transition-colors group"
                    >
                      <div className="flex gap-4">
                        <Badge variant="outline" className="flex-shrink-0 h-6">
                          {favorite.verse}
                        </Badge>
                        <div className="flex-1">
                          <p className="leading-relaxed text-gray-900 dark:text-gray-100 mb-2">
                            {favorite.text}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">
                                {favorite.translation.toUpperCase()}
                              </span>
                              <span>
                                Added {formatDate(favorite.dateAdded)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {onNavigateToVerse && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onNavigateToVerse(favorite.book, favorite.chapter, favorite.verse)}
                                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <BookOpen className="w-4 h-4 mr-1" />
                                  Read
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFavorite(favorite)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}