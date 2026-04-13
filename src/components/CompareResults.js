import React, { useState } from 'react';
import './CompareResults.css';

const STATE_RATES = {
  'New York, NY': '6.85%', 'San Francisco, CA': '9.3%', 'Los Angeles, CA': '9.3%',
  'Chicago, IL': '4.95%', 'Seattle, WA': '0%', 'Austin, TX': '0%',
  'Boston, MA': '5.0%', 'Washington, DC': '8.5%', 'Miami, FL': '0%',
  'Denver, CO': '4.4%', 'Atlanta, GA': '5.49%', 'Nashville, TN': '0%',
};

const COL_INDEXES = {
  'New York, NY': 187, 'San Francisco, CA': 194, 'Los Angeles, CA': 163,
  'Chicago, IL': 107, 'Seattle, WA': 150, 'Austin, TX': 118,
  'Boston, MA': 162, 'Washington, DC': 153, 'Miami, FL': 123,
  'Denver, CO': 128, 'Atlanta, GA': 108, 'Nashville, TN': 112,
};

function MiniPayCard({ label, value, highlight }) {
  return (
    <div className={'mini-pay-card' + (highlight ? ' mini-pay-highlight' : '')}>
      <div className="mini-pay-label">{label}</div>
      <div className="mini-pay-value">{value}</div>
    </div>
  );
}

function TaxCard({ label, value, highlight }) {
  return (
    <div className={'tax-card' + (highlight ? ' tax-card-highlight' : '')}>
      <div className="tax-label">{label}</div>
      <div className="tax-value">{value}</div>
    </div>
  );
}

function CityColumn({ data, label }) {
  const { salary, city, takeHome, summary } = data;
  const stateRate = STATE_RATES[city] || 'N/A';
  const colIndex = COL_INDEXES[city] || 100;
  const noStateTax = stateRate === '0%';

  return (
    <div className="compare-city-col">
      <div className="compare-city-header">
        <div className="compare-city-label">{label}</div>
        <div className="compare-city-name">{city}</div>
        <div className="compare-city-salary">${salary.toLocaleString()} offer</div>
      </div>

      <div className="mini-pay-grid">
        <MiniPayCard label="Take-Home" value={'$' + takeHome.monthly.toLocaleString() + '/mo'} highlight />
        <MiniPayCard label="Avg Rent" value={'$' + takeHome.typicalRent.toLocaleString() + '/mo'} />
        <MiniPayCard label="After Everything" value={'$' + takeHome.leftAfterEverything.toLocaleString() + '/mo'} />
      </div>

      <div className="tax-section-label">✦ Tax & Cost Breakdown</div>
      <div className="tax-grid">
        <TaxCard label="Federal Tax" value="22%" />
        <TaxCard label="State Income Tax" value={stateRate} highlight={noStateTax} />
        <TaxCard label="FICA" value="7.65%" />
        <TaxCard label="Cost of Living" value={colIndex + ' / 100'} />
        <TaxCard label="Avg Monthly Rent" value={'$' + takeHome.typicalRent.toLocaleString()} />
        <TaxCard label="Est. Other Expenses" value={'$' + takeHome.adjustedExpenses.toLocaleString() + '/mo'} />
      </div>

      {summary && (
        <div className="compare-ai-box">
          <div className="compare-ai-label">AI City Analysis</div>
          <div className="compare-ai-text">{summary}</div>
        </div>
      )}
    </div>
  );
}

function CompareResults({ results }) {
  const { cityA, cityB } = results;
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const winnerCity = cityA.takeHome.leftAfterEverything >
    cityB.takeHome.leftAfterEverything ? cityA : cityB;
  const winnerLabel = winnerCity === cityA ? 'Offer A' : 'Offer B';
  const diff = Math.abs(
    cityA.takeHome.leftAfterEverything - cityB.takeHome.leftAfterEverything
  );

  const handleGetAnalysis = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are a financial advisor helping a new college grad compare two job offers.

Offer A: $${cityA.salary.toLocaleString()} in ${cityA.city}
- Monthly take-home: $${cityA.takeHome.monthly.toLocaleString()}
- Average rent: $${cityA.takeHome.typicalRent.toLocaleString()}/mo
- Cost of living index: ${COL_INDEXES[cityA.city] || 100} (100 = national average)
- Left after rent and expenses: $${cityA.takeHome.leftAfterEverything.toLocaleString()}
- State income tax: ${STATE_RATES[cityA.city] || 'N/A'}

Offer B: $${cityB.salary.toLocaleString()} in ${cityB.city}
- Monthly take-home: $${cityB.takeHome.monthly.toLocaleString()}
- Average rent: $${cityB.takeHome.typicalRent.toLocaleString()}/mo
- Cost of living index: ${COL_INDEXES[cityB.city] || 100} (100 = national average)
- Left after rent and expenses: $${cityB.takeHome.leftAfterEverything.toLocaleString()}
- State income tax: ${STATE_RATES[cityB.city] || 'N/A'}

Write 3-4 sentences explaining which offer is better financially and exactly why. Mention taxes, rent differences, and cost of living specifically with real numbers. Sound like a smart friend explaining it simply. End with one sentence about what kind of person might still prefer the other city for career or lifestyle reasons.`,
        }),
      });
      const data = await res.json();
      setAiAnalysis(data.text);
    } catch {
      setAiAnalysis(null);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="compare-results">

      <div className="winner-banner">
        <div className="winner-trophy">🏆</div>
        <div>
          <div className="winner-title">{winnerLabel} wins on affordability</div>
          <div className="winner-sub">
            {winnerCity.city} leaves you ${diff.toLocaleString()}/mo more after rent and expenses
          </div>
        </div>
      </div>

      {!aiAnalysis && (
        <button className="ai-analysis-btn" onClick={handleGetAnalysis} disabled={aiLoading}>
          {aiLoading ? 'Analyzing...' : '✦ Get AI Analysis — Why Does ' + winnerLabel + ' Win?'}
        </button>
      )}

      {aiAnalysis && (
        <div className="comparison-ai-box">
          <div className="comparison-ai-label">✦ Why {winnerLabel} Wins</div>
          <div className="comparison-ai-text">{aiAnalysis}</div>
        </div>
      )}

      <div className="compare-grid">
        <CityColumn data={cityA} label="Offer A" />
        <div className="compare-divider" />
        <CityColumn data={cityB} label="Offer B" />
      </div>

    </div>
  );
}

export default CompareResults;