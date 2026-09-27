// Lightweight baseline-deviation anomaly scoring. This flags *statistical*
// deviation from the asset's recent operating baseline — it does not
// diagnose a specific mechanical cause.

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

export function computeAnomaly(assetType, reading) {
  const params = assetType.params.filter(p => p.warnAt !== undefined && p.critAt !== undefined)

  const checks = params.map(p => {
    const value = reading[p.key]
    const higherBetter = p.direction === 'higher_better'
    const deviatedPct = higherBetter
      ? Math.max(0, ((p.baseline - value) / (p.baseline - p.critAt)) * 100)
      : Math.max(0, ((value - p.baseline) / (p.critAt - p.baseline)) * 100)

    const withinBaseline = higherBetter ? value >= p.warnAt : value <= p.warnAt

    return {
      key: p.key,
      label: p.label,
      pass: withinBaseline,
      deviatedPct: clamp(deviatedPct, 0, 100),
    }
  })

  const score = Math.round(
    clamp(checks.reduce((s, c) => s + c.deviatedPct, 0) / checks.length, 0, 100)
  )

  let status = 'NORMAL'
  if (score >= 60) status = 'CRITICAL'
  else if (score >= 25) status = 'ELEVATED'

  return { score, status, checks }
}

export function anomalyNarrative(anomaly) {
  if (anomaly.status === 'NORMAL') {
    return 'Current sensor behavior is consistent with the asset\u2019s recent operating baseline.'
  }
  const failing = anomaly.checks.filter(c => !c.pass).map(c => c.label)
  if (anomaly.status === 'ELEVATED') {
    return `${failing.join(' and ')} ${failing.length > 1 ? 'are' : 'is'} trending outside the recent baseline. Continued monitoring recommended.`
  }
  return `Multiple parameters (${failing.join(', ')}) have deviated significantly from baseline. Inspection recommended.`
}
