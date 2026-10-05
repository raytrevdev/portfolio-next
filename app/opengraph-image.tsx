import { ImageResponse } from 'next/og';

// Rendered to a static PNG at build time (social platforms don't render SVG previews).
export const dynamic = 'force-static';
export const alt = 'Raymond Ting — Built, plot by plot. Senior Software Developer, Singapore.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PLOTS = ['#3f7fd8', '#d9773f', '#3d9a6a', '#8a5bd0', '#d8453a'];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 80px',
          background: 'linear-gradient(#e8ecf0, #f4f1ec)',
          color: '#1d1c1a',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 620,
            padding: '44px 48px',
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 30px 60px -28px rgba(25,25,40,.35)',
          }}
        >
          <div style={{ display: 'flex', width: 64, height: 6, background: '#3f7fd8', borderRadius: 3, marginBottom: 26 }} />
          <div style={{ display: 'flex', fontSize: 20, letterSpacing: 2, color: '#63605a', marginBottom: 18 }}>
            KUALA LUMPUR → SINGAPORE
          </div>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, letterSpacing: -2, lineHeight: 1 }}>Raymond Ting</div>
          <div style={{ display: 'flex', fontSize: 30, color: '#3f7fd8', marginTop: 16 }}>Senior Software Developer</div>
          <div style={{ display: 'flex', fontSize: 24, color: '#63605a', marginTop: 22 }}>Built, plot by plot.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 380 }}>
          {PLOTS.map((c, i) => (
            <div
              key={c}
              style={{
                display: 'flex',
                width: 58,
                height: 110 + i * 60,
                background: '#f6f4f0',
                borderRadius: 10,
                borderTop: `14px solid ${c}`,
                boxShadow: '0 20px 40px -20px rgba(25,25,40,.45)',
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
