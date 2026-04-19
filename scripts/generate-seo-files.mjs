import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.resolve(__dirname, '../public')

const vercelUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : ''

const inferredBaseUrl =
  process.env.VITE_SITE_URL ||
  process.env.SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  vercelUrl ||
  'https://example.com'

const baseUrl = inferredBaseUrl.replace(/\/+$/, '')
const today = new Date().toISOString().split('T')[0]

const indexableRoutes = [
  {
    path: '/',
    changefreq: 'daily',
    priority: '1.0',
  },
]

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexableRoutes
  .map(
    ({ path: routePath, changefreq, priority }) => `  <url>
    <loc>${baseUrl}${routePath}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

const robotsTxt = `User-agent: *
Allow: /

Disallow: /admin/
Disallow: /login
Disallow: /signup
Disallow: /profile
Disallow: /edit-profile
Disallow: /safe-route

Sitemap: ${baseUrl}/sitemap.xml
`

mkdirSync(publicDir, { recursive: true })
writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8')
writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf8')

if (!process.env.VITE_SITE_URL && !process.env.SITE_URL && !process.env.URL && !process.env.DEPLOY_PRIME_URL && !process.env.VERCEL_URL) {
  console.warn('[seo] No deployment URL env var found. Using https://example.com for sitemap and robots. Set VITE_SITE_URL in production.')
}

console.log(`[seo] Generated robots.txt and sitemap.xml for ${baseUrl}`)
