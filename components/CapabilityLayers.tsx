'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

interface Layer {
  key: string;
  name: string;
  tag: string;
  title: string;
  body: string;
  stack: string[];
}

const LAYERS: Layer[] = [
  {
    key: 'frontend',
    name: 'Frontend',
    tag: '01 // ui · ux',
    title: 'Render the truth, fast.',
    body:
      'React and Next.js apps with server-side rendering and ISR for SEO and CDN-level scalability. Typed API clients, content-driven pages, accessible markup — interfaces that survive contact with real users and real editors.',
    stack: ['React', 'Next.js 14', 'TypeScript', 'Tailwind', 'Angular'],
  },
  {
    key: 'backend',
    name: 'Backend',
    tag: '02 // api · data',
    title: 'Services that hold their shape under load.',
    body:
      '.NET 8 with Entity Framework, Spring Boot, REST APIs with strict contracts. Schema-first design with relational + singleton collections, paginated endpoints, and clean separation between domain and integration layers.',
    stack: ['.NET 8', 'EF Core', 'Spring Boot', 'PostgreSQL', 'MySQL', 'MongoDB'],
  },
  {
    key: 'cms',
    name: 'CMS Architecture',
    tag: '03 // content · headless',
    title: 'Editors stay out of the codebase.',
    body:
      'Headless and traditional CMS architectures — WordPress, Sitefinity, Directus. Modeled schemas so non-technical editors can ship news, categories, and pages without a deploy, while engineers keep type-safety end-to-end.',
    stack: ['WordPress', 'Sitefinity', 'Directus', 'Headless API'],
  },
  {
    key: 'infra',
    name: 'Infrastructure',
    tag: '04 // hosts · cloud',
    title: 'Linux, IIS, and a calm production line.',
    body:
      'RedHat and Debian hosts, Windows IIS, VM provisioning on Azure and AWS. Configuration, troubleshooting, and the unglamorous work of keeping environments consistent across dev, staging, and prod.',
    stack: ['RedHat', 'Debian', 'IIS', 'Azure VM', 'AWS EC2', 'Nginx'],
  },
  {
    key: 'deploy',
    name: 'Deployment',
    tag: '05 // build · ship',
    title: 'Reproducible from commit to container.',
    body:
      'Dockerized applications and GitHub Actions pipelines — build, test, push, deploy. Liquibase for schema versioning. Release consistency across environments so the third deploy of the week is as boring as the first.',
    stack: ['Docker', 'GitHub Actions', 'Fly.io', 'Liquibase'],
  },
  {
    key: 'ownership',
    name: 'Ownership',
    tag: '06 // delivery',
    title: 'Scope, timeline, stakeholders, pager.',
    body:
      'Driving multiple concurrent projects — task delegation, timeline control, direct stakeholder communication. End-to-end accountability from requirement to post-launch support. The system is not done when it builds; it is done when it runs.',
    stack: ['Planning', 'Estimation', 'Stakeholder comms', 'On-call'],
  },
];

export default function CapabilityLayers() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const layerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % LAYERS.length);
    }, 2400);
    return () => clearInterval(id);
  }, [paused]);

  const cur = LAYERS[active];

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      setActive((prev) =>
        delta < 0
          ? (prev + 1) % LAYERS.length
          : (prev - 1 + LAYERS.length) % LAYERS.length
      );
    }
    setPaused(false);
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = Math.min(LAYERS.length - 1, i + 1);
      setActive(next);
      layerRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = Math.max(0, i - 1);
      setActive(prev);
      layerRefs.current[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
      layerRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = LAYERS.length - 1;
      setActive(last);
      layerRefs.current[last]?.focus();
    }
  };

  return (
    <section
      className="section"
      id="capabilities"
      aria-labelledby="cap-title"
      data-screen-label="Capabilities"
    >
      <div className="shell">
        <div className="section-meta" aria-hidden="true">
          <span className="num">02</span>
          <span>Capability Layers</span>
          <span className="bar" />
          <span>fe → be → infra → deploy → ownership</span>
        </div>
        <h2 className="section-title" id="cap-title">
          The stack I&apos;m responsible for, top to bottom.
        </h2>
        <p className="section-lede">
          A senior developer is not just a frontend or backend engineer. Each layer below
          is part of my day-to-day delivery — hover to explore.
        </p>

        {/* ── Mobile slider (≤767px) ── */}
        <div className="layers-mobile">
          <div
            className="slider-track-wrap"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="slider-track"
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {LAYERS.map((l, i) => (
                <div
                  className="slide"
                  key={l.key}
                  aria-hidden={i !== active}
                >
                  <div className="slide-header">
                    <span className="slide-dot" aria-hidden="true" />
                    <span className="slide-name">{l.name}</span>
                    <span className="slide-tag" aria-hidden="true">{l.tag}</span>
                  </div>
                  <h3 className="det-title">{l.title}</h3>
                  <p className="det-body">{l.body}</p>
                  <ul className="det-stack" aria-label={`${l.name} stack`}>
                    {l.stack.map((s) => (
                      <li className="chip" key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="slider-footer">
            <div className="slider-dots" role="tablist" aria-label="Capability layers">
              {LAYERS.map((l, i) => (
                <button
                  key={l.key}
                  className={'slider-dot' + (i === active ? ' active' : '')}
                  role="tab"
                  aria-selected={i === active}
                  aria-label={l.name}
                  onClick={() => { setPaused(true); setActive(i); }}
                />
              ))}
            </div>
            <div className="slider-arrows">
              <button
                className="slider-arrow"
                aria-label="Previous layer"
                onClick={() => { setPaused(true); setActive((p) => (p - 1 + LAYERS.length) % LAYERS.length); }}
              >
                ←
              </button>
              <button
                className="slider-arrow"
                aria-label="Next layer"
                onClick={() => { setPaused(true); setActive((p) => (p + 1) % LAYERS.length); }}
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* ── Desktop tab + detail ── */}
        <div
          className="layers-wrap"
          onMouseLeave={() => setPaused(false)}
        >
          <div role="tablist" aria-label="Capability layers" aria-orientation="vertical">
            <div className="layer-stack">
              {LAYERS.map((l, i) => (
                <button
                  type="button"
                  key={l.key}
                  ref={(el) => {
                    layerRefs.current[i] = el;
                  }}
                  role="tab"
                  id={`layer-tab-${l.key}`}
                  aria-selected={i === active}
                  aria-controls="layer-panel"
                  tabIndex={i === active ? 0 : -1}
                  className={'layer' + (i === active ? ' active' : '')}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => { setPaused(true); setActive(i); }}
                  onKeyDown={(e) => onKey(e, i)}
                >
                  <span className="marker" aria-hidden="true" />
                  <span className="layer-name">{l.name}</span>
                  <span className="layer-tag" aria-hidden="true">
                    {l.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div
            className="layer-detail"
            role="tabpanel"
            id="layer-panel"
            aria-labelledby={`layer-tab-${cur.key}`}
            tabIndex={0}
          >
            <div className="det-label" aria-hidden="true">
              {cur.tag}
            </div>
            <h3 className="det-title">{cur.title}</h3>
            <p className="det-body">{cur.body}</p>
            <ul className="det-stack" aria-label={`${cur.name} stack`}>
              {cur.stack.map((s) => (
                <li className="chip" key={s}>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
