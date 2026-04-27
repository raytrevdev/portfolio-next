'use client';

import { useEffect, useRef, useState } from 'react';

interface Step {
  num: string;
  title: string;
  body: string;
  meta: string[];
}

const STEPS: Step[] = [
  { num: 'STEP 01', title: 'Requirement', body: 'Sit with stakeholders. Define scope. Translate ambiguous business goals into testable acceptance criteria. Make sure the right thing is being built before a single line of code goes in.', meta: ['stakeholder comms', 'scope', 'acceptance criteria'] },
  { num: 'STEP 02', title: 'Planning', body: 'Break down the work. Estimate. Sequence dependencies across multiple concurrent projects. Architecture decisions made up front — schema, hosting target, CMS shape, CI/CD strategy.', meta: ['estimation', 'architecture', 'task delegation'] },
  { num: 'STEP 03', title: 'Development', body: 'Build. Frontend, backend, database, integrations — wherever the work lives. Code reviews, typed contracts, schema versioning with Liquibase, tests on the surfaces that matter.', meta: ['react / next', '.net 8', 'spring boot', 'postgres'] },
  { num: 'STEP 04', title: 'Deployment', body: 'Containerize. Wire CI/CD. Provision infrastructure on Azure or AWS. Deploy to RedHat, Debian, IIS, or Fly.io. Verify the third deploy of the day is as boring as the first.', meta: ['docker', 'github actions', 'azure / aws'] },
  { num: 'STEP 05', title: 'Maintenance', body: 'Post-launch support. Monitor. Triage. Keep production stable across hosting environments. The system is not done when it builds — it is done when it runs reliably for real users.', meta: ['stability', 'troubleshooting', 'on-call'] },
  { num: 'STEP 06', title: 'Iteration', body: 'Feedback loops back into requirement. New scope, new releases, schema migrations, careful refactors. Ownership does not end at launch — it ends when the project does.', meta: ['feedback', 'refactor', 'release cadence'] },
];

export default function OwnershipTimeline() {
  const [activeIdx, setActiveIdx] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const wrapRef = useRef<HTMLOListElement | null>(null);
  const [railHeight, setRailHeight] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            setActiveIdx(idx);
          }
        });
      },
      { threshold: 0.6, rootMargin: '-20% 0px -30% 0px' }
    );
    stepRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const total = rect.height;
      const pct = Math.max(0, Math.min(1, (window.innerHeight * 0.5 - rect.top) / total));
      setRailHeight(pct * (total - 48));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section
      className="section"
      id="ownership"
      aria-labelledby="own-title"
      data-screen-label="Engineering Ownership"
    >
      <div className="shell">
        <div className="section-meta" aria-hidden="true">
          <span className="num">04</span>
          <span>Engineering Ownership</span>
          <span className="bar" />
          <span>requirement → iteration</span>
        </div>
        <h2 className="section-title" id="own-title">
          I own the work end-to-end.
        </h2>
        <p className="section-lede">
          A senior developer writes code, but the job is wider than that. The work starts
          before the first commit and continues long after launch.
        </p>

        <ol className="timeline" ref={wrapRef}>
          <div className="timeline-rail" aria-hidden="true">
            <div className="rail" />
            <div className="rail-fill" style={{ height: `${railHeight}px` }} />
          </div>

          <div className="timeline-steps">
            {STEPS.map((s, i) => (
              <li
                key={s.num}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                data-idx={i}
                className={'tstep' + (i <= activeIdx ? ' active' : '')}
                aria-current={i === activeIdx ? 'step' : undefined}
              >
                <div className="tstep-num" aria-hidden="true">{s.num}</div>
                <h3 className="tstep-title">{s.title}</h3>
                <p className="tstep-body">{s.body}</p>
                <ul className="tstep-meta" aria-label={`${s.title} keywords`}>
                  {s.meta.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </li>
            ))}
          </div>
        </ol>
      </div>
    </section>
  );
}
