import React from 'react';
import './Header.css';

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
      <div className="header-tag">Powered by Claude AI</div>
    </header>
  );
}

export default Header;