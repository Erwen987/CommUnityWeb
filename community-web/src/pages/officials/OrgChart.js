import React, { useState, useEffect } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar  from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import { supabase } from '../../supabaseClient';

const avatarColors = ['#1E3A5F','#0f766e','#7c3aed','#c2410c','#0369a1','#b45309','#0891b2'];

// Position hierarchy order
const POSITION_ORDER = [
  'Barangay Captain',
  'Barangay Secretary',
  'Barangay Treasurer',
  'Barangay Councilor',
  'SK Chairperson',
];

function positionRank(pos) {
  const i = POSITION_ORDER.indexOf(pos);
  return i === -1 ? 99 : i;
}

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}

function OfficialAvatar({ url, name, size = 64, index = 0 }) {
  const src = resolveAvatar(url);
  if (src) return (
    <img src={src} alt={name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e5e7eb' }} />
  );
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: avatarColors[index % avatarColors.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.33, border: '3px solid #e5e7eb', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// Position badge color map
const POSITION_COLORS = {
  'Barangay Captain':  { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  'Barangay Secretary':{ bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' },
  'Barangay Treasurer':{ bg: '#dcfce7', color: '#166534', border: '#86efac' },
  'Barangay Councilor':{ bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'SK Chairperson':    { bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
};

function PositionBadge({ position }) {
  const c = POSITION_COLORS[position] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {position}
    </span>
  );
}

// ── Card for a single official ────────────────────────────────────────────────
function OfficialCard({ official, index, isCapitan }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: isCapitan ? '28px 32px' : '20px 24px',
      boxShadow: isCapitan
        ? '0 4px 24px rgba(30,58,95,0.13), 0 0 0 2px #1E3A5F22'
        : '0 1px 6px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: isCapitan ? 12 : 10,
      position: 'relative',
      transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = isCapitan
        ? '0 8px 32px rgba(30,58,95,0.18), 0 0 0 2px #1E3A5F44'
        : '0 4px 16px rgba(0,0,0,0.12)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = isCapitan
        ? '0 4px 24px rgba(30,58,95,0.13), 0 0 0 2px #1E3A5F22'
        : '0 1px 6px rgba(0,0,0,0.08)'}
    >
      {isCapitan && (
        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#1E3A5F', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          ★ Barangay Head
        </div>
      )}
      <OfficialAvatar url={official.avatar_url} name={official.full_name} size={isCapitan ? 80 : 60} index={index} />
      <div>
        <div style={{ fontWeight: 800, fontSize: isCapitan ? 16 : 14, color: '#111827', marginBottom: 4 }}>
          {official.full_name || '—'}
        </div>
        <PositionBadge position={official.position} />
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>{official.email}</div>
      </div>
    </div>
  );
}

// ── Group divider ─────────────────────────────────────────────────────────────
function GroupDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '32px 0 16px' }}>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
      <span style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function OrgChart() {
  const { barangay, barangay_name, loading } = useOfficialProfile();
  const [officials, setOfficials] = useState([]);
  const [fetching,  setFetching]  = useState(false);

  useEffect(() => {
    if (!barangay) return;
    setFetching(true);
    supabase
      .from('officials')
      .select('id, full_name, position, email, avatar_url, can_manage')
      .eq('barangay', barangay)
      .eq('status', 'approved')
      .then(({ data }) => {
        const sorted = (data || []).sort((a, b) => positionRank(a.position) - positionRank(b.position));
        setOfficials(sorted);
        setFetching(false);
      });
  }, [barangay]);

  const captain   = officials.find(o => o.position === 'Barangay Captain');
  const rest      = officials.filter(o => o.position !== 'Barangay Captain');

  // Group rest by category
  const executive = rest.filter(o => ['Barangay Secretary', 'Barangay Treasurer'].includes(o.position));
  const councilors = rest.filter(o => o.position === 'Barangay Councilor');
  const sk         = rest.filter(o => o.position?.startsWith('SK'));
  const others     = rest.filter(o =>
    !['Barangay Secretary','Barangay Treasurer','Barangay Councilor'].includes(o.position) &&
    !o.position?.startsWith('SK')
  );

  const displayName = barangay_name || barangay || 'Your Barangay';

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 className="off-page-title" style={{ marginBottom: 4 }}>Organizational Chart</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>
              {!loading && barangay ? `Approved officials of Barangay ${displayName}` : 'Loading barangay information…'}
            </p>
          </div>

          {fetching ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 12 }}>
              <div style={{ width: 36, height: 36, border: '3px solid #e0e7ef', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 13, color: '#9ca3af' }}>Loading officials…</span>
            </div>
          ) : officials.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏛️</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>No approved officials yet</div>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>Officials will appear here once they are approved.</div>
            </div>
          ) : (
            <div>

              {/* ── Barangay header banner ── */}
              <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2563eb 100%)', borderRadius: 16, padding: '24px 32px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 4px 20px rgba(30,58,95,0.2)' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🏛️</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: '#fff' }}>Barangay {displayName}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{officials.length} approved official{officials.length !== 1 ? 's' : ''}</div>
                </div>
              </div>

              {/* ── Captain (top center) ── */}
              {captain && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <div style={{ width: 280 }}>
                    <OfficialCard official={captain} index={0} isCapitan />
                  </div>
                </div>
              )}

              {/* Connector line */}
              {captain && rest.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 0' }}>
                  <div style={{ width: 2, height: 28, background: '#d1d5db' }} />
                </div>
              )}

              {/* ── Executive officers ── */}
              {executive.length > 0 && (
                <>
                  <GroupDivider label="Executive Officers" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                    {executive.map((o, i) => <OfficialCard key={o.id} official={o} index={i + 1} isCapitan={false} />)}
                  </div>
                </>
              )}

              {/* ── Councilors ── */}
              {councilors.length > 0 && (
                <>
                  <GroupDivider label={`Barangay Councilors (${councilors.length})`} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                    {councilors.map((o, i) => <OfficialCard key={o.id} official={o} index={i + 3} isCapitan={false} />)}
                  </div>
                </>
              )}

              {/* ── SK Officials ── */}
              {sk.length > 0 && (
                <>
                  <GroupDivider label="SK Officials (Sangguniang Kabataan)" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                    {sk.map((o, i) => <OfficialCard key={o.id} official={o} index={i + 10} isCapitan={false} />)}
                  </div>
                </>
              )}

              {/* ── Other positions ── */}
              {others.length > 0 && (
                <>
                  <GroupDivider label="Barangay Support Staff" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                    {others.map((o, i) => <OfficialCard key={o.id} official={o} index={i + 15} isCapitan={false} />)}
                  </div>
                </>
              )}

              {/* Footer note */}
              <div style={{ marginTop: 32, padding: '14px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>Only approved officials are shown. Pending or banned accounts are not displayed.</span>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default OrgChart;
