import { useState, useCallback } from 'react'
import { searchAwards, formatCurrency, formatDate } from './api'
import './App.css'

const DEFAULT_FISCAL_YEAR = new Date().getFullYear()

function App() {
  const [organization, setOrganization] = useState('')
  const [piName, setPiName] = useState('')
  const [fiscalYear, setFiscalYear] = useState(String(DEFAULT_FISCAL_YEAR))
  const [projectNumber, setProjectNumber] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [meta, setMeta] = useState(null)
  const [offset, setOffset] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)

  const doSearch = useCallback(async (newOffset = 0) => {
    setLoading(true)
    setError(null)
    try {
      const data = await searchAwards({
        organization: organization || undefined,
        pi: piName || undefined,
        fiscalYear: fiscalYear || undefined,
        projectNumber: projectNumber || undefined,
        offset: newOffset,
        limit: 25,
      })
      setResults(data.results)
      setMeta(data.meta)
      setOffset(newOffset)
      setHasSearched(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [organization, piName, fiscalYear, projectNumber])

  const handleSubmit = (e) => {
    e.preventDefault()
    doSearch(0)
  }

  const totalAmount = results.reduce((sum, r) => sum + (r.awardAmount || 0), 0)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 11 }, (_, i) => currentYear + 1 - i)

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1>
            <span className="header-icon">🏛️</span>
            NIH Award Tracker
          </h1>
          <p className="subtitle">Search NIH RePORTER for award recipients by organization, PI, fiscal year, or project number.</p>
        </div>
      </header>

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
        </div>
        <div className="search-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Searching…' : '🔍 Search Awards'}
          </button>
          {(organization || piName || fiscalYear || projectNumber) && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setOrganization(''); setPiName(''); setFiscalYear(String(DEFAULT_FISCAL_YEAR)); setProjectNumber('') }}
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
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
                  {results.map((r, i) => (
                    <>
                      <tr key={r.projectNumber || i} className="result-row">
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
                          <td colSpan={7}>
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
                  ))}
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
          <p>Use the form above to search NIH RePORTER for grant awards. Try searching by organization name (e.g. "Stanford") or PI name to get started.</p>
        </div>
      )}

      <footer className="footer">
        <p>Data from <a href="https://reporter.nih.gov/" target="_blank" rel="noopener noreferrer">NIH RePORTER</a> · API v2</p>
      </footer>
    </div>
  )
}

export default App
