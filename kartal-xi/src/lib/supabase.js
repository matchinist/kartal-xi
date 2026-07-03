import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://fojysisgshhhcmsnujrh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvanlzaXNnc2hoaGNtc251anJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk5MDgwNzMsImV4cCI6MjAyNTQ4NDA3M30.GUd2TqUaMkEdYRcJnOTkfLSYP7Lw7yAZqMjsI0s35Cc';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
