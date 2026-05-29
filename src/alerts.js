// Alert storage + matching logic
// Alerts are persisted in localStorage keyed by a stable ID.

const STORAGE_KEY = 'nih-alerts'
const SEEN_KEY = 'nih-alert-seen'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(alerts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
}

function loadSeen() {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveSeen(seen) {
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen))
}

/**
 * Generate a simple ID.
 */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/**
 * Get all alerts.
 */
export function getAlerts() {
  return load()
}

/**
 * Get a single alert by ID.
 */
export function getAlert(id) {
  return load().find(a => a.id === id) || null
}

/**
 * Create a new alert.
 * @param {object} params
 * @param {string} params.name - Human-readable label
 * @param {string} [params.organization]
 * @param {string} [params.pi]
 * @param {string} [params.fiscalYear]
 * @param {string} [params.projectNumber]
 * @param {string} [params.notifyEmail] - optional email for delivery
 * @param {'immediate'|'daily'|'weekly'} [params.frequency='daily']
 */
export function createAlert({ name, organization, pi, fiscalYear, projectNumber, notifyEmail, frequency = 'daily' }) {
  const alerts = load()
  const alert = {
    id: uid(),
    name,
    criteria: {
      organization: organization || '',
      pi: pi || '',
      fiscalYear: fiscalYear || '',
      projectNumber: projectNumber || '',
    },
    notifyEmail: notifyEmail || '',
    frequency,
    enabled: true,
    createdAt: new Date().toISOString(),
    lastChecked: null,
    lastMatchCount: 0,
  }
  alerts.push(alert)
  save(alerts)
  return alert
}

/**
 * Update an existing alert.
 */
export function updateAlert(id, patch) {
  const alerts = load()
  const idx = alerts.findIndex(a => a.id === id)
  if (idx === -1) return null
  alerts[idx] = { ...alerts[idx], ...patch, criteria: { ...alerts[idx].criteria, ...(patch.criteria || {}) } }
  save(alerts)
  return alerts[idx]
}

/**
 * Toggle alert enabled/disabled.
 */
export function toggleAlert(id) {
  const alerts = load()
  const idx = alerts.findIndex(a => a.id === id)
  if (idx === -1) return null
  alerts[idx].enabled = !alerts[idx].enabled
  save(alerts)
  return alerts[idx]
}

/**
 * Delete an alert.
 */
export function deleteAlert(id) {
  const alerts = load().filter(a => a.id !== id)
  save(alerts)
}

/**
 * Mark an alert as just checked.
 */
export function markChecked(id, matchCount) {
  const alerts = load()
  const idx = alerts.findIndex(a => a.id === id)
  if (idx === -1) return
  alerts[idx].lastChecked = new Date().toISOString()
  alerts[idx].lastMatchCount = matchCount
  save(alerts)
}

/**
 * Check which awards in a result set are new (not previously seen) for a given alert.
 * Returns { newAwards, allSeenIds }
 */
export function findNewAwards(alert, awards) {
  const seen = loadSeen()
  const key = alert.id
  const previouslySeen = new Set(seen[key] || [])
  const newAwards = awards.filter(a => !previouslySeen.has(a.projectNumber))
  return { newAwards, previouslySeen }
}

/**
 * Mark a set of project numbers as seen for an alert.
 */
export function markAwardsSeen(alert, projectNumbers) {
  const seen = loadSeen()
  const key = alert.id
  const existing = new Set(seen[key] || [])
  projectNumbers.forEach(pn => existing.add(pn))
  seen[key] = [...existing]
  saveSeen(seen)
}

/**
 * Build a human-readable summary of alert criteria.
 */
export function criteriaSummary(criteria) {
  const parts = []
  if (criteria.organization) parts.push(`Org: ${criteria.organization}`)
  if (criteria.pi) parts.push(`PI: ${criteria.pi}`)
  if (criteria.fiscalYear) parts.push(`FY: ${criteria.fiscalYear}`)
  if (criteria.projectNumber) parts.push(`Project: ${criteria.projectNumber}`)
  return parts.length > 0 ? parts.join(' · ') : '(no criteria)'
}
