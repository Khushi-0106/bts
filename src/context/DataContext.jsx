import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ASSET_TYPES, ASSETS } from '../data/assetData.js'
import { startReadingStream } from '../services/sensorService.js'
import { generateHistory } from '../data/simulatedData.js'
import { computeHealth, primaryFactorNarrative, statusMeta } from '../utils/healthScore.js'
import { computeAnomaly, anomalyNarrative } from '../utils/anomalyDetection.js'

const DataContext = createContext(null)

const ALERTS_LIBRARY = {
  normal: [
    { id: 'a1', level: 'RESOLVED', text: 'Temperature returned to normal', minsAgo: 12 },
    { id: 'a2', level: 'LOW', text: 'Increased operating load', minsAgo: 25 },
  ],
  warning: [
    { id: 'a3', level: 'MEDIUM', text: 'Elevated vibration', minsAgo: 2 },
    { id: 'a1', level: 'RESOLVED', text: 'Temperature returned to normal', minsAgo: 18 },
    { id: 'a2', level: 'LOW', text: 'Increased operating load', minsAgo: 31 },
  ],
  critical: [
    { id: 'a4', level: 'CRITICAL', text: 'Multiple parameters outside baseline', minsAgo: 1 },
    { id: 'a3', level: 'MEDIUM', text: 'Elevated vibration', minsAgo: 6 },
    { id: 'a1', level: 'RESOLVED', text: 'Temperature returned to normal', minsAgo: 22 },
  ],
}

export function DataProvider({ children }) {
  const [assetId, setAssetId] = useState('AST-IND-001')
  const [demoState, setDemoState] = useState('normal')
  const [dataSource, setDataSource] = useState('demo') // 'demo' | 'live'
  const [reading, setReading] = useState(null)
  const readingRef = useRef(null)

  const asset = ASSETS.find(a => a.id === assetId) || ASSETS[0]
  const assetTypeKey = asset.type
  const assetType = ASSET_TYPES[assetTypeKey]

  useEffect(() => {
    setReading(null)
    const unsubscribe = startReadingStream({
      assetTypeKey,
      demoState,
      source: dataSource,
      onReading: (r) => {
        readingRef.current = r
        setReading(r)
      },
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetTypeKey, demoState, dataSource])

  const health = useMemo(() => {
    if (!reading) return null
    return computeHealth(assetType, reading)
  }, [assetType, reading])

  const anomaly = useMemo(() => {
    if (!reading) return null
    return computeAnomaly(assetType, reading)
  }, [assetType, reading])

  const alerts = ALERTS_LIBRARY[demoState] || ALERTS_LIBRARY.normal

  const getHistory = (paramKey, range) => {
    if (!reading) return []
    return generateHistory(assetTypeKey, paramKey, range, reading[paramKey], demoState)
  }

  const maintenance = useMemo(() => {
    if (!health) return null
    if (demoState === 'critical') {
      return {
        title: 'IMMEDIATE INSPECTION',
        priority: 'HIGH',
        reason: 'Multiple operating parameters have deviated significantly from baseline.',
        action: 'Stop operation and perform inspection.',
      }
    }
    if (demoState === 'warning') {
      return {
        title: 'ROUTINE INSPECTION',
        priority: 'MEDIUM',
        reason: `${health.primaryFactor?.label || 'Vibration'} trend has increased gradually compared with the recent baseline.`,
        action: `Inspect ${assetTypeKey === 'ev_battery' ? 'battery pack connections and thermal management' : 'motor mounting, bearings and alignment'}.`,
      }
    }
    return {
      title: 'NO ACTION REQUIRED',
      priority: 'LOW',
      reason: 'All monitored parameters are within the established baseline.',
      action: 'Continue routine monitoring. Next scheduled check-in is automatic.',
    }
  }, [demoState, health, assetTypeKey])

  const value = {
    assetId, setAssetId,
    asset,
    assetTypeKey, assetType,
    demoState, setDemoState,
    dataSource, setDataSource,
    reading,
    health,
    anomaly,
    anomalyText: anomaly ? anomalyNarrative(anomaly) : '',
    primaryFactorText: health ? primaryFactorNarrative(health.primaryFactor, assetType.label) : '',
    statusMeta: health ? statusMeta(health.status) : statusMeta('healthy'),
    alerts,
    getHistory,
    maintenance,
    assets: ASSETS,
    assetTypes: ASSET_TYPES,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useAssetData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useAssetData must be used within DataProvider')
  return ctx
}
