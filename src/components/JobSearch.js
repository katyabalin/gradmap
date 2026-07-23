import React, { useState } from 'react';
import './JobSearch.css';

const CITIES = [
  'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL',
  'Seattle, WA', 'Austin, TX', 'Boston, MA', 'Washington, DC',
  'Miami, FL', 'Denver, CO', 'Atlanta, GA', 'Nashville, TN', 'Raleigh, NC',
];

const COL_INDEX = {
  'New York, NY': 187, 'San Francisco, CA': 194, 'Los Angeles, CA': 163,
  'Chicago, IL': 107, 'Seattle, WA': 150, 'Austin, TX': 118,
  'Boston, MA': 162, 'Washington, DC': 153, 'Miami, FL': 123,
  'Denver, CO': 128, 'Atlanta, GA': 108, 'Nashville, TN': 112,
  'Raleigh, NC': 103,
};

function parseSalary(salaryStr) {
  if (!salaryStr) return null;
  const nums = salaryStr.match(/[\d,]+/g);
  if (!nums) return null;
  const values = nums.map((n) => parseInt(n.replace(/,/g, ''), 10)).filter((n) => n > 0);
  if (!values.length) return null;
  const isHourly = /hour|hr/i.test(salaryStr);
  const midpoint = values.length >= 2 ? (values[0] + values[1]) / 2 : values[0];
  return isHourly ? Math.round(midpoint * 2080) : Math.round(midpoint);
}

function colAdjusted(salary, city) {
  const col = COL_INDEX[city] || 100;
  return Math.round(salary / (col / 100));
}

function JobCard({ job, rank }) {
  const salary = parseSalary(job.salary);
  const adjusted = salary ? colAdjusted(salary, job.city) : null;
  const isTop = rank === 0;

  return (
    <div className={'job-card' + (isTop ? ' job-card-top' : '')}>
      <div className="job-card-rank">#{rank + 1}</div>
      <div className="job-card-body">
        <div className="job-card-header">
          <div>
            <div className="job-title">{job.title}</div>
            <div className="job-company">{job.company} — {job.location}</div>
          </div>
          {job.applyLink && (
            <a className="job-apply-btn" href={job.applyLink} target="_blank" rel="noreferrer">
              Apply
            </a>
          )}
        </div>

        <div className="job-salary-row">
          <div className="job-salary-block">
            <div className="job-salary-label">Listed Salary</div>
            <div className="job-salary-value">
              {salary ? '$' + salary.toLocaleString() : 'Not listed'}
            </div>
          </div>
          {adjusted && (
            <div className="job-salary-block job-salary-block-highlight">
              <div className="job-salary-label">COL-Adjusted Value</div>
              <div className="job-salary-value job-adjusted-value">
                ${adjusted.toLocaleString()}
              </div>
            </div>
          )}
          {job.posted && (
            <div className="job-salary-block">
              <div className="job-salary-label">Posted</div>
              <div className="job-salary-value job-posted">{job.posted}</div>
            </div>
          )}
        </div>

        {job.description && (
          <div className="job-description">{job.description}…</div>
        )}
      </div>
    </div>
  );
}

function JobSearch() {
  const [role, setRole] = useState('');
  const [selectedCities, setSelectedCities] = useState([]);
  const [jobs, setJobs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleCity = (city) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role || !selectedCities.length) return;
    setLoading(true);
    setError('');
    setJobs(null);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, cities: selectedCities }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Sort: jobs with parsed salary first (by COL-adjusted desc), rest at bottom
      const ranked = [...data.jobs].sort((a, b) => {
        const sa = parseSalary(a.salary);
        const sb = parseSalary(b.salary);
        const aa = sa ? colAdjusted(sa, a.city) : 0;
        const ab = sb ? colAdjusted(sb, b.city) : 0;
        return ab - aa;
      });

      setJobs(ranked);
    } catch {
      setError('Search failed. Make sure SERPAPI_KEY is set in your environment variables.');
    } finally {
      setLoading(false);
    }
  };

  const isValid = role.trim() && selectedCities.length > 0;

  return (
    <div className="job-search">
      <div className="hero">
        <div className="hero-label">Job Search</div>
        <h1 className="hero-title">Which offer actually<br /><em>pays more?</em></h1>
        <p className="hero-sub">
          Search real listings across multiple cities and see which pays the most after cost of living.
        </p>
      </div>

      <div className="job-form-card">
        <form onSubmit={handleSubmit}>
          <div className="job-form-top">
            <div className="form-group">
              <label className="form-label">Job Title / Role</label>
              <input
                className="form-input-standalone"
                type="text"
                placeholder="e.g. Software Engineer, Product Manager"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>

          <div className="job-cities-label form-label">Cities to Search</div>
          <div className="job-city-grid">
            {CITIES.map((city) => (
              <button
                key={city}
                type="button"
                className={'job-city-btn' + (selectedCities.includes(city) ? ' job-city-btn-active' : '')}
                onClick={() => toggleCity(city)}
              >
                {city}
              </button>
            ))}
          </div>

          <button className="submit-btn" type="submit" disabled={loading || !isValid}>
            {loading ? 'Searching...' : 'Search Jobs'}
          </button>
        </form>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading && (
        <div className="loading-wrap">
          <div className="loading-bar"><div className="loading-fill" /></div>
          <div className="loading-text">Fetching listings and ranking by real value...</div>
        </div>
      )}

      {jobs && (
        <div className="job-results">
          <div className="section-label">
            {jobs.length} listings ranked by COL-adjusted salary
          </div>
          <div className="job-col-note">
            COL-adjusted value = what each salary is worth relative to national average purchasing power.
          </div>
          {jobs.length === 0 ? (
            <div className="job-empty">No listings found. Try a broader role or different cities.</div>
          ) : (
            jobs.map((job, i) => <JobCard key={i} job={job} rank={i} />)
          )}
        </div>
      )}
    </div>
  );
}

export default JobSearch;
