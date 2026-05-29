import { useState, useEffect } from 'react'
import {
  getAlerts, createAlert, toggleAlert, deleteAlert,
  criteriaSummary, updateAlert,
} from './alerts'
import { formatCurrency } from './api'

export default function AlertsPanel({ searchCriteria, onNavigate }) {
  const [alerts, setAlerts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [expandedId, setExpandedId] = useState(null)

  // Common activity codes from NIH RePORTER
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

  function emptyForm() {
    return {
      name: '',
      organization: searchCriteria?.organization || '',
      pi: searchCriteria?.pi || '',
      fiscalYear: searchCriteria?.fiscalYear || '',
      projectNumber: searchCriteria?.projectNumber || '',
      activityCode: searchCriteria?.activityCode || '',
      fundingMechanism: searchCriteria?.fundingMechanism || '',
      notifyEmail: '',
      frequency: 'daily',
    }
  }

  useEffect(() => {
    setAlerts(getAlerts())
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editingId) {
      updateAlert(editingId, {
        name: form.name.trim(),
        criteria: {
          organization: form.organization,
          pi: form.pi,
          fiscalYear: form.fiscalYear,
          projectNumber: form.projectNumber,
          activityCode: form.activityCode,
          fundingMechanism: form.fundingMechanism,
        },
        notifyEmail: form.notifyEmail,
        frequency: form.frequency,
      })
    } else {
      createAlert({
        name: form.name.trim(),
        organization: form.organization || undefined,
        pi: form.pi || undefined,
        fiscalYear: form.fiscalYear || undefined,
        projectNumber: form.projectNumber || undefined,
        activityCode: form.activityCode || undefined,
        fundingMechanism: form.fundingMechanism || undefined,
        notifyEmail: form.notifyEmail || undefined,
        frequency: form.frequency,
      })
    }
    setAlerts(getAlerts())
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm())
  }

  function handleEdit(alert) {
    setEditingId(alert.id)
    setForm({
      name: alert.name,
      organization: alert.criteria.organization || '',
      pi: alert.criteria.pi || '',
      fiscalYear: alert.criteria.fiscalYear || '',
      projectNumber: alert.criteria.projectNumber || '',
      activityCode: alert.criteria.activityCode || '',
      fundingMechanism: alert.criteria.fundingMechanism || '',
      notifyEmail: alert.notifyEmail || '',
      frequency: alert.frequency || 'daily',
    })
    setShowForm(true)
  }

  function handleDelete(id) {
    if (!confirm('Delete this alert?')) return
    deleteAlert(id)
    setAlerts(getAlerts())
    if (expandedId === id) setExpandedId(null)
  }

  function handleToggle(id) {
    toggleAlert(id)
    setAlerts(getAlerts())
  }

  function handleNewFromSearch() {
    setForm({
      name: '',
      organization: searchCriteria?.organization || '',
      pi: searchCriteria?.pi || '',
      fiscalYear: searchCriteria?.fiscalYear || '',
      projectNumber: searchCriteria?.projectNumber || '',
      activityCode: searchCriteria?.activityCode || '',
      fundingMechanism: searchCriteria?.fundingMechanism || '',
      notifyEmail: '',
      frequency: 'daily',
    })
    setEditingId(null)
    setShowForm(true)
  }

  const enabledCount = alerts.filter(a => a.enabled).length

  return (
    <div className="alerts-panel">
      <div className="alerts-header">
        <div>
          <h2>🔔 Saved Alerts</h2>
          <p className="alerts-subtitle">
            {alerts.length === 0
              ? 'Get notified when new awards match your criteria.'
              : `${enabledCount} active · ${alerts.length} total`}
          </p>
        </div>
        <button className="btn-primary btn-sm" onClick={handleNewFromSearch}>
          + New Alert
        </button>
      </div>

      {showForm && (
        <form className="alert-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Alert' : 'New Alert'}</h3>

          <div className="field">
            <label htmlFor="alert-name">Alert Name</label>
            <input
              id="alert-name"
              placeholder="e.g. Stanford R01 Awards 2025"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="alert-form-grid">
            <div className="field">
              <label htmlFor="alert-org">Organization</label>
              <input
                id="alert-org"
                placeholder="e.g. Stanford"
                value={form.organization}
                onChange={e => setForm({ ...form, organization: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="alert-pi">PI Last Name</label>
              <input
                id="alert-pi"
                placeholder="e.g. Smith"
                value={form.pi}
                onChange={e => setForm({ ...form, pi: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="alert-fy">Fiscal Year</label>
              <input
                id="alert-fy"
                placeholder="e.g. 2025"
                value={form.fiscalYear}
                onChange={e => setForm({ ...form, fiscalYear: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="alert-proj">Project Number</label>
              <input
                id="alert-proj"
                placeholder="e.g. R01GM12345"
                value={form.projectNumber}
                onChange={e => setForm({ ...form, projectNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="alert-form-grid">
            <div className="field">
              <label htmlFor="alert-activity">Activity Code</label>
              <select
                id="alert-activity"
                value={form.activityCode}
                onChange={e => setForm({ ...form, activityCode: e.target.value })}
              >
                {ACTIVITY_CODES.map(ac => (
                  <option key={ac.value} value={ac.value}>{ac.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="alert-mechanism">Funding Mechanism</label>
              <select
                id="alert-mechanism"
                value={form.fundingMechanism}
                onChange={e => setForm({ ...form, fundingMechanism: e.target.value })}
              >
                {FUNDING_MECHANISMS.map(fm => (
                  <option key={fm.value} value={fm.value}>{fm.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="alert-form-grid">
            <div className="field">
              <label htmlFor="alert-email">Notify Email</label>
              <input
                id="alert-email"
                type="email"
                placeholder="you@example.com"
                value={form.notifyEmail}
                onChange={e => setForm({ ...form, notifyEmail: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="alert-freq">Frequency</label>
              <select
                id="alert-freq"
                value={form.frequency}
                onChange={e => setForm({ ...form, frequency: e.target.value })}
              >
                <option value="immediate">Immediate</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
              </select>
            </div>
          </div>

          <div className="alert-form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? 'Save Changes' : 'Create Alert'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm()) }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {alerts.length === 0 && !showForm ? (
        <div className="alerts-empty">
          <div className="empty-icon">🔔</div>
          <h3>No alerts yet</h3>
          <p>Search for awards above, then click "New Alert" to save the criteria and get notified of new matches.</p>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`alert-card ${alert.enabled ? '' : 'disabled'} ${expandedId === alert.id ? 'expanded' : ''}`}
            >
              <div className="alert-card-header">
                <div className="alert-card-info">
                  <button
                    className="alert-toggle"
                    onClick={() => handleToggle(alert.id)}
                    title={alert.enabled ? 'Disable' : 'Enable'}
                  >
                    <span className={`toggle-switch ${alert.enabled ? 'on' : 'off'}`}>
                      <span className="toggle-knob" />
                    </span>
                  </button>
                  <div className="alert-card-text">
                    <span className="alert-name">{alert.name}</span>
                    <span className="alert-criteria">{criteriaSummary(alert.criteria)}</span>
                  </div>
                </div>
                <div className="alert-card-meta">
                  {alert.lastMatchCount > 0 && (
                    <span className="alert-match-badge">{alert.lastMatchCount} found</span>
                  )}
                  <span className="alert-frequency">{alert.frequency}</span>
                  <button
                    className="btn-icon"
                    onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                    title="Details"
                  >
                    {expandedId === alert.id ? '▾' : '▸'}
                  </button>
                </div>
              </div>

              {expandedId === alert.id && (
                <div className="alert-card-body">
                  <div className="alert-detail-grid">
                    <div><strong>Email:</strong> {alert.notifyEmail || '—'}</div>
                    <div><strong>Frequency:</strong> {alert.frequency}</div>
                    <div><strong>Status:</strong> {alert.enabled ? 'Active' : 'Paused'}</div>
                    <div><strong>Created:</strong> {new Date(alert.createdAt).toLocaleDateString()}</div>
                    <div><strong>Last checked:</strong> {alert.lastChecked ? new Date(alert.lastChecked).toLocaleString() : 'Never'}</div>
                    <div><strong>Last matches:</strong> {alert.lastMatchCount}</div>
                  </div>

                  {/* Mini search results preview if this alert has criteria */}
                  {hasCriteria(alert) && (
                    <div className="alert-preview-actions">
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => onNavigate && onNavigate(alert.criteria)}
                      >
                        🔍 Search with this criteria
                      </button>
                    </div>
                  )}

                  <div className="alert-card-actions">
                    <button className="btn-secondary btn-sm" onClick={() => handleEdit(alert)}>
                      ✏️ Edit
                    </button>
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(alert.id)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function hasCriteria(alert) {
  const c = alert.criteria
  return c.organization || c.pi || c.fiscalYear || c.projectNumber || c.activityCode || c.fundingMechanism
}
