import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssetData } from '../context/DataContext.jsx'
import { REFERENCE_HEALTH, REFERENCE_STATUS, ASSET_TYPES } from '../data/assetData.js'

const STATUS_COLOR = { healthy: 'green', warning: 'amber', critical: 'red' }

export default function Assets() {
  const { assets, setAssetId, assetId: activeId, assetTypeKey: activeType, health } = useAssetData()
  const navigate = useNavigate()

  const open = (a) => {
    setAssetId(a.id)
    navigate('/')
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Assets</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>
          Every asset ASSETIQ is currently intelligent about, across a demo fleet of six.
        </p>
      </div>

      <div className="grid grid-3">
        {assets.map(a => {
          const isActive = a.id === activeId
          const score = isActive && health ? health.score : REFERENCE_HEALTH[a.id]
          const status = isActive && health ? health.status : REFERENCE_STATUS[a.id]
          const colorKey = STATUS_COLOR[status] || 'green'
          const def = ASSET_TYPES[a.type]

          return (
            <div className="panel asset-card fade-in" key={a.id} onClick={() => open(a)}>
              <div className="asset-card-top">
                <div className="asset-icon">{def.unitIcon}</div>
                <span className={'pill pill-' + colorKey}>{status.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 2 }}>{a.id}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{def.label}</div>
              <div className="asset-card-health mono">{score}%</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>Asset Health Score{isActive ? ' · live' : ''}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
