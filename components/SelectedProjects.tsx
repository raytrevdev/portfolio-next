// Server component — pure markup.

interface Block { label: string; body: string }
interface DeployStep { lbl: string; icon: 'git' | 'box' | 'check' | 'cube' | 'rocket' }
interface Project {
  tag: string;
  title: string;
  summary: string;
  blocks: Block[];
  stack: string[];
  deploy: DeployStep[];
}

const PROJECTS: Project[] = [
  {
    tag: '// SIDE PROJECT · 2024',
    title: 'Government Portal Prototype',
    summary:
      'A content-driven public portal: server-rendered, CDN-cached, editor-friendly. Built to prove that headless CMS architecture can match the SEO and scale of monolithic platforms.',
    blocks: [
      { label: 'Problem', body: 'Public portals need fast, SEO-friendly pages that non-technical editors can update — without redeploying. Most CMS-driven sites trade one for the other.' },
      { label: 'Architecture Decision', body: 'Headless: Directus owns the schema and editor experience; Next.js renders pages with SSR + ISR for SEO and CDN-level scalability. A typed API client keeps the boundary safe.' },
    ],
    stack: ['Next.js 14', 'TypeScript', 'Directus', 'PostgreSQL', 'Tailwind', 'Jest', 'Docker', 'SSR + ISR'],
    deploy: [
      { lbl: 'PUSH', icon: 'git' },
      { lbl: 'BUILD', icon: 'box' },
      { lbl: 'TEST', icon: 'check' },
      { lbl: 'IMAGE', icon: 'cube' },
      { lbl: 'DEPLOY', icon: 'rocket' },
    ],
  },
  {
    tag: '// SIDE PROJECT · 2024',
    title: 'Personal Finance Dashboard',
    summary:
      'A full-stack finance dashboard with Google SSO, real-time budget tracking, savings goals, and spending analytics — built to exercise the full delivery pipeline solo.',
    blocks: [
      { label: 'Problem', body: 'Existing finance apps either own your data or limit categorization. The goal: a self-hosted dashboard with auth, charts, and CI/CD that I could ship and forget.' },
      { label: 'Architecture Decision', body: 'React/TypeScript frontend, ASP.NET Core 8 REST API, EF Core 8 over PostgreSQL. Containerized end-to-end. Deployed to Fly.io via GitHub Actions — a real production pipeline at hobby scale.' },
    ],
    stack: ['React', 'TypeScript', 'ASP.NET Core 8', 'EF Core 8', 'PostgreSQL', 'Docker', 'Fly.io', 'GitHub Actions', 'Google OAuth'],
    deploy: [
      { lbl: 'COMMIT', icon: 'git' },
      { lbl: 'CI', icon: 'check' },
      { lbl: 'BUILD', icon: 'box' },
      { lbl: 'IMAGE', icon: 'cube' },
      { lbl: 'FLY.IO', icon: 'rocket' },
    ],
  },
];

function DeployIcon({ kind }: { kind: DeployStep['icon'] }) {
  const props = {
    width: 14,
    height: 14,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (kind) {
    case 'git':
      return (
        <svg {...props} className="icon">
          <circle cx="4" cy="4" r="1.6" />
          <circle cx="4" cy="12" r="1.6" />
          <circle cx="12" cy="8" r="1.6" />
          <path d="M4 5.6 V10.4 M5.4 4 H10.6 M5.4 12 H10.6" />
        </svg>
      );
    case 'box':
      return (
        <svg {...props} className="icon">
          <path d="M2 5 L8 2 L14 5 L14 11 L8 14 L2 11 Z" />
          <path d="M2 5 L8 8 L14 5 M8 8 V14" />
        </svg>
      );
    case 'check':
      return (
        <svg {...props} className="icon">
          <rect x="2" y="2" width="12" height="12" rx="1" />
          <path d="M5 8 L7 10 L11 6" />
        </svg>
      );
    case 'cube':
      return (
        <svg {...props} className="icon">
          <rect x="3" y="3" width="10" height="10" />
          <rect x="5.5" y="5.5" width="5" height="5" />
        </svg>
      );
    case 'rocket':
      return (
        <svg {...props} className="icon">
          <path d="M8 1 L11 5 L11 11 L8 14 L5 11 L5 5 Z" />
          <circle cx="8" cy="7" r="1.2" />
          <path d="M5 11 L3 13 M11 11 L13 13" />
        </svg>
      );
  }
}

function ProjectCard({ p }: { p: Project }) {
  const titleId = `proj-${p.title.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <article className="project" aria-labelledby={titleId}>
      <header className="proj-head">
        <div className="proj-tag" aria-hidden="true">{p.tag}</div>
        <h3 className="proj-title" id={titleId}>{p.title}</h3>
        <p className="proj-summary">{p.summary}</p>
      </header>
      <div>
        <div className="proj-blocks">
          {p.blocks.map((b) => (
            <div className="proj-block" key={b.label}>
              <h4 className="blk-label">{b.label}</h4>
              <p className="blk-body">{b.body}</p>
            </div>
          ))}
          <div className="proj-block">
            <h4 className="blk-label">Tech Stack</h4>
            <ul className="stack-grid" aria-label={`${p.title} tech stack`}>
              {p.stack.map((s) => (
                <li className="stack-cell" key={s}>
                  <span className="dot" aria-hidden="true" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="proj-block">
            <h4 className="blk-label">Deployment Flow</h4>
            <ol className="deploy-flow" aria-label={`${p.title} deployment flow`}>
              {p.deploy.map((d) => (
                <li className="deploy-node" key={d.lbl}>
                  <DeployIcon kind={d.icon} />
                  <div className="lbl">{d.lbl}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SelectedProjects() {
  return (
    <section
      className="section"
      id="projects"
      aria-labelledby="proj-title"
      data-screen-label="Selected Projects"
    >
      <div className="shell">
        <div className="section-meta" aria-hidden="true">
          <span className="num">05</span>
          <span>Selected Projects</span>
          <span className="bar" />
          <span>real systems · shipped</span>
        </div>
        <h2 className="section-title" id="proj-title">
          Projects, framed as systems.
        </h2>
        <p className="section-lede">
          Not screenshots. Each project below is a problem statement, an architecture
          decision, the stack that delivered it, and the pipeline that ships it.
        </p>
        {PROJECTS.map((p) => <ProjectCard key={p.title} p={p} />)}
      </div>
    </section>
  );
}
