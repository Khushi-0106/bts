// Transparent, explainable "Asset Health Score" calculation.
// This is a heuristic condition-monitoring score, NOT a validated
// mechanical-failure diagnosis. Every number here is traceable back to a
// named sensor parameter and a configurable weight/threshold.

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

// Piecewise-linear mapping of a raw sensor value to a 0-100 "param health".
// lower_better (default): baseline -> 100, warnAt -> 70, critAt -> 30, beyond -> toward 0
// higher_better (e.g. State of Health, Voltage): mirrored.
function paramHealth(param, value) {
  const { baseline, warnAt, critAt, direction } = param
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

  // lower_better
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

export function statusFromScore(score) {
  if (score >= 80) return 'healthy'
  if (score >= 55) return 'warning'
  return 'critical'
}

export function statusMeta(status) {
  switch (status) {
    case 'healthy': return { label: 'HEALTHY', color: 'green' }
    case 'warning': return { label: 'WARNING', color: 'amber' }
    default: return { label: 'CRITICAL', color: 'red' }
  }
}

// reading: { [paramKey]: number }
export function computeHealth(assetType, reading) {
  const scoredParams = assetType.params.filter(p => p.weight > 0)
  const totalWeight = scoredParams.reduce((s, p) => s + p.weight, 0) || 1

  const factors = scoredParams.map(p => {
    const value = reading[p.key]
    const health = value === undefined ? 100 : paramHealth(p, value)
    return {
      key: p.key,
      label: p.label,
      unit: p.unit,
      value: Math.round(health),
      rawValue: value,
      weight: p.weight,
      normalizedWeight: p.weight / totalWeight,
      impact: impactLabel(p.weight / totalWeight),
    }
  })

  const score = Math.round(
    factors.reduce((sum, f) => sum + f.value * f.normalizedWeight, 0)
  )

  const primary = [...factors].sort((a, b) => {
    const weightedGapA = (100 - a.value) * a.normalizedWeight
    const weightedGapB = (100 - b.value) * b.normalizedWeight
    return weightedGapB - weightedGapA
  })[0]

  return {
    score: clamp(score, 0, 100),
    factors: factors.sort((a, b) => b.weight - a.weight),
    status: statusFromScore(score),
    primaryFactor: primary,
  }
}

export function primaryFactorNarrative(factor, assetLabel) {
  if (!factor || factor.value >= 90) {
    return `All monitored parameters for this ${assetLabel} are within their established baseline.`
  }
  const severity = factor.value >= 60 ? 'slightly elevated' : 'significantly elevated compared with'
  return `${factor.label} is ${severity} the asset baseline.`
}
