import type { Metadata } from 'next';
import TingLand from '@/components/ting-land/TingLand';

const TITLE = 'Ting Family Land — Sitiawan, Perak · 1933 to today';
const DESC = 'Ninety-three years of one family plot in Sitiawan, Perak: banana & papaya, rubber, oil palm.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: '/roots' },
  openGraph: { type: 'website', locale: 'en_SG', url: '/roots', title: TITLE, description: DESC, siteName: 'Raymond Ting' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC },
};

export default function RootsPage() {
  return <TingLand textureBase="/roots/textures/" cityHref="/" />;
}
