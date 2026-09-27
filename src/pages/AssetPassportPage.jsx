// ============================================================================
// AssetPassportPage.jsx — Digital Machine Passport View
// ============================================================================

import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'
import AssetPassport from '../components/AssetPassport.jsx'

export default function AssetPassportPage() {
  const { asset } = useAssetData()

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
          Digital Machine Passport
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>
          {asset.id} · Permanent digital identity, physical hardware specification, sensor mapping, and operational pedigree.
        </p>
      </div>
      <AssetPassport />
    </div>
  )
}
