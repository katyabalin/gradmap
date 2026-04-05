import React from 'react';
import './CompareResults.css';

function MiniPayCard({ label, value, highlight }) {
  return (
    <div className={'mini-pay-card' + (highlight ? ' mini-pay-highlight' : '')}>
      <div className="mini-pay-label">{label}</div>
      <div className="mini-pay-value">{value}</div>
    </div>
  );
}

function CityColumn({ data, label }) {
  const { salary, city, takeHome, summary } = data;
  return (
    <div className="compare-city-col">
      <div className="compare-city-header">
        <div className="compare-city-label">{label}</div>
        <div className="compare-city-name">{city}</div>
        <div className="compare-city-salary">${salary.toLocaleString()} offer</div>
      </div>

      <div className="mini-pay-grid">
        <MiniPayCard label="Take-Home" value={'$' + takeHome.monthly.toLocaleString() + '/mo'} highlight />
        <MiniPayCard label="Max Rent" value={'$' + takeHome.maxRent.toLocaleString() + '/mo'} />
        <MiniPayCard label="Left After Rent" value={'$' + (takeHome.monthly - takeHome.maxRent).toLocaleString() + '/mo'} />
      </div>

      {summary && (
        <div className="compare-ai-box">
          <div className="compare-ai-label">AI Analysis</div>
          <div className="compare-ai-text">{summary}</div>
        </div>
      )}
    </div>
  );
}

function CompareResults({ results }) {
  const { cityA, cityB } = results;

  const winnerCity = cityA.takeHome.monthly - cityA.takeHome.maxRent >
    cityB.takeHome.monthly - cityB.takeHome.maxRent ? cityA : cityB;
  const winnerLabel = winnerCity === cityA ? 'Offer A' : 'Offer B';
  const diff = Math.abs(
    (cityA.takeHome.monthly - cityA.takeHome.maxRent) -
    (cityB.takeHome.monthly - cityB.takeHome.maxRent)
  );

  return (
    <div className="compare-results">

      {/* Winner banner */}
      <div className="winner-banner">
        <div className="winner-trophy">🏆</div>
        <div>
          <div className="winner-title">{winnerLabel} wins on affordability</div>
          <div className="winner-sub">
            {winnerCity.city} leaves you ${diff.toLocaleString()}/mo more after rent
          </div>
        </div>
      </div>

      {/* Side by side */}
      <div className="compare-grid">
        <CityColumn data={cityA} label="Offer A" />
        <div className="compare-divider" />
        <CityColumn data={cityB} label="Offer B" />
      </div>

    </div>
  );
}

export default CompareResults;