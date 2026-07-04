/* Service worker for game.fechtin.com (Thuyết Khách Hành PWA).
 * - Never touches /api/* so SSE streaming passes straight to the network.
 * - Navigations: network-first with an offline fallback to the cached shell,
 *   so a fresh deploy is picked up immediately when online.
 * - Static assets: stale-while-revalidate for instant repeat loads.
 * Bump VERSION to invalidate old caches on the next activate.
 */
const VERSION = 'tkh-v4'
const CACHE = `tkh-${VERSION}`
const SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon-32.png',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Let API calls (and especially SSE) go straight to the network, untouched.
  if (url.pathname.startsWith('/api/')) return

  // SPA navigations: try the network, fall back to the cached shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/', copy))
          return res
        })
        .catch(() => caches.match('/').then((r) => r || caches.match(request))),
    )
    return
  }

  // Same-origin static assets + cached cross-origin (fonts): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && (url.origin === self.location.origin || res.type === 'basic' || res.type === 'cors')) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
