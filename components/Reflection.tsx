// Server component — pure markup.

const PRINCIPLES = [
  { n: 'P/01', title: 'The system is not done until it runs.', body: 'Build, deploy, and monitor are the same job. A green CI badge is not delivery — sustained production is.' },
  { n: 'P/02', title: 'Editors out of the codebase.', body: 'Content models exist so the people closest to the words can ship without engineering. Architect for that, not against it.' },
  { n: 'P/03', title: 'Reproducible or it didn\u2019t happen.', body: 'Containers, schema versioning, infrastructure as configuration. The third deploy of the week should be as boring as the first.' },
  { n: 'P/04', title: 'Own the boundary.', body: 'Frontend ↔ API ↔ database ↔ host. The most expensive bugs live between layers. A senior engineer reads the whole stack.' },
  { n: 'P/05', title: 'Deliver, then communicate.', body: 'Stakeholder trust comes from on-time releases and direct, unembellished updates. Both, every time.' },
];

export default function Reflection() {
  return (
    <section
      className="section"
      id="reflection"
      aria-labelledby="ref-title"
      data-screen-label="Reflection"
    >
      <div className="shell">
        <div className="section-meta" aria-hidden="true">
          <span className="num">06</span>
          <span>Reflection</span>
          <span className="bar" />
          <span>principles · what comes next</span>
        </div>
        <h2 className="section-title" id="ref-title">
          What three years of shipping taught me.
        </h2>
        <p className="section-lede">
          Five operating principles I keep returning to — the ones that made the
          difference between code that compiled and software that stayed online.
        </p>

        <ol className="principles" aria-label="Operating principles">
          {PRINCIPLES.map((p) => (
            <li className="principle" key={p.n}>
              <div className="p-num" aria-hidden="true">{p.n}</div>
              <h3 className="p-title">{p.title}</h3>
              <p className="p-body">{p.body}</p>
            </li>
          ))}
        </ol>

        <div className="closing">
          <p className="closing-line">
            Next: deeper into <span className="accent">platform engineering</span>,
            production reliability, and teams that ship.
          </p>

        </div>
      </div>


    </section>
  );
}
