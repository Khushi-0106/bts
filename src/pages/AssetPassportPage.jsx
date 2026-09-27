import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import AssetPassport from '../components/AssetPassport.jsx'

export default function AssetPassportPage() {
  const { asset } = useAssetData()

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Digital Asset Passport</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>{asset.id} · a permanent record of this asset's identity and monitored history.</p>
      </div>
      <AssetPassport />
    </div>
  )
}
