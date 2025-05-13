const CACHE_DYNAMIC = 'dynamic-v1';
const CACHE_IMMUTABLE = 'immutable-v1';

// Opcional: pre-cache de la shell mínima
const PRECACHE_URLS = [
    '/', // home
    '/index.html'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_DYNAMIC).then(cache => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    const allowedCaches = [CACHE_DYNAMIC, CACHE_IMMUTABLE];
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => !allowedCaches.includes(k)).map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// Determina si la petición es de un recurso inmutable
function isImmutable(url) {
    return false
    return url.pathname.startsWith('/media/') || (!url.origin.includes('47herri') && !url.origin.includes('localhost'))
    //url.pathname.match(/\.[a-f0-9]{8}\.(js|css)$/); // hashed files tipo main.89abc123.js
}

self.addEventListener('fetch', event => {
    const req = event.request;
    const url = new URL(req.url);

    // Solo GET, ignoramos POST, etc.
    if (req.method !== 'GET') return;

    if (isImmutable(url)) {
        // Estrategia Cache-First
        event.respondWith(
            caches.open(CACHE_IMMUTABLE).then(cache =>
                cache.match(req).then(cached =>
                    cached || fetch(req).then(res => {
                        if (res.ok) cache.put(req, res.clone());
                        return res;
                    })
                )
            )
        );
    } else {
        // Estrategia Stale-While-Revalidate
        event.respondWith(
            caches.open(CACHE_DYNAMIC).then(cache =>
                cache.match(req).then(cached => {
                    const fetchPromise = fetch(req).then(res => {
                        if (res.ok) cache.put(req, res.clone());
                        return res;
                    }).catch(() => cached); // Si red falla y no hay cache, se queda en undefined
                    return cached || fetchPromise;
                })
            )
        );
    }
});

/* beautify ignore:start */
self.addEventListener('push', event => {
    const data = event.data?.json() ?? {};
    event.waitUntil(
        self.registration.showNotification(data.title, data.options)
    );
});


self.addEventListener('notificationclick', event => {
    const url = event.notification.data?.url || '/';
    event.notification.close();
    event.waitUntil(clients.openWindow(url));
});