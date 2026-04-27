'use client';

import { useEffect, useState } from 'react';

const CHARS       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%/\\';
const TARGET_NAME = 'raymond.ting';
const TARGET_ROLE = 'BUILD · DEPLOY · OWN THE STACK';

function scramble(
  target: string,
  setFn: (v: string) => void,
  speed = 40,
  step = 0.3,
): () => void {
  let iteration = 0;
  const id = setInterval(() => {
    setFn(
      target.split('').map((char, i) =>
        i < iteration ? char : CHARS[Math.floor(Math.random() * CHARS.length)]
      ).join('')
    );
    iteration += step;
    if (iteration > target.length) clearInterval(id);
  }, speed);
  return () => clearInterval(id);
}

export default function LoadingScreen() {
  const [phase,       setPhase]       = useState<'enter' | 'exit' | 'done'>('enter');
  const [displayName, setDisplayName] = useState(TARGET_NAME);
  const [displayRole, setDisplayRole] = useState(TARGET_ROLE);

  // Name scramble — starts immediately
  useEffect(() => scramble(TARGET_NAME, setDisplayName), []);

  // Role scramble — starts after name is mostly decoded
  useEffect(() => {
    const t = setTimeout(() => scramble(TARGET_ROLE, setDisplayRole, 30, 0.55), 750);
    return () => clearTimeout(t);
  }, []);

  // Phase transitions
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('exit'), 3700);
    const t2 = setTimeout(() => setPhase('done'), 4600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'done') return null;

  const exiting = phase === 'exit';

  return (
    <div className={`loader${exiting ? ' loader-exit' : ''}`} aria-hidden="true">
      <div className="loader-scan" />
      <div className="loader-half loader-half-top" />
      <div className="loader-half loader-half-bot" />

      <div className="loader-content">
        <div className="loader-eyebrow">From Idea to Production</div>

        {/* HUD brackets + big name */}
        <div className="loader-hud">
          <span className="hud-c hud-tl" />
          <span className="hud-c hud-tr" />
          <div className="loader-name" data-text={displayName}>{displayName}</div>
          <span className="hud-c hud-bl" />
          <span className="hud-c hud-br" />
        </div>

        <div className="loader-rule" />

        <div className="loader-role">{displayRole}</div>

        <div className="loader-status">
          <span className="loader-prompt">&gt;</span>
          <span> AUTHENTICATED</span>
          <span className="loader-cursor"> ▮</span>
        </div>
      </div>
    </div>
  );
}
