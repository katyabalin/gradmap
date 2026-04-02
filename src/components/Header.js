import React from 'react';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-logo">Grad<span>Map</span></div>
      <div className="header-tag">Powered by Claude AI</div>
    </header>
  );
}

export default Header;