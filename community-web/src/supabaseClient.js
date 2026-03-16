import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://apesvvqntqldihnzmitn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mRVhQVRmCmX7mYUpy6WDxw_Nu6iaN7_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
