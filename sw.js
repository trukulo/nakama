const CACHE='nakama-v1';
const URLS=['index.html','nakama.pdf','assets/css/nakama.css','assets/js/nucleo.js','assets/js/datos.js','assets/js/app.js','assets/favicon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
