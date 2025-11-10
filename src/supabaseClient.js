import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aozmcgciznyivoavncjy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvem1jZ2Npem55aXZvYXZuY2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTUzMDQsImV4cCI6MjA3MDIzMTMwNH0.Tt_NA_eyptv2O_LWLE_s0N-KZv04kUfEZvTm2MXwPck';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
