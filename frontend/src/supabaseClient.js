import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://apesvvqntqldihnzmitn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZXN2dnFudHFsZGlobnptaXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODIzOTgsImV4cCI6MjA4Njc1ODM5OH0.Njc5I5znelNJbyhJoSqJxcuQ9gKfoBAKbijOQm4azhg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
