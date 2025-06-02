import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dnealqonjiljfrffrqdo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZWFscW9uamlsamZyZmZycWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjUxMTMsImV4cCI6MjA2NDIwMTExM30.yAIBW7Og5QHMkN-LiMwMhvewQfiBFfZc9f_wDcxeDVc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
