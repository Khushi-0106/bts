import React from 'react'
import { useAssetData } from '../context/DataContext.jsx'

export default function AssetSelector() {
  const { assetTypeKey, setAssetId, assets, assetTypes } = useAssetData()

  const selectType = (typeKey) => {
    const match = assets.find(a => a.type === typeKey)
    if (match) setAssetId(match.id)
  }

  return (
    <div className="panel panel-pad fade-in">
      <div className="section-title">Select Asset Type</div>
      <p className="section-sub">ASSETIQ adapts its sensors, terminology and thresholds to the selected asset type.</p>
      <div className="type-tile-row">
        {Object.entries(assetTypes).map(([key, def]) => (
          <button
            key={key}
            className={'type-tile' + (assetTypeKey === key ? ' active' : '')}
            onClick={() => selectType(key)}
          >
            <span>{def.unitIcon}</span> {def.label}
          </button>
        ))}
      </div>
    </div>
  )
}
