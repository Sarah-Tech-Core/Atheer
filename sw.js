// ============================================================
//  Service Worker - أثير
// ============================================================

const CACHE_NAME = 'atheer-v1.2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './offline.html',
    './quran-uthmani.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] تم فتح الكاش');
                return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                    console.warn('[SW] فشل تحميل بعض الملفات:', err);
                });
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] حذف الكاش القديم:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    
    if (requestUrl.pathname.endsWith('.mp3')) {
        event.respondWith(fetch(event.request).catch(() => {
            return new Response('', { status: 404 });
        }));
        return;
    }

    if (requestUrl.hostname === 'cdnjs.cloudflare.com' || 
        requestUrl.hostname === 'fonts.googleapis.com' ||
        requestUrl.hostname === 'fonts.gstatic.com' ||
        requestUrl.hostname === 'api.alquran.cloud') {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then(response => {
                        if (response && response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        if (event.request.headers.get('accept')?.includes('text/html')) {
                            return caches.match('./offline.html');
                        }
                        return new Response('', { status: 404 });
                    });
            })
    );
});
