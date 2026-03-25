import React, { useState, useEffect, useCallback } from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';
import { supabase } from '../../supabaseClient';

// ── Tier helpers (used for contributor row badges only) ─────────────────────
const TIERS = [
  { label: 'Gold',   min: 1500, bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)' },
  { label: 'Silver', min: 1000, bg: 'linear-gradient(135deg, #9ca3af, #6b7280)' },
  { label: 'Green',  min: 500,  bg: 'linear-gradient(135deg, #4ade80, #16a34a)' },
  { label: 'Blue',   min: 300,  bg: 'linear-gradient(135deg, #60a5fa, #1d4ed8)' },
  { label: 'Red',    min: 100,  bg: 'linear-gradient(135deg, #f87171, #dc2626)' },
];
function getTier(pts) { return TIERS.find(t => (pts || 0) >= t.min) || null; }

const rankColors  = ['#f59e0b', '#9ca3af', '#cd7f32', '#6b7280', '#6b7280'];
const avatarColors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444'];
const medals = ['🥇','🥈','🥉'];

const categoryColors = { food:'#FF7043', school_supplies:'#1565C0', hygiene:'#2E7D32', household:'#6A1B9A' };

const REDEMPTION_STATUS = {
  pending:   { bg:'#fef9c3', color:'#92400e', dot:'#f59e0b', label:'Pending'   },
  claimed:   { bg:'#dcfce7', color:'#166534', dot:'#22c55e', label:'Claimed'   },
  cancelled: { bg:'#f1f5f9', color:'#6b7280', dot:'#9ca3af', label:'Cancelled' },
};

function resolveAvatar(url) {
  if (!url) return null;
  if (url.startsWith('preset_')) return `/avatar_${url}.png`;
  return url;
}

function ResidentAvatar({ url, name, size = 36, index = 0 }) {
  const src = resolveAvatar(url);
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e5e7eb' }} />;
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: avatarColors[index % 5], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.36, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function TierBadge({ points }) {
  const tier = getTier(points);
  if (!tier) return <span style={{ fontSize: 11, color: '#9ca3af' }}>Starter</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: tier.bg, color: '#fff' }}>
      {tier.label}
    </span>
  );
}

function RedemptionBadge({ status }) {
  const s = REDEMPTION_STATUS[status] || REDEMPTION_STATUS.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function CodeBadge({ code }) {
  const [copied, setCopied] = useState(false);
  if (!code) return <span style={{ color: '#9ca3af', fontSize: 11 }}>—</span>;
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={handleCopy} title="Click to copy"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, border: '1.5px solid #c7d2fe', background: copied ? '#e0e7ff' : '#f5f3ff', cursor: 'pointer', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#4338ca', letterSpacing: '0.08em' }}>
      {code}
      {copied
        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4338ca" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4338ca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      }
    </button>
  );
}

function ExpiryBadge({ iso }) {
  if (!iso) return <span style={{ color: '#9ca3af', fontSize: 11 }}>—</span>;
  const ms   = new Date(iso) - new Date();
  const days = Math.ceil(ms / 86400000);
  const expired = days <= 0;
  const urgent  = days <= 1 && !expired;
  const bg    = expired ? '#fef2f2' : urgent ? '#fff7ed' : '#f0fdf4';
  const color = expired ? '#dc2626' : urgent ? '#ea580c' : '#16a34a';
  const label = expired ? 'Expired' : days === 1 ? 'Expires today' : `${days}d left`;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: bg, color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

const TH = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };
const TD = { padding: '10px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' };

// ── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.2, marginTop: 2 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
function Rewards() {
  const { barangay, isCapitan, canManage, loading } = useOfficialProfile();
  const canAct = isCapitan || canManage;
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [officialId, setOfficialId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setOfficialId(data.user?.id || null));
  }, []);

  // ── Leaderboard ────────────────────────────────────────────────────────────
  const [contributors, setContributors] = useState([]);
  const [fetching, setFetching]         = useState(false);
  const [search, setSearch]             = useState('');

  const load = useCallback(async () => {
    if (!barangay) return;
    setFetching(true);
    const { data } = await supabase
      .from('users')
      .select('auth_id, first_name, last_name, points, avatar_url')
      .eq('barangay', barangay)
      .order('points', { ascending: false });
    setContributors((data || []).map((u, i) => ({
      ...u,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown',
      rank: i + 1,
    })));
    setFetching(false);
  }, [barangay]);

  // ── Budget ─────────────────────────────────────────────────────────────────
  const [budget, setBudget]             = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(false);

  const loadBudget = useCallback(async () => {
    if (!barangay) return;
    setBudgetLoading(true);
    const { data } = await supabase
      .from('barangay_budgets')
      .select('*')
      .eq('barangay', barangay)
      .single();
    setBudget(data || null);
    setBudgetLoading(false);
  }, [barangay]);

  // ── Request Points Modal ───────────────────────────────────────────────────
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestPoints, setRequestPoints]       = useState('');
  const [requestReason, setRequestReason]       = useState('');
  const [requestLoading, setRequestLoading]     = useState(false);
  const [requestSuccess, setRequestSuccess]     = useState(false);

  const MAX_REQUEST_PTS = 50000;

  const submitPointRequest = async () => {
    const pts = parseInt(requestPoints);
    if (!pts || pts <= 0 || pts > MAX_REQUEST_PTS || !requestReason.trim()) return;
    setRequestLoading(true);
    await supabase.from('point_requests').insert({
      barangay,
      requested_by_official_id: officialId,
      points_requested: pts,
      reason: requestReason.trim(),
      status: 'pending',
    });
    setRequestLoading(false);
    setRequestSuccess(true);
    setTimeout(() => {
      setShowRequestModal(false);
      setRequestSuccess(false);
      setRequestPoints('');
      setRequestReason('');
    }, 2500);
  };

  const closeRequestModal = () => {
    if (requestLoading) return;
    setShowRequestModal(false);
    setRequestPoints('');
    setRequestReason('');
    setRequestSuccess(false);
  };

  // ── Redemptions ────────────────────────────────────────────────────────────
  const [redemptions, setRedemptions]               = useState([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);
  const [processingId, setProcessingId]             = useState(null);
  const [redemptionFilter, setRedemptionFilter]     = useState('pending');

  const loadRedemptions = useCallback(async () => {
    if (!barangay) return;
    setRedemptionsLoading(true);
    const { data: uData } = await supabase.from('users').select('auth_id, first_name, last_name, avatar_url').eq('barangay', barangay);
    const authIds = (uData || []).map(u => u.auth_id);
    if (authIds.length === 0) { setRedemptions([]); setRedemptionsLoading(false); return; }

    const [{ data: rData }, { data: iData }] = await Promise.all([
      supabase.from('redemptions').select('*').in('user_id', authIds).order('created_at', { ascending: false }),
      supabase.from('reward_items').select('id, name, category'),
    ]);
    const itemMap = {}; (iData || []).forEach(i => { itemMap[i.id] = i; });
    const userMap = {}; (uData || []).forEach(u => { userMap[u.auth_id] = u; });
    setRedemptions((rData || []).map(r => ({
      ...r,
      itemName:     itemMap[r.reward_item_id]?.name     || 'Unknown Item',
      itemCategory: itemMap[r.reward_item_id]?.category || '',
      residentName: userMap[r.user_id] ? `${userMap[r.user_id].first_name || ''} ${userMap[r.user_id].last_name || ''}`.trim() : 'Unknown',
      avatarUrl:    userMap[r.user_id]?.avatar_url || null,
    })));
    setRedemptionsLoading(false);
  }, [barangay]);

  const confirmPickup = async (r) => {
    setProcessingId(r.id);
    await supabase.from('redemptions').update({
      status:                 'claimed',
      claimed_at:             new Date().toISOString(),
      claimed_by_official_id: officialId,
    }).eq('id', r.id);
    setProcessingId(null);
    loadRedemptions();
  };

  // ── Reward Items ───────────────────────────────────────────────────────────
  const [rewardItems,  setRewardItems]  = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemModal,    setItemModal]    = useState({ open:false, item:null });
  const [itemForm,     setItemForm]     = useState({ name:'', description:'', category:'food', points_required:'', stock:'', is_active:true });
  const [itemSaving,   setItemSaving]   = useState(false);
  const [stockModal,   setStockModal]   = useState({ open:false, item:null, newStock:0 });
  const [deletingId,   setDeletingId]   = useState(null);

  const CATEGORIES = [
    { value:'food',            label:'🍱 Food' },
    { value:'school_supplies', label:'🎒 School Supplies' },
    { value:'hygiene',         label:'🧴 Hygiene' },
    { value:'household',       label:'🏠 Household' },
  ];

  const loadRewardItems = useCallback(async () => {
    if (!barangay) return;
    setItemsLoading(true);
    const { data } = await supabase.from('reward_items').select('*').eq('barangay', barangay).order('category').order('name');
    setRewardItems(data || []);
    setItemsLoading(false);
  }, [barangay]);

  const openAddModal = () => {
    setItemForm({ name:'', description:'', category:'food', points_required:'', stock:'', is_active:true });
    setItemModal({ open:true, item:null });
  };
  const openEditModal = (item) => {
    setItemForm({ name:item.name, description:item.description||'', category:item.category, points_required:String(item.points_required), stock:String(item.stock), is_active:item.is_active });
    setItemModal({ open:true, item });
  };
  const closeItemModal = () => { if (itemSaving) return; setItemModal({ open:false, item:null }); };

  const saveItem = async () => {
    if (!itemForm.name.trim() || !itemForm.points_required || !itemForm.stock) return;
    setItemSaving(true);
    const payload = {
      name:            itemForm.name.trim(),
      description:     itemForm.description.trim() || null,
      category:        itemForm.category,
      points_required: parseInt(itemForm.points_required),
      stock:           parseInt(itemForm.stock),
      is_active:       itemForm.is_active,
      barangay,
    };
    if (itemModal.item) {
      await supabase.from('reward_items').update(payload).eq('id', itemModal.item.id);
    } else {
      await supabase.from('reward_items').insert(payload);
    }
    setItemSaving(false);
    closeItemModal();
    loadRewardItems();
  };

  const toggleActive = async (item) => {
    await supabase.from('reward_items').update({ is_active: !item.is_active }).eq('id', item.id);
    loadRewardItems();
  };

  const openStockModal = (item) => setStockModal({ open:true, item, newStock:item.stock });
  const closeStockModal = () => setStockModal({ open:false, item:null, newStock:0 });
  const saveStock = async () => {
    await supabase.from('reward_items').update({ stock: stockModal.newStock }).eq('id', stockModal.item.id);
    closeStockModal();
    loadRewardItems();
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setDeletingId(item.id);
    await supabase.from('reward_items').delete().eq('id', item.id);
    setDeletingId(null);
    loadRewardItems();
  };

  // ── Load on tab / barangay change ─────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'leaderboard') load();
    if (activeTab === 'redemptions') loadRedemptions();
    if (activeTab === 'items') loadRewardItems();
  }, [activeTab, load, loadRedemptions, loadRewardItems]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadBudget(); }, [loadBudget]);
  useEffect(() => { loadRedemptions(); }, [loadRedemptions]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = contributors.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );
  const pendingCount   = redemptions.filter(r => r.status === 'pending').length;
  const totalPtsEarned = contributors.reduce((s, c) => s + (c.points || 0), 0);
  const activeContributors = contributors.filter(c => (c.points || 0) > 0).length;
  const allocated = budget?.allocated_points || 0;
  const used      = budget?.used_points || 0;
  const remaining = Math.max(0, allocated - used);
  const budgetPct = allocated > 0 ? Math.min(100, Math.round((used / allocated) * 100)) : 0;

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <div style={{ marginBottom: 24 }}>
            <h1 className="off-page-title" style={{ marginBottom: 2 }}>Rewards</h1>
            <p className="off-page-sub" style={{ margin: 0 }}>
              {!loading && barangay ? `Monitor reward contributions for Barangay ${barangay}` : 'Monitor barangay reward contributions'}
            </p>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e5e7eb' }}>
            {[
              { key: 'leaderboard', label: '🏆 Leaderboard' },
              { key: 'redemptions', label: pendingCount > 0 ? `🎁 Redemptions (${pendingCount})` : '🎁 Redemptions' },
              { key: 'items',       label: '🏷️ Reward Items' },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ padding: '10px 20px', border: 'none', background: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  color: activeTab === t.key ? '#1E3A5F' : '#6b7280',
                  borderBottom: activeTab === t.key ? '3px solid #1E3A5F' : '3px solid transparent',
                  marginBottom: -2, transition: 'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ══ REDEMPTIONS TAB ══ */}
          {activeTab === 'redemptions' && (
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Redemption Requests</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Confirm in-person pickups at the barangay hall</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { key: 'pending', label: `Pending (${redemptions.filter(r => r.status === 'pending').length})` },
                    { key: 'claimed', label: `Claimed (${redemptions.filter(r => r.status === 'claimed').length})` },
                    { key: 'all',     label: 'All' },
                  ].map(f => (
                    <button key={f.key} onClick={() => setRedemptionFilter(f.key)}
                      style={{ padding: '5px 14px', borderRadius: 20, border: `1.5px solid ${redemptionFilter === f.key ? '#1E3A5F' : '#e5e7eb'}`, background: redemptionFilter === f.key ? '#1E3A5F' : '#f9fafb', color: redemptionFilter === f.key ? '#fff' : '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {redemptionsLoading ? (
                <div style={{ padding: '52px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #e0e7ef', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>Loading redemptions...</span>
                </div>
              ) : redemptions.filter(r => redemptionFilter === 'all' || r.status === redemptionFilter).length === 0 ? (
                <div style={{ padding: '52px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#374151' }}>No {redemptionFilter !== 'all' ? redemptionFilter : ''} redemptions</div>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>When residents request rewards, they'll appear here for in-person pickup confirmation.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={TH}>Resident</th>
                        <th style={TH}>Reward Item</th>
                        <th style={TH}>Pts Spent</th>
                        <th style={TH}>Code</th>
                        <th style={TH}>Claim By</th>
                        <th style={TH}>Requested</th>
                        <th style={TH}>Status</th>
                        <th style={TH}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {redemptions.filter(r => redemptionFilter === 'all' || r.status === redemptionFilter).map((r, i) => (
                        <tr key={r.id}
                          style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f7ff'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#fff' : '#f8fafc'}>
                          <td style={TD}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <ResidentAvatar url={r.avatarUrl} name={r.residentName} size={32} index={i} />
                              <span style={{ fontWeight: 600, fontSize: 13 }}>{r.residentName}</span>
                            </div>
                          </td>
                          <td style={TD}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: categoryColors[r.itemCategory] || '#9ca3af', flexShrink: 0 }} />
                              <span style={{ fontWeight: 600 }}>{r.itemName}</span>
                            </div>
                          </td>
                          <td style={TD}>
                            <span style={{ fontWeight: 700, color: '#d97706' }}>🪙 {r.points_spent?.toLocaleString()} pts</span>
                          </td>
                          <td style={TD}><CodeBadge code={r.redemption_code} /></td>
                          <td style={TD}><ExpiryBadge iso={r.code_expires_at} /></td>
                          <td style={{ ...TD, color: '#9ca3af', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(r.created_at)}</td>
                          <td style={TD}><RedemptionBadge status={r.status} /></td>
                          <td style={TD}>
                            {r.status === 'pending' ? (
                              canAct ? (
                              <button onClick={() => confirmPickup(r)} disabled={processingId === r.id}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, border: '1.5px solid #86efac', background: '#dcfce7', color: '#15803d', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: processingId === r.id ? 0.5 : 1 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                {processingId === r.id ? 'Confirming...' : 'Confirm Pickup'}
                              </button>
                              ) : <span style={{ fontSize: 11, color: '#9ca3af' }}>View Only</span>
                            ) : r.status === 'claimed' ? (
                              <span style={{ fontSize: 11, color: '#6b7280' }}>Picked up {fmtDate(r.claimed_at)}</span>
                            ) : (
                              <span style={{ fontSize: 11, color: '#9ca3af' }}>Cancelled</span>
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

          {/* ══ LEADERBOARD TAB ══ */}
          {activeTab === 'leaderboard' && <>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              <StatCard icon="👥" label="Total Residents"    value={contributors.length}            color="#1E3A5F" sub="in your barangay" />
              <StatCard icon="🪙" label="Total Pts Earned"   value={totalPtsEarned.toLocaleString()} color="#d97706" sub="across all residents" />
              <StatCard icon="⭐" label="Active Contributors" value={activeContributors}              color="#7c3aed" sub="residents with points" />
              <StatCard icon="🎁" label="Pending Redemptions" value={pendingCount}                   color="#16a34a" sub="awaiting pickup" />
            </div>

            {/* Two-column layout */}
            <div className="off-rewards-layout">

              {/* Top contributors table */}
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Top Contributors</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Residents with the most reward points in {barangay || 'your barangay'}</div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" placeholder="Search resident…" value={search} onChange={e => setSearch(e.target.value)}
                      style={{ padding: '7px 12px 7px 30px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#f9fafb', width: 200 }} />
                  </div>
                </div>

                {fetching ? (
                  <div style={{ padding: '52px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, border: '3px solid #e0e7ef', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>Loading contributors...</span>
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: '52px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#374151' }}>{search ? 'No results found' : 'No contributor records yet'}</div>
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>{search ? 'Try a different search term.' : 'Reward points will appear here as residents engage with the system.'}</div>
                  </div>
                ) : (
                  <div style={{ padding: '8px 16px 16px' }}>
                    {filtered.map((c, i) => (
                      <div key={c.auth_id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, marginBottom: 4, backgroundColor: i % 2 === 0 ? '#ffffff' : '#f0f4ff', cursor: 'default' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dbeafe'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#ffffff' : '#f0f4ff'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: rankColors[Math.min(i, 4)], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                            {i < 3 ? medals[i] : c.rank}
                          </div>
                          <ResidentAvatar url={c.avatar_url} name={c.name} size={36} index={i} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{c.name}</div>
                            <TierBadge points={c.points || 0} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: rankColors[Math.min(i, 4)] }}>{(c.points || 0).toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>points</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget & Points Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Barangay Budget */}
                <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>Awarding Budget</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Points you can award to residents</div>
                    </div>
                    <button onClick={() => setShowRequestModal(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: 'none', background: '#1E3A5F', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Request Points
                    </button>
                  </div>
                  <div style={{ padding: '20px 24px' }}>
                    {budgetLoading ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                        <div style={{ width: 24, height: 24, border: '3px solid #e0e7ef', borderTopColor: '#1E3A5F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      </div>
                    ) : budget ? (
                      <>
                        {/* Remaining (big) */}
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remaining</div>
                          <div style={{ fontSize: 42, fontWeight: 900, color: remaining > 0 ? '#1E3A5F' : '#dc2626', lineHeight: 1.1, marginTop: 4 }}>
                            {remaining.toLocaleString()}
                          </div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>points available to award</div>
                        </div>
                        {/* Progress bar */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Used</span>
                            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 700 }}>{budgetPct}%</span>
                          </div>
                          <div style={{ height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${budgetPct}%`, borderRadius: 999, background: budgetPct >= 90 ? 'linear-gradient(90deg,#f87171,#dc2626)' : budgetPct >= 70 ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#34d399,#059669)', transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                        {/* Used / Allocated */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px' }}>
                            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Used</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#374151', marginTop: 2 }}>{used.toLocaleString()}</div>
                          </div>
                          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px' }}>
                            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Allocated</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#374151', marginTop: 2 }}>{allocated.toLocaleString()}</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>No budget allocated yet</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, marginBottom: 16 }}>Request points from the admin to start awarding residents.</div>
                        <button onClick={() => setShowRequestModal(true)}
                          style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: '#1E3A5F', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Request Initial Budget
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick note */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
                  <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
                    <strong>How awarding works:</strong> When you resolve a resident's report, you can award points manually. Those points are deducted from your barangay's budget. Request more from admin when needed.
                  </div>
                </div>

              </div>
            </div>
          </>}

          {/* ══ REWARD ITEMS TAB ══ */}
          {activeTab === 'items' && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:16, color:'#1f2937' }}>Reward Catalog — Barangay {barangay}</div>
                  <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>Manage reward items residents can redeem with their points in your barangay</div>
                </div>
                {canAct && (
                <button onClick={openAddModal}
                  style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:10, border:'none', background:'#1E3A5F', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Reward Item
                </button>
                )}
              </div>

              <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
                {[
                  { label:'Total Items',  value: rewardItems.length,                        color:'#1E3A5F' },
                  { label:'Active',       value: rewardItems.filter(i=>i.is_active).length, color:'#16a34a' },
                  { label:'Out of Stock', value: rewardItems.filter(i=>i.stock===0).length, color:'#dc2626' },
                ].map(s => (
                  <div key={s.label} style={{ background:'#fff', borderRadius:10, padding:'10px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.07)', display:'flex', gap:10, alignItems:'center' }}>
                    <span style={{ fontSize:13, color:'#9ca3af', fontWeight:600 }}>{s.label}</span>
                    <span style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>

              {itemsLoading ? (
                <div style={{ padding:'52px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, border:'3px solid #e0e7ef', borderTopColor:'#1E3A5F', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize:13, color:'#9ca3af' }}>Loading reward items...</span>
                </div>
              ) : rewardItems.length === 0 ? (
                <div style={{ background:'#fff', borderRadius:16, padding:'52px 24px', textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>🎁</div>
                  <div style={{ fontWeight:700, fontSize:16, color:'#374151', marginBottom:6 }}>No reward items yet</div>
                  <div style={{ fontSize:13, color:'#9ca3af', marginBottom:20 }}>Add items for your barangay's residents to redeem with their points.</div>
                  <button onClick={openAddModal} style={{ padding:'9px 20px', borderRadius:9, border:'none', background:'#1E3A5F', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    Add First Item
                  </button>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
                  {rewardItems.map(item => {
                    const catColor = categoryColors[item.category] || '#9ca3af';
                    const catLabel = { food:'🍱 Food', school_supplies:'🎒 School', hygiene:'🧴 Hygiene', household:'🏠 Household' }[item.category] || item.category;
                    return (
                      <div key={item.id} style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden', opacity:item.is_active?1:0.6, display:'flex', flexDirection:'column' }}>
                        <div style={{ height:5, background:catColor }} />
                        <div style={{ padding:'16px 18px', flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:700, fontSize:14, color:'#111827' }}>{item.name}</div>
                              {item.description && <div style={{ fontSize:12, color:'#6b7280', marginTop:3 }}>{item.description}</div>}
                            </div>
                            <span style={{ padding:'3px 9px', borderRadius:999, fontSize:10, fontWeight:700, background:item.is_active?'#dcfce7':'#f1f5f9', color:item.is_active?'#166534':'#6b7280', whiteSpace:'nowrap', flexShrink:0 }}>
                              {item.is_active?'Active':'Inactive'}
                            </span>
                          </div>
                          <div style={{ display:'flex', gap:8 }}>
                            <div style={{ flex:1, background:'#fffbeb', borderRadius:9, padding:'8px 12px', textAlign:'center' }}>
                              <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600 }}>POINTS</div>
                              <div style={{ fontSize:16, fontWeight:800, color:'#d97706' }}>{item.points_required.toLocaleString()}</div>
                            </div>
                            <div style={{ flex:1, background: item.stock===0?'#fef2f2':'#f0fdf4', borderRadius:9, padding:'8px 12px', textAlign:'center' }}>
                              <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600 }}>STOCK</div>
                              <div style={{ fontSize:16, fontWeight:800, color: item.stock===0?'#dc2626':'#16a34a' }}>{item.stock}</div>
                            </div>
                            <div style={{ flex:1, background:'#f8fafc', borderRadius:9, padding:'8px 12px', textAlign:'center' }}>
                              <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600 }}>CATEGORY</div>
                              <div style={{ fontSize:12, fontWeight:700, color:catColor, marginTop:2 }}>{catLabel}</div>
                            </div>
                          </div>
                          {canAct && (
                          <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
                            <button onClick={() => openEditModal(item)}
                              style={{ flex:1, padding:'6px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                              ✏️ Edit
                            </button>
                            <button onClick={() => openStockModal(item)}
                              style={{ flex:1, padding:'6px', borderRadius:8, border:'1.5px solid #bfdbfe', background:'#eff6ff', color:'#1d4ed8', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                              📦 Stock
                            </button>
                            <button onClick={() => toggleActive(item)}
                              style={{ flex:1, padding:'6px', borderRadius:8, border:`1.5px solid ${item.is_active?'#fde68a':'#bbf7d0'}`, background:item.is_active?'#fefce8':'#f0fdf4', color:item.is_active?'#92400e':'#15803d', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                              {item.is_active?'⏸ Pause':'▶ Activate'}
                            </button>
                            <button onClick={() => deleteItem(item)} disabled={deletingId===item.id}
                              style={{ padding:'6px 10px', borderRadius:8, border:'1.5px solid #fca5a5', background:'#fee2e2', color:'#dc2626', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity:deletingId===item.id?0.5:1 }}>
                              🗑
                            </button>
                          </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Item Modal */}
              {itemModal.open && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
                  <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden' }}>
                    <div style={{ background:'linear-gradient(135deg,#1E3A5F,#2563eb)', padding:'18px 24px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏷️</div>
                      <div>
                        <div style={{ fontWeight:800, fontSize:15, color:'#fff' }}>{itemModal.item ? 'Edit Reward Item' : 'Add Reward Item'}</div>
                        <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)', marginTop:1 }}>Barangay {barangay}</div>
                      </div>
                      <button onClick={closeItemModal} style={{ marginLeft:'auto', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', borderRadius:8, padding:'5px 8px', cursor:'pointer', fontSize:15 }}>✕</button>
                    </div>
                    <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
                      <div>
                        <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>Item Name <span style={{ color:'#dc2626' }}>*</span></label>
                        <input value={itemForm.name} onChange={e => setItemForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Rice Pack (5kg)"
                          style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, outline:'none', boxSizing:'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>Description</label>
                        <textarea value={itemForm.description} onChange={e => setItemForm(f=>({...f,description:e.target.value}))} rows={2} placeholder="Optional description..."
                          style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} />
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <div>
                          <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>Category <span style={{ color:'#dc2626' }}>*</span></label>
                          <select value={itemForm.category} onChange={e => setItemForm(f=>({...f,category:e.target.value}))}
                            style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, outline:'none', background:'#fff' }}>
                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>Points Required <span style={{ color:'#dc2626' }}>*</span></label>
                          <input type="number" min="1" value={itemForm.points_required} onChange={e => setItemForm(f=>({...f,points_required:e.target.value}))} placeholder="e.g. 100"
                            style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, outline:'none', boxSizing:'border-box' }} />
                        </div>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <div>
                          <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>Initial Stock <span style={{ color:'#dc2626' }}>*</span></label>
                          <input type="number" min="0" value={itemForm.stock} onChange={e => setItemForm(f=>({...f,stock:e.target.value}))} placeholder="e.g. 20"
                            style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:13, outline:'none', boxSizing:'border-box' }} />
                        </div>
                        <div>
                          <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>Status</label>
                          <button onClick={() => setItemForm(f=>({...f,is_active:!f.is_active}))}
                            style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:`1.5px solid ${itemForm.is_active?'#86efac':'#e5e7eb'}`, background:itemForm.is_active?'#dcfce7':'#f9fafb', color:itemForm.is_active?'#15803d':'#6b7280', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                            {itemForm.is_active ? '✅ Active' : '⏸ Inactive'}
                          </button>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:10, marginTop:4 }}>
                        <button onClick={closeItemModal}
                          style={{ flex:1, padding:'10px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                          Cancel
                        </button>
                        <button onClick={saveItem} disabled={itemSaving || !itemForm.name.trim() || !itemForm.points_required || !itemForm.stock}
                          style={{ flex:2, padding:'10px', borderRadius:10, border:'none', background: itemSaving || !itemForm.name.trim() || !itemForm.points_required || !itemForm.stock ? '#9ca3af' : '#1E3A5F', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                          {itemSaving ? 'Saving...' : itemModal.item ? 'Save Changes' : 'Add Item'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stock Modal */}
              {stockModal.open && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
                  <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:360, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden' }}>
                    <div style={{ background:'linear-gradient(135deg,#0369a1,#0284c7)', padding:'16px 20px', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:9, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>📦</div>
                      <div style={{ fontWeight:800, fontSize:14, color:'#fff' }}>Adjust Stock — {stockModal.item?.name}</div>
                      <button onClick={closeStockModal} style={{ marginLeft:'auto', background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', borderRadius:7, padding:'4px 7px', cursor:'pointer', fontSize:14 }}>✕</button>
                    </div>
                    <div style={{ padding:'20px 24px' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginBottom:20 }}>
                        <button onClick={() => setStockModal(m=>({...m, newStock:Math.max(0,m.newStock-1)}))}
                          style={{ width:40, height:40, borderRadius:'50%', border:'1.5px solid #e5e7eb', background:'#f9fafb', fontSize:20, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                        <input type="number" min="0" value={stockModal.newStock} onChange={e => setStockModal(m=>({...m,newStock:Math.max(0,parseInt(e.target.value)||0)}))}
                          style={{ width:80, textAlign:'center', padding:'10px', border:'1.5px solid #e5e7eb', borderRadius:9, fontSize:22, fontWeight:800, outline:'none' }} />
                        <button onClick={() => setStockModal(m=>({...m, newStock:m.newStock+1}))}
                          style={{ width:40, height:40, borderRadius:'50%', border:'1.5px solid #e5e7eb', background:'#f9fafb', fontSize:20, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                      </div>
                      <div style={{ display:'flex', gap:10 }}>
                        <button onClick={closeStockModal}
                          style={{ flex:1, padding:'10px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                        <button onClick={saveStock}
                          style={{ flex:2, padding:'10px', borderRadius:10, border:'none', background:'#0369a1', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Save Stock</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══ REQUEST POINTS MODAL ══ */}
          {showRequestModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
              <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #1E3A5F, #2563eb)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📬</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>Request Awarding Points</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Submit a request to the admin for your barangay</div>
                  </div>
                  <button onClick={closeRequestModal} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
                </div>

                <div style={{ padding: '24px' }}>
                  {requestSuccess ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#166534' }}>Request Submitted!</div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>The admin will review your request and respond shortly.</div>
                    </div>
                  ) : (
                    <>
                      {/* Barangay info */}
                      <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>📍</span>
                        <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Barangay {barangay}</span>
                        {budget && (
                          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>
                            Current remaining: <strong style={{ color: remaining > 0 ? '#1E3A5F' : '#dc2626' }}>{remaining.toLocaleString()} pts</strong>
                          </span>
                        )}
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                          Points to Request <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input type="number" min="1" max={MAX_REQUEST_PTS} placeholder="e.g. 500"
                          value={requestPoints}
                          onChange={e => setRequestPoints(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${requestPoints && parseInt(requestPoints) > MAX_REQUEST_PTS ? '#dc2626' : '#e5e7eb'}`, borderRadius: 9, fontSize: 14, color: '#374151', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
                        {requestPoints && parseInt(requestPoints) > MAX_REQUEST_PTS && (
                          <div style={{ fontSize: 11, color: '#dc2626', marginTop: 5 }}>
                            Maximum request is {MAX_REQUEST_PTS.toLocaleString()} points per request.
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                          Reason / Justification <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <textarea placeholder="Explain why you need more points (e.g. high volume of reports resolved this month, upcoming community cleanup event, etc.)"
                          value={requestReason} onChange={e => setRequestReason(e.target.value)} rows={4}
                          style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 13, color: '#374151', outline: 'none', background: '#fff', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }} />
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={closeRequestModal}
                          style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Cancel
                        </button>
                        <button onClick={submitPointRequest}
                          disabled={requestLoading || !requestPoints || parseInt(requestPoints) > MAX_REQUEST_PTS || !requestReason.trim()}
                          style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: requestLoading || !requestPoints || parseInt(requestPoints) > MAX_REQUEST_PTS || !requestReason.trim() ? '#9ca3af' : '#1E3A5F', color: '#fff', fontSize: 13, fontWeight: 700, cursor: requestLoading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                          {requestLoading ? 'Submitting...' : `Submit Request for ${requestPoints ? parseInt(requestPoints).toLocaleString() : '—'} pts`}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Rewards;
