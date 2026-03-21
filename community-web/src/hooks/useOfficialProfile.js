import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useOfficialProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('officials')
        .select('barangay, barangay_name, avatar_url')
        .eq('auth_id', user.id)
        .single();

      setProfile(data || null);
      setLoading(false);
    };
    load();
  }, []);

  return {
    barangay:     profile?.barangay      || '',
    barangayName: profile?.barangay_name || '',
    avatarUrl:    profile?.avatar_url    || null,
    loading,
  };
}
