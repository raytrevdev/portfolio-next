'use client';

import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { href: '#capabilities', label: 'Capabilities', num: '01' },
  { href: '#pipeline',     label: 'Pipeline',     num: '02' },
  { href: '#systems',      label: 'Systems',      num: '03' },
  { href: '#ownership',    label: 'Ownership',    num: '03' },
  { href: '#projects',     label: 'Projects',     num: '04' },
  { href: '#reflection',   label: 'Reflection',   num: '05' },
  { href: '#contact',      label: 'Contact',      num: '06' },
];

export default function TopNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const close = () => setOpen(false);

  return (
    <>
      <header className="topnav" role="banner">
        <div className="brand" aria-label="Raymond Ting, Senior Software Developer">
          <span className="dot" aria-hidden="true" />
          raymond.ting{' '}
          <span style={{ color: 'var(--fg-2)' }} aria-hidden="true">
            // SE
          </span>
        </div>

        <nav className="right topnav-desktop" aria-label="Primary">
          <a href="#capabilities">Capabilities</a>
          <a href="#pipeline">Pipeline</a>
          <a href="#systems">Systems</a>
          <a href="#ownership">Ownership</a>
          <a href="#projects">Projects</a>
          <a href="#reflection">Reflection</a>
          <a href="#contact">Contact</a>
          <span style={{ color: 'var(--fg-4)' }} aria-hidden="true">|</span>
          <a href="mailto:raymondting521@gmail.com" style={{ color: 'var(--accent)' }}>
            raymondting521@gmail.com
          </a>
        </nav>

        <button
          className={'nav-burger' + (open ? ' open' : '')}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </header>

      {open && (
        <div className="nav-backdrop" aria-hidden="true" onClick={close} />
      )}

      <div
        id="mobile-nav"
        className={'nav-drawer' + (open ? ' open' : '')}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
      >
        <div className="nav-drawer-head">
          <div className="nav-drawer-brand">
            <span className="dot" aria-hidden="true" />
            raymond.ting
          </div>
          <button
            className="nav-drawer-close"
            aria-label="Close navigation"
            onClick={close}
          >
            ✕
          </button>
        </div>

        <nav className="nav-drawer-body" aria-label="Mobile navigation">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-drawer-link"
              style={{ '--i': i } as React.CSSProperties}
              onClick={close}
            >
              <span className="nav-drawer-num" aria-hidden="true">{link.num}</span>
              <span className="nav-drawer-label">{link.label}</span>
              <span className="nav-drawer-arrow" aria-hidden="true">→</span>
            </a>
          ))}
        </nav>

        <div className="nav-drawer-foot">
          <a href="mailto:raymondting521@gmail.com">raymondting521@gmail.com</a>
          <span>Singapore · 2026</span>
        </div>
      </div>
    </>
  );
}
