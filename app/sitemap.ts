import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://www.rdevting.com/', changeFrequency: 'monthly', priority: 1 },
    { url: 'https://www.rdevting.com/roots', changeFrequency: 'yearly', priority: 0.6 },
  ];
}
