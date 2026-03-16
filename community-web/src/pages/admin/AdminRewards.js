import React from 'react';
import '../../officials.css';
import AdminSidebar from '../../components/AdminSidebar';
import OfficialTopbar from '../../components/OfficialTopbar';

const TIERS = [
  { points: '1,500 Points', cls: 'off-tier-gold'  },
  { points: '500 Points',   cls: 'off-tier-green' },
  { points: '300 Points',   cls: 'off-tier-blue'  },
  { points: '100 Points',   cls: 'off-tier-red'   },
];

const CONTRIBUTORS = [
  { name: 'John Dewey', points: '2,000 Points' },
  { name: 'John Dewey', points: '1,000 Points' },
  { name: 'John Dewey', points: '950 Points'   },
];

function AdminRewards() {
  return (
    <div className="off-layout">
      <AdminSidebar />
      <div className="off-main">
        <OfficialTopbar />
        <div className="off-content">

          <h1 className="off-page-title">Rewards</h1>
          <p className="off-page-sub">Monitor barangay reward contributions.</p>

          <div className="off-reward-grid">
            {TIERS.map(t => (
              <div key={t.points} className={`off-reward-tier ${t.cls}`}>
                {t.points}
              </div>
            ))}
          </div>

          <div className="off-card">
            <h3 className="off-card-title">Top Contributors</h3>
            {CONTRIBUTORS.map((c, i) => (
              <div key={i} className="off-contributor-row">
                <div className="off-contributor-info">
                  <div className="off-contributor-avatar">{c.name[0]}</div>
                  {c.name}
                </div>
                <span className="off-contributor-pts">{c.points}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminRewards;
