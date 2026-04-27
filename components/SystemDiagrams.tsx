'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

function useInView(threshold = 0.35) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
          }
        }),
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, shown] as const;
}

// Helper: cast CSS custom properties so TS accepts them in style props.
const cssVar = (vars: Record<string, string | number>) => vars as CSSProperties;

function HeadlessCMSDiagram() {
  const [ref, shown] = useInView();
  return (
    <figure className="diagram-card" aria-labelledby="dia-cms-title">
      <figcaption className="dia-head">
        <span className="dia-title" id="dia-cms-title">
          Headless CMS Architecture
        </span>
        <span className="dia-tag" aria-hidden="true">
          // gov-portal · directus
        </span>
      </figcaption>
      <svg
        ref={ref}
        className={'diagram-svg' + (shown ? ' in' : '')}
        viewBox="0 0 900 280"
        fill="none"
        stroke="currentColor"
        role="img"
        aria-label="Editors author content in Directus, which stores data in PostgreSQL. A typed API client fetches that content into Next.js 14, which serves SSR and ISR pages from the CDN edge."
      >
        <g className="pop" style={cssVar({ '--delay': '0s' })}>
          <rect x="20" y="60" width="120" height="60" rx="3" stroke="var(--line)" fill="var(--bg-2)" />
          <text x="80" y="86" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="var(--fg-1)">EDITORS</text>
          <text x="80" y="102" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-3)">non-technical</text>
        </g>
        <g className="pop" style={cssVar({ '--delay': '0.4s' })}>
          <rect x="220" y="40" width="160" height="100" rx="3" stroke="var(--accent-line)" fill="var(--bg-2)" />
          <text x="300" y="68" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="var(--accent)">DIRECTUS CMS</text>
          <text x="300" y="86" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-2)">collections</text>
          <text x="300" y="100" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-2)">singletons</text>
          <text x="300" y="114" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-2)">relations</text>
        </g>
        <g className="pop" style={cssVar({ '--delay': '0.8s' })}>
          <rect x="220" y="180" width="160" height="60" rx="3" stroke="var(--line)" fill="var(--bg-2)" />
          <text x="300" y="206" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="var(--fg-1)">POSTGRESQL</text>
          <text x="300" y="222" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-3)">source of truth</text>
        </g>
        <g className="pop" style={cssVar({ '--delay': '1.0s' })}>
          <rect x="460" y="40" width="160" height="100" rx="3" stroke="var(--line)" fill="var(--bg-2)" />
          <text x="540" y="68" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="var(--fg-1)">TYPED API CLIENT</text>
          <text x="540" y="86" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-3)">codegen</text>
          <text x="540" y="100" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-3)">zod schemas</text>
          <text x="540" y="114" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-3)">SSR fetch</text>
        </g>
        <g className="pop" style={cssVar({ '--delay': '1.4s' })}>
          <rect x="700" y="40" width="180" height="100" rx="3" stroke="var(--accent-line)" fill="var(--bg-2)" />
          <text x="790" y="68" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="var(--accent)">NEXT.JS 14</text>
          <text x="790" y="86" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-2)">SSR + ISR</text>
          <text x="790" y="100" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-2)">CDN edge</text>
          <text x="790" y="114" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-2)">SEO ready</text>
        </g>
        <path className="draw-line" style={cssVar({ '--len': 100 })} d="M140 90 L220 90" stroke="var(--accent)" strokeWidth="1.2" />
        <path className="draw-line" style={cssVar({ '--len': 80 })} d="M300 140 L300 180" stroke="var(--line)" strokeWidth="1.2" strokeDasharray="3 3" />
        <path className="draw-line" style={cssVar({ '--len': 100 })} d="M380 90 L460 90" stroke="var(--accent)" strokeWidth="1.2" />
        <path className="draw-line" style={cssVar({ '--len': 100 })} d="M620 90 L700 90" stroke="var(--accent)" strokeWidth="1.2" />
        <g className="pop" style={cssVar({ '--delay': '1.8s' })}>
          {[220, 460, 700].map((x) => (
            <path key={x} d={`M${x - 8} 86 L${x} 90 L${x - 8} 94`} stroke="var(--accent)" strokeWidth="1.2" fill="none" />
          ))}
        </g>
      </svg>
    </figure>
  );
}

function CICDDiagram() {
  const [ref, shown] = useInView();
  const stages = [
    { x: 40, lbl: 'PUSH', sub: 'main' },
    { x: 200, lbl: 'BUILD', sub: 'docker' },
    { x: 360, lbl: 'TEST', sub: 'jest · junit' },
    { x: 520, lbl: 'PUSH IMG', sub: 'registry' },
    { x: 680, lbl: 'DEPLOY', sub: 'fly.io · azure' },
  ];
  return (
    <figure className="diagram-card" aria-labelledby="dia-cicd-title">
      <figcaption className="dia-head">
        <span className="dia-title" id="dia-cicd-title">CI/CD Pipeline</span>
        <span className="dia-tag" aria-hidden="true">// github actions</span>
      </figcaption>
      <svg
        ref={ref}
        className={'diagram-svg' + (shown ? ' in' : '')}
        viewBox="0 0 820 180"
        fill="none"
        role="img"
        aria-label="Five-stage pipeline running on GitHub Actions: push to main, build with Docker, run Jest and JUnit tests, push image to registry, deploy to Fly.io or Azure."
      >
        <path className="draw-line" style={cssVar({ '--len': 700 })} d="M40 90 L780 90" stroke="var(--accent)" strokeWidth="1.2" />
        {stages.map((s, i) => (
          <g key={s.lbl} className="pop" style={cssVar({ '--delay': `${i * 0.25}s` })}>
            <circle cx={s.x + 60} cy="90" r="6" fill="var(--bg-0)" stroke="var(--accent)" strokeWidth="1.5" />
            <circle cx={s.x + 60} cy="90" r="2" fill="var(--accent)" />
            <rect x={s.x + 12} y="40" width="96" height="36" rx="2" stroke="var(--line)" fill="var(--bg-2)" />
            <text x={s.x + 60} y="62" textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--fg-0)">{s.lbl}</text>
            <text x={s.x + 60} y="120" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-3)">{s.sub}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

function ContainerDiagram() {
  const [ref, shown] = useInView();
  return (
    <figure className="diagram-card" aria-labelledby="dia-container-title">
      <figcaption className="dia-head">
        <span className="dia-title" id="dia-container-title">Container Lifecycle</span>
        <span className="dia-tag" aria-hidden="true">// docker · fly.io</span>
      </figcaption>
      <svg
        ref={ref}
        className={'diagram-svg' + (shown ? ' in' : '')}
        viewBox="0 0 820 240"
        fill="none"
        role="img"
        aria-label="Source on git becomes a multi-stage Dockerfile, builds a tagged image, pushes to a registry, then fans out to three runtimes: Fly.io for production, Azure VM for staging, and Linux hosts on RedHat or Debian."
      >
        <g className="pop" style={cssVar({ '--delay': '0s' })}>
          <rect x="20" y="100" width="110" height="50" rx="3" stroke="var(--line)" fill="var(--bg-2)" />
          <text x="75" y="122" textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--fg-0)">SOURCE</text>
          <text x="75" y="138" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-3)">git · main</text>
        </g>
        <g className="pop" style={cssVar({ '--delay': '0.3s' })}>
          <rect x="180" y="100" width="110" height="50" rx="3" stroke="var(--accent-line)" fill="var(--bg-2)" />
          <text x="235" y="122" textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--accent)">DOCKERFILE</text>
          <text x="235" y="138" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-3)">multi-stage</text>
        </g>
        <g className="pop" style={cssVar({ '--delay': '0.6s' })}>
          <rect x="340" y="100" width="110" height="50" rx="3" stroke="var(--line)" fill="var(--bg-2)" />
          <text x="395" y="122" textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--fg-0)">IMAGE</text>
          <text x="395" y="138" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-3)">tagged · :sha</text>
        </g>
        <g className="pop" style={cssVar({ '--delay': '0.9s' })}>
          <rect x="500" y="100" width="110" height="50" rx="3" stroke="var(--line)" fill="var(--bg-2)" />
          <text x="555" y="122" textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--fg-0)">REGISTRY</text>
          <text x="555" y="138" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-3)">ghcr · ecr</text>
        </g>
        <g className="pop" style={cssVar({ '--delay': '1.2s' })}>
          <rect x="660" y="40" width="140" height="50" rx="3" stroke="var(--accent-line)" fill="var(--bg-2)" />
          <text x="730" y="62" textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--accent)">FLY.IO</text>
          <text x="730" y="78" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-3)">container · prod</text>
          <rect x="660" y="100" width="140" height="50" rx="3" stroke="var(--line)" fill="var(--bg-2)" />
          <text x="730" y="122" textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--fg-0)">AZURE VM</text>
          <text x="730" y="138" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-3)">container · stage</text>
          <rect x="660" y="160" width="140" height="50" rx="3" stroke="var(--line)" fill="var(--bg-2)" />
          <text x="730" y="182" textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--fg-0)">LINUX HOST</text>
          <text x="730" y="198" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--fg-3)">redhat · debian</text>
        </g>
        <path className="draw-line" style={cssVar({ '--len': 50 })} d="M130 125 L180 125" stroke="var(--accent)" strokeWidth="1.2" />
        <path className="draw-line" style={cssVar({ '--len': 50 })} d="M290 125 L340 125" stroke="var(--accent)" strokeWidth="1.2" />
        <path className="draw-line" style={cssVar({ '--len': 50 })} d="M450 125 L500 125" stroke="var(--accent)" strokeWidth="1.2" />
        <path className="draw-line" style={cssVar({ '--len': 110 })} d="M610 125 Q635 125 645 90 L660 65" stroke="var(--accent)" strokeWidth="1.2" />
        <path className="draw-line" style={cssVar({ '--len': 50 })} d="M610 125 L660 125" stroke="var(--accent)" strokeWidth="1.2" />
        <path className="draw-line" style={cssVar({ '--len': 110 })} d="M610 125 Q635 125 645 160 L660 185" stroke="var(--accent)" strokeWidth="1.2" />
      </svg>
    </figure>
  );
}

export default function SystemDiagrams() {
  return (
    <section
      className="section"
      id="systems"
      aria-labelledby="sys-title"
      data-screen-label="System Diagrams"
    >
      <div className="shell">
        <div className="section-meta" aria-hidden="true">
          <span className="num">04</span>
          <span>System Thinking</span>
          <span className="bar" />
          <span>diagrams draw on scroll</span>
        </div>
        <h2 className="section-title" id="sys-title">
          The systems beneath the work.
        </h2>
        <p className="section-lede">
          Three diagrams that show how I architect, ship, and run software in production —
          from headless CMS to container lifecycle.
        </p>
        <HeadlessCMSDiagram />
        <CICDDiagram />
        <ContainerDiagram />
      </div>
    </section>
  );
}
