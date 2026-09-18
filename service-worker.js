// Football Tactics — Service Worker
const CACHE_NAME = 'ft-cache-v1';
const URLS_TO_CACHE = [
    '/football-tactics/',
    '/football-tactics/index.html',
    '/football-tactics/coaches.html',
    '/football-tactics/tactic.html',
    '/football-tactics/ai-coach.html',
    '/football-tactics/contact.html',
    '/football-tactics/style.css',
    '/football-tactics/app.js',
    '/football-tactics/data.js',
    '/football-tactics/tactic.js',
    '/football-tactics/js/sounds.js'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(URLS_TO_CACHE).catch(function(e) {
                console.log('Cache addAll failed:', e);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(name) {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function(event) {
    // ما نخزّن طلبات API (Worker / Groq / Gemini)
    var url = event.request.url;
    if (url.indexOf('/api/') !== -1 ||
        url.indexOf('workers.dev') !== -1 ||
        url.indexOf('api.groq.com') !== -1 ||
        url.indexOf('generativelanguage.googleapis.com') !== -1) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) return response;
            return fetch(event.request).catch(function() {
                if (event.request.mode === 'navigate') {
                    return caches.match('/football-tactics/index.html');
                }
            });
        })
    );
});
