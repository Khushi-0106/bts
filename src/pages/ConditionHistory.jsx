// ============================================================================
// ConditionHistory.jsx — Exact Timestamped Machine Condition Log
// ============================================================================

import React, { useState, useMemo } from 'react'
import { useAssetData } from '../context/DataContext.jsx'

export default function ConditionHistory() {
  const { records, asset, assetType, exportCSV, clearAllHistory } = useAssetData()
  const [filterState, setFilterState] = useState('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filterState !== 'ALL' && r.operatingState !== filterState) return false
      if (search) {
        const str = `${r.timestamp} ${r.operatingState} ${r.temperature} ${r.vibration} ${r.rpm}`.toLowerCase()
        if (!str.includes(search.toLowerCase())) return false
      }
      return true
    }).reverse() // Most recent first
  }, [records, filterState, search])

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1
  const paginated = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
            Machine Condition History
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>
            {asset.id} · Exact chronological record of all monitored machine operating conditions ({records.length} stored observations).
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📥</span> Export CSV
          </button>
          <button className="btn" onClick={clearAllHistory} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)' }}>
            <span>🔄</span> Reset Seed
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel panel-pad" style={{ marginBottom: 18, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)' }}>STATE FILTER:</span>
            {['ALL', 'NORMAL', 'WARNING', 'ABNORMAL', 'MAINTENANCE REQUIRED'].map(s => (
              <button
                key={s}
                className={'filter-chip' + (filterState === s ? ' active' : '')}
                onClick={() => { setFilterState(s); setPage(1) }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              className="text-input"
              placeholder="Search history..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ width: 180 }}
            />
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="panel" style={{ overflowX: 'auto', marginBottom: 18 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>TIME (UTC / LOCAL)</th>
              <th>OPERATING STATE</th>
              <th>TEMP (°C)</th>
              <th>VIBRATION (g)</th>
              <th>RPM</th>
              <th>CYCLE COUNT</th>
              <th>CURRENT (A)</th>
              <th>VOLTAGE (V)</th>
              <th>HEALTH</th>
              <th>ANOMALY</th>
              <th>RUNTIME</th>
              <th>DATA SOURCE</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)' }}>
                  No historical records match the selected filter.
                </td>
              </tr>
            ) : (
              paginated.map((r, idx) => {
                const dateObj = new Date(r.timestamp)
                const timeStr = dateObj.toLocaleTimeString()
                const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                const stateClass = r.operatingState === 'NORMAL' ? 'pill-green' : r.operatingState === 'WARNING' ? 'pill-amber' : 'pill-red'

                return (
                  <tr key={r.id || idx}>
                    <td className="mono" style={{ fontSize: 12 }}>
                      <span style={{ fontWeight: 700 }}>{timeStr}</span>
                      <span style={{ color: 'var(--text-faint)', marginLeft: 6, fontSize: 11 }}>{dateStr}</span>
                    </td>
                    <td>
                      <span className={'pill ' + stateClass} style={{ fontSize: 10.5 }}>
                        <span className="pill-dot" /> {r.operatingState}
                      </span>
                    </td>
                    <td className="mono" style={{ fontWeight: 600, color: (r.temperature > 50 ? 'var(--amber)' : 'inherit') }}>
                      {r.temperature !== undefined ? `${r.temperature}°C` : '—'}
                    </td>
                    <td className="mono" style={{ fontWeight: 600, color: (r.vibration > 0.5 ? 'var(--amber)' : 'inherit') }}>
                      {r.vibration !== undefined ? `${r.vibration} g` : '—'}
                    </td>
                    <td className="mono">{r.rpm !== undefined ? r.rpm : '—'}</td>
                    <td className="mono">{r.cycleCount !== undefined ? r.cycleCount.toLocaleString() : '—'}</td>
                    <td className="mono">{r.current !== undefined ? `${r.current} A` : '—'}</td>
                    <td className="mono">{r.voltage !== undefined ? `${r.voltage} V` : '—'}</td>
                    <td className="mono" style={{ fontWeight: 700, color: r.healthScore >= 80 ? 'var(--green)' : r.healthScore >= 55 ? 'var(--amber)' : 'var(--red)' }}>
                      {r.healthScore !== undefined ? `${r.healthScore}%` : '—'}
                    </td>
                    <td className="mono">
                      <span style={{ color: r.anomalyScore >= 40 ? 'var(--red)' : r.anomalyScore >= 15 ? 'var(--amber)' : 'var(--green)' }}>
                        {r.anomalyScore}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
                      {r.runtimeFormatted || '—'}
                    </td>
                    <td>
                      <span className={`source-badge ${r.source === 'live' ? 'source-tag-real' : 'source-tag-sim'}`} style={{ fontSize: 9.5 }}>
                        {r.source === 'live' ? 'LIVE HARDWARE' : 'SIMULATED'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredRecords.length)} of {filteredRecords.length} observations
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ padding: '6px 12px', opacity: page <= 1 ? 0.4 : 1 }}
          >
            Previous
          </button>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 12, fontWeight: 700 }}>
            Page {page} of {totalPages}
          </div>
          <button
            className="btn"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            style={{ padding: '6px 12px', opacity: page >= totalPages ? 0.4 : 1 }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
