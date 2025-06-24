const { createClient } = supabase;

// Create your Supabase client instance
const supabaseClient = createClient(
  "https://wnrcgbghdxirlzrctkgu.supabase.co", // ✅ Your actual Supabase URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducmNnYmdoZHhpcmx6cmN0a2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NzI2NDMsImV4cCI6MjA2NjA0ODY0M30.tsVKPWuTGO-p9TGcZAsz20t4G2VqzOIYS5_dh_TpBVA" // ✅ Your actual anon key
);

// Make it globally available as `supabase`
window.supabase = supabaseClient;