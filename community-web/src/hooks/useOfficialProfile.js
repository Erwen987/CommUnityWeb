import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useOfficialProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userId = null;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      userId = user.id;

      const { data } = await supabase
        .from('officials')
        .select('barangay, barangay_name, avatar_url')
        .eq('auth_id', user.id)
        .single();

      setProfile(data || null);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel('official-profile-hook')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'officials' }, payload => {
        if (payload.new && userId && payload.new.auth_id === userId) {
          setProfile(prev => prev ? { ...prev, ...payload.new } : payload.new);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return {
    barangay:     profile?.barangay      || '',
    barangayName: profile?.barangay_name || '',
    avatarUrl:    profile?.avatar_url    || null,
    loading,
  };
}
