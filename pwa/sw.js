const sw = async () => {
    if ("serviceWorker" in navigator) {
        try {
            const registration = await navigator.serviceWorker.register(
                "/js/sw.js",
                {
                    scope: "."
                }
            );

            if (registration.installing) {
                console.log("Service worker installing");
            } else if (registration.waiting) {
                console.log("Service worker installed");
            } else if (registration.active) {
                console.log("Service worker active");
            }
        } catch (error) {
            console.error(`Registration failed with ${error}`);
        }
    }
};

// Cache data for offline
const cacheResource = async (resources) => {
    const cache = await caches.open("v1");
    await cache.addAll(resources);
};

self.addEventListener("install", (event) => {
    event.waitUntil(
        cacheResource([
            "/",
            "/img/icon192.png",
            "/img/icon512.png",
            "/css/main.css",
            "/js/editor.js",
            "/js/nodes.json",
        ])
    );
});

// Get data for offline
self.addEventListener("fetch", event => {
    if (event.request.url === "https://127.0.0.1:5000") {
        // or whatever your app's URL is
        event.respondWith(
            fetch(event.request).catch(err =>
                self.cache.open(cache_name).then(cache => cache.match("/"))
            )
        );
    } else {
        event.respondWith(
            fetch(event.request).catch(err =>
                caches.match(event.request).then(response => response)
            )
        );
    }
});

// Initialize service worker
sw();