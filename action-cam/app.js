(function () {
  'use strict';

  var canvas = document.getElementById('scene');
  var lab = document.getElementById('lab');
  var partsList = document.getElementById('parts-list');
  var partsPanel = document.querySelector('.parts-panel');
  var detailsPanel = document.querySelector('.details-panel');
  var labelsLayer = document.getElementById('labels');
  var titleEl = document.getElementById('part-title');
  var enEl = document.getElementById('part-en');
  var noteEl = document.getElementById('part-note');
  var specsEl = document.getElementById('part-specs');
  var indexEl = document.getElementById('part-index');
  var explodeButton = document.getElementById('explode-all');
  var resetButton = document.getElementById('reset-view');
  var focusButton = document.getElementById('focus-part');
  var loadVideoButton = document.getElementById('load-video');
  var toggleVideoButton = document.getElementById('toggle-video');
  var enlargeButton = document.getElementById('enlarge-screen');
  var videoInput = document.getElementById('video-file');
  var screenExpand = document.getElementById('screen-expand');
  var closeScreenButton = document.getElementById('close-screen');
  var expandedVideo = document.getElementById('expanded-video');
  var toastEl = document.getElementById('toast');
  var loader = document.getElementById('loader');

  if (!window.THREE || !canvas) {
    if (loader) loader.querySelector('span').textContent = '当前浏览器无法启动 Three.js';
    return;
  }

  var reduced = false;
  try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (error) {}

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.72;
  if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
  if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xdde2e5, 0.025);
  var camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 80);

  var view = { yaw: 0.42, pitch: 0.2, radius: 9.2, target: new THREE.Vector3(0, 0.05, 0) };
  var targetView = { yaw: view.yaw, pitch: view.pitch, radius: view.radius };

  function updateCamera() {
    var cp = Math.cos(view.pitch);
    camera.position.set(
      view.target.x + Math.sin(view.yaw) * cp * view.radius,
      view.target.y + Math.sin(view.pitch) * view.radius,
      view.target.z + Math.cos(view.yaw) * cp * view.radius
    );
    camera.lookAt(view.target);
  }
  updateCamera();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xaeb8bd, 0.92));
  var keyLight = new THREE.DirectionalLight(0xffffff, 2.15);
  keyLight.position.set(4, 7, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);
  var cyanLight = new THREE.PointLight(0x7fc7de, 3.1, 18, 2);
  cyanLight.position.set(-5, 2.2, 3.2);
  scene.add(cyanLight);
  var warmLight = new THREE.PointLight(0xd29a6a, 1.8, 14, 2);
  warmLight.position.set(4.5, -2, 2.5);
  scene.add(warmLight);

  var world = new THREE.Group();
  scene.add(world);

  var floor = new THREE.Mesh(
    new THREE.CylinderGeometry(3.35, 3.55, 0.14, 96),
    new THREE.MeshPhysicalMaterial({
      color: 0xcbd1d4,
      metalness: 0.28,
      roughness: 0.44,
      transparent: true,
      opacity: 0.58
    })
  );
  floor.position.y = -1.82;
  floor.receiveShadow = true;
  scene.add(floor);

  var grid = new THREE.GridHelper(20, 40, 0x7b8d94, 0xb5c0c4);
  grid.position.y = -1.73;
  grid.material.transparent = true;
  grid.material.opacity = 0.24;
  scene.add(grid);

  [2.45, 2.72].forEach(function (radius, index) {
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(radius, radius + 0.012, 112),
      new THREE.MeshBasicMaterial({
        color: index ? 0x819198 : 0x9e6842,
        transparent: true,
        opacity: index ? 0.2 : 0.28,
        side: THREE.DoubleSide
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.68;
    scene.add(ring);
  });

  var particleGeometry = new THREE.BufferGeometry();
  var particlePositions = [];
  for (var p = 0; p < 260; p++) {
    particlePositions.push((Math.random() - 0.5) * 22, Math.random() * 10 - 2, (Math.random() - 0.5) * 18);
  }
  particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
  var particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0x6f858d,
      size: 0.022,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  scene.add(particles);

  function roundedShape(width, height, radius) {
    var shape = new THREE.Shape();
    var x = -width / 2;
    var y = -height / 2;
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    return shape;
  }

  function roundedBox(width, height, depth, radius, material) {
    var geometry = new THREE.ExtrudeGeometry(roundedShape(width, height, radius), {
      depth: depth,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.035,
      bevelThickness: 0.035,
      curveSegments: 14
    });
    geometry.center();
    return new THREE.Mesh(geometry, material);
  }

  function roundedPlane(width, height, radius, material) {
    return new THREE.Mesh(new THREE.ShapeGeometry(roundedShape(width, height, radius), 14), material);
  }

  function cylinder(radius, depth, material, segments) {
    var mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, segments || 64), material);
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  var materials = {
    shell: new THREE.MeshStandardMaterial({ color: 0x020405, metalness: 0.08, roughness: 0.82 }),
    face: new THREE.MeshStandardMaterial({ color: 0x030506, metalness: 0.36, roughness: 0.54 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x070909, metalness: 0.06, roughness: 0.9 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x4b575c, metalness: 0.9, roughness: 0.36 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: 0x151d21, metalness: 0.88, roughness: 0.42 }),
    red: new THREE.MeshStandardMaterial({ color: 0xa63f32, metalness: 0.32, roughness: 0.4, emissive: 0x2b0502, emissiveIntensity: 0.3 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x082638,
      metalness: 0.1,
      roughness: 0.1,
      transparent: true,
      opacity: 0.96,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      emissive: 0x03131c,
      emissiveIntensity: 0.35
    })
  };

  var displayCanvas = document.createElement('canvas');
  displayCanvas.width = 640;
  displayCanvas.height = 360;
  var displayCtx = displayCanvas.getContext('2d');
  var displayTexture = new THREE.CanvasTexture(displayCanvas);
  if ('colorSpace' in displayTexture && THREE.SRGBColorSpace) displayTexture.colorSpace = THREE.SRGBColorSpace;
  displayTexture.minFilter = THREE.LinearFilter;
  displayTexture.magFilter = THREE.LinearFilter;

  var screenMaterials = [
    new THREE.MeshBasicMaterial({ map: displayTexture, toneMapped: false }),
    new THREE.MeshBasicMaterial({ map: displayTexture, toneMapped: false })
  ];

  function paintIdleScreen(time) {
    var ctx = displayCtx;
    var w = displayCanvas.width;
    var h = displayCanvas.height;
    var g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#06131a');
    g.addColorStop(0.55, '#0a2028');
    g.addColorStop(1, '#15130e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(95,216,255,.18)';
    ctx.lineWidth = 1;
    for (var x = 40; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (var y = 30; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    var scan = (time * 0.12) % h;
    var scanGradient = ctx.createLinearGradient(0, scan - 34, 0, scan + 34);
    scanGradient.addColorStop(0, 'rgba(95,216,255,0)');
    scanGradient.addColorStop(0.5, 'rgba(95,216,255,.2)');
    scanGradient.addColorStop(1, 'rgba(95,216,255,0)');
    ctx.fillStyle = scanGradient;
    ctx.fillRect(0, scan - 34, w, 68);

    ctx.fillStyle = 'rgba(238,247,251,.9)';
    ctx.font = '600 23px Segoe UI, sans-serif';
    ctx.fillText('ACTION 4', 30, 44);
    ctx.fillStyle = 'rgba(95,216,255,.9)';
    ctx.font = '11px Cascadia Mono, Consolas, monospace';
    ctx.fillText('DISPLAY INPUT / STANDBY', 31, 66);

    ctx.strokeStyle = 'rgba(238,247,251,.72)';
    ctx.lineWidth = 1.4;
    var cx = w / 2;
    var cy = h / 2 + 20;
    ctx.beginPath();
    ctx.arc(cx, cy, 33, 0, Math.PI * 2);
    ctx.moveTo(cx - 46, cy); ctx.lineTo(cx + 46, cy);
    ctx.moveTo(cx, cy - 46); ctx.lineTo(cx, cy + 46);
    ctx.stroke();

    ctx.fillStyle = 'rgba(238,247,251,.56)';
    ctx.font = '10px Cascadia Mono, Consolas, monospace';
    ctx.fillText('1/1.3 CMOS', 31, h - 55);
    ctx.fillText('4K  120P', w - 97, h - 55);
    ctx.fillText('LOAD LOCAL VIDEO TO MOUNT', 31, h - 30);

    ctx.fillStyle = '#f0a665';
    ctx.beginPath();
    ctx.arc(w - 34, 36, 5, 0, Math.PI * 2);
    ctx.fill();
    displayTexture.needsUpdate = true;
  }
  paintIdleScreen(0);

  var model = new THREE.Group();
  world.add(model);

  var parts = [];
  var pickables = [];

  function part(id, name, en, note, specs, group, offset, labelSide) {
    group.userData.partId = id;
    var materialsForPart = [];
    group.traverse(function (object) {
      if (!object.isMesh) return;
      object.userData.partId = id;
      object.castShadow = true;
      object.receiveShadow = true;
      pickables.push(object);
      var list = Array.isArray(object.material) ? object.material : [object.material];
      list.forEach(function (mat) {
        if (mat && mat.emissive && materialsForPart.indexOf(mat) < 0) materialsForPart.push(mat);
      });
    });
    model.add(group);
    var record = {
      id: id,
      name: name,
      en: en,
      note: note,
      specs: specs,
      group: group,
      base: group.position.clone(),
      offset: new THREE.Vector3(offset[0], offset[1], offset[2]),
      materials: materialsForPart,
      glow: 0,
      side: labelSide,
      button: null,
      label: null
    };
    parts.push(record);
  }

  var shell = new THREE.Group();
  var shellMesh = roundedBox(4.05, 2.55, 1.02, 0.2, materials.shell);
  shell.add(shellMesh);
  var frontPlate = roundedPlane(3.74, 2.22, 0.16, materials.face);
  frontPlate.position.z = 0.525;
  shell.add(frontPlate);
  var backPlate = roundedPlane(3.74, 2.22, 0.16, new THREE.MeshStandardMaterial({ color: 0x06090b, metalness: 0.35, roughness: 0.5 }));
  backPlate.position.z = -0.525;
  backPlate.rotation.y = Math.PI;
  shell.add(backPlate);
  for (var vent = 0; vent < 8; vent++) {
    var ventMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.035, 0.03),
      materials.rubber
    );
    ventMesh.position.set(0.12 + vent * 0.14, -0.92, 0.548);
    shell.add(ventMesh);
  }
  var sideRail = roundedBox(0.12, 2.12, 0.82, 0.1, materials.rubber);
  sideRail.position.set(-2.02, 0, 0);
  shell.add(sideRail);
  part(
    'shell',
    '机身框架',
    'MAGNESIUM ALLOY FRAME',
    '承载双屏、影像模组与磁吸快拆结构的核心骨架。',
    [['尺寸', '70.5 × 44.2 × 32.8 mm'], ['重量', '145 g'], ['防护', '裸机 18 m 防水']],
    shell,
    [0, 0.45, 0],
    -1
  );

  var lens = new THREE.Group();
  lens.position.set(1.08, 0.2, 0.69);
  var lensBase = cylinder(0.73, 0.2, materials.darkSteel, 72);
  lensBase.position.z = 0.08;
  lens.add(lensBase);
  var lensCollar = cylinder(0.62, 0.18, materials.steel, 72);
  lensCollar.position.z = 0.2;
  lens.add(lensCollar);
  var lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.045, 18, 72), materials.steel);
  lensRing.position.z = 0.31;
  lens.add(lensRing);
  var glass = cylinder(0.4, 0.035, materials.glass, 72);
  glass.position.z = 0.325;
  lens.add(glass);
  var glint = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 32),
    new THREE.MeshBasicMaterial({ color: 0x9ee8ff, transparent: true, opacity: 0.22 })
  );
  glint.position.set(-0.12, 0.12, 0.348);
  lens.add(glint);
  part(
    'lens',
    '超广角镜头',
    'ULTRA-WIDE LENS MODULE',
    '1/1.3 英寸传感器与超广角镜片组，负责收集主体的全部光线。',
    [['传感器', '1/1.3 CMOS'], ['光圈', 'f/2.8'], ['视场角', '155°']],
    lens,
    [1.05, 0.14, 1.55],
    1
  );

  var frontScreen = new THREE.Group();
  frontScreen.position.set(-1.08, 0.19, 0.6);
  var displayFrame = roundedBox(1.58, 0.92, 0.075, 0.1, materials.rubber);
  frontScreen.add(displayFrame);
  var screen0 = new THREE.Mesh(new THREE.PlaneGeometry(1.37, 0.73), screenMaterials[0]);
  screen0.position.z = 0.115;
  frontScreen.add(screen0);
  part(
    'front-screen',
    '前置取景屏',
    'FRONT DISPLAY / VIDEO INPUT',
    '预留为 16:9 的视频显示面，可装载本地视频，也可保持动态监看画面。',
    [['尺寸', '1.4 英寸'], ['比例', '16:9'], ['用途', '监看 / 视频输出']],
    frontScreen,
    [-0.7, 0.15, 1.65],
    -1
  );

  var rearScreen = new THREE.Group();
  rearScreen.position.set(0, 0.18, -0.6);
  rearScreen.rotation.y = Math.PI;
  var rearFrame = roundedBox(2.5, 1.46, 0.07, 0.1, materials.rubber);
  rearScreen.add(rearFrame);
  var screen1 = new THREE.Mesh(new THREE.PlaneGeometry(2.24, 1.22), screenMaterials[1]);
  screen1.position.z = 0.115;
  rearScreen.add(screen1);
  part(
    'rear-screen',
    '后置触控屏',
    'REAR TOUCH DISPLAY',
    '大面积触控监看界面，与前置屏共享同一路画面信号。',
    [['尺寸', '2.25 英寸'], ['触控', '支持'], ['亮度', '750 cd/m²']],
    rearScreen,
    [0.5, 0.25, -1.4],
    1
  );

  var controls = new THREE.Group();
  controls.position.set(-0.95, 1.32, 0);
  var recordBase = roundedBox(0.84, 0.1, 0.48, 0.08, materials.darkSteel);
  controls.add(recordBase);
  var recordTop = cylinder(0.15, 0.13, materials.red, 48);
  recordTop.rotation.z = Math.PI / 2;
  recordTop.position.set(-0.22, 0.1, 0);
  controls.add(recordTop);
  var powerTop = cylinder(0.1, 0.11, materials.steel, 40);
  powerTop.rotation.z = Math.PI / 2;
  powerTop.position.set(0.29, 0.09, 0);
  controls.add(powerTop);
  part(
    'controls',
    '顶部控制组',
    'TOP CONTROL DECK',
    '快门、电源与状态指示集中在顶部，让单手也能完成主要操作。',
    [['快门', '机械按键'], ['电源', '短按 / 长按'], ['指示', '录制状态灯']],
    controls,
    [-0.4, 1.2, 0.2],
    1
  );

  var battery = new THREE.Group();
  battery.position.set(2.04, -0.02, 0);
  var batteryDoor = roundedBox(0.09, 1.68, 0.78, 0.085, materials.darkSteel);
  batteryDoor.rotation.y = Math.PI / 2;
  battery.add(batteryDoor);
  var batteryLine = new THREE.Mesh(new THREE.BoxGeometry(0.012, 1.18, 0.5), materials.rubber);
  batteryLine.position.set(0.057, 0, 0);
  battery.add(batteryLine);
  part(
    'battery',
    '电池与侧盖',
    'BATTERY / SIDE DOOR',
    '高能量密度电池和密封侧盖，共同组成可更换能源模块。',
    [['容量', '1770 mAh'], ['能量', '6.8 Wh'], ['续航', '最长 160 min']],
    battery,
    [1.15, 0.05, 0.1],
    1
  );

  var mount = new THREE.Group();
  mount.position.set(0, -1.38, 0.03);
  var mountPlate = roundedBox(2.3, 0.16, 0.82, 0.1, materials.rubber);
  mount.add(mountPlate);
  var magnet = cylinder(0.43, 0.1, materials.darkSteel, 64);
  magnet.position.set(0, -0.1, 0);
  mount.add(magnet);
  var mountSlot = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.07, 0.15), materials.steel);
  mountSlot.position.set(0, -0.14, 0.32);
  mount.add(mountSlot);
  part(
    'mount',
    '磁吸快拆底座',
    'MAGNETIC QUICK-RELEASE',
    '负责把机身固定在支架上，磁吸定位后以卡扣完成机械锁止。',
    [['结构', '磁吸 + 卡扣'], ['拆装', '快速释放'], ['兼容', 'DJI 快拆生态']],
    mount,
    [0, -1.1, 0.35],
    -1
  );

  // A small brand strip makes the generated shell read as an Action camera,
  // rather than an anonymous dark box.
  function textTexture(text, width, height, accent) {
    var c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    var x = c.getContext('2d');
    x.clearRect(0, 0, width, height);
    x.fillStyle = accent || '#eef7fb';
    x.font = '600 ' + Math.round(height * 0.56) + 'px Segoe UI, Arial, sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.letterSpacing = '6px';
    x.fillText(text, width / 2, height / 2);
    var texture = new THREE.CanvasTexture(c);
    if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
  var logo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.36, 0.2),
    new THREE.MeshBasicMaterial({ map: textTexture('ACTION 4', 512, 80, '#dfeaec'), transparent: true })
  );
  logo.position.set(0.98, -0.82, 0.556);
  shell.add(logo);

  var partById = {};
  parts.forEach(function (p) {
    partById[p.id] = p;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'part-button';
    button.dataset.part = p.id;
    button.innerHTML = '<i>' + String(parts.indexOf(p) + 1).padStart(2, '0') + '</i><span><b>' + p.name + '</b><small>' + p.en + '</small></span><span>↗</span>';
    button.addEventListener('click', function () { selectPart(p.id); });
    partsList.appendChild(button);
    p.button = button;

    var label = document.createElement('div');
    label.className = 'part-label' + (p.side < 0 ? ' left' : '');
    label.dataset.part = p.id;
    label.innerHTML = '<span><b>' + p.name + '</b><small>' + p.en + '</small></span>';
    labelsLayer.appendChild(label);
    p.label = label;
  });

  var selectedId = 'shell';
  var hoveredId = '';
  var explodedAll = false;
  var explodedParts = new Set();
  var hasSelection = false;
  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  var pointerDown = null;
  var dragDistance = 0;
  var lastInteraction = 0;
  var toastTimer = 0;

  function showToast(message) {
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.add('on');
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 1800);
  }

  function renderDetails(p) {
    indexEl.textContent = String(parts.indexOf(p) + 1).padStart(2, '0') + ' / ' + String(parts.length).padStart(2, '0');
    titleEl.textContent = p.name;
    enEl.textContent = p.en;
    noteEl.textContent = p.note;
    specsEl.innerHTML = p.specs.map(function (s) {
      return '<div><dt>' + s[0] + '</dt><dd>' + s[1] + '</dd></div>';
    }).join('');
  }

  function selectPart(id, highlight) {
    if (!partById[id]) return;
    selectedId = id;
    if (highlight !== false) hasSelection = true;
    parts.forEach(function (p) { p.button.classList.toggle('active', p.id === id); });
    renderDetails(partById[id]);
    updateExplodeButton();
  }

  function updateExplodeButton() {
    var single = explodedParts.has(selectedId);
    explodeButton.textContent = explodedAll ? '全部装回' : '全部拆解';
    explodeButton.setAttribute('aria-pressed', String(explodedAll));
    focusButton.innerHTML = (explodedAll ? '单独观察此部件' : single ? '装回此部件' : '拆开此部件') + ' <span>↗</span>';
    focusButton.setAttribute('aria-pressed', String(single || explodedAll));
  }

  function resetCamera() {
    targetView.yaw = 0.42;
    targetView.pitch = 0.2;
    targetView.radius = 9.2;
  }

  function resetAll() {
    explodedAll = false;
    explodedParts.clear();
    resetCamera();
    hasSelection = false;
    selectPart('shell', false);
  }

  explodeButton.addEventListener('click', function () {
    explodedAll = !explodedAll;
    if (explodedAll) explodedParts.clear();
    updateExplodeButton();
  });
  resetButton.addEventListener('click', resetAll);
  focusButton.addEventListener('click', function () {
    hasSelection = true;
    if (explodedAll) {
      explodedAll = false;
      explodedParts.clear();
      explodedParts.add(selectedId);
    } else if (explodedParts.has(selectedId)) {
      explodedParts.delete(selectedId);
    } else {
      explodedParts.add(selectedId);
    }
    targetView.yaw = selectedId === 'lens' ? 0.72 : selectedId === 'battery' ? 1.05 : 0.42;
    targetView.pitch = selectedId === 'mount' ? -0.08 : 0.2;
    targetView.radius = selectedId === 'lens' ? 7.3 : 8.3;
    updateExplodeButton();
  });

  function setPointerFromEvent(event) {
    var rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function hitPart(event) {
    setPointerFromEvent(event);
    raycaster.setFromCamera(pointer, camera);
    var hit = raycaster.intersectObjects(pickables, false)[0];
    return hit && hit.object.userData.partId;
  }

  canvas.addEventListener('pointerdown', function (event) {
    pointerDown = { x: event.clientX, y: event.clientY, yaw: targetView.yaw, pitch: targetView.pitch };
    dragDistance = 0;
    canvas.setPointerCapture(event.pointerId);
    lab.classList.add('dragging');
  });

  canvas.addEventListener('pointermove', function (event) {
    if (pointerDown) {
      var dx = event.clientX - pointerDown.x;
      var dy = event.clientY - pointerDown.y;
      dragDistance = Math.max(dragDistance, Math.hypot(dx, dy));
      targetView.yaw = pointerDown.yaw - dx * 0.007;
      targetView.pitch = Math.max(-0.65, Math.min(0.72, pointerDown.pitch - dy * 0.005));
      lastInteraction = performance.now();
      return;
    }
    var id = hitPart(event);
    if (id !== hoveredId) {
      hoveredId = id || '';
      canvas.style.cursor = hoveredId ? 'pointer' : 'grab';
    }
  });

  function endPointer(event) {
    if (!pointerDown) return;
    var moved = dragDistance;
    pointerDown = null;
    lab.classList.remove('dragging');
    try { canvas.releasePointerCapture(event.pointerId); } catch (error) {}
    if (moved < 5) {
      var id = hitPart(event);
      if (id) selectPart(id);
    }
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', function () { pointerDown = null; lab.classList.remove('dragging'); });
  canvas.addEventListener('wheel', function (event) {
    event.preventDefault();
    targetView.radius = Math.max(5.6, Math.min(14, targetView.radius + event.deltaY * 0.005));
    lastInteraction = performance.now();
  }, { passive: false });
  canvas.addEventListener('dblclick', resetCamera);

  // Basic two-finger pinch zoom without an external controls dependency.
  var touches = new Map();
  canvas.addEventListener('touchstart', function (event) {
    if (event.touches.length === 2) {
      touches.clear();
      touches.set('d', touchDistance(event.touches));
      touches.set('r', targetView.radius);
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', function (event) {
    if (event.touches.length === 2 && touches.has('d')) {
      event.preventDefault();
      var distance = touchDistance(event.touches);
      targetView.radius = Math.max(5.6, Math.min(14, touches.get('r') * touches.get('d') / Math.max(1, distance)));
    }
  }, { passive: false });
  canvas.addEventListener('touchend', function () { touches.clear(); }, { passive: true });
  function touchDistance(list) {
    return Math.hypot(list[0].clientX - list[1].clientX, list[0].clientY - list[1].clientY);
  }

  var video = null;
  var videoUrl = null;
  var videoTexture = null;
  var screenOpen = false;

  function openScreen() {
    if (!video || !videoUrl) {
      showToast('请先装载一个 MP4 / WebM 视频');
      videoInput.value = '';
      videoInput.click();
      return;
    }
    screenOpen = true;
    screenExpand.classList.add('open');
    screenExpand.setAttribute('aria-hidden', 'false');
    expandedVideo.src = videoUrl;
    expandedVideo.currentTime = video.currentTime;
    if (!video.paused) expandedVideo.play().catch(function () {});
  }

  function closeScreen() {
    screenOpen = false;
    expandedVideo.pause();
    screenExpand.classList.remove('open');
    screenExpand.setAttribute('aria-hidden', 'true');
  }

  enlargeButton.addEventListener('click', openScreen);
  closeScreenButton.addEventListener('click', closeScreen);
  screenExpand.addEventListener('click', function (event) {
    if (event.target === screenExpand) closeScreen();
  });

  loadVideoButton.addEventListener('click', function () {
    videoInput.value = '';
    videoInput.click();
  });
  videoInput.addEventListener('change', function () {
    var file = videoInput.files && videoInput.files[0];
    if (!file) return;
    var supported = /^video\/(mp4|webm|quicktime)$/i.test(file.type) || /\.(mp4|webm|mov)$/i.test(file.name);
    if (!supported) {
      showToast('请选择 MP4、WebM 或 MOV 视频');
      return;
    }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    videoUrl = URL.createObjectURL(file);
    if (video) {
      video.pause();
      video.remove();
    }
    video = document.createElement('video');
    video.src = videoUrl;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.addEventListener('loadeddata', function () {
      videoTexture = new THREE.VideoTexture(video);
      if ('colorSpace' in videoTexture && THREE.SRGBColorSpace) videoTexture.colorSpace = THREE.SRGBColorSpace;
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      screenMaterials.forEach(function (material) {
        material.map = videoTexture;
        material.needsUpdate = true;
      });
      video.play().catch(function () {});
      toggleVideoButton.hidden = false;
      toggleVideoButton.textContent = '暂停画面';
      enlargeButton.hidden = false;
      loadVideoButton.textContent = '更换 MP4';
      openScreen();
      showToast('视频已接入 Action 4 屏幕');
    });
    video.addEventListener('error', function () {
      showToast('这个视频编码暂时无法播放');
    });
  });
  toggleVideoButton.addEventListener('click', function () {
    if (!video) return;
    if (video.paused) {
      video.play().catch(function () {});
      if (screenOpen) expandedVideo.play().catch(function () {});
      toggleVideoButton.textContent = '暂停画面';
    } else {
      video.pause();
      expandedVideo.pause();
      toggleVideoButton.textContent = '继续画面';
    }
  });

  expandedVideo.addEventListener('play', function () {
    if (video && video.paused) video.play().catch(function () {});
  });
  expandedVideo.addEventListener('pause', function () {
    if (video && !video.paused && !expandedVideo.ended) video.pause();
  });
  expandedVideo.addEventListener('seeked', function () {
    if (video && isFinite(expandedVideo.currentTime)) video.currentTime = expandedVideo.currentTime;
  });

  selectPart('shell', false);
  renderer.domElement.addEventListener('contextmenu', function (event) { event.preventDefault(); });

  var clock = new THREE.Clock();
  var idleTimer = 0;
  var screenTimer = 0;
  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    var elapsed = clock.elapsedTime;

    view.yaw += (targetView.yaw - view.yaw) * Math.min(1, dt * 8);
    view.pitch += (targetView.pitch - view.pitch) * Math.min(1, dt * 8);
    view.radius += (targetView.radius - view.radius) * Math.min(1, dt * 8);
    updateCamera();

    if (!reduced && !pointerDown && performance.now() - lastInteraction > 5200) {
      targetView.yaw += dt * 0.045;
    }

    parts.forEach(function (p, index) {
      var displaced = explodedAll || explodedParts.has(p.id);
      var move = displaced ? 1 : 0;
      var target = p.base.clone().addScaledVector(p.offset, move);
      p.group.position.lerp(target, reduced ? 1 : Math.min(1, dt * 7));
      var selected = hasSelection && p.id === selectedId;
      var targetGlow = selected ? 0.72 + Math.sin(elapsed * 2.7) * 0.13 : hoveredId === p.id ? 0.22 : 0;
      p.glow += (targetGlow - p.glow) * Math.min(1, dt * 9);
      p.materials.forEach(function (mat) {
        mat.emissive.setHex(selected || hoveredId === p.id ? 0x1c8dac : 0x000000);
        if ('emissiveIntensity' in mat) mat.emissiveIntensity = p.glow;
      });
    });

    model.updateMatrixWorld();
    var width = renderer.domElement.clientWidth;
    var height = renderer.domElement.clientHeight;
    parts.forEach(function (p) {
      var pos = new THREE.Vector3();
      p.group.getWorldPosition(pos);
      pos.project(camera);
      var x = (pos.x * 0.5 + 0.5) * width;
      var y = (-pos.y * 0.5 + 0.5) * height;
      var leftGuard = detailsPanel ? detailsPanel.offsetLeft + detailsPanel.offsetWidth + (p.side < 0 ? 154 : 12) : 118;
      var rightGuard = partsPanel ? partsPanel.offsetLeft - (p.side > 0 ? 154 : 8) : width - 16;
      p.label.style.left = Math.max(leftGuard, Math.min(rightGuard, x)) + 'px';
      p.label.style.top = Math.max(98, Math.min(height - 100, y)) + 'px';
      var labelVisible = explodedAll || (explodedParts.has(selectedId) && p.id === selectedId);
      p.label.classList.toggle('on', labelVisible && pos.z < 1);
    });

    particles.rotation.y += dt * 0.009;
    cyanLight.intensity = 11 + Math.sin(elapsed * 1.4) * 1.5;
    if (!videoTexture && elapsed - screenTimer > 0.11) {
      screenTimer = elapsed;
      paintIdleScreen(elapsed);
    }

    renderer.render(scene, camera);
  }

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  requestAnimationFrame(function () {
    loader.classList.add('off');
  });
  animate();

  window.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (screenOpen) closeScreen();
    else parent.postMessage({ type: 'gml-close-action-cam' }, '*');
  });

  window.ActionCamLab = {
    selectPart: selectPart,
    reset: resetAll,
    mountVideo: function (element) {
      if (!element) return;
      video = element;
      video.loop = true;
      video.playsInline = true;
      var texture = new THREE.VideoTexture(video);
      screenMaterials.forEach(function (material) {
        material.map = texture;
        material.needsUpdate = true;
      });
    }
  };
})();
