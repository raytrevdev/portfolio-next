# Raymond Ting — Career City

Portfolio of Ting Tze Jian (Raymond), Senior Software Developer based in Singapore. The résumé is a miniature 3D clay city: as you scroll, a glowing commit puck travels the road and each career step grows as a building — Kuala Lumpur → a flight across the Straits of Johor (airliner, jet, UFO… or a full Starship launch and catch) → Singapore, ending at night with fireworks.

**Live site → [rdevting.com](https://www.rdevting.com/)**

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Framework | Next.js 16 (App Router, Static Export) |
| Language | TypeScript 5 |
| 3D | three.js 0.184 — imperative, one scroll-driven engine (no react-three-fiber) |
| Styling | Pure CSS — OKLCH color system, custom properties |
| Fonts | Bricolage Grotesque · DM Mono (self-hosted via `next/font`) |
| Hosting | Netlify (CDN, global edge) · domain via GoDaddy |

Scroll is the only timeline: every animation is a pure function of scroll progress. Respects `prefers-reduced-motion`, has dedicated mobile camera framing, and auto-scales pixel ratio / shadow resolution when frame time drops.

---

## CI/CD Pipeline

```
git push → GitHub Actions (push + PR to main)
              ├── TypeScript type check (tsc --noEmit)
              └── Production build (next build)

git push → Netlify (independent of Actions)
              ├── PRs   → deploy preview URL
              └── main  → npm run build → publish out/ → rdevting.com
```

---

## Local Development

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # static export → out/
npm run lint      # TypeScript type check (tsc --noEmit)
```

---

## Project Structure

```
app/
├── layout.tsx              # Fonts, SEO metadata, JSON-LD, Google Analytics
├── page.tsx                # Overlay + chapters + engine mount
├── globals.css             # All styles (ported from the design prototype)
├── opengraph-image.tsx     # Social preview, rendered to PNG at build time
├── sitemap.ts · robots.ts  # Static sitemap.xml / robots.txt
components/career-city/
├── Overlay.tsx             # Sky, WebGL canvas, fog, vehicle picker, nav, timeline
├── Chapters.tsx            # The 9 scroll chapters (all résumé copy lives here)
└── CityEngine.tsx          # Client-only: lazy-loads and mounts/disposes the engine
lib/three/
└── engine.ts               # The city, flight, Starship sequence, story state machine
public/                     # favicon, resume.pdf
```

`lib/three/engine.ts` is a 1:1 port of the design prototype's script, kept intact for motion parity. Only the mount/unmount lifecycle, the label font and the removed GLB export differ.

---

## Analytics

Google Analytics 4 (`G-JJ5YG883HM`). Set `NEXT_PUBLIC_GTM_ID` (e.g. `GTM-XXXXXXX`) in the Netlify environment (and `.env.local` for local testing) to load **Google Tag Manager** instead. GA4 is then configured inside GTM and the direct `gtag.js` snippet is not loaded. Without it, events go straight to GA4.

The city pushes these events to `dataLayer` (`{ event, ...params }`):

| Event | When | Params |
|---|---|---|
| `aircraft_select` | Visitor picks a vehicle (not the default on load) | `aircraft` |
| `flight_start` | The flight takes off | `aircraft`, `mode` (`auto` \| `scroll`) |
| `flight_complete` | The flight lands | `aircraft`, `mode` |
| `auto_launch_start` | Auto-launch pressed | `aircraft` |
| `auto_launch_stop` | Auto-launch stopped before landing | `aircraft`, `progress` (0–100) |
| `auto_launch_complete` | Auto-launch reached touchdown | `aircraft` |

`aircraft` is one of `airliner`, `jumbo`, `jet`, `prop`, `paper`, `ufo`, `starship`.
