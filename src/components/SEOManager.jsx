import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_NAME = 'SafeStree'
const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : ''
const BASE_URL = (import.meta.env.VITE_SITE_URL || runtimeOrigin || 'https://example.com').replace(/\/+$/, '')
const DEFAULT_IMAGE = `${BASE_URL}/og-image.svg`

const DEFAULT_META = {
  title: 'SafeStree | Women Safety Platform',
  description:
    'SafeStree is a women-focused safety platform with one-tap SOS alerts, live emergency visibility, and safer route support.',
  keywords:
    'women safety, sos alert app, emergency response, personal safety app, safer route guidance',
  noindex: false,
}

const SEO_RULES = [
  {
    match: (pathname) => pathname === '/',
    title: 'SafeStree | Women Safety Platform',
    description:
      'Stay safer with one-tap SOS alerts, live emergency visibility, and preparedness tools built for women.',
    keywords: 'women safety platform, emergency sos alert, live safety monitoring',
    noindex: false,
  },
  {
    match: (pathname) => pathname === '/login',
    title: 'User Login | SafeStree',
    description: 'Log in to access your SafeStree dashboard and emergency tools.',
    keywords: 'user login, safestree account access',
    noindex: true,
  },
  {
    match: (pathname) => pathname === '/signup',
    title: 'User Signup | SafeStree',
    description: 'Create your SafeStree account to set up SOS and profile safety details.',
    keywords: 'user signup, safety account registration',
    noindex: true,
  },
  {
    match: (pathname) => pathname === '/profile',
    title: 'Profile | SafeStree',
    description: 'Manage emergency profile details and trusted contacts for fast SOS support.',
    keywords: 'emergency profile, trusted contacts, safety details',
    noindex: true,
  },
  {
    match: (pathname) => pathname === '/edit-profile',
    title: 'Edit Profile | SafeStree',
    description: 'Update medical and emergency details to improve SOS response quality.',
    keywords: 'edit safety profile, medical details, emergency contact update',
    noindex: true,
  },
  {
    match: (pathname) => pathname === '/safe-route',
    title: 'Safer Route Planner | SafeStree',
    description: 'Compare route options and choose safer pathways before travel.',
    keywords: 'safe route planner, safer travel navigation',
    noindex: true,
  },
  {
    match: (pathname) => pathname === '/admin/login',
    title: 'Admin Login | SafeStree',
    description: 'Secure login for authorized emergency response officers.',
    keywords: 'admin login, emergency response dashboard login',
    noindex: true,
  },
  {
    match: (pathname) => pathname === '/admin/signup',
    title: 'Admin Signup | SafeStree',
    description: 'Create an authorized SafeStree admin account.',
    keywords: 'admin signup, response officer registration',
    noindex: true,
  },
  {
    match: (pathname) => pathname.startsWith('/admin/live/'),
    title: 'Live Incident Monitor | SafeStree Admin',
    description: 'Live incident stream for authorized emergency response handling.',
    keywords: 'live emergency monitoring, incident response stream',
    noindex: true,
  },
  {
    match: (pathname) => pathname.startsWith('/admin'),
    title: 'Emergency Dashboard | SafeStree Admin',
    description: 'Operational response dashboard for active safety alerts and coordination.',
    keywords: 'emergency dashboard, alert response management',
    noindex: true,
  },
]

const normalizePathname = (pathname) => {
  if (!pathname) {
    return '/'
  }

  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

const resolveMeta = (pathname) => {
  const rule = SEO_RULES.find((entry) => entry.match(pathname))

  if (!rule) {
    return {
      ...DEFAULT_META,
      noindex: true,
      title: 'Page Not Found | SafeStree',
      description: 'This page could not be found on SafeStree.',
      keywords: 'safestree not found, page not found',
    }
  }

  return {
    ...DEFAULT_META,
    ...rule,
  }
}

const buildStructuredData = ({ canonicalUrl, title, description }) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: SITE_NAME,
      description: DEFAULT_META.description,
      inLanguage: 'en',
    },
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      url: BASE_URL,
      name: SITE_NAME,
    },
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: title,
      description,
      isPartOf: {
        '@id': `${BASE_URL}/#website`,
      },
    },
  ],
})

const upsertMeta = ({ selector, attributes, content }) => {
  let metaTag = document.head.querySelector(selector)

  if (!metaTag) {
    metaTag = document.createElement('meta')
    document.head.appendChild(metaTag)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    metaTag.setAttribute(key, value)
  })

  metaTag.setAttribute('content', content)
}

const upsertCanonicalLink = (href) => {
  let canonicalTag = document.head.querySelector('link[rel="canonical"]')

  if (!canonicalTag) {
    canonicalTag = document.createElement('link')
    canonicalTag.setAttribute('rel', 'canonical')
    document.head.appendChild(canonicalTag)
  }

  canonicalTag.setAttribute('href', href)
}

const upsertStructuredData = (payload) => {
  let scriptTag = document.head.querySelector('script[data-seo="structured-data"]')

  if (!scriptTag) {
    scriptTag = document.createElement('script')
    scriptTag.setAttribute('type', 'application/ld+json')
    scriptTag.setAttribute('data-seo', 'structured-data')
    document.head.appendChild(scriptTag)
  }

  scriptTag.textContent = JSON.stringify(payload)
}

const SEOManager = () => {
  const { pathname } = useLocation()
  const normalizedPathname = normalizePathname(pathname)
  const meta = resolveMeta(normalizedPathname)
  const canonicalUrl = `${BASE_URL}${normalizedPathname}`
  const robots = meta.noindex
    ? 'noindex,nofollow,max-image-preview:none'
    : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'

  useEffect(() => {
    const structuredData = buildStructuredData({
      canonicalUrl,
      title: meta.title,
      description: meta.description,
    })

    document.title = meta.title

    upsertMeta({
      selector: 'meta[name="description"]',
      attributes: { name: 'description' },
      content: meta.description,
    })

    upsertMeta({
      selector: 'meta[name="keywords"]',
      attributes: { name: 'keywords' },
      content: meta.keywords,
    })

    upsertMeta({
      selector: 'meta[name="robots"]',
      attributes: { name: 'robots' },
      content: robots,
    })

    upsertMeta({
      selector: 'meta[name="googlebot"]',
      attributes: { name: 'googlebot' },
      content: robots,
    })

    upsertMeta({
      selector: 'meta[name="theme-color"]',
      attributes: { name: 'theme-color' },
      content: '#10243f',
    })

    upsertMeta({
      selector: 'meta[property="og:type"]',
      attributes: { property: 'og:type' },
      content: 'website',
    })

    upsertMeta({
      selector: 'meta[property="og:site_name"]',
      attributes: { property: 'og:site_name' },
      content: SITE_NAME,
    })

    upsertMeta({
      selector: 'meta[property="og:title"]',
      attributes: { property: 'og:title' },
      content: meta.title,
    })

    upsertMeta({
      selector: 'meta[property="og:description"]',
      attributes: { property: 'og:description' },
      content: meta.description,
    })

    upsertMeta({
      selector: 'meta[property="og:url"]',
      attributes: { property: 'og:url' },
      content: canonicalUrl,
    })

    upsertMeta({
      selector: 'meta[property="og:image"]',
      attributes: { property: 'og:image' },
      content: DEFAULT_IMAGE,
    })

    upsertMeta({
      selector: 'meta[property="og:image:alt"]',
      attributes: { property: 'og:image:alt' },
      content: 'SafeStree women safety platform',
    })

    upsertMeta({
      selector: 'meta[name="twitter:card"]',
      attributes: { name: 'twitter:card' },
      content: 'summary_large_image',
    })

    upsertMeta({
      selector: 'meta[name="twitter:title"]',
      attributes: { name: 'twitter:title' },
      content: meta.title,
    })

    upsertMeta({
      selector: 'meta[name="twitter:description"]',
      attributes: { name: 'twitter:description' },
      content: meta.description,
    })

    upsertMeta({
      selector: 'meta[name="twitter:image"]',
      attributes: { name: 'twitter:image' },
      content: DEFAULT_IMAGE,
    })

    upsertCanonicalLink(canonicalUrl)
    upsertStructuredData(structuredData)
  }, [canonicalUrl, meta.description, meta.keywords, meta.title, robots])

  return null
}

export default SEOManager
