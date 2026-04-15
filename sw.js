// Service Worker para Calc-Inversiones PWA
// Maneja caché y actualizaciones automáticas

const CACHE_NAME = 'calc-inversiones-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/js/globals.js',
    '/js/auth.js',
    '/js/ui.js',
    '/js/inventory.js',
    '/js/shopping.js',
    '/js/sales.js',
    '/js/receipt.js',
    '/js/reports.js',
    '/js/expenses.js',
    '/js/modals.js',
    '/js/init.js',
    '/js/charts.js',
    '/js/chart.min.js'
];

// Instalación - Cachear archivos estáticos
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Cacheando archivos estáticos');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Instalación completada');
                return self.skipWaiting();
            })
            .catch((err) => {
                console.error('[SW] Error al cachear:', err);
            })
    );
});

// Activación - Limpiar cachés viejas y tomar control
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando Service Worker...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Eliminando caché vieja:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Activación completada');
                return self.clients.claim();
            })
    );
});

// Fetch - Estrategia: Network First, fallback a Cache
// Compatible con iOS Safari (que puede perder caché tras inactividad)
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Solo manejar GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Ignorar requests de extensiones del navegador
    const url = new URL(request.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return;
    }
    
    // Para archivos de la app (mismo origen)
    if (url.origin === self.location.origin) {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    // Si hay respuesta de red válida, actualizar caché
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Si falla red, usar caché
                    console.log('[SW] Usando caché para:', request.url);
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Fallback: si es una navegación, mostrar página offline
                        if (request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        return new Response('Offline', { status: 503, statusText: 'Offline' });
                    });
                })
        );
    }
    // Para recursos externos, cachear al primer fetch exitoso
    else {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, responseToCache);
                            });
                        }
                        return networkResponse;
                    });
                })
        );
    }
});

// Escuchar mensajes desde la app principal
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        console.log('[SW] Saltando espera por solicitud del cliente');
        self.skipWaiting();
    }
});
