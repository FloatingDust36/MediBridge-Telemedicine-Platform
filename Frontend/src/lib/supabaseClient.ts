// backend/auth/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Create your Supabase client instance
const supabase: SupabaseClient = createClient(
  "https://wnrcgbghdxirlzrctkgu.supabase.co", // ✅ Your Supabase URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducmNnYmdoZHhpcmx6cmN0a2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NzI2NDMsImV4cCI6MjA2NjA0ODY0M30.tsVKPWuTGO-p9TGcZAsz20t4G2VqzOIYS5_dh_TpBVA" // ✅ Your anon/public key
);

export default supabase;
