import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'url';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const [book, chapter] = slug;
    const translation = request.nextUrl.searchParams.get('translation') || 'web';

    if (!book || !chapter) {
      return NextResponse.json(
        { error: 'book and chapter are required' },
        { status: 400 }
      );
    }

    // Fetch from external Bible API
    try {
      const url = `https://bible-api.com/data/${translation}/${book}/${chapter}`;
      const response = await fetch(url);

      if (!response.ok) {
        return NextResponse.json(
          { error: `Bible API error: HTTP ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch chapter: ${fetchError}` },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
