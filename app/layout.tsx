import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, DM_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const disp = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-disp',
  display: 'swap',
});
const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const SITE = 'https://www.rdevting.com';
const DESC =
  'Senior software developer in Singapore — a scroll-built 3D clay city of a career shipping CMS-driven web platforms end-to-end across React/Next.js, .NET, Linux infrastructure, and CI/CD.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Raymond Ting — Built, plot by plot',
  description: DESC,
  alternates: { canonical: '/' },
  authors: [{ name: 'Ting Tze Jian (Raymond)' }],
  keywords: [
    'senior software developer',
    'full-stack',
    'Next.js',
    '.NET',
    'headless CMS',
    'Directus',
    'Sitefinity',
    'Singapore',
    'Azure',
    'AWS',
    'CI/CD',
    'three.js',
  ],
  icons: { icon: '/favicon.svg', apple: '/apple-icon.png' },
  openGraph: {
    type: 'profile',
    locale: 'en_SG',
    url: '/',
    title: 'Raymond Ting — Built, plot by plot',
    description: 'A career built as a miniature 3D city, from Kuala Lumpur to Singapore.',
    siteName: 'Raymond Ting',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Raymond Ting — Built, plot by plot',
    description: 'Senior software developer · ships systems end-to-end · React/Next.js · .NET · Linux · CI/CD.',
  },
};

export const viewport: Viewport = {
  themeColor: '#ece9e3',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Ting Tze Jian',
  alternateName: 'Raymond Ting',
  jobTitle: 'Senior Software Developer',
  url: SITE,
  worksFor: { '@type': 'Organization', name: 'WhooshPro Pte Ltd' },
  address: { '@type': 'PostalAddress', addressCountry: 'SG' },
  email: 'mailto:raymondting521@gmail.com',
  knowsAbout: [
    'Full-stack development',
    'React',
    'Next.js',
    '.NET',
    'Entity Framework',
    'Headless CMS',
    'Docker',
    'CI/CD',
    'Linux infrastructure',
    'Azure',
    'AWS',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${disp.variable} ${mono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
        />
      </head>
      <body>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-JJ5YG883HM"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-JJ5YG883HM');
          `}
        </Script>
      </body>
    </html>
  );
}
