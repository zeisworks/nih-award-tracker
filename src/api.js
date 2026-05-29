// NIH RePORTER API v2 client
// Docs: https://api.reporter.nih.gov/

const BASE = 'https://api.reporter.nih.gov/v2'

/**
 * Search NIH awards.
 * @param {object} params
 * @param {string} [params.organization] - Organization name (e.g. "Harvard")
 * @param {string} [params.pi] - PI last name
 * @param {string} [params.fiscalYear] - e.g. "2024"
 * @param {string} [params.projectNumber] - e.g. "R01GM12345"
 * @param {number} [params.offset=0]
 * @param {number} [params.limit=25] - max 500
 */
export async function searchAwards({
  organization,
  pi,
  fiscalYear,
  projectNumber,
  offset = 0,
  limit = 25,
} = {}) {
  const criteria = {}

  if (organization) criteria.organizationName = organization
  if (pi) criteria.piNames = [{lastName: pi}]
  if (fiscalYear) criteria.fiscalYear = parseInt(fiscalYear)
  if (projectNumber) criteria.projectNumber = projectNumber

  const body = {
    criteria,
    offset,
    limit,
    include_fields: [
      'projectTitle',
      'abstractText',
      'organizationName',
      'organizationCity',
      'organizationState',
      'organizationZip',
      'principalInvestigators',
      'programOfficer',
      'awardAmount',
      'awardNoticeDate',
      'budgetStartDate',
      'budgetEndDate',
      'fiscalYear',
      'projectNumber',
      'opportunityNumber',
      'fundingMechanism',
      'cfdaCode',
      'directCosts',
      'indirectCosts',
      'projectDetailUrl',
    ],
  }

  const res = await fetch(`${BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`NIH API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return {
    results: data.results || [],
    meta: data.meta || {},
  }
}

/**
 * Format a dollar amount.
 */
export function formatCurrency(amount) {
  if (amount == null || amount === '') return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a date string.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
