import React, { useState } from 'react';
import './CompareForm.css';

const CITIES = [
  'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL',
  'Seattle, WA', 'Austin, TX', 'Boston, MA', 'Washington, DC',
  'Miami, FL', 'Denver, CO', 'Atlanta, GA', 'Nashville, TN'
];

const VIBES = ['Trendy & Social', 'Quiet & Residential', 'Walkable & Urban', 'Outdoorsy', 'Artsy & Creative'];

function CompareForm({ onSubmit, loading }) {
  const [salaryA, setSalaryA] = useState('');
  const [cityA, setCityA] = useState('');
  const [salaryB, setSalaryB] = useState('');
  const [cityB, setCityB] = useState('');
  const [vibe, setVibe] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!salaryA || !cityA || !salaryB || !cityB) return;
    onSubmit({ salaryA: parseInt(salaryA), cityA, salaryB: parseInt(salaryB), cityB, vibe });
  };

  const isValid = salaryA && cityA && salaryB && cityB;

  return (
    <div className="compare-form-card">
      <form onSubmit={handleSubmit}>
        <div className="compare-cols">
          <div className="compare-col">
            <div className="compare-col-label">🏙 Offer A</div>
            <div className="form-group">
              <label className="form-label">Annual Salary</label>
              <div className="input-prefix-wrap">
                <span className="input-prefix">$</span>
                <input className="form-input" type="number" placeholder="95000" value={salaryA} onChange={e => setSalaryA(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <select className="form-select" value={cityA} onChange={e => setCityA(e.target.value)}>
                <option value="">Select a city...</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="compare-vs">VS</div>

          <div className="compare-col">
            <div className="compare-col-label">🌆 Offer B</div>
            <div className="form-group">
              <label className="form-label">Annual Salary</label>
              <div className="input-prefix-wrap">
                <span className="input-prefix">$</span>
                <input className="form-input" type="number" placeholder="85000" value={salaryB} onChange={e => setSalaryB(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <select className="form-select" value={cityB} onChange={e => setCityB(e.target.value)}>
                <option value="">Select a city...</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="compare-vibe">
          <label className="form-label">Neighborhood Vibe (optional)</label>
          <select className="form-select" value={vibe} onChange={e => setVibe(e.target.value)}>
            <option value="">Any vibe...</option>
            {VIBES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <button className="submit-btn" type="submit" disabled={loading || !isValid}>
          {loading ? 'Comparing...' : '✦ Compare Cities'}
        </button>
      </form>
    </div>
  );
}

export default CompareForm;