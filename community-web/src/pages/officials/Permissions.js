import React, { useEffect, useState, useCallback } from 'react';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar  from '../../components/OfficialTopbar';
import MaintenanceModeListener from '../../components/MaintenanceModeListener';
import { useOfficialProfile }  from '../../hooks/useOfficialProfile';
import { supabase } from '../../supabaseClient';
import { Navigate } from 'react-router-dom';

const POSITION_COLORS = {
  'Barangay Captain':  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  'Secretary':         { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  'Treasurer':         { bg: '#fefce8', text: '#92400e', border: '#fde68a' },
  'Kagawad':           { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' },
  'SK Chairman':       { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  'SK Kagawad':        { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
};

function PositionBadge({ position }) {
  const c = POSITION_COLORS[position] || { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
  return (
    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:c.bg, color:c.text, border:`1.5px solid ${c.border}` }}>
      {position}
    </span>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        position: 'relative',
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        background: checked ? '#1E3A5F' : '#d1d5db',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: checked ? 23 : 3,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

export default function Permissions() {
  const { barangay, isCapitan, loading: profileLoading } = useOfficialProfile();
  const [officials, setOfficials]   = useState([]);
  const [savingId,  setSavingId]    = useState(null);
  const [loading,   setLoading]     = useState(true);
  const [toast,     setToast]       = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadOfficials = useCallback(async () => {
    if (!barangay) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('officials')
      .select('id, auth_id, full_name, email, position, can_manage, avatar_url')
      .eq('barangay', barangay)
      .eq('status', 'approved')
      .neq('position', 'Barangay Captain')
      .order('position');
    if (!error) setOfficials(data || []);
    setLoading(false);
  }, [barangay]);

  useEffect(() => { loadOfficials(); }, [loadOfficials]);

  const handleToggle = async (official, newValue) => {
    setSavingId(official.id);
    const { error } = await supabase
      .from('officials')
      .update({ can_manage: newValue })
      .eq('id', official.id);

    if (error) {
      showToast('Failed to update permission.', 'error');
    } else {
      setOfficials(prev => prev.map(o => o.id === official.id ? { ...o, can_manage: newValue } : o));
      showToast(`${official.full_name} ${newValue ? 'granted' : 'revoked'} full access.`);
    }
    setSavingId(null);
  };

  if (!profileLoading && !isCapitan) return <Navigate to="/officials/dashboard" replace />;

  const managed   = officials.filter(o => o.can_manage);
  const unmanaged = officials.filter(o => !o.can_manage);

  return (
    <div className="off-layout">
      <MaintenanceModeListener />
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar title="Permissions" />
        <div className="off-content" style={{ maxWidth: 780, paddingBottom: 40 }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1f2937', margin: 0 }}>Official Permissions</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Toggle full access for officials in your barangay. Officials with full access can resolve reports, process requests, manage rewards, and confirm redemptions.
            </p>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Officials', value: officials.length, color: '#1E3A5F', bg: '#eff6ff' },
              { label: 'Full Access',     value: managed.length,   color: '#15803d', bg: '#f0fdf4' },
              { label: 'View Only',       value: unmanaged.length, color: '#92400e', bg: '#fefce8' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, minWidth: 120, background: s.bg, borderRadius: 12, padding: '14px 18px' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Officials list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', fontSize: 14 }}>Loading officials…</div>
          ) : officials.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, background: '#f8fafc', borderRadius: 16, color: '#9ca3af', fontSize: 14 }}>
              No other approved officials found in your barangay.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {officials.map(official => (
                <div key={official.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: '#fff', borderRadius: 14, padding: '14px 18px',
                  border: `1.5px solid ${official.can_manage ? '#bfdbfe' : '#e5e7eb'}`,
                  boxShadow: official.can_manage ? '0 2px 8px rgba(30,58,95,0.07)' : 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}>
                  {/* Avatar */}
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#e0e7ff', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {official.avatar_url ? (
                      <img src={official.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#1E3A5F' }}>
                        {official.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {official.full_name}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {official.email}
                    </div>
                    <div style={{ marginTop: 5 }}>
                      <PositionBadge position={official.position} />
                    </div>
                  </div>

                  {/* Access label + toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: official.can_manage ? '#1d4ed8' : '#9ca3af', minWidth: 70, textAlign: 'right' }}>
                      {official.can_manage ? 'Full Access' : 'View Only'}
                    </span>
                    <Toggle
                      checked={official.can_manage}
                      onChange={val => handleToggle(official, val)}
                      disabled={savingId === official.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info note */}
          <div style={{ marginTop: 24, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
            <strong style={{ color: '#374151' }}>Note:</strong> Changes take effect immediately. Officials will see action buttons on their next page load. Only the Barangay Captain can change these settings.
          </div>

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#dc2626' : '#1E3A5F',
          color: '#fff', padding: '10px 20px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
