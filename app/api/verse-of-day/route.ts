import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'url';

export async function GET(request: NextRequest) {
  try {

    const today = new Date().toISOString().split('T')[0];

    return NextResponse.json({
      book: 'John',
      reference: 'John 3:16',
      text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
      translation: 'NIV',
      date: today,
      favorited: false,
      user_note: null
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
