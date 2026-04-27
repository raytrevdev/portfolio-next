# Raymond Ting — Engineering Portfolio

Personal portfolio of Ting Tze Jian (Raymond), Senior Software Developer based in Singapore. Built to demonstrate full-stack engineering capability — from frontend interfaces to infrastructure, deployment pipelines, and end-to-end system ownership.

**Live site → [rdevting.com](https://www.rdevting.com/)**

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Framework | Next.js 16 (App Router, Static Export) |
| Language | TypeScript 5 |
| Styling | Pure CSS — OKLCH color system, custom properties |
| Fonts | Inter Tight · JetBrains Mono (Google Fonts) |
| Animations | Canvas API · SVG · CSS transitions · IntersectionObserver |
| Hosting | Netlify (CDN, global edge) |

No UI libraries. No CSS frameworks. No external dependencies beyond Next.js and React.

---

## CI/CD Pipeline

Every push to `main` triggers the following automated pipeline:

```
git push → GitHub Actions
              ├── TypeScript type check (tsc --noEmit)
              ├── ESLint lint check
              └── Production build (next build)
                        ↓ all pass
                   Netlify picks up the commit
                        ↓
                   Runs npm run build
                        ↓
                   Publishes out/ to global CDN
                        ↓
                   Live at rdevting.com
```

If any step in GitHub Actions fails, the commit is flagged and Netlify does not deploy — the live site stays on the last good version.

---

## Local Development

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # static export → out/
npm run lint      # ESLint
```

---

## Project Structure

```
next-app/
├── app/
│   ├── layout.tsx            # Root layout, fonts, SEO metadata
│   ├── page.tsx              # Single-page composition
│   └── globals.css           # All styles
├── components/
│   ├── TopNav.tsx            # Fixed nav with mobile drawer
│   ├── Hero.tsx              # Canvas animation + headline reveal
│   ├── CapabilityLayers.tsx  # Auto-cycling skill tabs / mobile slider
│   ├── SystemDiagrams.tsx    # SVG architecture diagrams
│   ├── OwnershipTimeline.tsx # Scroll-tracked delivery timeline
│   ├── SelectedProjects.tsx  # Featured project case studies
│   ├── Reflection.tsx        # Operating principles
│   └── Contact.tsx           # Contact form + resume download
├── public/                   # Static assets (favicon, OG card, resume PDF)
├── .github/workflows/        # GitHub Actions CI workflow
└── netlify.toml              # Netlify build + publish config
```
