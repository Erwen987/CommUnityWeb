import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

const OfficialProfileContext = createContext(null);

export function OfficialProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      userIdRef.current = user.id;

      const { data } = await supabase
        .from('officials')
        .select('barangay, barangay_name, avatar_url, position, can_manage')
        .eq('auth_id', user.id)
        .single();

      setProfile(data || null);
      setLoading(false);
    };

    load();

    // Keep in sync when the captain toggles someone else's can_manage
    // or when this official's own row changes
    const channel = supabase
      .channel('official-profile-ctx')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'officials' }, payload => {
        if (payload.new && userIdRef.current && payload.new.auth_id === userIdRef.current) {
          setProfile(prev => prev ? { ...prev, ...payload.new } : payload.new);
        }
      })
      .subscribe();

    // Clear profile on sign-out so the next login gets fresh data
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(true);
        userIdRef.current = null;
      }
    });

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <OfficialProfileContext.Provider value={{ profile, loading }}>
      {children}
    </OfficialProfileContext.Provider>
  );
}

export function useOfficialProfileContext() {
  return useContext(OfficialProfileContext);
}
