// Fixed layers around the chapters: sky gradient, WebGL canvas, fog wash, vehicle picker, nav, timeline.
// The engine drives all of these by id/class; React only renders the initial markup.
export default function Overlay() {
  return (
    <>
      <div id="sky"></div>
      <canvas id="gl"></canvas>
      <div
        id="fog"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0,
          background: 'radial-gradient(ellipse 70% 60% at 50% 42%,rgba(255,255,255,.7),rgba(255,255,255,.97))',
        }}
      ></div>

      <div className="hangar" id="hangar" aria-live="polite">
        <div className="h-kick">Before you board</div>
        <div className="h-title">Pick your aircraft</div>
        <div className="h-car">
          <button type="button" data-dir="-1" aria-label="Previous aircraft">‹</button>
          <div className="h-name" id="hName"><b>Starship</b><span>Pad to pad, via the edge of space</span></div>
          <button type="button" data-dir="1" className="nx" aria-label="Next aircraft">›</button>
        </div>
        <div className="h-dots" id="hDots"></div>
        <div className="h-hint"><i></i>Or keep scrolling to take off</div>
      </div>

      <header className="nav">
        <a className="pill brand" href="#start"><i></i>Raymond Ting</a>
        <span className="sp"></span>
        <a className="pill hide" href="/resume.pdf" target="_blank" rel="noopener">Résumé</a>
        <a className="pill dark" href="#contact">Get in touch</a>
      </header>

      <nav className="tl" id="tl" aria-label="Chapters"><div className="fill"><i id="tlFill"></i></div></nav>
    </>
  );
}
