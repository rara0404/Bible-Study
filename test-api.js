// Simple test script to validate Bible API integration
// This can be run with: node test-api.js

const BASE_URL = 'https://bible-api.com';

async function testBibleApi() {
  console.log('🧪 Testing Bible API Integration...\n');

  try {
    // Test 1: Get a specific verse
    console.log('📖 Test 1: Fetching John 3:16...');
    const verseResponse = await fetch(`${BASE_URL}/john 3:16`);
    if (!verseResponse.ok) {
      throw new Error(`HTTP ${verseResponse.status}: ${verseResponse.statusText}`);
    }
    const verseData = await verseResponse.json();
    console.log('✅ Success!');
    console.log(`   Reference: ${verseData.reference}`);
    console.log(`   Text: "${verseData.verses[0].text.trim()}"`);
    console.log('');

    // Test 2: Get a random verse
    console.log('🎲 Test 2: Fetching random verse...');
    const randomResponse = await fetch(`${BASE_URL}/data/web/random`);
    if (!randomResponse.ok) {
      throw new Error(`HTTP ${randomResponse.status}: ${randomResponse.statusText}`);
    }
    const randomData = await randomResponse.json();
    console.log('✅ Success!');
    console.log(`   Book: ${randomData.random_verse.book_name}`);
    console.log(`   Reference: ${randomData.random_verse.chapter}:${randomData.random_verse.verse}`);
    console.log(`   Text: "${randomData.random_verse.text.trim()}"`);
    console.log('');

    // Test 3: Get chapter data
    console.log('📚 Test 3: Fetching John chapter 3...');
    const chapterResponse = await fetch(`${BASE_URL}/data/web/JHN/3`);
    if (!chapterResponse.ok) {
      throw new Error(`HTTP ${chapterResponse.status}: ${chapterResponse.statusText}`);
    }
    const chapterData = await chapterResponse.json();
    console.log('✅ Success!');
    console.log(`   Chapter has ${chapterData.verses.length} verses`);
    console.log(`   First verse: "${chapterData.verses[0].text.trim()}"`);
    console.log('');

    // Test 4: Get available translations
    console.log('🌍 Test 4: Fetching available translations...');
    const translationsResponse = await fetch(`${BASE_URL}/data`);
    if (!translationsResponse.ok) {
      throw new Error(`HTTP ${translationsResponse.status}: ${translationsResponse.statusText}`);
    }
    const translationsData = await translationsResponse.json();
    console.log('✅ Success!');
    console.log(`   Available translations: ${translationsData.translations.length}`);
    console.log(`   Examples: ${translationsData.translations.slice(0, 3).map(t => t.identifier).join(', ')}`);
    console.log('');

    console.log('🎉 All tests passed! Bible API integration is working correctly.');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Test the "Verse of the Day" component with the refresh button');
    console.log('   3. Navigate to different Bible chapters using the Books tab');
    console.log('   4. Test the search functionality and verse navigation');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   - Check your internet connection');
    console.log('   - Verify bible-api.com is accessible');
    console.log('   - The API has rate limiting (15 requests per 30 seconds)');
  }
}

testBibleApi();