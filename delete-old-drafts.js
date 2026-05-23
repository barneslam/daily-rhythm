const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zyoszbmahxnfcokuzkuv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3N6Ym1haHhuZmNva3V6a3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDU3OTMsImV4cCI6MjA4OTA4MTc5M30.Ilz4RYTcgZU3IMnABg0eV7iAfFcC0iykyl4DOln-mjY'
);

(async () => {
  const { error } = await supabase
    .from('gtm_drafts')
    .delete()
    .in('draft_date', ['2026-05-04', '2026-05-05', '2026-05-11']);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Deleted old drafts');
  }
})();
