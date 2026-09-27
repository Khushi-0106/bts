// ============================================================================
// anomalyDetection.js — Explainable Anomaly Detection for MechSight
// ============================================================================
// Flags statistical deviations from established operating baselines and generates
// explainable maintenance recommendations with transparent rationales.
// ============================================================================

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

export function computeAnomaly(assetType, reading) {
  if (!reading || !assetType) {
    return { score: 0, status: 'NORMAL', checks: [], anomalies: [] }
  }

  const params = assetType.params.filter(p => p.warnAt !== undefined && p.critAt !== undefined)
  const anomalies = []

  const checks = params.map(p => {
    const value = reading[p.key]
    if (value === undefined || value === null || isNaN(value)) {
      return { key: p.key, label: p.label, pass: true, deviatedPct: 0 }
    }

    const higherBetter = p.direction === 'higher_better'
    const deviatedPct = higherBetter
      ? Math.max(0, ((p.baseline - value) / (p.baseline - p.critAt)) * 100)
      : Math.max(0, ((value - p.baseline) / (p.critAt - p.baseline)) * 100)

    const withinBaseline = higherBetter ? value >= p.warnAt : value <= p.warnAt
    const isCritical = higherBetter ? value <= p.critAt : value >= p.critAt

    if (!withinBaseline) {
      const severity = isCritical ? 'CRITICAL' : 'MEDIUM'
      let explanation = ''
      let recommendation = ''

      if (p.key === 'vibration') {
        explanation = 'Elevated vibration amplitude detected relative to motor baseline.'
        recommendation = 'Inspect mechanical mounting bolts, shaft alignment, and rotating mass.'
      } else if (p.key === 'temperature') {
        explanation = 'Thermal rise observed beyond normal operating equilibrium.'
        recommendation = 'Check cooling airflow, heat dissipation, and motor drive loading.'
      } else if (p.key === 'rpm') {
        explanation = 'Rotation speed has dropped below expected nominal operating range.'
        recommendation = 'Verify mechanical load, power supply voltage, and motor driver output.'
      } else if (p.key === 'current') {
        explanation = 'Current draw elevated compared to nominal running conditions.'
        recommendation = 'Check for mechanical binding or elevated motor torque resistance.'
      } else {
        explanation = `${p.label} has deviated outside established baseline.`
        recommendation = `Perform routine inspection on ${p.label.toLowerCase()} subsystem.`
      }

      anomalies.push({
        id: `anom_${p.key}_${Date.now()}`,
        parameter: p.label,
        key: p.key,
        observedValue: `${value} ${p.unit}`,
        expectedRange: p.normalRange || `${p.baseline} ${p.unit}`,
        deviation: `${Math.round(deviatedPct)}% deviation`,
        severity,
        explanation,
        recommendation,
        sourceType: p.sourceType || 'CALCULATED',
      })
    }

    return {
      key: p.key,
      label: p.label,
      pass: withinBaseline,
      deviatedPct: clamp(deviatedPct, 0, 100),
      currentValue: value,
      unit: p.unit,
    }
  })

  const score = Math.round(
    clamp(checks.reduce((s, c) => s + c.deviatedPct, 0) / (checks.length || 1), 0, 100)
  )

  let status = 'NORMAL'
  if (score >= 50) status = 'CRITICAL'
  else if (score >= 20) status = 'ELEVATED'

  return { score, status, checks, anomalies }
}

export function anomalyNarrative(anomaly) {
  if (!anomaly || anomaly.status === 'NORMAL') {
    return 'Current machine sensor behavior is consistent with the established operating baseline.'
  }
  const failing = anomaly.checks.filter(c => !c.pass).map(c => c.label)
  if (anomaly.status === 'ELEVATED') {
    return `${failing.join(' and ')} ${failing.length > 1 ? 'are' : 'is'} trending outside the recent baseline. Continued monitoring recommended.`
  }
  return `Multiple operating parameters (${failing.join(', ')}) have deviated significantly from baseline. Immediate machine inspection recommended.`
}
