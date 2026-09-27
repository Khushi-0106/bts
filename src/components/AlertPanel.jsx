// ============================================================================
// AlertPanel.jsx — Live Warning & Critical Events
// ============================================================================

import React, { useState } from 'react'
import { useAssetData } from '../context/DataContext.jsx'

const ICONS = {
  CRITICAL: { icon: '🔴', bg: 'var(--red-dim)' },
  MEDIUM: { icon: '⚠', bg: 'var(--amber-dim)' },
  LOW: { icon: 'ℹ', bg: 'var(--accent-dim)' },
  RESOLVED: { icon: '✓', bg: 'var(--green-dim)' },
}

export default function AlertPanel({ withFilters = false, limit }) {
  const { alerts = [] } = useAssetData()
  const [filter, setFilter] = useState('ALL')

  const safeAlerts = alerts || []
  const filtered = safeAlerts.filter(a => {
    if (filter === 'ALL') return true
    if (filter === 'WARNING') return a.level === 'MEDIUM' || a.level === 'LOW'
    return a.level === filter
  })
  const list = limit ? filtered.slice(0, limit) : filtered

  return (
    <div className="panel panel-pad fade-in">
      <div className="section-title">Alert Center</div>
      <p className="section-sub">Live alerts generated from sensor threshold evaluation and anomaly detection.</p>

      {withFilters && (
        <div className="alert-filters">
          {['ALL', 'WARNING', 'CRITICAL', 'RESOLVED'].map(f => (
            <button key={f} className={'filter-chip' + (filter === f ? ' active' : '')} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      )}

      <div>
        {list.length === 0 && <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>No alerts in this category.</div>}
        {list.map((a, idx) => {
          const meta = ICONS[a.level] || ICONS.LOW
          return (
            <div className="alert-item" key={a.id || idx}>
              <div className="alert-icon" style={{ background: meta.bg }}>{meta.icon}</div>
              <div className="alert-body">
                <div className="alert-text">{a.text}</div>
                <div className="alert-meta">{a.minsAgo} minute{a.minsAgo === 1 ? '' : 's'} ago · {a.level}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
