// ============================================================================
// simulatedData.js — Realistic AIoT Sensor Condition Generator for MechSight
// ============================================================================

import { ASSET_TYPES } from './assetData.js'

function rand(min, max) {
  return min + Math.random() * (max - min)
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function step(current, target, noise, smoothing = 0.2) {
  return current + (target - current) * smoothing + rand(-noise, noise)
}

let sessionStartTimestamp = Date.now() - 3600000 // 1 hr ago

/**
 * Validates and constructs a clean sensor reading object
 */
export function nextReading(assetTypeKey, demoState, prevReading) {
  const assetType = ASSET_TYPES[assetTypeKey] || ASSET_TYPES.industrial_motor
  const reading = {}

  let totalRuntime = (prevReading?.runtime || 3600) + 2.5
  reading.runtime = Math.round(totalRuntime)

  const hrs = Math.floor(totalRuntime / 3600).toString().padStart(2, '0')
  const mins = Math.floor((totalRuntime % 3600) / 60).toString().padStart(2, '0')
  const secs = Math.floor(totalRuntime % 60).toString().padStart(2, '0')
  reading.runtimeFormatted = `${hrs}:${mins}:${secs}`

  assetType.params.forEach(p => {
    const prevVal = prevReading?.[p.key] ?? p.baseline

    if (p.isCounter) {
      const increment = p.ratePerTick > 0.5 ? rand(1, p.ratePerTick * 1.5) : rand(0.01, p.ratePerTick * 2)
      reading[p.key] = +(prevVal + increment).toFixed(p.ratePerTick < 1 ? 2 : 0)
      return
    }

    const demoTarget = demoState && assetType.demo?.[demoState]?.[p.key]
    const target = demoTarget !== undefined ? demoTarget : p.baseline
    const noise = Math.max(0.02, (p.warnAt ? Math.abs(p.warnAt - p.baseline) : p.baseline) * 0.02)

    let next = step(prevVal, target, noise)
    if (p.direction === 'higher_better') {
      next = clamp(next, 0, (p.baseline || target) * 1.3)
    } else {
      next = clamp(next, 0, (p.critAt || target) * 1.8)
    }

    reading[p.key] = +(next.toFixed(p.unit === '%' || p.unit === 'V' ? 1 : 2))
  })

  // Ensure RPM and Cycle Count are explicitly present
  if (reading.rpm === undefined && reading.cycles !== undefined && !assetType.params.find(p => p.key === 'rpm')) {
    reading.rpm = Math.round(285 + rand(-5, 5))
  }
  if (reading.cycleCount === undefined) {
    reading.cycleCount = reading.cycles || Math.round((prevReading?.cycleCount || 12480) + rand(1, 3))
  }

  // Sensor connectivity & hardware health
  const isDemo = Boolean(demoState)
  reading.sensorStatus = {
    temperature: 'CONNECTED',
    vibration: 'CONNECTED',
    rpm: 'CONNECTED',
    cycles: 'CONNECTED',
    current: isDemo ? 'SIMULATED' : 'CONNECTED',
    voltage: isDemo ? 'SIMULATED' : 'CONNECTED',
  }

  reading.sensorSources = {
    temperature: assetTypeKey === 'industrial_motor' ? 'DS18B20 — LIVE' : 'SIMULATED',
    vibration: assetTypeKey === 'industrial_motor' ? 'MPU6050 — LIVE' : 'SIMULATED',
    rpm: assetTypeKey === 'industrial_motor' ? 'IR SENSOR — LIVE' : 'SIMULATED',
    cycles: assetTypeKey === 'industrial_motor' ? 'IR SENSOR — LIVE' : 'SIMULATED',
    current: 'ACS712 — SIMULATED / OPTIONAL',
    voltage: 'DIVIDER — SIMULATED / OPTIONAL',
  }

  reading.timestamp = new Date().toISOString()
  return reading
}

export function initialReading(assetTypeKey, demoState) {
  const assetType = ASSET_TYPES[assetTypeKey] || ASSET_TYPES.industrial_motor
  const reading = {}

  assetType.params.forEach(p => {
    const demoTarget = demoState && assetType.demo?.[demoState]?.[p.key]
    reading[p.key] = demoTarget !== undefined ? demoTarget : p.baseline
  })

  reading.runtime = 3600
  reading.runtimeFormatted = '01:00:00'
  reading.rpm = reading.rpm || 285
  reading.cycleCount = reading.cycles || 12480
  reading.timestamp = new Date().toISOString()

  reading.sensorStatus = {
    temperature: 'CONNECTED',
    vibration: 'CONNECTED',
    rpm: 'CONNECTED',
    cycles: 'CONNECTED',
    current: 'SIMULATED',
    voltage: 'SIMULATED',
  }

  reading.sensorSources = {
    temperature: assetTypeKey === 'industrial_motor' ? 'DS18B20 — LIVE' : 'SIMULATED',
    vibration: assetTypeKey === 'industrial_motor' ? 'MPU6050 — LIVE' : 'SIMULATED',
    rpm: assetTypeKey === 'industrial_motor' ? 'IR SENSOR — LIVE' : 'SIMULATED',
    cycles: assetTypeKey === 'industrial_motor' ? 'IR SENSOR — LIVE' : 'SIMULATED',
    current: 'ACS712 — SIMULATED',
    voltage: 'DIVIDER — SIMULATED',
  }

  return reading
}

const RANGE_CONFIG = {
  'Live': { points: 25, stepMinutes: 0.5 },
  '1H': { points: 30, stepMinutes: 2 },
  '6H': { points: 36, stepMinutes: 10 },
  '24H': { points: 48, stepMinutes: 30 },
  '7D': { points: 28, stepMinutes: 360 },
}

export function generateHistory(assetTypeKey, paramKey, range = '24H', currentValue, demoState) {
  const assetType = ASSET_TYPES[assetTypeKey] || ASSET_TYPES.industrial_motor
  const param = assetType.params.find(p => p.key === paramKey)
  if (!param) return []

  const config = RANGE_CONFIG[range] || RANGE_CONFIG['24H']
  const { points, stepMinutes } = config
  const now = Date.now()
  const series = []

  const driftsUp = paramKey === 'vibration' || paramKey === 'temperature'
  const endValue = currentValue ?? param.baseline
  const startValue = param.isCounter
    ? Math.max(0, endValue - (param.ratePerTick || 1) * points * (stepMinutes / 2))
    : driftsUp
      ? param.baseline + (endValue - param.baseline) * 0.15
      : endValue - (endValue - param.baseline) * 0.1

  const noiseScale = param.warnAt ? Math.abs(param.warnAt - param.baseline) * 0.12 : endValue * 0.05

  for (let i = 0; i < points; i++) {
    const t = i / (points - 1)
    const time = new Date(now - (points - 1 - i) * stepMinutes * 60000)

    let value
    if (param.isCounter) {
      value = startValue + (endValue - startValue) * t
    } else {
      const eased = driftsUp ? Math.pow(t, 1.3) : t
      const base = startValue + (endValue - startValue) * eased
      value = base + rand(-noiseScale, noiseScale) * (0.4 + Math.random() * 0.6)
    }

    series.push({
      time: time.toISOString(),
      label: formatTimeLabel(time, range),
      value: +(value.toFixed(param.unit === '%' || param.unit === 'V' ? 1 : 2)),
    })
  }

  if (series.length) series[series.length - 1].value = +endValue.toFixed(2)
  return series
}

function formatTimeLabel(date, range) {
  if (range === '7D') {
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })
  }
  if (range === 'Live') {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
