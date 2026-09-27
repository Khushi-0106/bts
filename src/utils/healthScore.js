// ============================================================================
// healthScore.js — Explainable Asset Health Intelligence Engine
// ============================================================================
// Calculates a traceable condition-monitoring score (0-100) from weighted
// parameter baselines. Also derives machine operating state and contributing factors.
// ============================================================================

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function paramHealth(param, value) {
  const { baseline, warnAt, critAt, direction } = param
  if (value === undefined || value === null || isNaN(value)) return 100
  if (warnAt === undefined || critAt === undefined) return 100

  if (direction === 'higher_better') {
    if (value >= baseline) return 100
    if (value <= critAt) return clamp(30 * (value / critAt), 0, 30)
    if (value <= warnAt) {
      const t = (value - critAt) / (warnAt - critAt)
      return 30 + t * 40
    }
    const t = (value - warnAt) / (baseline - warnAt)
    return 70 + clamp(t, 0, 1) * 30
  }

  // lower_better (temperature, vibration, current)
  if (value <= baseline) return 100
  if (value >= critAt) {
    const over = (value - critAt) / (critAt - baseline)
    return clamp(30 - over * 30, 0, 30)
  }
  if (value >= warnAt) {
    const t = (value - warnAt) / (critAt - warnAt)
    return 70 - t * 40
  }
  const t = (value - baseline) / (warnAt - baseline)
  return 100 - t * 30
}

export function impactLabel(weight) {
  if (weight >= 0.3) return 'HIGH'
  if (weight >= 0.15) return 'MEDIUM'
  return 'LOW'
}

/**
 * Maps health score and parameter status to standardized Machine Operating State:
 * NORMAL | WARNING | ABNORMAL | MAINTENANCE REQUIRED | OFFLINE
 */
export function deriveOperatingState(score, hasCriticalParam, isOffline = false) {
  if (isOffline) return 'OFFLINE'
  if (score < 50 || hasCriticalParam) return 'MAINTENANCE REQUIRED'
  if (score < 70) return 'ABNORMAL'
  if (score < 85) return 'WARNING'
  return 'NORMAL'
}

export function statusMeta(stateOrStatus) {
  const norm = (stateOrStatus || 'NORMAL').toUpperCase()
  switch (norm) {
    case 'NORMAL':
    case 'HEALTHY':
      return { label: 'NORMAL', color: 'green', desc: 'Operating within established baseline' }
    case 'WARNING':
      return { label: 'WARNING', color: 'amber', desc: 'Moderate parameter elevation observed' }
    case 'ABNORMAL':
      return { label: 'ABNORMAL', color: 'amber', desc: 'Significant parameter deviation detected' }
    case 'MAINTENANCE REQUIRED':
    case 'CRITICAL':
      return { label: 'MAINTENANCE REQUIRED', color: 'red', desc: 'Immediate inspection recommended' }
    case 'OFFLINE':
      return { label: 'OFFLINE', color: 'neutral', desc: 'Machine telemetry disconnected' }
    default:
      return { label: 'NORMAL', color: 'green', desc: 'Condition nominal' }
  }
}

export function computeHealth(assetType, reading) {
  if (!reading || !assetType) {
    return {
      score: 95,
      factors: [],
      status: 'NORMAL',
      operatingState: 'NORMAL',
      primaryFactor: null,
      abnormalParameters: [],
    }
  }

  const scoredParams = assetType.params.filter(p => p.weight > 0)
  const totalWeight = scoredParams.reduce((s, p) => s + p.weight, 0) || 1

  let hasCriticalParam = false
  const abnormalParameters = []

  const factors = scoredParams.map(p => {
    const value = reading[p.key]
    const health = paramHealth(p, value)

    if (p.critAt !== undefined) {
      if (p.direction === 'higher_better' ? value <= p.critAt : value >= p.critAt) {
        hasCriticalParam = true
        abnormalParameters.push(p.label)
      } else if (p.warnAt !== undefined && (p.direction === 'higher_better' ? value <= p.warnAt : value >= p.warnAt)) {
        abnormalParameters.push(p.label)
      }
    }

    return {
      key: p.key,
      label: p.label,
      unit: p.unit,
      value: Math.round(health),
      rawValue: value,
      weight: p.weight,
      weightPct: Math.round((p.weight / totalWeight) * 100),
      impact: impactLabel(p.weight / totalWeight),
      sourceType: p.sourceType || 'CALCULATED',
      sensorHardware: p.sensorHardware || '',
    }
  })

  const score = Math.round(
    factors.reduce((sum, f) => sum + f.value * (f.weight / totalWeight), 0)
  )

  const clampedScore = clamp(score, 0, 100)
  const operatingState = deriveOperatingState(clampedScore, hasCriticalParam)

  const primary = [...factors].sort((a, b) => {
    const weightedGapA = (100 - a.value) * (a.weight / totalWeight)
    const weightedGapB = (100 - b.value) * (b.weight / totalWeight)
    return weightedGapB - weightedGapA
  })[0]

  return {
    score: clampedScore,
    factors: factors.sort((a, b) => b.weight - a.weight),
    status: operatingState,
    operatingState,
    primaryFactor: primary,
    abnormalParameters,
  }
}

export function primaryFactorNarrative(factor, assetLabel = 'machine') {
  if (!factor || factor.value >= 90) {
    return `All monitored parameters for this ${assetLabel} are within their established baseline.`
  }
  const severity = factor.value >= 65 ? 'slightly elevated above' : 'significantly elevated compared with'
  return `${factor.label} is ${severity} the machine baseline.`
}
