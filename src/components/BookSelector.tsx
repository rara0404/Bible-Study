import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { bibleBooks, BibleBook } from "./bible-data";
import { Book, Search } from "lucide-react";

interface BookSelectorProps {
  onSelectBook: (book: string, chapter: number) => void;
  currentBook?: string;
  currentChapter?: number;
}

export function BookSelector({ onSelectBook, currentBook, currentChapter }: BookSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);

  const filteredBooks = bibleBooks.filter(book =>
    book.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const oldTestamentBooks = filteredBooks.filter(book => book.testament === 'Old');
  const newTestamentBooks = filteredBooks.filter(book => book.testament === 'New');

  const handleBookSelect = (book: BibleBook) => {
    setSelectedBook(book);
  };

  const handleChapterSelect = (chapter: number) => {
    if (selectedBook) {
      onSelectBook(selectedBook.name, chapter);
      setSelectedBook(null);
    }
  };

  if (selectedBook) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Book className="w-5 h-5" />
              {selectedBook.name} - Select Chapter
            </CardTitle>
            <Button variant="outline" onClick={() => setSelectedBook(null)}>
              ← Back to Books
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(chapter => (
              <Button
                key={chapter}
                variant={currentBook === selectedBook.name && currentChapter === chapter ? "default" : "outline"}
                size="sm"
                onClick={() => handleChapterSelect(chapter)}
                className="aspect-square"
              >
                {chapter}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="w-5 h-5" />
          Choose a Book
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {oldTestamentBooks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Old Testament
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {oldTestamentBooks.map(book => (
                <Button
                  key={book.name}
                  variant={currentBook === book.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleBookSelect(book)}
                  className="justify-start text-left h-auto py-3"
                >
                  <div>
                    <div className="font-medium">{book.name}</div>
                    <div className="text-xs text-gray-500">
                      {book.chapters} chapters
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {newTestamentBooks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                New Testament
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {newTestamentBooks.map(book => (
                <Button
                  key={book.name}
                  variant={currentBook === book.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleBookSelect(book)}
                  className="justify-start text-left h-auto py-3"
                >
                  <div>
                    <div className="font-medium">{book.name}</div>
                    <div className="text-xs text-gray-500">
                      {book.chapters} chapters
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {filteredBooks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No books found matching "{searchTerm}"
          </div>
        )}
      </CardContent>
    </Card>
  );
}