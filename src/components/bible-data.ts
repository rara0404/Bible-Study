// Bible data interface and API integration
// Now using real Bible API from bible-api.com

import { getRandomVerse, getBooks, BibleApiError, type BibleVerse as ApiBibleVerse } from "../services/bibleApi";

// Compatibility interface for existing components
export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleBook {
  name: string;
  shortName: string;
  chapters: number;
  testament: 'Old' | 'New';
}

// Enhanced book data with API integration
export const bibleBooks: BibleBook[] = [
  // Old Testament
  { name: 'Genesis', shortName: 'Gen', chapters: 50, testament: 'Old' },
  { name: 'Exodus', shortName: 'Exod', chapters: 40, testament: 'Old' },
  { name: 'Leviticus', shortName: 'Lev', chapters: 27, testament: 'Old' },
  { name: 'Numbers', shortName: 'Num', chapters: 36, testament: 'Old' },
  { name: 'Deuteronomy', shortName: 'Deut', chapters: 34, testament: 'Old' },
  { name: 'Joshua', shortName: 'Josh', chapters: 24, testament: 'Old' },
  { name: 'Judges', shortName: 'Judg', chapters: 21, testament: 'Old' },
  { name: 'Ruth', shortName: 'Ruth', chapters: 4, testament: 'Old' },
  { name: '1 Samuel', shortName: '1 Sam', chapters: 31, testament: 'Old' },
  { name: '2 Samuel', shortName: '2 Sam', chapters: 24, testament: 'Old' },
  { name: '1 Kings', shortName: '1 Kgs', chapters: 22, testament: 'Old' },
  { name: '2 Kings', shortName: '2 Kgs', chapters: 25, testament: 'Old' },
  { name: '1 Chronicles', shortName: '1 Chr', chapters: 29, testament: 'Old' },
  { name: '2 Chronicles', shortName: '2 Chr', chapters: 36, testament: 'Old' },
  { name: 'Ezra', shortName: 'Ezra', chapters: 10, testament: 'Old' },
  { name: 'Nehemiah', shortName: 'Neh', chapters: 13, testament: 'Old' },
  { name: 'Esther', shortName: 'Esth', chapters: 10, testament: 'Old' },
  { name: 'Job', shortName: 'Job', chapters: 42, testament: 'Old' },
  { name: 'Psalms', shortName: 'Ps', chapters: 150, testament: 'Old' },
  { name: 'Proverbs', shortName: 'Prov', chapters: 31, testament: 'Old' },
  { name: 'Ecclesiastes', shortName: 'Eccl', chapters: 12, testament: 'Old' },
  { name: 'Song of Songs', shortName: 'Song', chapters: 8, testament: 'Old' },
  { name: 'Isaiah', shortName: 'Isa', chapters: 66, testament: 'Old' },
  { name: 'Jeremiah', shortName: 'Jer', chapters: 52, testament: 'Old' },
  { name: 'Lamentations', shortName: 'Lam', chapters: 5, testament: 'Old' },
  { name: 'Ezekiel', shortName: 'Ezek', chapters: 48, testament: 'Old' },
  { name: 'Daniel', shortName: 'Dan', chapters: 12, testament: 'Old' },
  { name: 'Hosea', shortName: 'Hos', chapters: 14, testament: 'Old' },
  { name: 'Joel', shortName: 'Joel', chapters: 3, testament: 'Old' },
  { name: 'Amos', shortName: 'Amos', chapters: 9, testament: 'Old' },
  { name: 'Obadiah', shortName: 'Obad', chapters: 1, testament: 'Old' },
  { name: 'Jonah', shortName: 'Jonah', chapters: 4, testament: 'Old' },
  { name: 'Micah', shortName: 'Mic', chapters: 7, testament: 'Old' },
  { name: 'Nahum', shortName: 'Nah', chapters: 3, testament: 'Old' },
  { name: 'Habakkuk', shortName: 'Hab', chapters: 3, testament: 'Old' },
  { name: 'Zephaniah', shortName: 'Zeph', chapters: 3, testament: 'Old' },
  { name: 'Haggai', shortName: 'Hag', chapters: 2, testament: 'Old' },
  { name: 'Zechariah', shortName: 'Zech', chapters: 14, testament: 'Old' },
  { name: 'Malachi', shortName: 'Mal', chapters: 4, testament: 'Old' },
  
  // New Testament
  { name: 'Matthew', shortName: 'Matt', chapters: 28, testament: 'New' },
  { name: 'Mark', shortName: 'Mark', chapters: 16, testament: 'New' },
  { name: 'Luke', shortName: 'Luke', chapters: 24, testament: 'New' },
  { name: 'John', shortName: 'John', chapters: 21, testament: 'New' },
  { name: 'Acts', shortName: 'Acts', chapters: 28, testament: 'New' },
  { name: 'Romans', shortName: 'Rom', chapters: 16, testament: 'New' },
  { name: '1 Corinthians', shortName: '1 Cor', chapters: 16, testament: 'New' },
  { name: '2 Corinthians', shortName: '2 Cor', chapters: 13, testament: 'New' },
  { name: 'Galatians', shortName: 'Gal', chapters: 6, testament: 'New' },
  { name: 'Ephesians', shortName: 'Eph', chapters: 6, testament: 'New' },
  { name: 'Philippians', shortName: 'Phil', chapters: 4, testament: 'New' },
  { name: 'Colossians', shortName: 'Col', chapters: 4, testament: 'New' },
  { name: '1 Thessalonians', shortName: '1 Thess', chapters: 5, testament: 'New' },
  { name: '2 Thessalonians', shortName: '2 Thess', chapters: 3, testament: 'New' },
  { name: '1 Timothy', shortName: '1 Tim', chapters: 6, testament: 'New' },
  { name: '2 Timothy', shortName: '2 Tim', chapters: 4, testament: 'New' },
  { name: 'Titus', shortName: 'Titus', chapters: 3, testament: 'New' },
  { name: 'Philemon', shortName: 'Phlm', chapters: 1, testament: 'New' },
  { name: 'Hebrews', shortName: 'Heb', chapters: 13, testament: 'New' },
  { name: 'James', shortName: 'Jas', chapters: 5, testament: 'New' },
  { name: '1 Peter', shortName: '1 Pet', chapters: 5, testament: 'New' },
  { name: '2 Peter', shortName: '2 Pet', chapters: 3, testament: 'New' },
  { name: '1 John', shortName: '1 John', chapters: 5, testament: 'New' },
  { name: '2 John', shortName: '2 John', chapters: 1, testament: 'New' },
  { name: '3 John', shortName: '3 John', chapters: 1, testament: 'New' },
  { name: 'Jude', shortName: 'Jude', chapters: 1, testament: 'New' },
  { name: 'Revelation', shortName: 'Rev', chapters: 22, testament: 'New' },
];

// Fallback verses for when API is not available
const fallbackVerses: BibleVerse[] = [
  {
    book: 'John',
    chapter: 3,
    verse: 16,
    text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'
  },
  {
    book: 'Psalms',
    chapter: 23,
    verse: 1,
    text: 'The Lord is my shepherd, I lack nothing.'
  },
  {
    book: 'Proverbs',
    chapter: 3,
    verse: 5,
    text: 'Trust in the Lord with all your heart and lean not on your own understanding.'
  },
  {
    book: 'Romans',
    chapter: 8,
    verse: 28,
    text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.'
  },
  {
    book: 'Matthew',
    chapter: 11,
    verse: 28,
    text: 'Come to me, all you who are weary and burdened, and I will give you rest.'
  },
  {
    book: 'Philippians',
    chapter: 4,
    verse: 13,
    text: 'I can do all this through him who gives me strength.'
  }
];

/**
 * Get verse of the day using API or fallback
 * Attempts to fetch from API first, falls back to predetermined verses
 */
export const getVerseOfTheDay = async (): Promise<BibleVerse> => {
  try {
    const response = await getRandomVerse();
    const apiVerse = response.random_verse;
    
    return {
      book: apiVerse.book_name,
      chapter: apiVerse.chapter,
      verse: apiVerse.verse,
      text: apiVerse.text.trim()
    };
  } catch (error) {
    console.warn('Failed to fetch verse of the day from API, using fallback:', error);
    
    // Use fallback based on day of year for consistency
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return fallbackVerses[dayOfYear % fallbackVerses.length];
  }
};

/**
 * Synchronous version for backward compatibility
 * Returns a fallback verse immediately
 */
export const getVerseOfTheDaySync = (): BibleVerse => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return fallbackVerses[dayOfYear % fallbackVerses.length];
};

/**
 * Mock chapter data function for backward compatibility
 * This function is now deprecated - components should use the API directly
 * @deprecated Use getChapter from bibleApi.ts instead
 */
export const getChapterVerses = (book: string, chapter: number): BibleVerse[] => {
  console.warn('getChapterVerses is deprecated. Use getChapter from bibleApi.ts instead.');
  
  // Return fallback data for common chapters
  if (book === 'John' && chapter === 3) {
    return [
      { book: 'John', chapter: 3, verse: 16, text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
      { book: 'John', chapter: 3, verse: 17, text: 'For God did not send his Son into the world to condemn the world, but to save the world through him.' },
    ];
  }
  
  if (book === 'Psalms' && chapter === 23) {
    return [
      { book: 'Psalms', chapter: 23, verse: 1, text: 'The Lord is my shepherd, I lack nothing.' },
      { book: 'Psalms', chapter: 23, verse: 2, text: 'He makes me lie down in green pastures, he leads me beside quiet waters,' },
      { book: 'Psalms', chapter: 23, verse: 3, text: 'he refreshes my soul. He guides me along the right paths for his name\'s sake.' },
    ];
  }
  
  // Generate sample verses for other chapters
  const mockVerses: BibleVerse[] = [];
  for (let i = 1; i <= 10; i++) {
    mockVerses.push({
      book,
      chapter,
      verse: i,
      text: `This is verse ${i} of ${book} chapter ${chapter}. Please use the real API for actual content.`
    });
  }
  
  return mockVerses;
};

/**
 * Initialize book data from API
 * Fetches real book information and updates the local cache
 */
export const initializeBooksFromApi = async (): Promise<void> => {
  try {
    const response = await getBooks();
    console.log('Successfully loaded books from Bible API:', response.books.length, 'books');
    
    // You could update the bibleBooks array here if needed
    // For now, we keep the static data for consistency
  } catch (error) {
    console.warn('Failed to load books from API, using static data:', error);
  }
};