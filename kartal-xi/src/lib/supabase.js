import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fojysisgshhhcmsnujrh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvanlzaXNnc2hoaGNtc251anJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzE3MTksImV4cCI6MjA5NjUwNzcxOX0.CcBe4kVbS3aatbXpHZ_-TCbMzMu2e5xU5RavW6nauWk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
