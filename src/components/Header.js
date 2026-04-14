import React from 'react';
import './Header.css';

export default Header;


function Header({ activeTab, onTabChange }) {
  return (
    <header className="header">
      <div className="header-logo">Grad<span>Map</span></div>
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
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <a href="/case-study" style={{ fontSize: '0.75rem', color: '#16a34a', textDecoration: 'none', fontWeight: 600, fontFamily: 'Outfit, sans-serif', letterSpacing: '1px', textTransform: 'uppercase' }}>Case Study</a>
        <div className="header-tag">Powered by Claude AI</div>
      </div>
    </header>
  );
}