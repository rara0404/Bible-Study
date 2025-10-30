// Bible API Service for interacting with bible-api.com
// Documentation: https://bible-api.com/
// GitHub: https://github.com/seven1m/bible_api

const BASE_URL = 'https://bible-api.com';

// Rate limiting: 15 requests per 30 seconds per IP
// We'll implement a simple rate limiter to be respectful
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 15;
  private readonly timeWindow = 30000; // 30 seconds

  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Remove requests older than the time window
    this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindow);
    
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }
}

const rateLimiter = new RateLimiter();

// TypeScript interfaces for Bible API responses
export interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleTranslation {
  identifier: string;
  name: string;
  language: string;
  language_code?: string;
  license: string;
}

export interface BibleBook {
  id: string;
  name: string;
  url: string;
}

export interface BibleChapter {
  book_id: string;
  book: string;
  chapter: number;
  url: string;
}

// User Input API Response (e.g., /john+3:16)
export interface UserInputApiResponse {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

// Parameterized API Responses
export interface TranslationsResponse {
  translations: (BibleTranslation & { url: string })[];
}

export interface BooksResponse {
  translation: BibleTranslation;
  books: BibleBook[];
}

export interface ChaptersResponse {
  translation: BibleTranslation;
  chapters: BibleChapter[];
}

export interface ChapterVersesResponse {
  translation: BibleTranslation;
  verses: BibleVerse[];
}

export interface RandomVerseResponse {
  translation: BibleTranslation;
  random_verse: BibleVerse;
}

// Error types
export class BibleApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'BibleApiError';
  }
}

export class RateLimitError extends BibleApiError {
  constructor() {
    super('Rate limit exceeded. Please wait before making more requests.', 429);
    this.name = 'RateLimitError';
  }
}

// Generic API request function with error handling
async function apiRequest<T>(url: string): Promise<T> {
  // Check rate limit
  if (!rateLimiter.canMakeRequest()) {
    throw new RateLimitError();
  }

  try {
    rateLimiter.recordRequest();
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new BibleApiError('Resource not found', 404);
      }
      throw new BibleApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof BibleApiError) {
      throw error;
    }
    throw new BibleApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Main API functions

/**
 * Get a verse or passage using natural language input
 * Examples: "john 3:16", "matt 25:31-33,46", "ps 23"
 */
export async function getVerse(
  reference: string,
  translation?: string
): Promise<UserInputApiResponse> {
  const encodedRef = encodeURIComponent(reference.replace(/\s+/g, '+'));
  const translationId = translation || getDefaultTranslation().identifier;
  const params = `?translation=${translationId}`;
  const url = `${BASE_URL}/${encodedRef}${params}`;
  
  return apiRequest<UserInputApiResponse>(url);
}

/**
 * Get a specific chapter using book ID
 */
export async function getChapter(
  bookId: string,
  chapter: number,
  translation?: string
): Promise<ChapterVersesResponse> {
  const translationId = translation || getDefaultTranslation().identifier;
  const url = `${BASE_URL}/data/${translationId}/${bookId.toUpperCase()}/${chapter}`;
  return apiRequest<ChapterVersesResponse>(url);
}

/**
 * Get all available translations
 */
export async function getTranslations(): Promise<TranslationsResponse> {
  const url = `${BASE_URL}/data`;
  return apiRequest<TranslationsResponse>(url);
}

/**
 * Get all books for a specific translation
 */
export async function getBooks(translation?: string): Promise<BooksResponse> {
  const translationId = translation || getDefaultTranslation().identifier;
  const url = `${BASE_URL}/data/${translationId}`;
  return apiRequest<BooksResponse>(url);
}

/**
 * Get all chapters for a specific book
 */
export async function getChapters(
  bookId: string,
  translation?: string
): Promise<ChaptersResponse> {
  const translationId = translation || getDefaultTranslation().identifier;
  const url = `${BASE_URL}/data/${translationId}/${bookId.toUpperCase()}`;
  return apiRequest<ChaptersResponse>(url);
}

/**
 * Get a random verse
 */
export async function getRandomVerse(
  translation?: string
): Promise<RandomVerseResponse> {
  const translationId = translation || getDefaultTranslation().identifier;
  const url = `${BASE_URL}/data/${translationId}/random`;
  return apiRequest<RandomVerseResponse>(url);
}

/**
 * Get a random verse from specific books
 * bookIds can be book IDs like ['JHN', 'MAT'] or special values ['OT', 'NT']
 */
export async function getRandomVerseFromBooks(
  bookIds: string[],
  translation?: string
): Promise<RandomVerseResponse> {
  const translationId = translation || getDefaultTranslation().identifier;
  const books = bookIds.join(',');
  const url = `${BASE_URL}/data/${translationId}/random/${books}`;
  return apiRequest<RandomVerseResponse>(url);
}

/**
 * Validate if a translation identifier is supported
 */
export function isValidTranslation(identifier: string): boolean {
  return Object.values(BibleTranslations).some(t => t.identifier === identifier);
}

/**
 * Get suggested verses for specific occasions or themes
 */
export async function getThematicVerse(
  theme: 'encouragement' | 'peace' | 'love' | 'faith' | 'hope' | 'wisdom',
  translation?: string
): Promise<RandomVerseResponse> {
  const translationId = translation || getDefaultTranslation().identifier;
  
  // Define book sets for different themes
  const themeBooks: Record<string, string[]> = {
    encouragement: ['PHP', 'ROM', 'ISA'],
    peace: ['PSA', 'JHN', 'PHP'],
    love: ['1CO', '1JN', 'JHN'],
    faith: ['HEB', 'ROM', 'JAS'],
    hope: ['ROM', 'PSA', 'JER'],
    wisdom: ['PRO', 'JAS', 'ECC']
  };
  
  const books = themeBooks[theme] || ['PSA', 'PRO', 'JHN'];
  return getRandomVerseFromBooks(books, translationId);
}

// Available Bible translations from bible-api.com
export interface TranslationInfo {
  identifier: string;
  name: string;
  language: string;
  license: string;
  description: string;
  default?: boolean;
}

export const BibleTranslations: Record<string, TranslationInfo> = {
  // English translations
  WEB: {
    identifier: 'web',
    name: 'World English Bible',
    language: 'English',
    license: 'Public Domain',
    description: 'Default translation, modern English',
    default: true
  },
  KJV: {
    identifier: 'kjv',
    name: 'King James Version',
    language: 'English',
    license: 'Public Domain',
    description: 'Classic 1611 translation'
  },
  ASV: {
    identifier: 'asv',
    name: 'American Standard Version (1901)',
    language: 'English',
    license: 'Public Domain',
    description: 'Early 20th century American revision'
  },
  BBE: {
    identifier: 'bbe',
    name: 'Bible in Basic English',
    language: 'English',
    license: 'Public Domain',
    description: 'Simplified English vocabulary'
  },
  DARBY: {
    identifier: 'darby',
    name: 'Darby Bible',
    language: 'English',
    license: 'Public Domain',
    description: 'J.N. Darby translation'
  },
  DRA: {
    identifier: 'dra',
    name: 'Douay-Rheims 1899 American Edition',
    language: 'English',
    license: 'Public Domain',
    description: 'Catholic translation'
  },
  YLT: {
    identifier: 'ylt',
    name: 'Young\'s Literal Translation (NT only)',
    language: 'English',
    license: 'Public Domain',
    description: 'Literal translation, New Testament only'
  },
  
  // English regional variants
  WEBBE: {
    identifier: 'webbe',
    name: 'World English Bible, British Edition',
    language: 'English (UK)',
    license: 'Public Domain',
    description: 'British spelling and terminology'
  },
  OEB_CW: {
    identifier: 'oeb-cw',
    name: 'Open English Bible, Commonwealth Edition',
    language: 'English (UK)',
    license: 'Public Domain',
    description: 'Commonwealth English'
  },
  OEB_US: {
    identifier: 'oeb-us',
    name: 'Open English Bible, US Edition',
    language: 'English (US)',
    license: 'Public Domain',
    description: 'American English'
  },
  
  // Other languages
  CHEROKEE: {
    identifier: 'cherokee',
    name: 'Cherokee New Testament',
    language: 'Cherokee',
    license: 'Public Domain',
    description: 'New Testament in Cherokee language'
  },
  CUV: {
    identifier: 'cuv',
    name: 'Chinese Union Version',
    language: 'Chinese',
    license: 'Public Domain',
    description: 'Traditional Chinese Bible'
  },
  BKR: {
    identifier: 'bkr',
    name: 'Bible kralická',
    language: 'Czech',
    license: 'Public Domain',
    description: 'Historic Czech Bible translation'
  },
  CLEMENTINE: {
    identifier: 'clementine',
    name: 'Clementine Latin Vulgate',
    language: 'Latin',
    license: 'Public Domain',
    description: 'Official Catholic Latin Bible'
  },
  ALMEIDA: {
    identifier: 'almeida',
    name: 'João Ferreira de Almeida',
    language: 'Portuguese',
    license: 'Public Domain',
    description: 'Classic Portuguese translation'
  },
  RCCV: {
    identifier: 'rccv',
    name: 'Protestant Romanian Corrected Cornilescu Version',
    language: 'Romanian',
    license: 'Public Domain',
    description: 'Romanian Protestant Bible'
  },
  SYNODAL: {
    identifier: 'synodal',
    name: 'Russian Synodal Translation',
    language: 'Russian',
    license: 'Public Domain',
    description: 'Official Russian Orthodox translation'
  }
} as const;

// Helper to get all translations as an array
export const getAllTranslations = (): TranslationInfo[] => {
  return Object.values(BibleTranslations);
};

// Helper to get translations by language
export const getTranslationsByLanguage = (language: string): TranslationInfo[] => {
  return Object.values(BibleTranslations).filter(t => t.language === language);
};

// Helper to get translation by identifier
export const getTranslationInfo = (identifier: string): TranslationInfo | undefined => {
  return Object.values(BibleTranslations).find(t => t.identifier === identifier);
};

// Helper to get default translation
export const getDefaultTranslation = (): TranslationInfo => {
  return BibleTranslations.WEB;
};

// Utility functions for common Bible references
export const BibleBookIds = {
  // Old Testament
  GENESIS: 'GEN',
  EXODUS: 'EXO',
  LEVITICUS: 'LEV',
  NUMBERS: 'NUM',
  DEUTERONOMY: 'DEU',
  JOSHUA: 'JOS',
  JUDGES: 'JDG',
  RUTH: 'RUT',
  '1_SAMUEL': '1SA',
  '2_SAMUEL': '2SA',
  '1_KINGS': '1KI',
  '2_KINGS': '2KI',
  '1_CHRONICLES': '1CH',
  '2_CHRONICLES': '2CH',
  EZRA: 'EZR',
  NEHEMIAH: 'NEH',
  ESTHER: 'EST',
  JOB: 'JOB',
  PSALMS: 'PSA',
  PROVERBS: 'PRO',
  ECCLESIASTES: 'ECC',
  SONG_OF_SONGS: 'SNG',
  ISAIAH: 'ISA',
  JEREMIAH: 'JER',
  LAMENTATIONS: 'LAM',
  EZEKIEL: 'EZK',
  DANIEL: 'DAN',
  HOSEA: 'HOS',
  JOEL: 'JOL',
  AMOS: 'AMO',
  OBADIAH: 'OBA',
  JONAH: 'JON',
  MICAH: 'MIC',
  NAHUM: 'NAM',
  HABAKKUK: 'HAB',
  ZEPHANIAH: 'ZEP',
  HAGGAI: 'HAG',
  ZECHARIAH: 'ZEC',
  MALACHI: 'MAL',
  
  // New Testament
  MATTHEW: 'MAT',
  MARK: 'MRK',
  LUKE: 'LUK',
  JOHN: 'JHN',
  ACTS: 'ACT',
  ROMANS: 'ROM',
  '1_CORINTHIANS': '1CO',
  '2_CORINTHIANS': '2CO',
  GALATIANS: 'GAL',
  EPHESIANS: 'EPH',
  PHILIPPIANS: 'PHP',
  COLOSSIANS: 'COL',
  '1_THESSALONIANS': '1TH',
  '2_THESSALONIANS': '2TH',
  '1_TIMOTHY': '1TI',
  '2_TIMOTHY': '2TI',
  TITUS: 'TIT',
  PHILEMON: 'PHM',
  HEBREWS: 'HEB',
  JAMES: 'JAS',
  '1_PETER': '1PE',
  '2_PETER': '2PE',
  '1_JOHN': '1JN',
  '2_JOHN': '2JN',
  '3_JOHN': '3JN',
  JUDE: 'JUD',
  REVELATION: 'REV'
} as const;

// Helper to convert book names to IDs
export function getBookId(bookName: string): string | null {
  const normalizedName = bookName.toLowerCase().replace(/\s+/g, '_');
  
  // Common mappings
  const nameToId: Record<string, string> = {
    // Old Testament
    'genesis': 'GEN',
    'gen': 'GEN',
    'exodus': 'EXO',
    'exod': 'EXO',
    'exo': 'EXO',
    'leviticus': 'LEV',
    'lev': 'LEV',
    'numbers': 'NUM',
    'num': 'NUM',
    'deuteronomy': 'DEU',
    'deut': 'DEU',
    'deu': 'DEU',
    'joshua': 'JOS',
    'josh': 'JOS',
    'jos': 'JOS',
    'judges': 'JDG',
    'judg': 'JDG',
    'jdg': 'JDG',
    'ruth': 'RUT',
    '1_samuel': '1SA',
    '1_sam': '1SA',
    '1sa': '1SA',
    '1_chronicles': '1CH',
    '1_chr': '1CH',
    '1ch': '1CH',
    '1_chron': '1CH',
    '2_samuel': '2SA',
    '2_sam': '2SA',
    '2sa': '2SA',
    '1_kings': '1KI',
    '1_kgs': '1KI',
    '1ki': '1KI',
    '2_kings': '2KI',
    '2_kgs': '2KI',
    '2ki': '2KI',
    '2_chronicles': '2CH',
    '2_chr': '2CH',
    '2ch': '2CH',
    '2_chron': '2CH',
    'ezra': 'EZR',
    'ezr': 'EZR',
    'nehemiah': 'NEH',
    'neh': 'NEH',
    'esther': 'EST',
    'est': 'EST',
    'job': 'JOB',
    'psalms': 'PSA',
    'psalm': 'PSA',
    'ps': 'PSA',
    'psa': 'PSA',
    'proverbs': 'PRO',
    'prov': 'PRO',
    'pro': 'PRO',
    'ecclesiastes': 'ECC',
    'eccl': 'ECC',
    'ecc': 'ECC',
    'song_of_songs': 'SNG',
    'song_of_solomon': 'SNG',
    'songs': 'SNG',
    'sng': 'SNG',
    'isaiah': 'ISA',
    'isa': 'ISA',
    'jeremiah': 'JER',
    'jer': 'JER',
    'lamentations': 'LAM',
    'lam': 'LAM',
    'ezekiel': 'EZK',
    'ezek': 'EZK',
    'ezk': 'EZK',
    'daniel': 'DAN',
    'dan': 'DAN',
    'hosea': 'HOS',
    'hos': 'HOS',
    'joel': 'JOL',
    'jol': 'JOL',
    'amos': 'AMO',
    'amo': 'AMO',
    'obadiah': 'OBA',
    'obad': 'OBA',
    'oba': 'OBA',
    'jonah': 'JON',
    'jon': 'JON',
    'micah': 'MIC',
    'mic': 'MIC',
    'nahum': 'NAM',
    'nah': 'NAM',
    'nam': 'NAM',
    'habakkuk': 'HAB',
    'hab': 'HAB',
    'zephaniah': 'ZEP',
    'zeph': 'ZEP',
    'zep': 'ZEP',
    'haggai': 'HAG',
    'hag': 'HAG',
    'zechariah': 'ZEC',
    'zech': 'ZEC',
    'zec': 'ZEC',
    'malachi': 'MAL',
    'mal': 'MAL',
    
    // New Testament
    'matthew': 'MAT',
    'matt': 'MAT',
    'mat': 'MAT',
    'mark': 'MRK',
    'mrk': 'MRK',
    'luke': 'LUK',
    'luk': 'LUK',
    'john': 'JHN',
    'jhn': 'JHN',
    'jn': 'JHN',
    'acts': 'ACT',
    'act': 'ACT',
    'romans': 'ROM',
    'rom': 'ROM',
    '1_corinthians': '1CO',
    '1_cor': '1CO',
    '1co': '1CO',
    '2_corinthians': '2CO',
    '2_cor': '2CO',
    '2co': '2CO',
    'galatians': 'GAL',
    'gal': 'GAL',
    'ephesians': 'EPH',
    'eph': 'EPH',
    'philippians': 'PHP',
    'phil': 'PHP',
    'php': 'PHP',
    'colossians': 'COL',
    'col': 'COL',
    '1_thessalonians': '1TH',
    '1_thess': '1TH',
    '1th': '1TH',
    '2_thessalonians': '2TH',
    '2_thess': '2TH',
    '2th': '2TH',
    '1_timothy': '1TI',
    '1_tim': '1TI',
    '1ti': '1TI',
    '2_timothy': '2TI',
    '2_tim': '2TI',
    '2ti': '2TI',
    'titus': 'TIT',
    'tit': 'TIT',
    'philemon': 'PHM',
    'phlm': 'PHM',
    'phm': 'PHM',
    'hebrews': 'HEB',
    'heb': 'HEB',
    'james': 'JAS',
    'jas': 'JAS',
    '1_peter': '1PE',
    '1_pet': '1PE',
    '1pe': '1PE',
    '2_peter': '2PE',
    '2_pet': '2PE',
    '2pe': '2PE',
    '1_john': '1JN',
    '1_jn': '1JN',
    '1jn': '1JN',
    '2_john': '2JN',
    '2_jn': '2JN',
    '2jn': '2JN',
    '3_john': '3JN',
    '3_jn': '3JN',
    '3jn': '3JN',
    'jude': 'JUD',
    'jud': 'JUD',
    'revelation': 'REV',
    'rev': 'REV'
  };

  return nameToId[normalizedName] || null;
}