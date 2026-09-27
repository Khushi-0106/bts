import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import AlertPanel from '../components/AlertPanel.jsx'

export default function Alerts() {
  const { asset } = useAssetData()
  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Alerts</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>{asset.id} · every warning, critical event and resolution for this asset.</p>
      </div>
      <AlertPanel withFilters />
    </div>
  )
}
