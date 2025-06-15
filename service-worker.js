'use strict';
const CACHE_NAME='static-cache-v1';
const FILES_TO_CACHE=["catBox.html","manifest.webmanifest","android-chrome-192x192.png","apple-touch-icon.png"];
self.addEventListener('install',(evt)=>{
console.log('SW: Install');evt.waitUntil(caches.open(CACHE_NAME).then((cache)=>{return cache.addAll(FILES_TO_CACHE).catch(E=>console.log("SW:",E))})
.catch(E=>console.log("SW:",E)));self.skipWaiting();});

self.addEventListener('activate',(evt)=>{console.log('SW: Activate');
evt.waitUntil(caches.keys().then((keyList)=>{return Promise.all(keyList.map((key)=>{
if(key!==CACHE_NAME){console.log('SW: Rem old cache',key);return caches.delete(key);}}))
.catch(E=>{console.log("SW:",E)});}).catch(E=>{console.log("SW:",E)}));self.clients.claim();});

self.addEventListener('fetch',(evt)=>{let nav=(evt.request.mode!=='navigate');
evt.respondWith(fetch(evt.request).catch(()=>{let x=evt.request.url.split("localhost:88/");return caches.open(CACHE_NAME)
.then((cache)=>{return cache.match(nav?x[1]:'catBox.html')}).catch(E=>console.log("SW:",E));}));});