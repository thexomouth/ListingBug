import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ynqmisrlahjberhmlviz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucW1pc3JsYWhqYmVyaG1sdml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTQ2MzksImV4cCI6MjA4OTUzMDYzOX0.dDZodNajIu6UVfSkMCYiX4B4yYEf7QtPot3mNy18yMg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserPlan = 'trial' | 'starter' | 'professional' | 'enterprise';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  company?: string;
  role?: string;
  plan: UserPlan;
  plan_status: string;
  trial_ends_at?: string;
  created_at: string;
}