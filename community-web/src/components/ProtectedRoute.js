import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

/**
 * Wraps a route and redirects to /login if the user is not
 * authenticated or does not have the required role.
 *
 * role: 'admin' | 'official'
 */
function ProtectedRoute({ children, role }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'denied'

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!cancelled) setStatus('denied'); return; }

      if (role === 'admin') {
        const { data } = await supabase
          .from('admins')
          .select('id')
          .eq('auth_id', user.id)
          .maybeSingle();
        if (!cancelled) setStatus(data ? 'ok' : 'denied');
      } else if (role === 'official') {
        const { data } = await supabase
          .from('officials')
          .select('status')
          .eq('auth_id', user.id)
          .maybeSingle();
        if (!cancelled) setStatus(data?.status === 'approved' ? 'ok' : 'denied');
      } else {
        if (!cancelled) setStatus('ok');
      }
    };
    check();
    return () => { cancelled = true; };
  }, [role]);

  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f8fafc', fontFamily: 'Poppins, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid #e0e7ef',
            borderTopColor: '#2563eb', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 14px',
          }} />
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Checking access…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === 'denied') return <Navigate to="/login" replace />;
  return children;
}

export default ProtectedRoute;
