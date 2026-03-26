import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

function MaintenanceModeListener() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Subscribe to system_settings changes
    const channel = supabase
      .channel('maintenance-mode-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=eq.maintenance_mode'
        },
        (payload) => {
          if (payload.new.value === 'true') {
            setShowModal(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!showModal) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 40, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', textAlign: 'center' }}>
        {/* Icon */}
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 12px', fontFamily: 'Poppins, sans-serif' }}>
          System Maintenance Mode
        </h2>

        {/* Message */}
        <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.6, margin: '0 0 28px', fontFamily: 'Poppins, sans-serif' }}>
          The system administrator has enabled maintenance mode. All officials must log out now. The system will be unavailable until maintenance is complete.
        </p>

        {/* Logout button */}
        <button onClick={handleLogout}
          style={{ width: '100%', padding: '14px 24px', borderRadius: 12, border: 'none', background: '#d97706', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.2s' }}
          onMouseEnter={e => e.target.style.background = '#b45309'}
          onMouseLeave={e => e.target.style.background = '#d97706'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Log Out Now
        </button>

        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 16, fontFamily: 'Poppins, sans-serif' }}>
          You will be redirected to the login page
        </p>
      </div>
    </div>
  );
}

export default MaintenanceModeListener;
