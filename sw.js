/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Service worker: offline support for the app shell.
 * - Install: precache core pages and static assets.
 * - Fetch: network-first for pages (fresh online, cached offline);
 *          cache-first with stale-while-revalidate for assets.
 * Bump CACHE when deploying changes.
 */
'use strict';

var CACHE = 'usl-v7';

var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/archive.htm',
  '/manifest.htm',
  '/history.htm',
  '/articles/views.htm',
  '/404.html',
  '/style.css',
  '/js/layout.js',
  '/js/app-nav.js',
  '/js/device-detection.js',
  '/js/article-widgets.js',
  '/js/archive-data.js',
  '/js/archive-init.js',
  '/js/config.js',
  '/js/supabase-client.js',
  '/js/votes.js',
  '/js/comments.js',
  '/js/bookmarks.js',
  '/js/reader.js',
  '/js/theme.js',
  '/js/search.js',
  '/js/engagement.js',
  '/js/consent.js',
  '/js/translate.js',
  '/site.webmanifest',
  '/robots.txt',
  '/feed.xml',
  '/sitemap.xml',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/pictures/logo-256.webp',
  '/pictures/logo-256.png',
  '/pictures/logo_w.png',
  '/pictures/maskable-icon-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE).then(function(cache) {
      // Cache each URL individually so one missing file can't fail the install.
      return Promise.all(PRECACHE_URLS.map(function(url) {
        return cache.add(url).catch(function() { return undefined; });
      }));
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url;
  try { url = new URL(request.url); } catch (e) { return; }
  if (url.origin !== location.origin) return;

  // Navigation requests: network-first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function(response) {
        var copy = response.clone();
        caches.open(CACHE).then(function(cache) { cache.put(request, copy); });
        return response;
      }).catch(function() {
        return caches.match(request).then(function(hit) {
          return hit || caches.match('/404.html');
        });
      })
    );
    return;
  }

  // Static assets: cache-first with stale-while-revalidate
  event.respondWith(
    caches.match(request).then(function(hit) {
      var refresh = fetch(request).then(function(response) {
        if (response.ok) {
          var copy = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(request, copy); });
        }
        return response;
      }).catch(function() { return undefined; });
      if (hit) return hit;
      return refresh.then(function(r) {
        return r || new Response('', { status: 404, statusText: 'Not Found' });
      });
    })
  );
});
