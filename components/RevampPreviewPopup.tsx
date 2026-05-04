'use client';

import { useEffect, useState } from 'react';

export default function RevampPreviewPopup() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Fire right after LoadingScreen's 'done' phase (4600ms) + small buffer
    const t = setTimeout(() => setVisible(true), 4800);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setClosing(true);
    setTimeout(() => setVisible(false), 380);
  }

  if (!visible) return null;

  return (
    <div
      className={`rp-overlay${closing ? ' rp-overlay-out' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Upcoming site revamp preview"
    >
      <div className={`rp-popup${closing ? ' rp-popup-out' : ''}`}>

        {/* Header */}
        <div className="rp-header">
          <div className="rp-badge">
            <span className="rp-dot" aria-hidden="true" />
            <span>REVAMP INCOMING · 2026</span>
          </div>
          <button className="rp-x" onClick={dismiss} aria-label="Close preview">✕</button>
        </div>

        {/* Blurry sneak-peek preview */}
        <div className="rp-preview" aria-hidden="true">

          {/* Mock of the new site's aesthetic */}
          <div className="rp-mock">
            <div className="rp-mock-nav">
              <span className="rp-mock-logo">RT</span>
              <div className="rp-mock-links">
                <span>Operator</span>
                <span>Manifesto</span>
                <span>Stack</span>
                <span className="rp-mock-cta">Hire →</span>
              </div>
            </div>
            <div className="rp-mock-hero">
              <div className="rp-mock-meta">01 · Available · Build · Deploy · Own the Stack</div>
              <div className="rp-mock-hl">
                <span className="rp-mock-word">I&nbsp;SHIP</span>
                <span className="rp-mock-word rp-mock-red">SYSTEMS.</span>
              </div>
              <div className="rp-mock-rule" />
              <div className="rp-mock-foot">
                <p>Senior software developer. Three years taking systems from first commit to live production — owning every layer.</p>
                <div className="rp-mock-stats">
                  <div><span className="rp-mock-num">3</span><span className="rp-mock-lab">Years</span></div>
                  <div><span className="rp-mock-num">5</span><span className="rp-mock-lab">Layers</span></div>
                  <div><span className="rp-mock-num rp-mock-red">01</span><span className="rp-mock-lab">Push</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Frosted gradient */}
          <div className="rp-frost" />
          {/* Film grain */}
          <div className="rp-grain" />
          {/* Centered label */}
          <div className="rp-label-overlay">
            <span>[ PREVIEW ]</span>
          </div>
        </div>

        {/* Footer */}
        <div className="rp-footer">
          <span className="rp-footer-text">A new site is in the works.</span>
          <button className="rp-dismiss" onClick={dismiss}>Dismiss</button>
        </div>

      </div>
    </div>
  );
}
