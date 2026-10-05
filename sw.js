const CACHE='gml-v19';
const ASSETS=['./','./index.html','./css/style.css','./js/data.js','./js/srs.js','./js/store.js','./js/input.js','./js/ai.js','./js/portal.js','./js/globe.js','./data/videos.js','./data/cities.js','./js/app.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(
    fetch(e.request).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return res})
      .catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
  );
});
