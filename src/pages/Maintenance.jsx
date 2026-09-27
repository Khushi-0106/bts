import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import MaintenanceCard from '../components/MaintenanceCard.jsx'
import DemoMode from '../components/DemoMode.jsx'

export default function Maintenance() {
  const { asset } = useAssetData()

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Maintenance Intelligence</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>{asset.id} · recommendations generated from the current Asset Health Score.</p>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <MaintenanceCard />
        <DemoMode />
      </div>
    </div>
  )
}
