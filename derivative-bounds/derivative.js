(function () {
  "use strict";

  var mainCanvas = document.getElementById("mainGraph");
  var mainCtx = mainCanvas.getContext("2d");
  var compareCanvas = document.getElementById("compareGraph");
  var compareCtx = compareCanvas.getContext("2d");
  var playButton = document.getElementById("playButton");
  var resetButton = document.getElementById("resetButton");
  var progressBar = document.getElementById("progressBar");
  var chapterNo = document.getElementById("chapterNo");
  var chapterName = document.getElementById("chapterName");
  var statusText = document.getElementById("statusText");

  var colors = {
    ink: "#263035",
    pencil: "#59676b",
    grid: "rgba(61, 91, 105, 0.10)",
    blue: "#27658e",
    purple: "#684bb0",
    green: "#39785a",
    orange: "#c9842d",
    red: "#ae4b40",
    highlight: "rgba(239, 207, 111, 0.27)"
  };

  var steps = [
    { no: "01", name: "切线条件", start: 0, end: 3.1 },
    { no: "02", name: "判断单调性", start: 3.1, end: 7.5 },
    { no: "03", name: "判断零点", start: 7.5, end: 11.4 }
  ];

  var state = {
    running: true,
    finished: false,
    time: 0,
    duration: 11.4,
    lastFrame: performance.now(),
    lastHud: 0,
    manualX: null,
    width: 0,
    height: 0
  };

  function f(x) {
    return x - (x - 1) * Math.exp(-x);
  }

  function df(x) {
    return 1 + (x - 2) * Math.exp(-x);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function smoothstep(value) {
    var x = clamp(value, 0, 1);
    return x * x * (3 - 2 * x);
  }

  function currentStep(time) {
    for (var i = 0; i < steps.length; i++) {
      if (time < steps[i].end) return i;
    }
    return steps.length - 1;
  }

  function resizeCanvas(canvas, context) {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = Math.max(1, Math.round(rect.width * dpr));
    var height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { x: rect.width, y: rect.height };
  }

  function line(context, x1, y1, x2, y2, color, width, dash) {
    context.save();
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.strokeStyle = color;
    context.lineWidth = width || 1;
    context.lineCap = "round";
    if (dash) context.setLineDash(dash);
    context.stroke();
    context.restore();
  }

  function label(context, value, x, y, size, color, align, italic, background) {
    context.save();
    context.font = (italic ? "italic " : "") + "600 " + size + "px 'KaiTi','STKaiti','FangSong',serif";
    if (background) {
      var metrics = context.measureText(value);
      var left = align === "center" ? x - metrics.width / 2 : align === "right" ? x - metrics.width : x;
      context.fillStyle = background;
      context.fillRect(left - 3, y - size, metrics.width + 6, size + 4);
    }
    context.fillStyle = color || colors.ink;
    context.textAlign = align || "left";
    context.textBaseline = "alphabetic";
    context.fillText(value, x, y);
    context.restore();
  }

  function drawArrow(context, x1, y1, x2, y2, color, width) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var length = Math.hypot(dx, dy);
    if (length < 0.1) return;
    var ux = dx / length;
    var uy = dy / length;
    context.save();
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = width || 1.4;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2 - ux * 7, y2 - uy * 7);
    context.stroke();
    context.beginPath();
    context.moveTo(x2, y2);
    context.lineTo(x2 - ux * 8 - uy * 4, y2 - uy * 8 + ux * 4);
    context.lineTo(x2 - ux * 8 + uy * 4, y2 - uy * 8 - ux * 4);
    context.closePath();
    context.fill();
    context.restore();
  }

  function drawMainGraph(time, stepIndex) {
    var size = resizeCanvas(mainCanvas, mainCtx);
    var width = size.x;
    var height = size.y;
    var compact = width < 650;
    var left = compact ? 35 : 50;
    var right = width - 18;
    var top = 14;
    var bottom = height - 28;
    var xMin = -1.2;
    var xMax = 3.4;
    var yMin = -1.2;
    var yMax = 5.1;

    mainCtx.clearRect(0, 0, width, height);
    mainCtx.save();
    mainCtx.strokeStyle = colors.grid;
    mainCtx.lineWidth = 1;
    for (var gx = left; gx <= right; gx += compact ? 34 : 48) {
      mainCtx.beginPath();
      mainCtx.moveTo(gx, top);
      mainCtx.lineTo(gx, bottom);
      mainCtx.stroke();
    }
    for (var gy = top; gy <= bottom; gy += compact ? 30 : 38) {
      mainCtx.beginPath();
      mainCtx.moveTo(left, gy);
      mainCtx.lineTo(right, gy);
      mainCtx.stroke();
    }
    mainCtx.restore();

    function toX(x) {
      return left + (x - xMin) / (xMax - xMin) * (right - left);
    }
    function toY(y) {
      return bottom - (y - yMin) / (yMax - yMin) * (bottom - top);
    }

    var axisY = toY(0);
    var axisX = toX(0);
    drawArrow(mainCtx, left, axisY, right + 7, axisY, colors.pencil, 1.3);
    drawArrow(mainCtx, axisX, bottom, axisX, top - 7, colors.pencil, 1.3);
    label(mainCtx, "x", right + 8, axisY + 15, 12, colors.pencil, "right", true);
    label(mainCtx, "y", axisX - 13, top, 12, colors.pencil, "center", true);
    label(mainCtx, "O", axisX - 11, axisY + 16, 11, colors.pencil, "right", true);

    if (stepIndex >= 1) {
      var regionLeft = toX(1);
      mainCtx.save();
      mainCtx.fillStyle = "rgba(104, 75, 176, 0.065)";
      mainCtx.fillRect(regionLeft, top, right - regionLeft, bottom - top);
      mainCtx.restore();
      line(mainCtx, regionLeft, top, regionLeft, bottom, "rgba(104,75,176,0.3)", 1, [4, 5]);
      label(mainCtx, "x > 1", regionLeft + 8, top + 15, 11, colors.purple, "left");
    }

    mainCtx.save();
    mainCtx.beginPath();
    var samples = compact ? 230 : 380;
    for (var i = 0; i <= samples; i++) {
      var x = xMin + (xMax - xMin) * i / samples;
      var y = f(x);
      var sx = toX(x);
      var sy = toY(clamp(y, yMin, yMax));
      if (i === 0) mainCtx.moveTo(sx, sy);
      else mainCtx.lineTo(sx, sy);
    }
    mainCtx.strokeStyle = colors.blue;
    mainCtx.lineWidth = 2.6;
    mainCtx.lineJoin = "round";
    mainCtx.stroke();
    mainCtx.restore();

    var tangentY0 = 1;
    var tangentX0 = 0;
    line(
      mainCtx,
      toX(xMin),
      toY(1 - xMin),
      toX(2.2),
      toY(-1.2),
      "rgba(201,132,45,0.72)",
      1.6,
      [7, 5]
    );
    mainCtx.save();
    mainCtx.beginPath();
    mainCtx.arc(toX(tangentX0), toY(tangentY0), 4.2, 0, Math.PI * 2);
    mainCtx.fillStyle = colors.orange;
    mainCtx.fill();
    mainCtx.restore();
    if (stepIndex >= 2) {
      var minX = 0.442854;
      line(mainCtx, toX(minX), toY(f(minX)), toX(minX), bottom, "rgba(57,120,90,0.3)", 1, [3, 4]);
      mainCtx.save();
      mainCtx.beginPath();
      mainCtx.arc(toX(minX), toY(f(minX)), 3.5, 0, Math.PI * 2);
      mainCtx.fillStyle = colors.green;
      mainCtx.fill();
      mainCtx.restore();
      label(mainCtx, "最小值仍 > 0", toX(minX) + 9, toY(f(minX)) + 16, compact ? 9 : 11, colors.green, "left", false, "rgba(248,244,232,0.9)");
    }

    var focusX = state.manualX == null
      ? (stepIndex === 1 ? 1.55 : stepIndex === 2 ? 0.442854 : 0)
      : state.manualX;
    focusX = clamp(focusX, -1, 3.2);
    var focusY = f(focusX);
    var pointX = toX(focusX);
    var pointY = toY(focusY);
    mainCtx.save();
    mainCtx.beginPath();
    mainCtx.arc(pointX, pointY, 5, 0, Math.PI * 2);
    mainCtx.fillStyle = colors.purple;
    mainCtx.fill();
    mainCtx.strokeStyle = "#fbf7eb";
    mainCtx.lineWidth = 2;
    mainCtx.stroke();
    mainCtx.restore();
    var shownSlope = Math.abs(df(focusX)) < 0.005 ? 0 : df(focusX);
    label(
      mainCtx,
      "x=" + focusX.toFixed(2) + "  f=" + focusY.toFixed(2) + "  f′=" + shownSlope.toFixed(2),
      Math.min(width - 8, pointX + 9),
      Math.max(top + 12, pointY - 9),
      compact ? 9 : 11,
      focusX > 1 ? colors.green : colors.purple,
      "left",
      false,
      "rgba(248,244,232,0.9)"
    );
  }

  function drawCompareGraph(stepIndex) {
    var size = resizeCanvas(compareCanvas, compareCtx);
    var width = size.x;
    var height = size.y;
    var left = 38;
    var right = width - 18;
    var top = 10;
    var bottom = height - 24;
    var xMin = 0.8;
    var xMax = 2.2;
    var yMax = 7.8;

    compareCtx.clearRect(0, 0, width, height);
    function tx(x) {
      return left + (x - xMin) / (xMax - xMin) * (right - left);
    }
    function ty(y) {
      return bottom - y / yMax * (bottom - top);
    }

    line(compareCtx, left, bottom, right + 5, bottom, colors.pencil, 1.2);
    line(compareCtx, left, bottom, left, top - 4, colors.pencil, 1.2);
    label(compareCtx, "x", right + 5, bottom + 15, 10, colors.pencil, "right", true);
    drawArrow(compareCtx, left, bottom, right + 5, bottom, colors.pencil, 1.1);
    drawArrow(compareCtx, left, bottom, left, top - 4, colors.pencil, 1.1);

    var reveal = stepIndex < 1 ? 0.25 : 0.25 + 0.75 * smoothstep((state.time - 3.1) / 2.4);

    compareCtx.save();
    compareCtx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var x = xMin + (xMax - xMin) * i / 100 * reveal;
      var y = Math.exp(x);
      if (i === 0) compareCtx.moveTo(tx(x), ty(y));
      else compareCtx.lineTo(tx(x), ty(y));
    }
    compareCtx.strokeStyle = colors.purple;
    compareCtx.lineWidth = 2.2;
    compareCtx.stroke();
    compareCtx.restore();

    compareCtx.save();
    compareCtx.beginPath();
    compareCtx.moveTo(tx(1), ty(1));
    compareCtx.lineTo(tx(xMin + (xMax - xMin) * reveal), ty(2 - (xMin + (xMax - xMin) * reveal)));
    compareCtx.strokeStyle = colors.orange;
    compareCtx.lineWidth = 2;
    compareCtx.stroke();
    compareCtx.restore();

    label(compareCtx, "eˣ", tx(1.55), ty(5.4), 15, colors.purple, "center", true);
    label(compareCtx, "2 − x", tx(1.72), ty(0.62), 12, colors.orange, "center", true);
    if (reveal > 0.93) {
      label(compareCtx, "eˣ > 2 − x", tx(1.05), ty(5.9), width < 500 ? 12 : 15, colors.green, "left");
    }
  }

  function updateHud(stepIndex) {
    var step = steps[stepIndex];
    var narration = [
      "第一问不要只看切线方程：它同时告诉我们函数值和导数，两个条件正好确定 a、b。",
      "这里没有硬算 f′(x)>0，而是把它化成 1>(2−x)e⁻ˣ，再比较两个简单函数。",
      "零点也不用真的解出来。分区证明 f(x) 始终大于 0，就能说明没有零点。"
    ];
    chapterNo.textContent = state.finished ? "✓" : step.no;
    chapterName.textContent = state.finished ? "推导完成" : step.name;
    progressBar.style.width = clamp(state.time / state.duration * 100, 0, 100) + "%";
    for (var i = 1; i <= 3; i++) {
      var item = document.getElementById("proof" + i);
      item.classList.toggle("active", !state.finished && i === stepIndex + 1);
      item.classList.toggle("done", state.finished || i < stepIndex + 1);
    }
    document.querySelector(".takeaway").classList.toggle("visible", state.finished);
    document.getElementById("summaryText").textContent = state.finished
      ? "整道题没有求出零点：先用切线确定函数，再用放缩判断导数符号，最后分区证明函数始终为正。"
      : narration[stepIndex];
    if (state.finished) statusText.textContent = "推导完成：a=1，b=−1，零点数为 0";
  }

  function draw() {
    var stepIndex = currentStep(state.time);
    drawMainGraph(state.time, stepIndex);
    drawCompareGraph(stepIndex);
    updateHud(stepIndex);
  }

  function finish() {
    state.time = state.duration;
    state.running = false;
    state.finished = true;
    playButton.textContent = "重播";
    playButton.setAttribute("aria-label", "重新播放");
    statusText.textContent = "推导完成：a=1，b=−1，零点数为 0";
    draw();
  }

  function tick(now) {
    var dt = Math.min(0.05, Math.max(0, (now - state.lastFrame) / 1000));
    state.lastFrame = now;
    if (state.running) {
      state.time += dt;
      if (state.time >= state.duration) finish();
    }
    draw();
    requestAnimationFrame(tick);
  }

  function setRunning(running) {
    state.running = running;
    state.lastFrame = performance.now();
    playButton.textContent = running ? "暂停" : "继续";
    playButton.setAttribute("aria-label", running ? "暂停" : "播放");
  }

  function reset() {
    state.time = 0;
    state.finished = false;
    state.manualX = null;
    statusText.textContent = "一次完整推导，结束后停在结论";
    setRunning(true);
  }

  function pointerToX(event) {
    var rect = mainCanvas.getBoundingClientRect();
    var compact = rect.width < 650;
    var left = compact ? 35 : 50;
    var right = rect.width - 18;
    var px = clamp(event.clientX - rect.left, left, right);
    return -1.2 + (px - left) / (right - left) * 4.6;
  }

  mainCanvas.addEventListener("pointermove", function (event) {
    if (event.buttons || state.finished) state.manualX = pointerToX(event);
  });
  mainCanvas.addEventListener("pointerdown", function (event) {
    state.manualX = pointerToX(event);
    setRunning(false);
  });
  mainCanvas.addEventListener("pointerleave", function () {
    if (!state.running) state.manualX = null;
  });

  playButton.addEventListener("click", function () {
    if (state.finished) reset();
    else setRunning(!state.running);
  });
  resetButton.addEventListener("click", reset);
  window.addEventListener("keydown", function (event) {
    if (event.code === "Space") {
      event.preventDefault();
      if (state.finished) reset();
      else setRunning(!state.running);
    }
    if (event.key.toLowerCase() === "r") reset();
  });

  if ("ResizeObserver" in window) {
    var observer = new ResizeObserver(function () {
      draw();
    });
    observer.observe(mainCanvas);
    observer.observe(compareCanvas);
  } else {
    window.addEventListener("resize", draw);
  }

  requestAnimationFrame(tick);
}());
