// backend/auth/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Create your Supabase client instance
const supabase: SupabaseClient = createClient(
  "https://vnulrstwumiqqvdgyznb.supabase.co", // ✅ Your Supabase URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudWxyc3R3dW1pcXF2ZGd5em5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDU3NDQsImV4cCI6MjA2Njc4MTc0NH0.FpQ7eCCgFf3gQQ7-IpOeu-uN0ZpwH1NyXQhO_ujHbzI" // ✅ Your anon/public key
);

export default supabase;
