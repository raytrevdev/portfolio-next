'use client';

import { useEffect, useRef } from 'react';

interface Packet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function Hero() {
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Canvas: drifting packet pulses on a grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      w = canvas.width = canvas.offsetWidth * dpr;
      h = canvas.height = canvas.offsetHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const cell = 64 * (window.devicePixelRatio || 1);
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() ||
      'rgb(126, 201, 255)';
    const transparent = (() => {
      if (accent.startsWith('oklch')) return accent.replace(/\)\s*$/, ' / 0)');
      if (accent.startsWith('rgb(')) return accent.replace('rgb(', 'rgba(').replace(')', ', 0)');
      if (accent.startsWith('rgba(')) return accent.replace(/,\s*[\d.]+\)\s*$/, ', 0)');
      if (/^#[0-9a-f]{6}$/i.test(accent)) return accent + '00';
      return 'rgba(126, 201, 255, 0)';
    })();

    const packets: Packet[] = [];
    const spawn = () => {
      const rows = Math.floor(h / cell);
      const cols = Math.floor(w / cell);
      const horizontal = Math.random() < 0.5;
      if (horizontal) {
        const row = Math.floor(Math.random() * rows) * cell + cell / 2;
        const dir = Math.random() < 0.5 ? 1 : -1;
        packets.push({
          x: dir > 0 ? -20 : w + 20,
          y: row,
          vx: dir * (1.2 + Math.random() * 1.5) * dpr,
          vy: 0,
        });
      } else {
        const col = Math.floor(Math.random() * cols) * cell + cell / 2;
        const dir = Math.random() < 0.5 ? 1 : -1;
        packets.push({
          x: col,
          y: dir > 0 ? -20 : h + 20,
          vx: 0,
          vy: dir * (1.2 + Math.random() * 1.5) * dpr,
        });
      }
      if (packets.length > 14) packets.shift();
    };
    const interval = window.setInterval(spawn, 600);

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      packets.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        const tailLen = 80 * dpr;
        const grad = p.vx
          ? ctx.createLinearGradient(p.x - Math.sign(p.vx) * tailLen, p.y, p.x, p.y)
          : ctx.createLinearGradient(p.x, p.y - Math.sign(p.vy) * tailLen, p.x, p.y);
        grad.addColorStop(0, transparent);
        grad.addColorStop(1, accent);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5 * dpr;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (p.vx) {
          ctx.moveTo(p.x - Math.sign(p.vx) * tailLen, p.y);
          ctx.lineTo(p.x, p.y);
        } else {
          ctx.moveTo(p.x, p.y - Math.sign(p.vy) * tailLen);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8 * dpr, 0, Math.PI * 2);
        ctx.fill();
      });
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        if (p.x < -100 || p.x > w + 100 || p.y < -100 || p.y > h + 100) {
          packets.splice(i, 1);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
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
      <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
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
