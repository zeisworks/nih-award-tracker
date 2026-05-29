import { useState, useCallback, useEffect } from 'react'
import { searchAwards, formatCurrency, formatDate } from './api'
import { getAlerts, findNewAwards, markAwardsSeen, markChecked } from './alerts'
import AlertsPanel from './AlertsPanel'
import './App.css'

const DEFAULT_FISCAL_YEAR = new Date().getFullYear()

function App() {
  const [tab, setTab] = useState('search')
  const [organization, setOrganization] = useState('')
  const [piName, setPiName] = useState('')
  const [fiscalYear, setFiscalYear] = useState(String(DEFAULT_FISCAL_YEAR))
  const [projectNumber, setProjectNumber] = useState('')
  const [activityCode, setActivityCode] = useState('')
  const [fundingMechanism, setFundingMechanism] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [meta, setMeta] = useState(null)
  const [offset, setOffset] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)
  const [newAwards, setNewAwards] = useState([]) // projectNumbers flagged as new
  const [alertBadge, setAlertBadge] = useState(0)

  // Count enabled alerts for badge
  useEffect(() => {
    const alerts = getAlerts()
    setAlertBadge(alerts.filter(a => a.enabled).length)
  }, [tab])

  const currentCriteria = { organization, pi: piName, fiscalYear, projectNumber, activityCode, fundingMechanism }

  const doSearch = useCallback(async (newOffset = 0) => {
    setLoading(true)
    setError(null)
    setNewAwards([])
    try {
      const data = await searchAwards({
        organization: organization || undefined,
        pi: piName || undefined,
        fiscalYear: fiscalYear || undefined,
        projectNumber: projectNumber || undefined,
        activityCode: activityCode || undefined,
        fundingMechanism: fundingMechanism || undefined,
        offset: newOffset,
        limit: 25,
      })

      // Check for new vs seen awards across all alerts
      const alerts = getAlerts().filter(a => a.enabled)
      const allNew = new Set()
      alerts.forEach(alert => {
        const { newAwards: newlyFound } = findNewAwards(alert, data.results)
        newlyFound.forEach(a => allNew.add(a.projectNumber))
        // Mark all current results as seen for this alert
        markAwardsSeen(alert, data.results.map(r => r.projectNumber))
        markChecked(alert, data.results.length)
      })

      setResults(data.results)
      setNewAwards([...allNew])
      setMeta(data.meta)
      setOffset(newOffset)
      setHasSearched(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [organization, piName, fiscalYear, projectNumber, activityCode, fundingMechanism])

  const handleSubmit = (e) => {
    e.preventDefault()
    doSearch(0)
  }

  // Navigate from Alerts tab to Search with pre-filled criteria
  function handleNavigateToSearch(criteria) {
    setOrganization(criteria.organization || '')
    setPiName(criteria.pi || '')
    setFiscalYear(criteria.fiscalYear || String(DEFAULT_FISCAL_YEAR))
    setProjectNumber(criteria.projectNumber || '')
    setActivityCode(criteria.activityCode || '')
    setFundingMechanism(criteria.fundingMechanism || '')
    setResults([])
    setHasSearched(false)
    setTab('search')
  }

  const totalAmount = results.reduce((sum, r) => sum + (r.awardAmount || 0), 0)

  const ACTIVITY_CODES = [
    { value: '', label: 'All' },
    { value: 'R01', label: 'R01 — Research Grant' },
    { value: 'R21', label: 'R21 — Exploratory/Developmental' },
    { value: 'R03', label: 'R03 — Small Research Grant' },
    { value: 'R15', label: 'R15 — AREA Grant' },
    { value: 'R35', label: 'R35 — MIRA' },
    { value: 'R56', label: 'R56 — High Priority Grant' },
    { value: 'U01', label: 'U01 — Cooperative Agreement' },
    { value: 'U54', label: 'U54 — Specialized Center' },
    { value: 'P01', label: 'P01 — Program Project' },
    { value: 'P30', label: 'P30 — Center Core Grant' },
    { value: 'P50', label: 'P50 — Specialized Center' },
    { value: 'T32', label: 'T32 — Institutional Training' },
    { value: 'T35', label: 'T35 — Short-Term Training' },
    { value: 'F31', label: 'F31 — Predoctoral Fellowship' },
    { value: 'F32', label: 'F32 — Postdoctoral Fellowship' },
    { value: 'K01', label: 'K01 — Mentored Research Award' },
    { value: 'K08', label: 'K08 — Clinical Investigator' },
    { value: 'K23', label: 'K23 — Patient-Oriented Research' },
    { value: 'K99', label: 'K99 — Pathway to Independence' },
  ]

  const FUNDING_MECHANISMS = [
    { value: '', label: 'All' },
    { value: 'Research Grant', label: 'Research Grant' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Cooperative Agreement', label: 'Cooperative Agreement' },
    { value: 'Training Grant', label: 'Training Grant' },
    { value: 'Fellowship', label: 'Fellowship' },
    { value: 'Career Development', label: 'Career Development' },
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 11 }, (_, i) => currentYear + 1 - i)

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-top">
            <h1>
              <span className="header-icon">🏛️</span>
              NIH Award Tracker
            </h1>
            <nav className="tab-nav">
              <button
                className={`tab-btn ${tab === 'search' ? 'active' : ''}`}
                onClick={() => setTab('search')}
              >
                🔍 Search
              </button>
              <button
                className={`tab-btn ${tab === 'alerts' ? 'active' : ''}`}
                onClick={() => setTab('alerts')}
              >
                🔔 Alerts
                {alertBadge > 0 && <span className="tab-badge">{alertBadge}</span>}
              </button>
            </nav>
          </div>
          <p className="subtitle">
            {tab === 'search'
              ? 'Search NIH RePORTER for award recipients.'
              : 'Monitor awards and get notified when new recipients match your criteria.'}
          </p>
        </div>
      </header>

      {tab === 'search' && (
        <>
          <form className="search-form" onSubmit={handleSubmit}>
            <div className="search-grid">
              <div className="field">
                <label htmlFor="org">Organization</label>
                <input
                  id="org"
                  placeholder="e.g. Harvard University"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="pi">PI Last Name</label>
                <input
                  id="pi"
                  placeholder="e.g. Smith"
                  value={piName}
                  onChange={(e) => setPiName(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="fy">Fiscal Year</label>
                <select
                  id="fy"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                >
                  <option value="">All</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="proj">Project Number</label>
                <input
                  id="proj"
                  placeholder="e.g. R01GM12345"
                  value={projectNumber}
                  onChange={(e) => setProjectNumber(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="activity">Activity Code</label>
                <select
                  id="activity"
                  value={activityCode}
                  onChange={(e) => setActivityCode(e.target.value)}
                >
                  {ACTIVITY_CODES.map(ac => (
                    <option key={ac.value} value={ac.value}>{ac.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="mechanism">Funding Mechanism</label>
                <select
                  id="mechanism"
                  value={fundingMechanism}
                  onChange={(e) => setFundingMechanism(e.target.value)}
                >
                  {FUNDING_MECHANISMS.map(fm => (
                    <option key={fm.value} value={fm.value}>{fm.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="search-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Searching…' : '🔍 Search Awards'}
              </button>
              {(organization || piName || fiscalYear || projectNumber || activityCode || fundingMechanism) && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setOrganization(''); setPiName(''); setFiscalYear(String(DEFAULT_FISCAL_YEAR)); setProjectNumber(''); setActivityCode(''); setFundingMechanism('') }}
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          {error && (
            <div className="error-banner">⚠️ {error}</div>
          )}

          {hasSearched && !loading && (
            <div className="results-section">
              <div className="results-header">
                <div className="results-stats">
                  <strong>{results.length}</strong> results
                  {meta?.total != null && (
                    <span className="meta"> of {meta.total.toLocaleString()} total</span>
                  )}
                  {results.length > 0 && (
                    <span className="total">
                      {' · '}Total: <strong>{formatCurrency(totalAmount)}</strong>
                    </span>
                  )}
                  {newAwards.length > 0 && (
                    <span className="new-badge">
                      {' · '}<strong>{newAwards.length} new</strong> since last check
                    </span>
                  )}
                </div>
              </div>

              {results.length === 0 ? (
                <div className="empty-state">
                  <p>No awards found matching your criteria.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Project #</th>
                        <th>Title</th>
                        <th>Organization</th>
                        <th>PI(s)</th>
                        <th>FY</th>
                        <th className="num">Award</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => {
                        const isNew = newAwards.includes(r.projectNumber)
                        return (
                          <>
                            <tr
                              key={r.projectNumber || i}
                              className={`result-row ${isNew ? 'is-new' : ''}`}
                            >
                              <td>{isNew && <span className="new-dot" title="New since last check">●</span>}</td>
                              <td className="mono">{r.projectNumber || '—'}</td>
                              <td className="title-cell" title={r.projectTitle}>
                                <a
                                  href={r.projectDetailUrl || `https://reporter.nih.gov/search/${r.projectNumber}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {r.projectTitle || 'Untitled'}
                                </a>
                              </td>
                              <td>
                                {r.organizationName}
                                {r.organizationCity && `, ${r.organizationCity}`}
                              </td>
                              <td>
                                {r.principalInvestigators?.map(pi => pi.fullName || `${pi.firstName || ''} ${pi.lastName || ''}`.trim()).filter(Boolean).join(', ') || '—'}
                              </td>
                              <td>{r.fiscalYear || '—'}</td>
                              <td className="num">{formatCurrency(r.awardAmount)}</td>
                              <td>
                                <button
                                  className="btn-expand"
                                  onClick={() => setExpandedRow(expandedRow === (r.projectNumber || i) ? null : (r.projectNumber || i))}
                                  title="Show details"
                                >
                                  {expandedRow === (r.projectNumber || i) ? '▾' : '▸'}
                                </button>
                              </td>
                            </tr>
                            {expandedRow === (r.projectNumber || i) && (
                              <tr key={`${r.projectNumber || i}-detail`} className="detail-row">
                                <td colSpan={8}>
                                  <div className="detail-content">
                                    {r.abstractText && (
                                      <div className="detail-block">
                                        <h4>Abstract</h4>
                                        <p>{r.abstractText}</p>
                                      </div>
                                    )}
                                    <div className="detail-grid">
                                      {r.fundingMechanism && (
                                        <div><strong>Mechanism:</strong> {r.fundingMechanism}</div>
                                      )}
                                      {r.cfdaCode && (
                                        <div><strong>CFDA:</strong> {r.cfdaCode}</div>
                                      )}
                                      {r.awardNoticeDate && (
                                        <div><strong>Award Date:</strong> {formatDate(r.awardNoticeDate)}</div>
                                      )}
                                      {r.budgetStartDate && (
                                        <div><strong>Budget Start:</strong> {formatDate(r.budgetStartDate)}</div>
                                      )}
                                      {r.budgetEndDate && (
                                        <div><strong>Budget End:</strong> {formatDate(r.budgetEndDate)}</div>
                                      )}
                                      {r.directCosts != null && r.directCosts !== '' && (
                                        <div><strong>Direct Costs:</strong> {formatCurrency(r.directCosts)}</div>
                                      )}
                                      {r.indirectCosts != null && r.indirectCosts !== '' && (
                                        <div><strong>Indirect Costs:</strong> {formatCurrency(r.indirectCosts)}</div>
                                      )}
                                      {r.opportunityNumber && (
                                        <div><strong>Opportunity #:</strong> {r.opportunityNumber}</div>
                                      )}
                                      {r.programOfficer && (
                                        <div><strong>PO:</strong> {typeof r.programOfficer === 'string' ? r.programOfficer : r.programOfficer?.name || '—'}</div>
                                      )}
                                    </div>
                                    {r.projectDetailUrl && (
                                      <a
                                        href={r.projectDetailUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="detail-link"
                                      >
                                        View on NIH RePORTER →
                                      </a>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      })}
                    </tbody>
                  </table>

                  {meta && meta.total > results.length && (
                    <div className="pagination">
                      <span>
                        Showing {offset + 1}–{offset + results.length} of {meta.total.toLocaleString()}
                      </span>
                      <div className="page-btns">
                        {offset > 0 && (
                          <button className="btn-secondary" onClick={() => doSearch(offset - 25)}>
                            ← Prev
                          </button>
                        )}
                        {offset + results.length < meta.total && (
                          <button className="btn-secondary" onClick={() => doSearch(offset + 25)}>
                            Next →
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!hasSearched && !loading && (
            <div className="empty-state initial">
              <div className="empty-icon">🔬</div>
              <h2>Welcome</h2>
              <p>Search for NIH grant awards above. When you find criteria worth monitoring, head to the Alerts tab to set up notifications.</p>
            </div>
          )}
        </>
      )}

      {tab === 'alerts' && (
        <AlertsPanel
          searchCriteria={currentCriteria}
          onNavigate={handleNavigateToSearch}
        />
      )}

      <footer className="footer">
        <p>Data from <a href="https://reporter.nih.gov/" target="_blank" rel="noopener noreferrer">NIH RePORTER</a> · API v2</p>
      </footer>
    </div>
  )
}

export default App
