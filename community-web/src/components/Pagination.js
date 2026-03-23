import React from 'react';

/**
 * Reusable pagination bar.
 *
 * Props:
 *   page        – current 1-based page number
 *   totalPages  – total number of pages
 *   onPage      – (newPage: number) => void
 */
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 1; // pages around current
  const left  = Math.max(1, page - delta);
  const right = Math.min(totalPages, page + delta);

  if (left > 1)           pages.push(1);
  if (left > 2)           pages.push('…');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push('…');
  if (right < totalPages)     pages.push(totalPages);

  const btn = (label, target, disabled, active) => (
    <button
      key={typeof label === 'number' ? label : `${label}-${target}`}
      onClick={() => !disabled && typeof target === 'number' && onPage(target)}
      disabled={disabled}
      style={{
        minWidth: 34, height: 34, padding: '0 10px',
        borderRadius: 8,
        border: active ? 'none' : '1.5px solid #e5e7eb',
        background: active ? '#2563eb' : disabled ? '#f9fafb' : '#fff',
        color: active ? '#fff' : disabled ? '#d1d5db' : '#374151',
        fontSize: 13, fontWeight: active ? 700 : 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Poppins, sans-serif',
        transition: 'background 0.15s, color 0.15s',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, padding: '14px 20px', borderTop: '1px solid #f1f5f9' }}>
      {btn(
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
        page - 1, page === 1, false
      )}

      {pages.map((p, i) =>
        p === '…'
          ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: '#9ca3af', fontSize: 13, userSelect: 'none' }}>…</span>
          : btn(p, p, false, p === page)
      )}

      {btn(
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
        page + 1, page === totalPages, false
      )}
    </div>
  );
}

export default Pagination;
