import React, { useState, useEffect, useCallback } from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import AdminTopbar from '../../components/AdminTopbar';
import { supabase } from '../../supabaseClient';

// ── Tier helpers (contributor row badges only) ──────────────────────────────
const TIERS = [
  { label: 'Gold',   min: 1500, bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)' },
  { label: 'Silver', min: 1000, bg: 'linear-gradient(135deg, #9ca3af, #6b7280)' },
  { label: 'Green',  min: 500,  bg: 'linear-gradient(135deg, #4ade80, #16a34a)' },
  { label: 'Blue',   min: 300,  bg: 'linear-gradient(135deg, #60a5fa, #1d4ed8)' },
  { label: 'Red',    min: 100,  bg: 'linear-gradient(135deg, #f87171, #dc2626)' },
];
function getTier(pts) { return TIERS.find(t => (pts || 0) >= t.min) || null; }

const rankColors   = ['#f59e0b','#9ca3af','#cd7f32','#6b7280','#6b7280'];
const avatarColors = ['#1E3A5F','#0f766e','#7c3aed','#c2410c','#0369a1'];
const medals       = ['🥇','🥈','🥉'];
const categoryColors = { food:'#FF7043', school_supplies:'#1565C0', hygiene:'#2E7D32', household:'#6A1B9A' };

const REDEMPTION_STATUS = {
  pending:   { bg:'#fef9c3', color:'#92400e', dot:'#f59e0b', label:'Pending'   },
  claimed:   { bg:'#dcfce7', color:'#166534', dot:'#22c55e', label:'Claimed'   },
  cancelled: { bg:'#f1f5f9', color:'#6b7280', dot:'#9ca3af', label:'Cancelled' },
};

const REQUEST_STATUS = {
  pending:  { bg:'#eff6ff', color:'#1e40af', dot:'#3b82f6', label:'Pending'  },
  approved: { bg:'#dcfce7', color:'#166534', dot:'#22c55e', label:'Approved' },
  rejected: { bg:'#fee2e2', color:'#991b1b', dot:'#ef4444', label:'Rejected' },
};

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}

function ResidentAvatar({ url, name, size = 36, index = 0 }) {
  const src = resolveAvatar(url);
  if (src) return <img src={src} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid #e5e7eb' }} />;
  const initials = (name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:avatarColors[index%5], color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:size*0.36, flexShrink:0 }}>
      {initials}
    </div>
  );
}

function TierBadge({ points }) {
  const tier = getTier(points);
  if (!tier) return <span style={{ fontSize:11, color:'#9ca3af' }}>Starter</span>;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, background:tier.bg, color:'#fff' }}>
      {tier.label}
    </span>
  );
}

function StatusBadge({ status, map }) {
  const s = (map || REDEMPTION_STATUS)[status] || REDEMPTION_STATUS.pending;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, background:s.bg, color:s.color }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }} />
      {s.label}
    </span>
  );
}

const Spinner = ({ size=32 }) => (
  <div style={{ width:size, height:size, border:'3px solid #e0e7ef', borderTopColor:'#1E3A5F', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
);

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

const TH = { padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', background:'#f8fafc', borderBottom:'1px solid #e5e7eb', whiteSpace:'nowrap' };
const TD = { padding:'10px 16px', fontSize:13, color:'#374151', borderBottom:'1px solid #f1f5f9', verticalAlign:'middle' };

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ background:'#fff', borderRadius:14, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ width:48, height:48, borderRadius:12, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
        <div style={{ fontSize:22, fontWeight:800, color, lineHeight:1.2, marginTop:2 }}>{value}</div>
        {sub && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
function AdminRewards() {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [adminId,   setAdminId]   = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAdminId(data.user?.id || null));
  }, []);

  // ── Summary stats (loaded on mount) ──────────────────────────────────────────
  const [summary, setSummary] = useState({ residents:0, totalPts:0, pendingRedemptions:0, pendingRequests:0 });

  const loadSummary = useCallback(async () => {
    const [{ count: residents }, { data: ptsData }, { count: pendingRedemptions }, { count: pendingRequests }] = await Promise.all([
      supabase.from('users').select('*', { count:'exact', head:true }),
      supabase.from('users').select('points'),
      supabase.from('redemptions').select('*', { count:'exact', head:true }).eq('status','pending'),
      supabase.from('point_requests').select('*', { count:'exact', head:true }).eq('status','pending'),
    ]);
    setSummary({
      residents: residents || 0,
      totalPts: (ptsData || []).reduce((s, u) => s + (u.points || 0), 0),
      pendingRedemptions: pendingRedemptions || 0,
      pendingRequests: pendingRequests || 0,
    });
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  const [contributors, setContributors] = useState([]);
  const [fetching,     setFetching]     = useState(false);
  const [search,       setSearch]       = useState('');

  const loadContributors = useCallback(async () => {
    setFetching(true);
    const { data } = await supabase.from('users').select('auth_id, first_name, last_name, points, avatar_url, barangay').order('points', { ascending:false });
    setContributors((data||[]).map((u,i) => ({ ...u, name:`${u.first_name||''} ${u.last_name||''}`.trim()||'Unknown', rank:i+1 })));
    setFetching(false);
  }, []);

  // ── Redemptions ──────────────────────────────────────────────────────────────
  const [redemptions,        setRedemptions]        = useState([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);
  const [processingId,       setProcessingId]       = useState(null);
  const [redemptionFilter,   setRedemptionFilter]   = useState('pending');

  const loadRedemptions = useCallback(async () => {
    setRedemptionsLoading(true);
    const [{ data: rData }, { data: iData }, { data: uData }] = await Promise.all([
      supabase.from('redemptions').select('*').order('created_at', { ascending:false }),
      supabase.from('reward_items').select('id, name, category'),
      supabase.from('users').select('auth_id, first_name, last_name, barangay, avatar_url'),
    ]);
    const itemMap = {}; (iData||[]).forEach(i => { itemMap[i.id] = i; });
    const userMap = {}; (uData||[]).forEach(u => { userMap[u.auth_id] = u; });
    setRedemptions((rData||[]).map(r => ({
      ...r,
      itemName:     itemMap[r.reward_item_id]?.name     || 'Unknown Item',
      itemCategory: itemMap[r.reward_item_id]?.category || '',
      residentName: userMap[r.user_id] ? `${userMap[r.user_id].first_name||''} ${userMap[r.user_id].last_name||''}`.trim() : 'Unknown',
      barangay:     userMap[r.user_id]?.barangay   || '—',
      avatarUrl:    userMap[r.user_id]?.avatar_url || null,
    })));
    setRedemptionsLoading(false);
  }, []);

  const markClaimed = async (r) => {
    setProcessingId(r.id);
    await supabase.from('redemptions').update({
      status:                 'claimed',
      claimed_at:             new Date().toISOString(),
      claimed_by_official_id: adminId,
    }).eq('id', r.id);
    setProcessingId(null);
    loadRedemptions();
    loadSummary();
  };

  const cancelRedemption = async (r) => {
    if (!window.confirm(`Cancel redemption and refund ${r.points_spent?.toLocaleString()} pts to ${r.residentName}?`)) return;
    setProcessingId(r.id);
    const { data: userData } = await supabase.from('users').select('points').eq('auth_id', r.user_id).single();
    const currentPts = userData?.points || 0;
    await Promise.all([
      supabase.from('redemptions').update({ status:'cancelled' }).eq('id', r.id),
      supabase.from('users').update({ points: currentPts + r.points_spent }).eq('auth_id', r.user_id),
    ]);
    setProcessingId(null);
    loadRedemptions();
    loadSummary();
  };

  // ── Point Log ────────────────────────────────────────────────────────────────
  const [pointLog,   setPointLog]   = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logFilter,  setLogFilter]  = useState('all');
  const [logSearch,  setLogSearch]  = useState('');

  const loadPointLog = useCallback(async () => {
    setLogLoading(true);
    const [{ data: rewardsData }, { data: uData }] = await Promise.all([
      supabase.from('rewards').select('*').order('created_at', { ascending:false }),
      supabase.from('users').select('auth_id, first_name, last_name, barangay'),
    ]);
    const userMap = {}; (uData||[]).forEach(u => { userMap[u.auth_id] = u; });
    setPointLog((rewardsData||[]).map(r => ({
      ...r,
      residentName: userMap[r.user_id] ? `${userMap[r.user_id].first_name||''} ${userMap[r.user_id].last_name||''}`.trim() : 'Unknown',
      barangay:     userMap[r.user_id]?.barangay || '—',
    })));
    setLogLoading(false);
  }, []);

  // ── Point Requests ────────────────────────────────────────────────────────────
  const [pointRequests,    setPointRequests]    = useState([]);
  const [requestsLoading,  setRequestsLoading]  = useState(false);
  const [requestsFilter,   setRequestsFilter]   = useState('pending');
  const [rejectModal,      setRejectModal]      = useState({ open:false, req:null, note:'' });
  const [actionLoading,    setActionLoading]    = useState(null);

  const loadPointRequests = useCallback(async () => {
    setRequestsLoading(true);
    const [{ data: reqData }, { data: uData }] = await Promise.all([
      supabase.from('point_requests').select('*').order('created_at', { ascending:false }),
      supabase.from('users').select('auth_id, first_name, last_name'),
    ]);
    const userMap = {}; (uData||[]).forEach(u => { userMap[u.auth_id] = u; });
    setPointRequests((reqData||[]).map(r => ({
      ...r,
      officialName: userMap[r.requested_by_official_id]
        ? `${userMap[r.requested_by_official_id].first_name||''} ${userMap[r.requested_by_official_id].last_name||''}`.trim()
        : 'Unknown Official',
    })));
    setRequestsLoading(false);
  }, []);

  const approveRequest = async (req) => {
    setActionLoading(req.id);
    const { data: existing } = await supabase.from('barangay_budgets').select('allocated_points').eq('barangay', req.barangay).single();
    const currentAlloc = existing?.allocated_points || 0;
    await Promise.all([
      supabase.from('barangay_budgets').upsert(
        { barangay: req.barangay, allocated_points: currentAlloc + req.points_requested, updated_at: new Date().toISOString() },
        { onConflict: 'barangay' }
      ),
      supabase.from('point_requests').update({ status:'approved', reviewed_at: new Date().toISOString(), admin_note: null }).eq('id', req.id),
    ]);
    setActionLoading(null);
    loadPointRequests();
    loadSummary();
  };

  const openRejectModal = (req) => setRejectModal({ open:true, req, note:'' });
  const closeRejectModal = () => setRejectModal({ open:false, req:null, note:'' });

  const confirmReject = async () => {
    const { req, note } = rejectModal;
    setActionLoading(req.id);
    await supabase.from('point_requests').update({
      status:      'rejected',
      admin_note:  note.trim() || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', req.id);
    setActionLoading(null);
    closeRejectModal();
    loadPointRequests();
    loadSummary();
  };

  // ── Load on tab switch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'leaderboard')      loadContributors();
    if (activeTab === 'redemptions')      loadRedemptions();
    if (activeTab === 'log')              loadPointLog();
    if (activeTab === 'point_requests')   loadPointRequests();
  }, [activeTab, loadContributors, loadRedemptions, loadPointLog, loadPointRequests]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const filtered = contributors.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.barangay?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredRedemptions = redemptionFilter === 'all' ? redemptions : redemptions.filter(r => r.status === redemptionFilter);
  const filteredLog = pointLog.filter(r => {
    const matchType = logFilter === 'all' || r.type === logFilter;
    const q = logSearch.toLowerCase();
    return matchType && (!q || r.residentName?.toLowerCase().includes(q) || r.reason?.toLowerCase().includes(q) || r.barangay?.toLowerCase().includes(q));
  });
  const filteredRequests = requestsFilter === 'all' ? pointRequests : pointRequests.filter(r => r.status === requestsFilter);

  // Barangay breakdown (for leaderboard sidebar)
  const barangayBreakdown = Object.entries(
    contributors.reduce((acc, c) => {
      const b = c.barangay || 'Unknown';
      if (!acc[b]) acc[b] = { pts: 0, count: 0 };
      acc[b].pts += (c.points || 0);
      acc[b].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1].pts - a[1].pts).slice(0, 8);

  const barColors = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444','#14b8a6','#f97316','#6366f1'];

  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <AdminTopbar />
        <div className="off-content">

          <div style={{ marginBottom:24 }}>
            <h1 className="off-page-title" style={{ marginBottom:2 }}>Rewards</h1>
            <p className="off-page-sub" style={{ margin:0 }}>Manage redemptions, review point transactions, and handle official budget requests</p>
          </div>

          {/* Tab bar */}
          <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:'2px solid #e5e7eb', paddingBottom:0 }}>
            {[
              { key:'leaderboard',    label:'🏆 Leaderboard' },
              { key:'redemptions',    label: summary.pendingRedemptions > 0 ? `🎁 Redemptions (${summary.pendingRedemptions})` : '🎁 Redemptions' },
              { key:'log',            label:'📋 Point Log' },
              { key:'point_requests', label: summary.pendingRequests > 0 ? `📬 Point Requests (${summary.pendingRequests})` : '📬 Point Requests' },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ padding:'10px 20px', border:'none', background:'none', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                  color: activeTab===t.key ? '#1E3A5F' : '#6b7280',
                  borderBottom: activeTab===t.key ? '3px solid #1E3A5F' : '3px solid transparent',
                  marginBottom:-2, transition:'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ══ LEADERBOARD TAB ══ */}
          {activeTab === 'leaderboard' && (
            <>
              {/* Stat cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:24 }}>
                <StatCard icon="👥" label="Total Residents"     value={summary.residents.toLocaleString()}    color="#1E3A5F" sub="system-wide" />
                <StatCard icon="🪙" label="Total Pts Awarded"   value={summary.totalPts.toLocaleString()}     color="#d97706" sub="across all barangays" />
                <StatCard icon="🎁" label="Pending Redemptions" value={summary.pendingRedemptions}            color="#16a34a" sub="awaiting pickup" />
                <StatCard icon="📬" label="Pending Requests"    value={summary.pendingRequests}               color="#7c3aed" sub="budget requests" />
              </div>

              {/* Two columns */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, alignItems:'start' }}>
                {/* Top Contributors */}
                <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden' }}>
                  <div style={{ padding:'18px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, color:'#1f2937' }}>Top Contributors</div>
                      <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>Residents with the most reward points system-wide</div>
                    </div>
                    <div style={{ position:'relative' }}>
                      <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input type="text" placeholder="Search by name or barangay…" value={search} onChange={e => setSearch(e.target.value)}
                        style={{ padding:'7px 12px 7px 30px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, color:'#374151', outline:'none', background:'#f9fafb', width:230 }} />
                    </div>
                  </div>
                  {fetching ? (
                    <div style={{ padding:'52px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                      <Spinner /><span style={{ fontSize:13, color:'#9ca3af' }}>Loading contributors...</span>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div style={{ padding:'52px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                      <div style={{ width:56, height:56, borderRadius:16, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      </div>
                      <div style={{ fontWeight:700, fontSize:15, color:'#374151' }}>{search?'No results found':'No contributor records yet'}</div>
                      <div style={{ fontSize:13, color:'#9ca3af' }}>{search?'Try a different search term.':'Reward points will appear here as residents engage.'}</div>
                    </div>
                  ) : (
                    <div style={{ padding:'8px 16px 16px' }}>
                      {filtered.map((c,i) => (
                        <div key={c.auth_id}
                          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:10, marginBottom:4, backgroundColor: i%2===0?'#ffffff':'#f0f4ff' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor='#dbeafe'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor= i%2===0?'#ffffff':'#f0f4ff'}>
                          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                            <div style={{ width:24, height:24, borderRadius:'50%', background:rankColors[Math.min(i,4)], color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:11, flexShrink:0 }}>
                              {i<3?medals[i]:c.rank}
                            </div>
                            <ResidentAvatar url={c.avatar_url} name={c.name} size={36} index={i} />
                            <div>
                              <div style={{ fontWeight:600, fontSize:13, color:'#111827' }}>{c.name}</div>
                              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                                <span style={{ fontSize:11, color:'#9ca3af' }}>{c.barangay||'—'}</span>
                                <TierBadge points={c.points||0} />
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontWeight:800, fontSize:15, color:rankColors[Math.min(i,4)] }}>{(c.points||0).toLocaleString()}</div>
                            <div style={{ fontSize:10, color:'#9ca3af' }}>points</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Barangay Breakdown */}
                <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden' }}>
                  <div style={{ padding:'18px 24px', borderBottom:'1px solid #f1f5f9' }}>
                    <div style={{ fontWeight:700, fontSize:15, color:'#1f2937' }}>Top Barangays</div>
                    <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>Total points earned per barangay</div>
                  </div>
                  <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
                    {fetching ? (
                      <div style={{ display:'flex', justifyContent:'center', padding:'20px 0' }}><Spinner size={24} /></div>
                    ) : barangayBreakdown.length === 0 ? (
                      <div style={{ textAlign:'center', padding:'20px 0', color:'#9ca3af', fontSize:13 }}>No data yet</div>
                    ) : (
                      <>
                        {barangayBreakdown.map(([name, stat], i) => {
                          const maxPts = barangayBreakdown[0]?.[1]?.pts || 1;
                          const pct = Math.round((stat.pts / maxPts) * 100);
                          return (
                            <div key={name}>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                                <div>
                                  <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Brgy. {name}</span>
                                  <span style={{ fontSize:11, color:'#9ca3af', marginLeft:6 }}>{stat.count} residents</span>
                                </div>
                                <span style={{ fontSize:12, color:'#6b7280', fontWeight:700 }}>{stat.pts.toLocaleString()} pts</span>
                              </div>
                              <div style={{ height:7, borderRadius:999, background:'#f1f5f9', overflow:'hidden' }}>
                                <div style={{ height:'100%', width:`${pct}%`, borderRadius:999, background:barColors[i%8], transition:'width 0.6s ease' }} />
                              </div>
                            </div>
                          );
                        })}
                        <div style={{ marginTop:4, paddingTop:12, borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', fontSize:12 }}>
                          <span style={{ color:'#6b7280', fontWeight:600 }}>Total system pts</span>
                          <span style={{ fontWeight:800, color:'#1f2937' }}>{summary.totalPts.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══ REDEMPTIONS TAB ══ */}
          {activeTab === 'redemptions' && (
            <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden' }}>
              <div style={{ padding:'18px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:'#1f2937' }}>Redemption Claims</div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>Confirm in-person pickups or cancel with point refund</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  {[
                    { key:'pending',   label:`Pending (${redemptions.filter(r=>r.status==='pending').length})` },
                    { key:'claimed',   label:`Claimed (${redemptions.filter(r=>r.status==='claimed').length})` },
                    { key:'cancelled', label:'Cancelled' },
                    { key:'all',       label:'All' },
                  ].map(f => (
                    <button key={f.key} onClick={() => setRedemptionFilter(f.key)}
                      style={{ padding:'5px 14px', borderRadius:20, border:`1.5px solid ${redemptionFilter===f.key?'#1E3A5F':'#e5e7eb'}`, background:redemptionFilter===f.key?'#1E3A5F':'#f9fafb', color:redemptionFilter===f.key?'#fff':'#374151', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {redemptionsLoading ? (
                <div style={{ padding:'52px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <Spinner /><span style={{ fontSize:13, color:'#9ca3af' }}>Loading redemptions...</span>
                </div>
              ) : filteredRedemptions.length === 0 ? (
                <div style={{ padding:'52px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  </div>
                  <div style={{ fontWeight:700, fontSize:15, color:'#374151' }}>No {redemptionFilter !== 'all' ? redemptionFilter : ''} redemptions</div>
                  <div style={{ fontSize:13, color:'#9ca3af' }}>Redemption requests from residents will appear here.</div>
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        <th style={TH}>Resident</th>
                        <th style={TH}>Barangay</th>
                        <th style={TH}>Reward Item</th>
                        <th style={TH}>Pts Spent</th>
                        <th style={TH}>Requested</th>
                        <th style={TH}>Status</th>
                        <th style={TH}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRedemptions.map((r,i) => (
                        <tr key={r.id}
                          style={{ backgroundColor: i%2===0?'#fff':'#f8fafc' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor='#f0f7ff'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor= i%2===0?'#fff':'#f8fafc'}>
                          <td style={TD}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <ResidentAvatar url={r.avatarUrl} name={r.residentName} size={32} index={i} />
                              <span style={{ fontWeight:600, fontSize:13 }}>{r.residentName}</span>
                            </div>
                          </td>
                          <td style={{ ...TD, color:'#6b7280' }}>{r.barangay}</td>
                          <td style={TD}>
                            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                              <span style={{ width:8, height:8, borderRadius:'50%', background: categoryColors[r.itemCategory]||'#9ca3af', flexShrink:0 }} />
                              <span style={{ fontWeight:600 }}>{r.itemName}</span>
                            </div>
                          </td>
                          <td style={TD}><span style={{ fontWeight:700, color:'#d97706' }}>🪙 {r.points_spent?.toLocaleString()} pts</span></td>
                          <td style={{ ...TD, color:'#9ca3af', fontSize:12, whiteSpace:'nowrap' }}>{fmtDate(r.created_at)}</td>
                          <td style={TD}><StatusBadge status={r.status} map={REDEMPTION_STATUS} /></td>
                          <td style={TD}>
                            {r.status === 'pending' && (
                              <div style={{ display:'flex', gap:6 }}>
                                <button onClick={() => markClaimed(r)} disabled={processingId===r.id}
                                  style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:7, border:'1.5px solid #86efac', background:'#dcfce7', color:'#15803d', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', opacity:processingId===r.id?0.5:1 }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  Confirm Claimed
                                </button>
                                <button onClick={() => cancelRedemption(r)} disabled={processingId===r.id}
                                  style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:7, border:'1.5px solid #fca5a5', background:'#fee2e2', color:'#dc2626', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', opacity:processingId===r.id?0.5:1 }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  Cancel & Refund
                                </button>
                              </div>
                            )}
                            {r.status === 'claimed' && <span style={{ fontSize:11, color:'#6b7280' }}>{r.claimed_at ? `Claimed ${fmtDate(r.claimed_at)}` : 'Confirmed'}</span>}
                            {r.status === 'cancelled' && <span style={{ fontSize:11, color:'#9ca3af' }}>Points refunded</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ POINT LOG TAB ══ */}
          {activeTab === 'log' && (
            <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden' }}>
              <div style={{ padding:'18px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:'#1f2937' }}>Point Transaction Log</div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>Audit trail of all awarded points across all barangays</div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <div style={{ display:'flex', gap:4 }}>
                    {[
                      { key:'all',            label:'All' },
                      { key:'official_award', label:'Official Award' },
                    ].map(f => (
                      <button key={f.key} onClick={() => setLogFilter(f.key)}
                        style={{ padding:'5px 12px', borderRadius:20, border:`1.5px solid ${logFilter===f.key?'#1E3A5F':'#e5e7eb'}`, background:logFilter===f.key?'#1E3A5F':'#f9fafb', color:logFilter===f.key?'#fff':'#374151', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ position:'relative' }}>
                    <svg style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" placeholder="Search resident or reason…" value={logSearch} onChange={e => setLogSearch(e.target.value)}
                      style={{ padding:'7px 12px 7px 28px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:12, color:'#374151', outline:'none', background:'#f9fafb', width:200 }} />
                  </div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:1, background:'#f1f5f9' }}>
                {[
                  { label:'Total Transactions', value: pointLog.length,                                                    color:'#1E3A5F' },
                  { label:'Total Pts Awarded',  value: pointLog.reduce((s,r)=>s+(r.points||0),0).toLocaleString(),        color:'#16a34a' },
                  { label:'Official Awards',    value: pointLog.filter(r=>r.type==='official_award').length,              color:'#d97706' },
                ].map(s => (
                  <div key={s.label} style={{ background:'#fff', padding:'14px 20px' }}>
                    <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:s.color, marginTop:2 }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {logLoading ? (
                <div style={{ padding:'52px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <Spinner /><span style={{ fontSize:13, color:'#9ca3af' }}>Loading point log...</span>
                </div>
              ) : filteredLog.length === 0 ? (
                <div style={{ padding:'52px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div style={{ fontWeight:700, fontSize:15, color:'#374151' }}>No transactions found</div>
                  <div style={{ fontSize:13, color:'#9ca3af' }}>Point transactions will appear here as residents earn points.</div>
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        <th style={TH}>Date</th>
                        <th style={TH}>Resident</th>
                        <th style={TH}>Barangay</th>
                        <th style={TH}>Points</th>
                        <th style={TH}>Type</th>
                        <th style={TH}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLog.map((r,i) => (
                        <tr key={r.id}
                          style={{ backgroundColor: i%2===0?'#fff':'#f8fafc' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor='#f0f7ff'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor= i%2===0?'#fff':'#f8fafc'}>
                          <td style={{ ...TD, color:'#9ca3af', fontSize:12, whiteSpace:'nowrap' }}>{fmtDate(r.created_at)}</td>
                          <td style={TD}><span style={{ fontWeight:600, fontSize:13, color:'#111827' }}>{r.residentName}</span></td>
                          <td style={{ ...TD, color:'#6b7280' }}>{r.barangay}</td>
                          <td style={TD}><span style={{ fontWeight:800, fontSize:14, color:'#16a34a' }}>+{r.points?.toLocaleString()} pts</span></td>
                          <td style={TD}>
                            {r.type === 'official_award'
                              ? <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, background:'#fef3c7', color:'#92400e' }}>Official Award</span>
                              : <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, background:'#e0f2fe', color:'#0369a1' }}>Auto Award</span>
                            }
                          </td>
                          <td style={{ ...TD, color:'#6b7280', fontSize:12, maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.reason||'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ POINT REQUESTS TAB ══ */}
          {activeTab === 'point_requests' && (
            <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden' }}>
              <div style={{ padding:'18px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:'#1f2937' }}>Official Point Requests</div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>Officials request more points to award residents in their barangay</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  {[
                    { key:'pending',  label:`Pending (${pointRequests.filter(r=>r.status==='pending').length})` },
                    { key:'approved', label:'Approved' },
                    { key:'rejected', label:'Rejected' },
                    { key:'all',      label:'All' },
                  ].map(f => (
                    <button key={f.key} onClick={() => setRequestsFilter(f.key)}
                      style={{ padding:'5px 14px', borderRadius:20, border:`1.5px solid ${requestsFilter===f.key?'#1E3A5F':'#e5e7eb'}`, background:requestsFilter===f.key?'#1E3A5F':'#f9fafb', color:requestsFilter===f.key?'#fff':'#374151', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {requestsLoading ? (
                <div style={{ padding:'52px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <Spinner /><span style={{ fontSize:13, color:'#9ca3af' }}>Loading requests...</span>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div style={{ padding:'52px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>📬</div>
                  <div style={{ fontWeight:700, fontSize:15, color:'#374151' }}>No {requestsFilter !== 'all' ? requestsFilter : ''} requests</div>
                  <div style={{ fontSize:13, color:'#9ca3af' }}>When officials request more awarding points, they'll appear here.</div>
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        <th style={TH}>Official</th>
                        <th style={TH}>Barangay</th>
                        <th style={TH}>Points Requested</th>
                        <th style={TH}>Reason</th>
                        <th style={TH}>Submitted</th>
                        <th style={TH}>Status</th>
                        <th style={TH}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((r,i) => (
                        <tr key={r.id}
                          style={{ backgroundColor: i%2===0?'#fff':'#f8fafc' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor='#f0f7ff'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor= i%2===0?'#fff':'#f8fafc'}>
                          <td style={TD}><span style={{ fontWeight:600, fontSize:13 }}>{r.officialName}</span></td>
                          <td style={{ ...TD, color:'#6b7280' }}>Brgy. {r.barangay}</td>
                          <td style={TD}>
                            <span style={{ fontWeight:800, fontSize:14, color:'#1E3A5F' }}>+{r.points_requested?.toLocaleString()} pts</span>
                          </td>
                          <td style={{ ...TD, color:'#6b7280', fontSize:12, maxWidth:240 }}>
                            <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.reason || '—'}</div>
                            {r.admin_note && <div style={{ color:'#ef4444', marginTop:2, fontSize:11 }}>Note: {r.admin_note}</div>}
                          </td>
                          <td style={{ ...TD, color:'#9ca3af', fontSize:12, whiteSpace:'nowrap' }}>{fmtDate(r.created_at)}</td>
                          <td style={TD}><StatusBadge status={r.status} map={REQUEST_STATUS} /></td>
                          <td style={TD}>
                            {r.status === 'pending' ? (
                              <div style={{ display:'flex', gap:6 }}>
                                <button onClick={() => approveRequest(r)} disabled={actionLoading===r.id}
                                  style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:7, border:'1.5px solid #86efac', background:'#dcfce7', color:'#15803d', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', opacity:actionLoading===r.id?0.5:1 }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  Approve
                                </button>
                                <button onClick={() => openRejectModal(r)} disabled={actionLoading===r.id}
                                  style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:7, border:'1.5px solid #fca5a5', background:'#fee2e2', color:'#dc2626', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', opacity:actionLoading===r.id?0.5:1 }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  Reject
                                </button>
                              </div>
                            ) : r.status === 'approved' ? (
                              <span style={{ fontSize:11, color:'#16a34a', fontWeight:600 }}>✅ Budget updated</span>
                            ) : (
                              <span style={{ fontSize:11, color:'#9ca3af' }}>Rejected {fmtDate(r.reviewed_at)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ REJECT MODAL ══ */}
          {rejectModal.open && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
              <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden' }}>
                <div style={{ background:'linear-gradient(135deg,#dc2626,#b91c1c)', padding:'18px 24px', display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>❌</div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:15, color:'#fff' }}>Reject Request</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)', marginTop:1 }}>Brgy. {rejectModal.req?.barangay} — {rejectModal.req?.points_requested?.toLocaleString()} pts</div>
                  </div>
                  <button onClick={closeRejectModal} style={{ marginLeft:'auto', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', borderRadius:8, padding:'5px 8px', cursor:'pointer', fontSize:15, lineHeight:1 }}>✕</button>
                </div>
                <div style={{ padding:'20px 24px' }}>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:6 }}>Reason for rejection (optional)</label>
                    <textarea placeholder="e.g. Insufficient justification provided. Please resubmit with more detail."
                      value={rejectModal.note} onChange={e => setRejectModal(m => ({ ...m, note:e.target.value }))} rows={3}
                      style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, color:'#374151', outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit', lineHeight:1.5 }} />
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={closeRejectModal}
                      style={{ flex:1, padding:'10px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      Cancel
                    </button>
                    <button onClick={confirmReject} disabled={actionLoading===rejectModal.req?.id}
                      style={{ flex:1, padding:'10px', borderRadius:10, border:'none', background:'#dc2626', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity:actionLoading===rejectModal.req?.id?0.6:1 }}>
                      {actionLoading===rejectModal.req?.id ? 'Rejecting...' : 'Confirm Reject'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminRewards;
