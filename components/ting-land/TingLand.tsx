'use client';

// Ting Family Land — scroll-driven 3D story of the family plot in Sitiawan, Perak (1933 → today).
// Static DOM (chapters, labels, HUD) is rendered by React; the three.js engine mounts onto it after hydration
// and drives the canvas, camera, era growth, specimen reveals and label positions from window scroll.

import { useEffect, useRef, type CSSProperties } from 'react';
import './ting-land.css';

// staggered reveal delay for .r elements (transition-delay = --d × 85ms)
const d = (n: number) => ({ '--d': n }) as CSSProperties;

export type TingLandProps = {
  /** public URL folder holding the baked textures (public/roots/textures) */
  textureBase?: string;
  /** the career city; "Back to the city" crosses there through the bridge (components/Bridge.tsx) */
  cityHref?: string;
};

// Return trip: lands on the city's Contact chapter (night, fireworks) and starts dark so nothing flashes.
const back = (cityHref: string) => ({
  href: `${cityHref}?from=roots#contact`,
  'data-bridge': 'roots_back',
  'data-bridge-prefetch': '',
  'data-from-year': '1933',
  'data-to-year': '2026',
  'data-label': 'Sitiawan, Perak → Singapore',
});

export default function TingLand({ textureBase = '/roots/textures/', cityHref = '/' }: TingLandProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    import('./engine').then(({ initTingLand }) => {
      if (cancelled || !rootRef.current) return;
      dispose = initTingLand(rootRef.current, { textureBase });
    });
    // analytics: reaching the end card ("93 years. One piece of land.") counts as finishing the story
    const fin = rootRef.current?.querySelector('.ch.fin');
    const mo = fin && new MutationObserver(() => {
      if (!fin.classList.contains('on')) return;
      mo?.disconnect();
      const w = window as any;
      (w.dataLayer = w.dataLayer || []).push({ event: 'roots_complete' });
      if (!w.__GTM__ && typeof w.gtag === 'function') w.gtag('event', 'roots_complete');
    });
    if (fin && mo) mo.observe(fin, { attributes: true, attributeFilter: ['class'] });
    return () => {
      cancelled = true;
      mo?.disconnect();
      dispose?.();
    };
  }, [textureBase]);

  return (
    <div ref={rootRef} className="ting-root" data-era="0" data-auto="0">
      <canvas id="gl"></canvas>
      <div id="vig"></div><div id="grain"></div>
      <div id="fade"></div>
      <div id="scrim"></div>

      <header>
        <a className="brand" href="#" data-jump="0">Ting <small>Sitiawan, Perak</small></a>
        <div className="hud">
          <button type="button" className="chip auto" data-auto-toggle="" aria-label="Autoplay the story">
            <i aria-hidden="true"></i><span className="a-play">Autoplay</span><span className="a-pause">Pause</span>
          </button>
          <a className="chip" {...back(cityHref)}>← Raymond Ting</a>
        </div>
      </header>

      <nav id="rail" aria-label="Timeline">
        <button data-jump="0"><span>Before 1933</span><i></i></button>
        <button data-jump="1"><span>1933 · Banana &amp; Papaya</span><i></i></button>
        <button data-jump="6"><span>1952 · Rubber</span><i></i></button>
        <button data-jump="9"><span>2004 · Oil Palm</span><i></i></button>
        <button data-jump="13"><span>Today</span><i></i></button>
      </nav>

      <div id="year"><div className="y" data-year>1933</div><div className="e"><span data-eralabel>Before planting</span> · <b data-tended>0</b> yrs tended</div></div>
      <div id="prog"><i></i></div>

      <div id="chapters">
        <article className="ch hero" data-i="0">
          <p className="eb r">Sitiawan, Perak</p>
          <h1 className="r" style={d(1)}>Ting Family Land</h1>
          <p className="sub r" style={d(2)}>1933 — today · Banana &amp; Papaya · Rubber · Oil Palm</p>
          <div className="act r" style={d(3)}>
            <button type="button" className="btn auto" data-auto-toggle=""><i aria-hidden="true"></i><span className="a-play">Autoplay the story</span><span className="a-pause">Pause</span></button>
          </div>
          <p className="cue r" style={d(4)}>or scroll</p>
        </article>

        <article className="ch" data-i="1">
          <p className="eb r">Chapter I · 1933 – 1952</p>
          <h2 className="r" style={d(1)}>Banana <em>&amp;</em><br />Papaya</h2>
          <dl className="facts r" style={d(2)}>
            <div><dt>On the land</dt><dd>19 yrs</dd></div>
          </dl>
          <div className="plant r" style={d(3)}><span>Scroll to plant</span><b data-count="banana">0</b><i><u data-bar="banana"></u></i></div>
        </article>

        <article className="ch gch" data-i="2">
          <p className="eb r">Banana · Musa</p>
          <h3 className="r" style={d(1)}>One bunch per stem</h3>
          <p className="lead r" style={d(2)}>Each stem flowers once and carries a single bunch. A sucker at its base grows up to replace it.</p>
          <dl className="facts r" style={d(3)}><div><dt>Plant to first bunch</dt><dd>9–12 mo</dd></div></dl>
        </article>

        <article className="ch" data-i="3">
          <p className="eb r">Specimen 01 · Musa</p>
          <h2 className="r" style={d(1)}>Inside<br /><em>a banana</em></h2>
        </article>

        <article className="ch gch" data-i="4">
          <p className="eb r">Papaya · Carica papaya</p>
          <h3 className="r" style={d(1)}>Fruit up the trunk</h3>
          <p className="lead r" style={d(2)}>Fruits set in clusters on the trunk, just below the crown, and ripen year-round.</p>
          <dl className="facts r" style={d(3)}><div><dt>Seed to first fruit</dt><dd>~10 mo</dd></div></dl>
        </article>

        <article className="ch" data-i="5">
          <p className="eb r">Specimen 02 · Carica papaya</p>
          <h2 className="r" style={d(1)}>Inside<br /><em>a papaya</em></h2>
        </article>

        <article className="ch" data-i="6">
          <p className="eb r">Chapter II · 1952 – 2004</p>
          <h2 className="r" style={d(1)}>Rubber</h2>
          <p className="lead r" style={{ ...d(2), fontStyle: 'italic' }}>Hevea brasiliensis</p>
          <dl className="facts r" style={d(3)}>
            <div><dt>On the land</dt><dd>52 yrs</dd></div>
            <div><dt>Planting to first tapping</dt><dd>6–7 yrs</dd></div>
            <div><dt>Trees, 3 × 6.7 m rows</dt><dd>≈390</dd></div>
          </dl>
          <div className="plant r" style={d(4)}><span>Scroll to plant</span><b data-count="rubber">0</b><i><u data-bar="rubber"></u></i></div>
        </article>

        <article className="ch gch" data-i="7">
          <p className="eb r">Tapping · early morning</p>
          <h3 className="r" style={d(1)}>Latex into the cup</h3>
          <p className="lead r" style={d(2)}>Tapping starts before sunrise, when latex flows best. It runs down the cut into the cup.</p>
          <dl className="facts r" style={d(3)}><div><dt>Tapping rounds</dt><dd>Every 2–3 days</dd></div></dl>
        </article>

        <article className="ch" data-i="8">
          <p className="eb r">Specimen 03 · Hevea bark</p>
          <h2 className="r" style={d(1)}>Inside<br /><em>the bark</em></h2>
        </article>

        <article className="ch" data-i="9">
          <p className="eb r">Chapter III · 2004 – today</p>
          <h2 className="r" style={d(1)}>Oil Palm</h2>
          <p className="lead r" style={d(2)}>Elaeis guineensis</p>
          <dl className="facts r" style={d(3)}>
            <div><dt>On the land</dt><dd>22 yrs</dd></div>
            <div><dt>Planting to first harvest</dt><dd>~30 mo</dd></div>
            <div><dt>Palms, 9 m triangle</dt><dd>≈105</dd></div>
          </dl>
          <div className="plant r" style={d(4)}><span>Scroll to plant</span><b data-count="palm">0</b><i><u data-bar="palm"></u></i></div>
        </article>

        <article className="ch gch" data-i="10">
          <p className="eb r">Harvest round</p>
          <h3 className="r" style={d(1)}>Ripe bunches</h3>
          <p className="lead r" style={d(2)}>Ripe bunches turn orange-red and shed loose fruitlets on the ground.</p>
          <dl className="facts r" style={d(3)}><div><dt>Harvest rounds</dt><dd>Every 10–15 days</dd></div></dl>
        </article>

        <article className="ch" data-i="11">
          <p className="eb r">Specimen 04 · Fresh fruit bunch</p>
          <h2 className="r" style={d(1)}>Inside<br /><em>a bunch</em></h2>
          <p className="lead r" style={d(2)}>10–25 kg each.</p>
        </article>

        <article className="ch" data-i="12">
          <p className="eb r">Specimen 05 · Palm fruitlet</p>
          <h2 className="r" style={d(1)}>Inside<br /><em>a palm fruit</em></h2>
        </article>

        <article className="ch fin" data-i="13">
          <p className="eb r">1933 — 2026</p>
          <h2 className="r" style={d(1)}>93 years.<br /><em>One piece of land.</em></h2>
          <ol className="recap">
            <li className="r" style={d(2)}><span className="yr">1933 – 1952</span><span className="cr">Banana &amp; Papaya</span><span className="du">19 yrs</span><span className="bar"><i style={{ left: '0', width: '20.4%', background: 'oklch(0.84 0.12 92)' }}></i></span></li>
            <li className="r" style={d(3)}><span className="yr">1952 – 2004</span><span className="cr">Rubber</span><span className="du">52 yrs</span><span className="bar"><i style={{ left: '20.4%', width: '55.9%', background: 'oklch(0.84 0.12 215)' }}></i></span></li>
            <li className="r" style={d(4)}><span className="yr">2004 – today</span><span className="cr">Oil Palm</span><span className="du">22 yrs</span><span className="bar"><i style={{ left: '76.3%', width: '23.7%', background: 'oklch(0.84 0.12 45)' }}></i></span></li>
          </ol>
          <div className="act r" style={d(5)}><a className="btn" {...back(cityHref)}>Back to the city →</a></div>
        </article>
      </div>

      <div id="labels">
        <div className="lbl" data-s="0" data-l="0" data-a="0"><i></i><em></em><div className="tx"><b>Peel</b><span>Exocarp. Green at harvest; yellows as starch turns to sugar.</span></div></div>
        <div className="lbl" data-s="0" data-l="1" data-a="0"><i></i><em></em><div className="tx"><b>Flesh</b><span>Mesocarp. Soft, starchy pulp.</span></div></div>
        <div className="lbl" data-s="0" data-l="2" data-a="0"><i></i><em></em><div className="tx"><b>Seed core</b><span>Dark specks are vestigial seeds. Edible bananas are seedless, grown from suckers.</span></div></div>

        <div className="lbl" data-s="1" data-l="0" data-a="0"><i></i><em></em><div className="tx"><b>Skin</b><span>Thin and waxy; green to yellow-orange as it ripens.</span></div></div>
        <div className="lbl" data-s="1" data-l="1" data-a="0"><i></i><em></em><div className="tx"><b>Flesh</b><span>Thick orange pulp, rich in the enzyme papain.</span></div></div>
        <div className="lbl" data-s="1" data-l="2" data-a="0"><i></i><em></em><div className="tx"><b>Seed cavity</b><span>Hundreds of black seeds, each in a gel-like coat.</span></div></div>

        <div className="lbl" data-s="2" data-l="0" data-a="0"><i></i><em></em><div className="tx"><b>Outer bark</b><span>Hard, corky, protective.</span></div></div>
        <div className="lbl" data-s="2" data-l="0" data-a="1"><i></i><em></em><div className="tx"><b>Tapping cut</b><span>A half-spiral sloped about 30°, shaved every 2–3 days.</span></div></div>
        <div className="lbl" data-s="2" data-l="1" data-a="0"><i></i><em></em><div className="tx"><b>Latex vessels</b><span>Rings of latex-bearing vessels in the soft bark. The cut opens them.</span></div></div>
        <div className="lbl" data-s="2" data-l="2" data-a="0"><i></i><em></em><div className="tx"><b>Cambium</b><span>The living growth layer. A good tapper never cuts this deep.</span></div></div>
        <div className="lbl" data-s="2" data-l="3" data-a="0"><i></i><em></em><div className="tx"><b>Wood</b><span>Rubberwood. Retired trees become timber.</span></div></div>

        <div className="lbl" data-s="3" data-l="0" data-a="0"><i></i><em></em><div className="tx"><b>Stalk</b><span>The bunch is cut free at its stalk.</span></div></div>
        <div className="lbl" data-s="3" data-l="1" data-a="0"><i></i><em></em><div className="tx"><b>Spikelets</b><span>Fruitlets grow on spikelets tipped with sharp spines.</span></div></div>
        <div className="lbl" data-s="3" data-l="2" data-a="0"><i></i><em></em><div className="tx"><b>Fruitlets</b><span>1,000–3,000 per bunch. Ripe ones loosen and drop.</span></div></div>

        <div className="lbl" data-s="4" data-l="0" data-a="0"><i></i><em></em><div className="tx"><b>Exocarp</b><span>The skin. Dark when young, orange-red when ripe.</span></div></div>
        <div className="lbl" data-s="4" data-l="1" data-a="0"><i></i><em></em><div className="tx"><b>Mesocarp</b><span>Fibrous flesh, pressed for crude palm oil.</span></div></div>
        <div className="lbl" data-s="4" data-l="2" data-a="0"><i></i><em></em><div className="tx"><b>Shell</b><span>Endocarp. Hard and woody.</span></div></div>
        <div className="lbl" data-s="4" data-l="3" data-a="0"><i></i><em></em><div className="tx"><b>Kernel</b><span>Pressed separately for palm kernel oil.</span></div></div>
      </div>

      <div id="loader"><h2>Ting Family Land</h2><i></i><p>Preparing the soil</p></div>

      <main id="track"></main>
    </div>
  );
}
