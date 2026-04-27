'use client';

import { useEffect, useRef } from 'react';

export default function Hero() {
  const headlineRef = useRef<HTMLHeadingElement | null>(null);

  // Word-by-word headline reveal
  useEffect(() => {
    const words = headlineRef.current?.querySelectorAll<HTMLSpanElement>('.word') ?? [];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      words.forEach((w) => w.classList.add('in'));
      return;
    }
    const timeouts: number[] = [];
    words.forEach((w, i) => {
      timeouts.push(window.setTimeout(() => w.classList.add('in'), 200 + i * 130));
    });
    return () => timeouts.forEach((t) => clearTimeout(t));
  }, []);


  const line1 = ['I', 'Don\u2019t', 'Just', 'Build', 'Apps.'];
  const line2 = ['I', 'Ship', 'Systems'];

  return (
    <section
      className="hero"
      id="main-content"
      tabIndex={-1}
      aria-labelledby="hero-headline"
      data-screen-label="Hero"
    >
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />

      <div className="hero-inner">
        <div className="hero-eyebrow">
          <span className="accent">●</span>
          <span>System Online</span>
          <span className="sep">/</span>
          <span>Portfolio</span>
        </div>

        <h1
          className="hero-headline"
          id="hero-headline"
          ref={headlineRef}
          aria-label="I don't just build apps. I ship systems."
        >
          <span aria-hidden="true">
            {line1.map((w, i) => (
              <span key={'a' + i} className="word">
                {w}
                {i < line1.length - 1 ? '\u00a0' : ''}
              </span>
            ))}
            <br />
            {line2.map((w, i) => (
              <span key={'b' + i} className={'word' + (w === 'Ship' ? ' accent' : '')}>
                {w}
                {i < line2.length - 1 ? '\u00a0' : ''}
              </span>
            ))}
            <span className="word period">.</span>
          </span>
        </h1>

        <div className="hero-name">
          <div className="name">Ting Tze Jian, Raymond</div>
          <div className="role">SENIOR SOFTWARE DEVELOPER</div>
        </div>

        <div style={{ maxWidth: '54ch', color: 'var(--fg-1)', fontSize: 17, lineHeight: 1.6 }}>
          Three years shipping CMS-driven web platforms end-to-end, frontend, backend, infrastructure, deployment. I take work from requirement to running production, and stay on the pager when it gets there.
        </div>

        <div className="hero-meta">
          <div className="cell">
            <div className="label">Focus</div>
            <div className="val">Full-stack · Infra</div>
          </div>
          <div className="cell">
            <div className="label">Stack</div>
            <div className="val">React · .NET · Linux</div>
          </div>
          <div className="cell">
            <div className="label">Cloud</div>
            <div className="val">Azure · AWS · Fly.io</div>
          </div>
          <div className="cell">
            <div className="label">Status</div>
            <div className="val" style={{ color: 'var(--accent)' }}>
              Open to conversations
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-cue" aria-hidden="true">
        <span>Scroll</span>
        <div className="line" />
      </div>
    </section>
  );
}
