import type { MetadataRoute } from 'next'

const BASE = 'https://astranova.uz'
const LOCALES = ['en', 'ru', 'uz']
const ROUTES = ['', '/solar-system', '/missions', '/scale']

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      entries.push({
        url: `${BASE}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: route === '' ? 1.0 : 0.8,
      })
    }
  }

  return entries
}
