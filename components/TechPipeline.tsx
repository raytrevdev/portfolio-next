'use client';

import { Fragment, useEffect, useRef, useState } from 'react';

const STAGES = [
  {
    key:   'dev',
    sym:   '</>',
    label: 'Code',
    sub:   'Local dev',
    lines: ['git commit -m "feat"', 'git push origin main'],
  },
  {
    key:   'github',
    sym:   'GIT',
    label: 'GitHub',
    sub:   'Remote',
    lines: ['main branch updated', 'webhook triggered'],
  },
  {
    key:   'ci',
    sym:   '//CI',
    label: 'Actions',
    sub:   'Check suite',
    lines: ['tsc --noEmit  ✓', 'next build    ✓'],
  },
  {
    key:   'build',
    sym:   '▲',
    label: 'Next.js',
    sub:   'SSG export',
    lines: ['static pages  3/3', 'out/ generated'],
  },
  {
    key:   'netlify',
    sym:   '◆',
    label: 'Netlify',
    sub:   'Deploy',
    lines: ['CDN edge nodes', 'cache invalidated'],
  },
  {
    key:   'live',
    sym:   '●',
    label: 'Live',
    sub:   'rdevting.com',
    lines: ['status: online', 'monitoring active'],
  },
];

const BADGE_GROUPS = [
  {
    label: 'Stack',
    variant: 'accent',
    items: ['Next.js 16', 'React 18', 'TypeScript 5', 'CSS', 'App Router'],
  },
  {
    label: 'Pipeline',
    variant: 'green',
    items: ['GitHub Actions', 'Netlify CDN', 'Node 24', 'npm ci'],
  },
  {
    label: 'Output',
    variant: 'default',
    items: ['Static Export', 'SSG', 'Edge Cache'],
  },
];

const STAGE_MS = 1100;
const PAUSE_MS = 2800;

export default function TechPipeline() {
  const [active,  setActive]  = useState(-1);
  const [loopKey, setLoopKey] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const startedRef = useRef(false);

  // Trigger when scrolled into view
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          setActive(0);
        }
      },
      { threshold: 0.35 },
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Stage progression + loop
  useEffect(() => {
    if (active < 0) return;
    if (active < STAGES.length - 1) {
      const t = setTimeout(() => setActive((a) => a + 1), STAGE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setActive(0);
      setLoopKey((k) => k + 1);
    }, PAUSE_MS);
    return () => clearTimeout(t);
  }, [active]);

  const cur = active >= 0 ? STAGES[active] : null;

  return (
    <section
      className="section"
      id="pipeline"
      ref={sectionRef}
      aria-labelledby="pipe-title"
      data-screen-label="Pipeline"
    >
      <div className="shell">
        <div className="section-meta" aria-hidden="true">
          <span className="num">03</span>
          <span>Dev to Production</span>
          <span className="bar" />
          <span>code · ci · build · deploy · live</span>
        </div>

        <h2 className="section-title" id="pipe-title">
          From commit to live in one push.
        </h2>
        <p className="section-lede">
          Every change flows through the same automated pipeline — type-checked,
          built, and deployed without manual steps. This is what shipping
          reproducibly looks like.
        </p>

        {/* ── Pipeline track ── */}
        <div className="pipe-wrap">
          <div className="pipe-track-scroll">
            <div className="pipe-track" key={loopKey}>
              {STAGES.map((stage, i) => (
                <Fragment key={stage.key}>
                  <div
                    className={[
                      'pipe-node',
                      i <= active ? 'active' : '',
                      i < active  ? 'done'   : '',
                    ].join(' ')}
                  >
                    {i === STAGES.length - 1 && i <= active && (
                      <span className="pipe-live-ring" />
                    )}
                    {i < active && <span className="pipe-tick">✓</span>}
                    <div className="pipe-sym">{stage.sym}</div>
                    <div className="pipe-label">{stage.label}</div>
                    <div className="pipe-sub">{stage.sub}</div>
                  </div>

                  {i < STAGES.length - 1 && (
                    <div className={`pipe-connector${i < active ? ' sent' : ''}`}>
                      <span className="pipe-packet" />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Status readout */}
          <div className="pipe-status" aria-live="polite">
            {cur && (
              <>
                <span className="pipe-status-stage">{cur.label}</span>
                {cur.lines.map((line) => (
                  <span key={line} className="pipe-status-line">{line}</span>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── Tech badge groups ── */}
        <div className="pipe-badges">
          {BADGE_GROUPS.map((group) => (
            <div key={group.label} className="pipe-badge-group">
              <div className="pipe-badge-group-label">{group.label}</div>
              <div className="pipe-badge-row">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className={`pipe-badge pipe-badge--${group.variant}`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
