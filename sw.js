const CACHE='gml-v99';
const ASSETS=['./','./index.html','./css/style.css','./js/data.js','./data/module-trig.js','./data/module-seq.js','./js/srs.js','./js/store.js','./js/input.js','./js/ai.js','./vendor/anime.umd.min.js','./vendor/three.min.js','./js/anim.js','./js/dotgrid.js','./js/galaxy.js','./js/egg-gallery.js','./js/lanyard.js','./lanyard.html','./js/portal.js','./js/portal-plan.js','./js/outfit.js','./js/globe.js','./js/earth3d.js','./data/videos-phy.js','./data/videos-bio.js','./data/videos.js','./data/cities.js','./js/merge.js','./js/sync-crypto.js','./js/sync.js','./js/app.js','./assets/ink-hero.jpg','./assets/map-paper.jpg','./manifest.webmanifest','./icon.svg'];
for (let i = 1; i <= 16; i++) { const n = String(i).padStart(2, '0'); ASSETS.push('./assets/egg/photo-' + n + '.jpg', './assets/egg/photo-' + n + '-thumb.jpg'); }
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












