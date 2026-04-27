import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://raymondting.dev'),
  title: 'Raymond Ting — From Idea to Production',
  description:
    'Senior software developer in Singapore — shipping CMS-driven web platforms end-to-end across React/Next.js, .NET, Linux infrastructure, and CI/CD.',
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
    'Docker',
  ],
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'profile',
    locale: 'en_SG',
    title: 'Raymond Ting — From Idea to Production',
    description:
      'Senior software developer specialising in shipping production systems across frontend, backend, infrastructure, and deployment.',
    siteName: 'raymond.ting',
    images: [
      {
        url: '/og-card.svg',
        width: 1200,
        height: 630,
        alt: 'From Idea to Production — Raymond Ting, senior software developer.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Raymond Ting — From Idea to Production',
    description:
      'Senior software developer · ships systems end-to-end · React/Next.js · .NET · Linux · CI/CD.',
    images: ['/og-card.svg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1d22',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Ting Tze Jian',
  alternateName: 'Raymond Ting',
  jobTitle: 'Senior Software Developer',
  worksFor: { '@type': 'Organization', name: 'WhooshPro Pte Ltd' },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Yishun',
    addressCountry: 'SG',
  },
  email: 'mailto:raymondting521@gmail.com',
  telephone: '+65-9112-5475',
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
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
