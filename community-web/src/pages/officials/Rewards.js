import React from 'react';
import '../../officials.css';
import OfficialSidebar from '../../components/OfficialSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';
import { useOfficialProfile } from '../../hooks/useOfficialProfile';

const TIERS = [
  { points: '1,500 Points', cls: 'off-tier-gold'  },
  { points: '500 Points',   cls: 'off-tier-green' },
  { points: '300 Points',   cls: 'off-tier-blue'  },
  { points: '100 Points',   cls: 'off-tier-red'   },
];

function Rewards() {
  const { barangay, loading } = useOfficialProfile();

  return (
    <div className="off-layout">
      <OfficialSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <h1 className="off-page-title">Rewards</h1>
          <p className="off-page-sub">
            {!loading && barangay ? `Monitor reward contributions for ${barangay}.` : 'Monitor barangay reward contributions.'}
          </p>

          {/* Point tier cards */}
          <div className="off-reward-grid">
            {TIERS.map(t => (
              <div key={t.points} className={`off-reward-tier ${t.cls}`}>
                {t.points}
              </div>
            ))}
          </div>

          {/* Top contributors */}
          <div className="off-card">
            <h3 className="off-card-title">Top Contributors</h3>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>No contributor records yet.</p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Rewards;
