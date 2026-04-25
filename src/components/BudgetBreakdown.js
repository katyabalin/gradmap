import React from 'react';
import './BudgetBreakdown.css';

function BudgetBreakdown({ data, city, takeHome }) {
  const leftOver = takeHome.monthly - takeHome.typicalRent - data.total_high;
  const isComfortable = leftOver > 200;

  return (
    <div className="budget-wrap">
      <div className="budget-title">✦ Your Monthly Budget in {city}</div>

      <div className="budget-verdict" style={{ borderLeftColor: isComfortable ? '#16a34a' : '#f59e0b' }}>
        <span style={{ color: isComfortable ? '#16a34a' : '#f59e0b', marginRight: '0.5rem' }}>
          {isComfortable ? '✓' : '⚠'}
        </span>
        {data.verdict}
      </div>

      <div className="budget-categories">
        {data.categories.map(function(cat) {
          return (
            <div key={cat.name} className="budget-cat">
              <div className="budget-cat-header">
                <div className="budget-cat-name">{cat.emoji} {cat.name}</div>
                <div className="budget-cat-range">${cat.low}–${cat.high}/mo</div>
              </div>
              <div className="budget-bar-wrap">
                <div className="budget-bar" style={{ width: Math.min((cat.high / 600) * 100, 100) + '%' }} />
              </div>
              <div className="budget-tip">💡 {cat.tip}</div>
            </div>
          );
        })}
      </div>

      <div className="budget-summary">
        <div className="budget-summary-row">
          <span>Monthly take-home</span>
          <span className="budget-summary-val">${takeHome.monthly.toLocaleString()}</span>
        </div>
        <div className="budget-summary-row">
          <span>Avg rent</span>
          <span className="budget-summary-val budget-red">−${takeHome.typicalRent.toLocaleString()}</span>
        </div>
        <div className="budget-summary-row">
          <span>Lifestyle (estimated high)</span>
          <span className="budget-summary-val budget-red">−${data.total_high.toLocaleString()}</span>
        </div>
        <div className="budget-summary-divider" />
        <div className="budget-summary-row budget-summary-total">
          <span>Left to save</span>
          <span className={'budget-summary-val ' + (leftOver > 0 ? 'budget-green' : 'budget-red')}>
            ${leftOver.toLocaleString()}/mo
          </span>
        </div>
      </div>
    </div>
  );
}

export default BudgetBreakdown;