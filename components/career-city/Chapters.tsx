import type { CSSProperties } from 'react';

// Per-chapter accent (--pa). Copy below is verbatim from the reference prototype unless noted.
const pa = (c: string) => ({ '--pa': c }) as CSSProperties;

export default function Chapters() {
  return (
    <main>
      <section className="ch" id="start" data-t="Start" data-y="Profile" style={{ height: '170vh' }}>
        <div className="pin">
          <div className="plac">
            <div className="row"><b>Site plan</b><span>Kuala Lumpur → Singapore</span></div>
            <h1>Ting Tze Jian, Raymond</h1>
            <div className="org">Senior Software Developer, Singapore</div>
            <p>Software developer with hands-on experience delivering and leading CMS-driven web projects across WordPress and Sitefinity environments, including headless CMS architectures.</p>
            <p className="hero-p2" style={{ marginTop: 8 }}>Brings a balanced mix of engineering execution, infrastructure awareness, and project ownership.</p>
            <div className="trio">
              <div><b className="count" data-to="3">0</b><span>Roles</span></div>
              <div><b className="count" data-to="2">0</b><span>Countries</span></div>
              <div><b className="count" data-to="2">0</b><span>Side projects</span></div>
            </div>
            <div className="cue"><i></i>SCROLL TO BUILD</div>
          </div>
        </div>
      </section>

      <section className="ch" id="diploma" data-t="Diploma" data-y="2018" style={{ height: '220vh' }}>
        <div className="pin">
          <div className="plac" style={pa('oklch(.56 .16 255)')}>
            <div className="row"><b>Plot 01 · Foundations</b><span>04/2018 – 04/2020 · Kuala Lumpur</span></div>
            <h2>Diploma in Computer Science and Management Mathematics</h2>
            <div className="org">Tunku Abdul Rahman University College</div>
            <p>Courses included C language Programming, Object Oriented Programming with Java, Web Development with HTML and CSS and Database Management System, Applied Mathematics included Advanced Calculus and Advanced Mathematics.</p>
            <div className="stat"><b className="count" data-to="3.6" data-dp="1">0</b><span>CGPA</span></div>
          </div>
        </div>
      </section>

      <section className="ch right" id="intsoft" data-t="Intsoft" data-y="2020" style={{ height: '220vh' }}>
        <div className="pin">
          <div className="plac" style={pa('oklch(.6 .16 40)')}>
            <div className="row"><b>Plot 02 · First build</b><span>02/2020 – 04/2020 · Kuala Lumpur</span></div>
            <h2>Software Developer (Intern)</h2>
            <div className="org">Intsoft Solutions Sdn Bhd</div>
            <ul className="b">
              <li>Developed web applications using C# (ASP.NET) and PHP within Apache/XAMPP environments, supporting secure and scalable client solutions.</li>
              <li>Built cross-platform mobile applications using C# (Xamarin), contributing to consistent user experiences across devices.</li>
            </ul>
            <ul className="tags"><li>C#</li><li>ASP.NET</li><li>PHP</li><li>Xamarin</li></ul>
          </div>
        </div>
      </section>

      <section className="ch" id="degree" data-t="Degree" data-y="2020" style={{ height: '220vh' }}>
        <div className="pin">
          <div className="plac" style={pa('oklch(.56 .14 155)')}>
            <div className="row"><b>Plot 03 · Campus</b><span>09/2020 – 11/2022 · Kuala Lumpur</span></div>
            <h2>Bachelors in Information Technology (Honours) in Software System Development</h2>
            <div className="org">Tunku Abdul Rahman University College</div>
            <p>Courses included Mobile Application Development with Kotlin and Firebase, Advance Computer Networks, Advance Database Management System with MongoDB and SQL Plus, Data Structure Algorithms with Java, Web Development with ASP.NET and SQL LITE.</p>
            <div className="stat"><b className="count" data-to="3.53" data-dp="2">0</b><span>CGPA</span></div>
          </div>
        </div>
      </section>

      <section className="ch right" id="arvato" data-t="Arvato" data-y="2022" style={{ height: '220vh' }}>
        <div className="pin">
          <div className="plac" style={pa('oklch(.56 .16 300)')}>
            <div className="row"><b>Plot 04 · Services</b><span>06/2022 – 12/2022 · Kuala Lumpur</span></div>
            <h2>Software Developer (Intern)</h2>
            <div className="org">Arvato Systems Malaysia</div>
            <ul className="b">
              <li>Contributed to internal web application development using Spring Boot (Java 8/11/17) and Angular with TypeScript, supporting API development and responsive UI implementation.</li>
              <li>Implemented CRUD operations with Spring Data JDBC, managed database interactions (PostgreSQL/MySQL), and handled schema versioning using Liquibase.</li>
              <li>Performed API testing (Postman/Swagger), wrote unit tests (JUnit/Mockito), and collaborated via Git/Bitbucket in an Agile team environment.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="ch" id="causeway" data-t="The flight" data-y="12/2022" style={{ height: '3100vh' }}>
        <div className="pin" style={{ justifyContent: 'flex-start', paddingTop: 78 }}>
          <div className="pass">
            <div className="pass-l">
              <div className="row"><b>Boarding pass · KUL → SIN</b><span>12/2022 → 01/2023</span></div>
              <div className="route">
                <div><span>From</span><b>KUL</b><em>Kuala Lumpur, Malaysia</em></div>
                <div className="track"><i className="line"><i id="passFill"></i></i><i className="dot" id="passDot"></i></div>
                <div style={{ textAlign: 'right' }}><span>To</span><b>SIN</b><em>Singapore</em></div>
              </div>
              <button type="button" className="chg" id="chgBtn">Change aircraft</button>
              <div className="meta3">
                <div><span>Leaving as</span>Software Developer (Intern)<br /><small>Arvato Systems Malaysia</small></div>
                <div><span>Arriving as</span>Software Developer<br /><small>WhooshPro Pte Ltd</small></div>
              </div>
            </div>
            <div className="pass-r">
              <span>Flight distance</span>
              <b><i id="km">0</i><small>km</small></b>
              <span id="passStage">Boarding at KUL</span>
            </div>
          </div>
        </div>
      </section>

      <section className="ch" id="whoosh" data-t="WhooshPro" data-y="2023" style={{ height: '560vh' }}>
        <div className="pin">
          <div className="plac" style={pa('oklch(.58 .19 25)')}>
            <div className="row"><b>Plot 05 · Singapore</b><span>01/2023 – present · Singapore</span></div>
            <h2>Software Developer <span style={{ color: 'var(--mut)', fontWeight: 400 }}>→</span> Senior Software Developer</h2>
            <div className="org">WhooshPro Pte Ltd · promoted</div>
            <ul className="tags"><li>WordPress</li><li>Sitefinity</li><li>React / Next.js</li><li>.NET · EF</li><li>RedHat · Debian · IIS</li><li>Azure · AWS</li></ul>
          </div>
          <div className="hz">
            <div className="htrack" id="htrack">
              {FLOORS.map(([tag, body], i) => (
                <div className="hcard" style={pa('oklch(.58 .19 25)')} key={tag}>
                  <div className="row"><b>Floor {String(i + 1).padStart(2, '0')}</b><span>{tag}</span></div>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="ch" id="projects" data-t="Side projects" data-y="Now" style={{ height: '300vh' }}>
        <div className="pin">
          <div className="plac proj" id="proj">
            <div style={pa('oklch(.56 .12 200)')}>
              <div className="row"><b>Plot 06 · Side project</b><span>1 / 2</span></div>
              <h2>Headless CMS Portal Prototype</h2>
              <div className="org">Next.js 14 · Directus · PostgreSQL</div>
              <ul className="b">
                <li>Built a content-driven public portal using server-side rendering and ISR for SEO performance and CDN-level scalability.</li>
                <li>Integrated a headless CMS with a typed API client, enabling non-technical editors to manage news, categories, and page content without code changes.</li>
                <li>Designed schema with singleton and relational collections; implemented paginated news listing with category filtering.</li>
              </ul>
              <ul className="tags"><li>Next.js 14</li><li>TypeScript</li><li>Directus</li><li>PostgreSQL</li><li>Tailwind CSS</li><li>Jest</li><li>Docker</li></ul>
            </div>
            <div style={pa('oklch(.6 .14 80)')}>
              <div className="row"><b>Plot 07 · Side project</b><span>2 / 2</span></div>
              <h2>Personal Finance Dashboard</h2>
              <div className="org">React · ASP.NET Core 8 · Fly.io</div>
              <ul className="b">
                <li>Full-stack personal finance dashboard with Google SSO authentication, featuring real-time budget tracking, savings goals, and spending analytics with interactive charts.</li>
                <li>Built with React/TypeScript frontend and ASP.NET Core 8 REST API backed by PostgreSQL, with EF Core 8 for data access, containerized with Docker and deployed to Fly.io via GitHub Actions CI/CD pipeline.</li>
              </ul>
              <ul className="tags"><li>React</li><li>TypeScript</li><li>ASP.NET Core 8</li><li>PostgreSQL</li><li>Docker</li><li>Fly.io</li><li>GitHub Actions</li><li>Google OAuth SSO</li></ul>
            </div>
          </div>
        </div>
      </section>

      <section className="ch right" id="contact" data-t="Contact" data-y="Next" style={{ height: '160vh' }}>
        <div className="pin">
          <div className="plac" style={pa('oklch(.58 .17 255)')}>
            <div className="row"><b>Plot 08 · Open</b><span>Singapore · 2026</span></div>
            <h1 style={{ fontSize: 'clamp(36px,3.6vw,52px)' }}>Let&apos;s talk shipping.</h1>
            <p>Building a CMS-driven platform, modernising legacy infrastructure, or looking for a senior who can own end-to-end delivery? Reach me directly.</p>
            <ul className="clist" style={{ marginTop: 14 }}>
              <li><span>Email</span><a href="mailto:raymondting521@gmail.com">raymondting521@gmail.com</a></li>
            </ul>
            <div className="btns">
              <a className="btn pri" href="mailto:raymondting521@gmail.com">Email Raymond</a>
              <a className="btn" href="/resume.pdf" target="_blank" rel="noopener">Download résumé</a>
              <button className="btn" id="fwBtn" type="button">Launch fireworks</button>
            </div>
            <p className="fwhint">Tap anywhere on the city to launch your own.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

const FLOORS: [string, string][] = [
  ['Delivery', 'Oversaw multiple concurrent projects, driving planning, task delegation, timeline control, and cross-functional execution to ensure on-time delivery.'],
  ['CMS', 'Led end-to-end delivery of CMS-driven web projects (WordPress and Sitefinity), from requirement gathering and technical planning to deployment and post-launch support.'],
  ['Full-stack', 'Developed and maintained full-stack solutions using React/Next.js and .NET with Entity Framework, ensuring scalable architecture and clean integration.'],
  ['Hosting', 'Managed Linux-based hosting environments (RedHat, Debian) and Windows IIS servers, handling deployments, configuration, troubleshooting, and production stability.'],
  ['Cloud', 'Provisioned and maintained cloud infrastructure on Azure and AWS, including VM setup, environment configuration, and hosting management for client projects.'],
  ['Stakeholders', 'Coordinated directly with stakeholders to define scope, manage timelines, assign tasks, and ensure on-time project delivery.'],
];
