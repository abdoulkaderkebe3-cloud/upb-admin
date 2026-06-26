import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://miacfoaspzccdlsoaxnc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pYWNmb2FzcHpjY2Rsc29heG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMjYyMDUsImV4cCI6MjA5NjcwMjIwNX0.VIKPuL1m05-yOlkmnZ3iAZskK9qj2TudujDIDmXMvkE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
