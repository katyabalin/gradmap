import React, { useState } from 'react';
import './InputForm.css';

const CITIES = [
  'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL',
  'Seattle, WA', 'Austin, TX', 'Boston, MA', 'Washington, DC',
  'Miami, FL', 'Denver, CO', 'Atlanta, GA', 'Nashville, TN'
];

const VIBES = [
  'Trendy & Social',
  'Quiet & Residential',
  'Walkable & Urban',
  'Outdoorsy',
  'Artsy & Creative',
  'Foodie & Restaurant Scene',
  'Fitness & Wellness',
  'Young Professional',
  'Family Friendly',
  'Nightlife & Entertainment',
];

function InputForm({ onSubmit, loading }) {
  const [salary, setSalary] = useState('');
  const [city, setCity] = useState('');
  const [vibe, setVibe] = useState('');
  const [age, setAge] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!salary || !city) return;
    onSubmit({ salary: parseInt(salary), city, vibe, age: parseInt(age) || 25 });
  };

  return (
    <div className="form-card">
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Annual Salary</label>
            <div className="input-prefix-wrap">
              <span className="input-prefix">$</span>
              <input
                className="form-input"
                type="number"
                placeholder="85000"
                value={salary}
                onChange={e => setSalary(e.target.value)}
                min="20000"
                max="500000"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <select className="form-select" value={city} onChange={e => setCity(e.target.value)}>
              <option value="">Select a city...</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Your Age</label>
            <input
              className="form-input form-input-standalone"
              type="number"
              placeholder="22"
              value={age}
              onChange={e => setAge(e.target.value)}
              min="18"
              max="65"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Neighborhood Vibe</label>
            <select className="form-select" value={vibe} onChange={e => setVibe(e.target.value)}>
              <option value="">Any vibe...</option>
              {VIBES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <button className="submit-btn" type="submit" disabled={loading || !salary || !city}>
          {loading ? 'Mapping...' : '✦ Map My Life'}
        </button>
      </form>
    </div>
  );
}

export default InputForm;