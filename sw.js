const CACHE='gml-v56';
const ASSETS=['./','./index.html','./css/style.css','./js/data.js','./data/module-trig.js','./data/module-seq.js','./js/srs.js','./js/store.js','./js/input.js','./js/ai.js','./vendor/anime.umd.min.js','./js/anim.js','./js/dotgrid.js','./js/galaxy.js','./js/portal.js','./js/globe.js','./js/earth3d.js','./data/videos.js','./data/cities.js','./js/app.js','./assets/ink-hero.jpg','./assets/map-paper.jpg','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  var u; try{u=new URL(e.request.url)}catch(err){return}
  if(u.origin!==self.location.origin)return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      var net=fetch(e.request).then(function(res){
        if(res&&res.status===200){var cp=res.clone();caches.open(CACHE).then(function(c){c.put(e.request,cp)})}
        return res;
      }).catch(function(){return hit||caches.match('./index.html')});
      return hit||net;
    })
  );
});
