const CACHE_STATIC = 'dynamic-v1';

const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/baliabideak.html'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_STATIC).then(cache => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_STATIC).map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const { request } = event;
    let strategy = request.headers.get('x-cache-strategy') || 'stale-while-revalidate';
    if (request.url.includes('.json') && !request.url.includes('/bible')) strategy = 'network-first'
    //return url.pathname.startsWith('/media/') || (!url.origin.includes('47herri') && !url.origin.includes('localhost'))

    let responsePromise;

    if (strategy === 'network-first') {
        responsePromise = networkFirst(request);
    } else if (strategy === 'cache-first') {
        responsePromise = cacheFirst(request);
    } else if (strategy === 'cache-only') {
        responsePromise = cacheOnly(request);
    } else {
        responsePromise = staleWhileRevalidate(request);
    }

    event.respondWith(responsePromise);
});

// --- Estrategias ---

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_STATIC);
        cache.put(request, response.clone());
        return response;
    } catch {
        return (await caches.match(request)) || Response.error();
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    const cache = await caches.open(CACHE_STATIC);
    cache.put(request, response.clone());
    return response;
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_STATIC);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then(response => {
        cache.put(request, response.clone());
        return response;
    });

    return cached || fetchPromise;
}

async function cacheOnly(request) {
    const cached = await caches.match(request);
    return cached || Response.error();
}




/* beautify ignore:start */
/* NOTIFICATIONS */
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