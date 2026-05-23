const { createClient } = require('@supabase/supabase-js');

const RIN_SUPABASE_URL = 'https://zyoszbmahxnfcokuzkuv.supabase.co';
const RIN_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3N6Ym1haHhuZmNva3V6a3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDU3OTMsImV4cCI6MjA4OTA4MTc5M30.Ilz4RYTcgZU3IMnABg0eV7iAfFcC0iykyl4DOln-mjY';

const rinSupabase = createClient(RIN_SUPABASE_URL, RIN_SUPABASE_ANON_KEY);

async function migrateCarousels() {
  console.log('📦 Migrating RIN carousels to RIN Supabase...\n');

  const carousels = [
    {
      draft_date: '2026-05-04',
      title: 'RIN: Dispatch Intelligence',
      content: `# RIN: Dispatch Intelligence

## Slide 1: The Problem
Manual dispatch = 2+ hours/day wasted.
Double bookings. Idle drivers. Chaos.

## Slide 2: Smart Matching
Real-time optimization.
Drivers know their next job before they finish the current one.

## Slide 3: The Result
2 hours saved per day.
More jobs assigned.
Drivers stay longer.

## Slide 4: The Call
Fair dispatch. Real-time optimization. Built for operators.

**Join the network:** drive.roadside.ai`,
      channel: 'instagram',
      draft_type: 'carousel',
      status: 'approved'
    },
    {
      draft_date: '2026-05-11',
      title: 'RIN: Smart Matching Saves 2 Hours/Day',
      content: `# RIN: Smart Matching Saves 2 Hours/Day

## Slide 1: The Problem
Manual dispatch = chaos.
2+ hours wasted. Double bookings. Idle drivers.

## Slide 2: The Solution
Real-time matching. Drivers know their next job before finishing the current one.

## Slide 3: The Impact
2 hours saved per day.
More jobs assigned.
Drivers earn more.

## Slide 4: Join RIN
Fair dispatch. Real-time optimization. For operators, by operators.

**drive.roadside.ai**`,
      channel: 'instagram,facebook',
      draft_type: 'carousel',
      status: 'approved'
    }
  ];

  for (const carousel of carousels) {
    const { data, error } = await rinSupabase
      .from('gtm_drafts')
      .insert([carousel]);

    if (error) {
      console.log(`⏭️  ${carousel.draft_date}: ${error.message}`);
    } else {
      console.log(`✅ ${carousel.draft_date}: "${carousel.title}"`);
    }
  }

  console.log('\n✅ Migration complete!');
}

migrateCarousels();
