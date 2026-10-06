(function () {
  'use strict';
  var root = document.getElementById('lanyardRoot');
  if (!root || !window.THREE) { fallback(); return; }
  var THREE = window.THREE;
  var renderer, scene, camera, card, strap, goldLine, anchor, curve, clock;
  var frontImg = null, backImg = null, lanCard = null;
  var dragging = false, moved = 0, lastX = 0, lastY = 0, lastStrap = 0, lastTime = 0;
  var vx = 0, vy = 0;
  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  var hitPoint = new THREE.Vector3();
  var dragOffset = new THREE.Vector3();
  var cardSize = { w: 2.02, h: 2.82, d: 0.12 };

  function fallback() {
    root.innerHTML = '<button class="lan-fallback" type="button"><b>我们的云空间</b><span>点击进入相册</span></button>';
    root.firstChild.addEventListener('click', postOpen);
  }
  function postOpen() { try { window.parent.postMessage({ type: 'egg-lanyard-open' }, '*'); } catch (e) {} }

  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawCover(ctx, img, x, y, w, h) {
    if (!img) return;
    var s = Math.max(w / img.width, h / img.height);
    var dw = img.width * s, dh = img.height * s;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }
  function makeFace(kind, img) {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 1420;
    var ctx = c.getContext('2d');
    var bg = ctx.createLinearGradient(0, 0, c.width, c.height);
    bg.addColorStop(0, kind === 'front' ? '#162c49' : '#0d1a2d'); bg.addColorStop(1, '#07101d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
    if (kind === 'front' && img) {
      ctx.save(); roundRect(ctx, 54, 54, 916, 1010, 34); ctx.clip(); drawCover(ctx, img, 54, 54, 916, 1010); ctx.restore();
      var shade = ctx.createLinearGradient(0, 54, 0, 1064); shade.addColorStop(0, 'rgba(7,16,29,.04)'); shade.addColorStop(.62, 'rgba(7,16,29,.12)'); shade.addColorStop(1, 'rgba(7,16,29,.92)'); ctx.fillStyle = shade; ctx.fillRect(54, 54, 916, 1010);
    } else if (kind === 'back' && img) {
      ctx.save(); ctx.globalAlpha = .18; drawCover(ctx, img, 0, 0, c.width, c.height); ctx.restore();
      ctx.fillStyle = 'rgba(8,17,31,.62)'; ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.strokeStyle = '#c9a96a'; ctx.lineWidth = 4; roundRect(ctx, 38, 38, 948, 1344, 32); ctx.stroke();
    ctx.strokeStyle = 'rgba(201,169,106,.42)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(150, 1010); ctx.lineTo(874, 1010); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f7f2e8';
    if (kind === 'front') {
      ctx.font = '500 54px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText('我们的云空间', 512, 1110);
      ctx.font = '400 28px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillStyle = 'rgba(231,240,249,.72)'; ctx.fillText('宝宝发现彩蛋了', 512, 1170);
      ctx.font = '400 21px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillStyle = 'rgba(201,169,106,.86)'; ctx.fillText('点击卡片进入相册', 512, 1240);
      ctx.font = '400 18px -apple-system,BlinkMacSystemFont,sans-serif';
      ctx.fillStyle = 'rgba(231,240,249,.42)'; ctx.fillText('OUR CLOUD SPACE', 512, 1300);
    } else {
      ctx.font = '500 60px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText('宝宝，快进我怀里来', 512, 550);
      ctx.font = '400 32px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillStyle = 'rgba(231,240,249,.72)'; ctx.fillText('我们奔现啦', 512, 640);
      ctx.font = '400 20px -apple-system,BlinkMacSystemFont,sans-serif';
      ctx.fillStyle = 'rgba(201,169,106,.82)'; ctx.fillText('PRIVATE COLLECTION', 512, 1230);
    }
    var tex = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace && 'colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8; tex.needsUpdate = true; return tex;
  }
  function makeCard(front, back) {
    var side = new THREE.MeshStandardMaterial({ color: 0x0a1425, metalness: .62, roughness: .36 });
    var base = new THREE.Mesh(new THREE.BoxGeometry(cardSize.w, cardSize.h, cardSize.d), side);
    var fm = new THREE.MeshBasicMaterial({ map: front, toneMapped: false });
    var bm = new THREE.MeshBasicMaterial({ map: back, toneMapped: false });
    var frontPlane = new THREE.Mesh(new THREE.PlaneGeometry(cardSize.w, cardSize.h), fm);
    frontPlane.position.z = cardSize.d / 2 + .002;
    var backPlane = new THREE.Mesh(new THREE.PlaneGeometry(cardSize.w, cardSize.h), bm);
    backPlane.position.z = -cardSize.d / 2 - .002; backPlane.rotation.y = Math.PI;
    var g = new THREE.Group(); g.add(base, frontPlane, backPlane);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(.17, .024, 12, 30), new THREE.MeshStandardMaterial({ color: 0xc9a96a, metalness: .92, roughness: .22 }));
    ring.position.set(0, 1.52, .08); g.add(ring);
    var clip = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .24, 16), new THREE.MeshStandardMaterial({ color: 0xd6c197, metalness: .94, roughness: .2 }));
    clip.position.set(0, 1.72, .02); g.add(clip);
    return g;
  }
  function updateStrap() {
    var end = new THREE.Vector3(card.position.x, card.position.y + 1.46, .03);
    var p1 = new THREE.Vector3(anchor.x + (end.x - anchor.x) * .16, anchor.y + (end.y - anchor.y) * .34, 0);
    var p2 = new THREE.Vector3(end.x * .34, anchor.y + (end.y - anchor.y) * .68, .02);
    curve = new THREE.CatmullRomCurve3([anchor, p1, p2, end], false, 'chordal');
    var pts = curve.getPoints(26);
    if (strap) { strap.geometry.dispose(); strap.geometry = new THREE.TubeGeometry(curve, 30, .034, 8, false); }
    if (goldLine) { goldLine.geometry.dispose(); goldLine.geometry = new THREE.BufferGeometry().setFromPoints(pts); }
  }
  function setPointer(e) {
    var r = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }
  function hitCard(e) { setPointer(e); raycaster.setFromCamera(pointer, camera); return raycaster.intersectObject(card, true).length > 0; }
  function pointerWorld(e) { setPointer(e); raycaster.setFromCamera(pointer, camera); return raycaster.ray.intersectPlane(plane, hitPoint) ? hitPoint.clone() : null; }
  function onDown(e) {
    if (!lanCard) return;
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
    if (lanCard.setPointerCapture) lanCard.setPointerCapture(e.pointerId);
    if (e.cancelable) e.preventDefault();
  }
  function onMove(e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    card.position.x = THREE.MathUtils.clamp(card.position.x + dx / 82, -1.25, 1.25);
    card.position.y = THREE.MathUtils.clamp(card.position.y - dy / 82, -1.25, .55);
    vx = dx * 2.6; vy = -dy * 2.6;
  }
  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    if (lanCard.releasePointerCapture) { try { lanCard.releasePointerCapture(e.pointerId); } catch (err) {} }
    if (moved < 12) postOpen();
  }
  function resize() {
    var w = window.innerWidth, h = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 1.55);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  function loop(t) {
    var dt = Math.min((t - lastTime) / 1000 || 0, .04); lastTime = t;
    if (!dragging) {
      var tx = Math.sin(t * .00072) * .055, ty = -.12 + Math.sin(t * .00105) * .035;
      vx += (tx - card.position.x) * 18 * dt; vy += (ty - card.position.y) * 18 * dt;
      vx *= Math.pow(.035, dt); vy *= Math.pow(.035, dt);
      card.position.x += vx * dt; card.position.y += vy * dt;
    }
    card.rotation.z = -card.position.x * .16; card.rotation.y = card.position.x * .42 + Math.sin(t * .00068) * .06; card.rotation.x = -card.position.y * .05;
    if (lanCard) { lanCard.style.setProperty('--x', (card.position.x * 86).toFixed(2) + 'px'); lanCard.style.setProperty('--y', (-card.position.y * 86).toFixed(2) + 'px'); lanCard.style.setProperty('--rz', (-card.rotation.z * 70).toFixed(2) + 'deg'); lanCard.style.setProperty('--ry', (card.rotation.y * 70).toFixed(2) + 'deg'); }
    if (t - lastStrap > 32) { lastStrap = t; updateStrap(); }
    renderer.render(scene, camera); requestAnimationFrame(loop);
  }
  function start() {
    scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, .1, 100); camera.position.set(0, 0, 8.6);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); renderer.setClearColor(0x08111f, 0); if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace; root.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, .8)); var d = new THREE.DirectionalLight(0xfff2d8, 2.1); d.position.set(-3, 5, 5); scene.add(d); var p = new THREE.PointLight(0x7ec9e0, 1.6, 20); p.position.set(3, -1, 4); scene.add(p);
    card = new THREE.Group(); card.position.set(0, -.12, 0); scene.add(card);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(.17, .024, 12, 30), new THREE.MeshStandardMaterial({ color: 0xc9a96a, metalness: .92, roughness: .22 })); ring.position.set(0, 1.52, .08); card.add(ring);
    var clip = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .24, 16), new THREE.MeshStandardMaterial({ color: 0xd6c197, metalness: .94, roughness: .2 })); clip.position.set(0, 1.72, .02); card.add(clip);
    anchor = new THREE.Vector3(0, 3.0, 0); strap = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0x0a1729, metalness: .18, roughness: .68 })); scene.add(strap); goldLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xc9a96a, transparent: true, opacity: .95 })); scene.add(goldLine); updateStrap();
    lanCard.addEventListener('pointerdown', onDown); lanCard.addEventListener('pointermove', onMove); lanCard.addEventListener('pointerup', onUp); lanCard.addEventListener('pointercancel', onUp); window.addEventListener('resize', resize); resize(); requestAnimationFrame(loop);
  }
  lanCard = document.getElementById('lanCard');
  if (!lanCard) fallback(); else start();
})();



