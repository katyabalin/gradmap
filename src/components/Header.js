import React from 'react';
import './Header.css';

function Header({ activeTab, onTabChange }) {
  return (
    <header className="header">
      <div className="header-logo">GradMap</div>
      <div className="header-tabs">
        <button
          className={'header-tab' + (activeTab === 'single' ? ' header-tab-active' : '')}
          onClick={() => onTabChange('single')}
        >
          Single City
        </button>
        <button
          className={'header-tab' + (activeTab === 'compare' ? ' header-tab-active' : '')}
          onClick={() => onTabChange('compare')}
        >
          Compare Cities
        </button>
        <button
          className={'header-tab' + (activeTab === 'jobs' ? ' header-tab-active' : '')}
          onClick={() => onTabChange('jobs')}
        >
          Job Search
        </button>
      </div>
      <div className="header-right">
        <a href="/case-study" className="header-case-link">Case Study</a>
        <div className="header-tag">Powered by Claude AI</div>
      </div>
    </header>
  );
}

export default Header;