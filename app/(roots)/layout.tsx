import type { Metadata, Viewport } from 'next';
import Analytics, { AnalyticsNoScript } from '@/components/Analytics';
import Bridge from '@/components/Bridge';
import { tlFontVars } from '@/components/ting-land/fonts';

// Bare root layout for the family-land story. It owns the whole viewport and scrolls the window, so none of the
// city's global styles, nav or light page background may sit around it (separate route group = separate root layout).
export const metadata: Metadata = {
  metadataBase: new URL('https://www.rdevting.com'),
  icons: { icon: '/favicon.svg', apple: '/apple-icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#0d0c0a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={tlFontVars} style={{ background: '#0d0c0a' }}>
      <body style={{ margin: 0, background: '#0d0c0a' }}>
        <AnalyticsNoScript />
        {children}
        <Bridge />
        <Analytics />
      </body>
    </html>
  );
}
