'use client';

// The crossing between the career city and the family land (/roots). Both are full-page scroll engines with their
// own root layout, so moving between them is a real page load. This hides it: a click on an `a[data-bridge]` fades
// the screen to the land's black (#0d0c0a) while a year counter rolls between the two eras, then navigates. The land's
// loader is the same black, and @view-transition (in both stylesheets) cross-fades the last frame where supported.
//
//   <a href="/roots?from=city" data-bridge="roots_open" data-from-year="2026" data-to-year="1933"
//      data-label="Singapore → Sitiawan, Perak">…</a>
//
// Without JS, or with a modifier key, these are plain links. Elements with [data-bridge-prefetch] warm the target
// route (and the land's textures) once they scroll into view.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROOTS_TEXTURES } from '@/components/ting-land/texture-files';

const BLACK = '#0d0c0a';
const FADE = 450, ROLL = 900, HOLD = 220;

const track = (event: string, params: Record<string, unknown> = {}) => {
  try {
    const w = window as any;
    (w.dataLayer = w.dataLayer || []).push({ event, ...params });
    if (!w.__GTM__ && typeof w.gtag === 'function') w.gtag('event', event, params);
  } catch {}
};

function cross(a: HTMLAnchorElement) {
  if (document.documentElement.dataset.bridging) return;
  document.documentElement.dataset.bridging = '1';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const y0 = +(a.dataset.fromYear || 0), y1 = +(a.dataset.toYear || 0);
  if (a.dataset.bridge) track(a.dataset.bridge, { from: location.pathname === '/' ? 'city' : 'roots' });

  const el = document.createElement('div');
  el.className = 'bridge';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = `position:fixed;inset:0;z-index:2147483000;background:${BLACK};opacity:0;display:flex;flex-direction:column;`
    + `align-items:center;justify-content:center;gap:18px;color:#f3ede1;pointer-events:auto;transition:opacity ${RM ? 200 : FADE}ms ease`;
  const yr = document.createElement('b');
  yr.style.cssText = 'font:400 clamp(64px,9vw,128px)/1 var(--tl-serif,var(--font-disp,serif));letter-spacing:-.02em;font-variant-numeric:tabular-nums;'
    + 'opacity:0;transform:translateY(12px);transition:opacity .5s ease .2s,transform .7s cubic-bezier(.2,.7,.2,1) .2s';
  yr.textContent = String(RM ? y1 : y0);
  const lb = document.createElement('span');
  lb.style.cssText = 'font:500 11px/1 var(--tl-mono,var(--font-mono,ui-monospace)),monospace;letter-spacing:.16em;text-transform:uppercase;color:#d6cebd;'
    + 'opacity:0;transition:opacity .5s ease .35s';
  lb.textContent = a.dataset.label || '';
  if (y0 && y1) el.append(yr);
  el.append(lb);
  document.body.append(el);

  void el.offsetWidth; // commit the transparent start so the fade transitions from it
  el.style.opacity = '1'; yr.style.opacity = '1'; yr.style.transform = 'none'; lb.style.opacity = '1';
  let gone = false;
  const go = () => { if (!gone) { gone = true; location.assign(a.href); } };
  if (RM || !(y0 && y1)) { setTimeout(go, RM ? 380 : FADE + HOLD); return; }
  const t0 = performance.now() + FADE * .55;
  const tick = (now: number) => {
    const k = Math.min(1, Math.max(0, (now - t0) / ROLL)), e = 1 - (1 - k) ** 3;
    yr.textContent = String(Math.round(y0 + (y1 - y0) * e));
    if (k < 1) requestAnimationFrame(tick); else setTimeout(go, HOLD);
  };
  requestAnimationFrame(tick);
  setTimeout(go, FADE * .55 + ROLL + HOLD + 400); // rAF pauses in background tabs; never strand the visitor
}

export default function Bridge() {
  const router = useRouter();

  useEffect(() => {
    const ac = new AbortController(), signal = ac.signal;
    document.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[data-bridge]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank') return;
      e.preventDefault();
      cross(a);
    }, { signal });
    // Coming back with the browser's back button restores this page from the bfcache with the overlay still up.
    addEventListener('pageshow', e => {
      if (!e.persisted) return;
      document.querySelectorAll('.bridge').forEach(n => n.remove());
      delete document.documentElement.dataset.bridging;
    }, { signal });

    const warmed = new Set<string>();
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const a = en.target as HTMLAnchorElement, url = new URL(a.href, location.href);
      io.unobserve(a);
      if (warmed.has(url.pathname)) return;
      warmed.add(url.pathname);
      router.prefetch(url.pathname);
      const saveData = (navigator as any).connection?.saveData;
      if (url.pathname.startsWith('/roots') && !saveData) {
        ROOTS_TEXTURES.forEach(f => {
          const l = document.createElement('link');
          l.rel = 'prefetch'; l.as = 'image'; l.href = '/roots/textures/' + f;
          document.head.append(l);
        });
      }
    }), { rootMargin: '0px 0px 25% 0px' });
    document.querySelectorAll('[data-bridge-prefetch]').forEach(n => io.observe(n));

    return () => { ac.abort(); io.disconnect(); };
  }, [router]);

  return null;
}
