import { ASSET_TYPES } from './assetData.js'

function rand(min, max) {
  return min + Math.random() * (max - min)
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

// Smoothly nudges `current` toward `target`, adding small organic noise so
// values drift rather than jump — this stands in for a real ESP32 sample.
function step(current, target, noise, smoothing = 0.18) {
  const next = current + (target - current) * smoothing + rand(-noise, noise)
  return next
}

// Produces the next simulated reading for an asset, given the previous one.
// demoState: null | 'normal' | 'warning' | 'critical'
export function nextReading(assetTypeKey, demoState, prevReading) {
  const assetType = ASSET_TYPES[assetTypeKey]
  const reading = {}

  assetType.params.forEach(p => {
    const prevVal = prevReading?.[p.key] ?? p.baseline

    if (p.isCounter) {
      const jitter = p.ratePerTick > 0.5 ? rand(0, p.ratePerTick) : rand(0, p.ratePerTick * 4)
      reading[p.key] = +(prevVal + jitter).toFixed(p.ratePerTick < 1 ? 2 : 0)
      return
    }

    const demoTarget = demoState && assetType.demo[demoState]?.[p.key]
    const target = demoTarget !== undefined ? demoTarget : p.baseline
    const noise = Math.max(0.02, (p.warnAt ? Math.abs(p.warnAt - p.baseline) : p.baseline) * 0.015)
    let next = step(prevVal, target, noise)
    next = clamp(next, 0, (p.critAt || target) * 1.6)
    reading[p.key] = +next.toFixed(p.unit === '%' || p.unit === 'V' ? 1 : 2)
  })

  reading.timestamp = new Date().toISOString()
  return reading
}

export function initialReading(assetTypeKey, demoState) {
  const assetType = ASSET_TYPES[assetTypeKey]
  const reading = {}
  assetType.params.forEach(p => {
    const demoTarget = demoState && assetType.demo[demoState]?.[p.key]
    reading[p.key] = demoTarget !== undefined ? demoTarget : p.baseline
  })
  reading.timestamp = new Date().toISOString()
  return reading
}

const RANGE_CONFIG = {
  '1H': { points: 30, stepMinutes: 2 },
  '6H': { points: 36, stepMinutes: 10 },
  '24H': { points: 48, stepMinutes: 30 },
  '7D': { points: 28, stepMinutes: 360 },
}

// Generates a realistic-looking historical series for a single parameter.
// Vibration gets a gentle upward drift (supports the "trend increasing"
// narrative); other parameters stay close to baseline with organic noise.
export function generateHistory(assetTypeKey, paramKey, range, currentValue, demoState) {
  const assetType = ASSET_TYPES[assetTypeKey]
  const param = assetType.params.find(p => p.key === paramKey)
  if (!param) return []

  const { points, stepMinutes } = RANGE_CONFIG[range]
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
      value: +value.toFixed(param.unit === '%' || param.unit === 'V' ? 1 : 2),
    })
  }
  // Ensure the series ends exactly on the live current value for continuity.
  if (series.length) series[series.length - 1].value = +endValue.toFixed(2)
  return series
}

function formatTimeLabel(date, range) {
  if (range === '7D') {
    return date.toLocaleDateString(undefined, { weekday: 'short' })
  }
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
