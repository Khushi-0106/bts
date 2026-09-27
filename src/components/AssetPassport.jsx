import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'

const TIMELINE = [
  { title: 'Installation', sub: 'Asset commissioned and baseline established' },
  { title: 'Healthy', sub: 'Operating within normal parameters' },
  { title: 'Normal Operation', sub: 'Stable readings across all sensors' },
  { title: 'Vibration Increase', sub: 'Gradual upward drift detected vs baseline' },
  { title: 'Inspection Recommended', sub: 'Maintenance intelligence flagged for review' },
  { title: 'Current Health', sub: 'Live status as of now' },
]

export default function AssetPassport() {
  const { asset, assetType, health, reading } = useAssetData()
  if (!reading || !health) return null

  const cyclesParam = assetType.params.find(p => p.isCounter)

  return (
    <div className="grid grid-2" style={{ alignItems: 'start' }}>
      <div className="panel panel-pad fade-in">
        <div className="section-title">{asset.id}</div>
        <p className="section-sub">{assetType.label}</p>

        <div className="kv-grid">
          <div className="kv-item"><div className="k">ASSET TYPE</div><div className="v">{assetType.label}</div></div>
          <div className="kv-item"><div className="k">INSTALLED</div><div className="v">{asset.installed}</div></div>
          <div className="kv-item"><div className="k">{cyclesParam?.label?.toUpperCase() || 'OPERATING CYCLES'}</div>
            <div className="v mono">{cyclesParam ? Math.round(reading[cyclesParam.key]).toLocaleString() : '—'}</div></div>
          <div className="kv-item"><div className="k">CURRENT HEALTH</div><div className="v mono">{health.score}%</div></div>
          <div className="kv-item"><div className="k">LAST MAINTENANCE</div><div className="v">Not yet recorded</div></div>
          <div className="kv-item"><div className="k">SENSOR STATUS</div><div className="v">{assetType.params.filter(p=>!p.isCounter).length}/{assetType.params.filter(p=>!p.isCounter).length} Connected</div></div>
        </div>
      </div>

      <div className="panel panel-pad fade-in">
        <div className="section-title">Health History</div>
        <p className="section-sub">A narrative timeline of this asset's monitored condition.</p>
        <div className="timeline">
          {TIMELINE.map((t, i) => (
            <div className="timeline-item" key={t.title}>
              <div className="timeline-marker">
                <div className="timeline-dot" />
                {i < TIMELINE.length - 1 && <div className="timeline-line" />}
              </div>
              <div className="timeline-content">
                <div className="timeline-title">{t.title}</div>
                <div className="timeline-sub">{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
