import React, { useState, useEffect } from 'react';
import './Header.css';

const NAV = [
  { key: 'home',      label: 'Beranda' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'about',     label: 'Tentang Model' },
];

export default function Header({ page, go }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const nav = (key) => { go(key); setOpen(false); };

  return (
    <header className={`hdr${scrolled ? ' scrolled' : ''}`}>
      <div className="hdr-inner">
        {/* Logo */}
        <button className="logo" onClick={() => nav('home')}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="13.5" stroke="#5ea1ff" strokeWidth="1.4"/>
            <path d="M7 15 Q10 9 15 15 Q20 21 23 15" stroke="#38d9f5" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <circle cx="15" cy="15" r="2.8" fill="#5ea1ff"/>
          </svg>
          <span>Neura<span className="logo-hi">Scan</span></span>
        </button>

        {/* Desktop nav */}
        <nav className={`nav${open ? ' open' : ''}`}>
          {NAV.map(n => (
            <button key={n.key} className={`nav-link${page === n.key ? ' active' : ''}`} onClick={() => nav(n.key)}>
              {n.label}
            </button>
          ))}
          <button className="nav-cta" onClick={() => nav('diagnosis')}>Mulai Diagnosis</button>
        </nav>

        {/* Hamburger */}
        <button className={`burger${open ? ' open' : ''}`} onClick={() => setOpen(v => !v)} aria-label="Menu">
          <span/><span/><span/>
        </button>
      </div>
    </header>
  );
}
