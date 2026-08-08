import React, { useState, useEffect } from 'react';
import './InboxScan.css';
import Results from './Results';
import CompareResults from './CompareResults';
import { analyzeCity } from '../utils/api';

const API_URL = process.env.REACT_APP_API_URL || '';

const SUPPORTED_CITIES = [
  'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL',
  'Seattle, WA', 'Austin, TX', 'Boston, MA', 'Washington, DC',
  'Miami, FL', 'Denver, CO', 'Atlanta, GA', 'Nashville, TN', 'Raleigh, NC',
];

// Best-effort match of a raw location string to a supported city
function matchCity(raw) {
  if (!raw) return '';
  const lower = raw.toLowerCase();
  for (const city of SUPPORTED_CITIES) {
    const [name] = city.split(', ');
    if (lower.includes(name.toLowerCase())) return city;
  }
  // State abbreviation fallback
  const stateMap = { ny: 'New York, NY', ca: 'San Francisco, CA', il: 'Chicago, IL',
    wa: 'Seattle, WA', tx: 'Austin, TX', ma: 'Boston, MA', dc: 'Washington, DC',
    fl: 'Miami, FL', co: 'Denver, CO', ga: 'Atlanta, GA', tn: 'Nashville, TN', nc: 'Raleigh, NC' };
  for (const [abbr, city] of Object.entries(stateMap)) {
    if (lower.includes(`, ${abbr}`) || lower.endsWith(abbr)) return city;
  }
  return '';
}

function parseSalary(str) {
  if (!str) return null;
  const nums = str.replace(/,/g, '').match(/[\d.]+[kK]?/g);
  if (!nums) return null;
  const vals = nums.map(n => {
    const v = parseFloat(n);
    return /[kK]$/.test(n) ? v * 1000 : v;
  }).filter(v => v > 10000); // ignore obviously non-salary numbers
  if (!vals.length) return null;
  return vals.length > 1 ? Math.round((vals[0] + vals[1]) / 2) : vals[0];
}

const STATUS_CONFIG = {
  applied:   { label: 'Applied',   cls: 'inbox-badge-applied' },
  interview: { label: 'Interview', cls: 'inbox-badge-interview' },
  offer:     { label: 'Offer',     cls: 'inbox-badge-offer' },
  rejected:  { label: 'Rejected',  cls: 'inbox-badge-rejected' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.applied;
  return <span className={`inbox-badge ${cfg.cls}`}>{cfg.label}</span>;
}

function JobTable({ jobs, selected, onToggle, onAnalyze }) {
  return (
    <div className="inbox-table-wrap">
      <table className="inbox-table">
        <thead>
          <tr>
            <th className="inbox-th-check" />
            <th>Company</th>
            <th>Role</th>
            <th>Status</th>
            <th>Location</th>
            <th>Salary</th>
            <th>Date</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, i) => (
            <tr
              key={i}
              className={[
                'inbox-row',
                selected.has(i) ? 'inbox-row-selected' : '',
                job.status === 'rejected' ? 'inbox-row-rejected' : '',
              ].filter(Boolean).join(' ')}
            >
              <td className="inbox-td-check">
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => onToggle(i)}
                  className="inbox-checkbox"
                />
              </td>
              <td className="inbox-td-company">{job.company || '—'}</td>
              <td className="inbox-td-role">{job.role || '—'}</td>
              <td className="inbox-td-status"><StatusBadge status={job.status} /></td>
              <td className="inbox-td-loc">{job.location || '—'}</td>
              <td className="inbox-td-salary">{job.salary || '—'}</td>
              <td className="inbox-td-date">{job.source_date || '—'}</td>
              <td className="inbox-td-action">
                <button className="inbox-analyze-btn" onClick={() => onAnalyze(i)}>
                  Analyze
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CityPicker({ job, onConfirm, onCancel }) {
  const suggested = matchCity(job.location);
  const [city, setCity] = useState(suggested || '');
  const [salary, setSalary] = useState(parseSalary(job.salary) || 70000);

  const cityMissing = !suggested;
  const salaryMissing = !parseSalary(job.salary);

  return (
    <div className="inbox-picker-overlay">
      <div className="inbox-picker">
        <div className="inbox-picker-title">{job.company} — {job.role}</div>
        {(cityMissing || salaryMissing) && (
          <div className="inbox-picker-missing">
            {cityMissing && salaryMissing
              ? 'City and salary weren\'t found in the email — fill them in below to run the analysis.'
              : cityMissing
              ? `City wasn't found in the email — pick the closest match below.`
              : `Salary wasn't found in the email — adjust the estimate below.`}
          </div>
        )}
        <label className="inbox-picker-label">City</label>
        <select
          className="inbox-picker-select"
          value={city}
          onChange={e => setCity(e.target.value)}
        >
          <option value="">Select a city...</option>
          {SUPPORTED_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="inbox-picker-label" style={{ marginTop: 12 }}>Annual Salary</label>
        <input
          className="inbox-picker-input"
          type="number"
          value={salary}
          onChange={e => setSalary(Number(e.target.value))}
          placeholder="e.g. 95000"
        />
        <div className="inbox-picker-note">
          Age and vibe use defaults (25, balanced) — re-run on the Single City tab for full customization.
        </div>
        <div className="inbox-picker-actions">
          <button className="inbox-picker-cancel" onClick={onCancel}>Cancel</button>
          <button
            className="inbox-picker-confirm"
            disabled={!city || !salary}
            onClick={() => onConfirm({ city, salary: Number(salary) })}
          >
            Analyze
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InboxScan({ accessToken, oauthError }) {
  const [phase, setPhase] = useState(accessToken ? 'scanning' : 'idle');
  const [jobs, setJobs] = useState([]);
  const [scanned, setScanned] = useState(0);
  const [error, setError] = useState(oauthError || '');
  const [selected, setSelected] = useState(new Set());

  // Single-job analyze
  const [pickingFor, setPickingFor] = useState(null); // job index
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  // Comparison
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  useEffect(() => {
    if (accessToken) doScan(accessToken);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doScan = async (token) => {
    setPhase('scanning');
    setError('');
    try {
      const res = await fetch(`${API_URL}/inbox-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Scan failed');
      setJobs(data.jobs || []);
      setScanned(data.scanned || 0);
      setPhase('results');
    } catch (e) {
      setError(e.message);
      setPhase('error');
    }
  };

  const handleConnect = async () => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/oauth/google`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to start OAuth');
      window.location.href = data.auth_url;
    } catch (e) {
      setError(e.message);
    }
  };

  const toggleSelected = (i) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i); else next.add(i);
    setSelected(next);
  };

  const handleAnalyzePick = (i) => {
    setAnalyzeResult(null);
    setCompareResult(null);
    setPickingFor(i);
  };

  const handleAnalyzeConfirm = async ({ city, salary }) => {
    setPickingFor(null);
    setAnalyzeLoading(true);
    try {
      const data = await analyzeCity({ salary, city, age: 25, vibe: 'balanced' });
      setAnalyzeResult(data);
    } catch (e) {
      setError('Analysis failed: ' + e.message);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const handleCompare = async () => {
    const indices = [...selected].slice(0, 2);
    const [jobA, jobB] = [jobs[indices[0]], jobs[indices[1]]];
    const cityA = matchCity(jobA.location) || 'New York, NY';
    const cityB = matchCity(jobB.location) || 'San Francisco, CA';
    const salaryA = parseSalary(jobA.salary) || 70000;
    const salaryB = parseSalary(jobB.salary) || 70000;
    setAnalyzeResult(null);
    setCompareLoading(true);
    try {
      const [dataA, dataB] = await Promise.all([
        analyzeCity({ salary: salaryA, city: cityA, age: 25, vibe: 'balanced' }),
        analyzeCity({ salary: salaryB, city: cityB, age: 25, vibe: 'balanced' }),
      ]);
      setCompareResult({ cityA: dataA, cityB: dataB });
    } catch (e) {
      setError('Comparison failed: ' + e.message);
    } finally {
      setCompareLoading(false);
    }
  };

  const handleBack = () => {
    setAnalyzeResult(null);
    setCompareResult(null);
    setSelected(new Set());
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (analyzeResult && !analyzeLoading) {
    return (
      <div className="inbox-wrap">
        <button className="inbox-back-btn" onClick={handleBack}>← Back to results</button>
        <Results results={analyzeResult} />
      </div>
    );
  }

  if (compareResult && !compareLoading) {
    return (
      <div className="inbox-wrap">
        <button className="inbox-back-btn" onClick={handleBack}>← Back to results</button>
        <CompareResults results={compareResult} />
      </div>
    );
  }

  return (
    <div className="inbox-wrap">
      <div className="inbox-hero">
        <div className="inbox-hero-label">Gmail Integration</div>
        <h2 className="inbox-hero-title">Scan your inbox for job applications</h2>
        <p className="inbox-hero-sub">
          Connect Gmail read-only access to pull application confirmation emails. Claude extracts company, role, salary, and location — then you can run any result through GradMap's full city analysis.
        </p>
      </div>

      {error && <div className="inbox-error">{error}</div>}

      {phase === 'idle' && (
        <div className="inbox-connect-box">
          <button className="inbox-connect-btn" onClick={handleConnect}>
            Connect Gmail
          </button>
          <p className="inbox-connect-note">
            Read-only access. Your emails are never stored — raw data is discarded after the scan.
          </p>
        </div>
      )}

      {phase === 'scanning' && (
        <div className="inbox-loading">
          <div className="loading-bar"><div className="loading-fill" /></div>
          <div className="loading-text">Scanning your inbox...</div>
        </div>
      )}

      {(analyzeLoading || compareLoading) && (
        <div className="inbox-loading">
          <div className="loading-bar"><div className="loading-fill" /></div>
          <div className="loading-text">{compareLoading ? 'Comparing cities...' : 'Analyzing city...'}</div>
        </div>
      )}

      {phase === 'results' && !analyzeLoading && !compareLoading && (
        <>
          <div className="inbox-results-header">
            <div className="inbox-results-meta">
              {jobs.length === 0
                ? `Scanned ${scanned} emails — no application confirmations found.`
                : `Found ${jobs.length} application${jobs.length !== 1 ? 's' : ''} across ${scanned} emails.`}
            </div>
            {selected.size === 2 && (
              <button className="inbox-compare-btn" onClick={handleCompare}>
                Compare 2 selected
              </button>
            )}
            {selected.size > 0 && selected.size !== 2 && (
              <span className="inbox-select-hint">Select exactly 2 rows to compare</span>
            )}
          </div>

          {jobs.length > 0 && (
            <JobTable
              jobs={jobs}
              selected={selected}
              onToggle={toggleSelected}
              onAnalyze={handleAnalyzePick}
            />
          )}

          {jobs.length === 0 && (
            <div className="inbox-empty">
              Try connecting a Gmail account that has received application confirmation emails, or apply to some jobs and check back later.
            </div>
          )}
        </>
      )}

      {phase === 'error' && !error && (
        <div className="inbox-error">Something went wrong. Try reconnecting Gmail.</div>
      )}

      {pickingFor !== null && (
        <CityPicker
          job={jobs[pickingFor]}
          onConfirm={handleAnalyzeConfirm}
          onCancel={() => setPickingFor(null)}
        />
      )}
    </div>
  );
}
