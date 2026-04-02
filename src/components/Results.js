import React from 'react';
import './Results.css';

function PlaceCard({ place }) {
  const name = place.name;
  const address = place.location?.formatted_address || place.location?.address || '';
  const category = place.categories?.[0]?.name || '';

  return (
    <div className="place-card">
      <div className="place-name">{name}</div>
      <div className="place-meta">{category}{address ? ` · ${address}` : ''}</div>
    </div>
  );
}

function Results({ results }) {
  const { salary, city, takeHome, places, aiSummary } = results;

  return (
    <div className="results">

      {/* Pay breakdown */}
      <div className="results-section">
        <div className="section-label">✦ Your Money</div>
        <div className="pay-cards">
          <div className="pay-card">
            <div className="pay-label">Annual Salary</div>
            <div className="pay-value">${salary.toLocaleString()}</div>
          </div>
          <div className="pay-card pay-card-highlight">
            <div className="pay-label">Monthly Take-Home</div>
            <div className="pay-value">${takeHome.monthly.toLocaleString()}</div>
          </div>
          <div className="pay-card">
            <div className="pay-label">Max Rent (30% rule)</div>
            <div className="pay-value">${takeHome.maxRent.toLocaleString()}</div>
          </div>
          <div className="pay-card">
            <div className="pay-label">Left After Rent</div>
            <div className="pay-value">${(takeHome.monthly - takeHome.maxRent).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="results-section">
          <div className="section-label">✦ Your Life in {city}</div>
          <div className="ai-box">
            <div className="ai-label">AI City Analysis</div>
            <div className="ai-text">{aiSummary}</div>
          </div>
        </div>
      )}

      {/* Places */}
      <div className="results-section">
        <div className="section-label">✦ What's Nearby</div>
        <div className="places-grid">
          {[
            { label: '🍜 Restaurants', items: places.restaurants },
            { label: '☕ Cafes', items: places.cafes },
            { label: '💪 Gyms', items: places.gyms },
            { label: '🌳 Parks', items: places.parks },
          ].map(({ label, items }) => (
            <div key={label} className="places-col">
              <div className="places-col-title">{label}</div>
              {items.length > 0
                ? items.map((p, i) => <PlaceCard key={i} place={p} />)
                : <div className="places-empty">No results found</div>
              }
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Results;