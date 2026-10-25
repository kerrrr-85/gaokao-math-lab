(function () {
  "use strict";

  var canvas = document.getElementById("plot");
  var ctx = canvas.getContext("2d");
  var lambdaInput = document.getElementById("lambda");
  var lambdaValue = document.getElementById("lambdaValue");
  var playButton = document.getElementById("playButton");
  var resetButton = document.getElementById("resetButton");
  var progressBar = document.getElementById("progressBar");
  var captionIndex = document.getElementById("captionIndex");
  var captionText = document.getElementById("captionText");
  var statusText = document.getElementById("statusText");
  var expanded = document.getElementById("expanded");

  var colors = {
    ink: "#20213a",
    axis: "#687080",
    purple: "#633bcf",
    blue: "#145fd4",
    green: "#26957b",
    orange: "#c78b35",
    faint: "rgba(70, 77, 91, 0.12)"
  };

  var state = {
    width: 0,
    height: 0,
    dpr: 1,
    time: 0,
    running: true,
    manual: false,
    lambda: 0,
    lastFrame: performance.now(),
    duration: 8.2
  };

  var view = {
    xMin: -5,
    xMax: 5,
    yMin: -3.65,
    yMax: 3.65
  };

  function evalF(x, y) {
    return 4 * x * x + 9 * y * y - 36;
  }

  function evalG(x, y) {
    return (3 * x - 5 * y + 3) * (3 * x + 5 * y + 2);
  }

  function evalFamily(x, y, lambda) {
    return evalF(x, y) + lambda * evalG(x, y);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function smoothstep(value) {
    var x = clamp(value, 0, 1);
    return x * x * (3 - 2 * x);
  }

  function lineY(which, x) {
    if (which === 0) return (3 * x + 3) / 5;
    return -(3 * x + 2) / 5;
  }

  function solvePoints() {
    var result = [];
    for (var which = 0; which < 2; which++) {
      var roots = [];
      var previousX = view.xMin + 0.3;
      var previous = evalF(previousX, lineY(which, previousX));
      for (var i = 1; i <= 900; i++) {
        var x = view.xMin + 0.3 + i * (view.xMax - view.xMin - 0.6) / 900;
        var value = evalF(x, lineY(which, x));
        if (previous * value <= 0) {
          var low = previousX;
          var high = x;
          for (var k = 0; k < 45; k++) {
            var middle = (low + high) * 0.5;
            if (evalF(low, lineY(which, low)) * evalF(middle, lineY(which, middle)) <= 0) high = middle;
            else low = middle;
          }
          var root = (low + high) * 0.5;
          if (!roots.some(function (oldRoot) { return Math.abs(oldRoot - root) < 0.01; })) roots.push(root);
        }
        previousX = x;
        previous = value;
      }
      roots.sort(function (a, b) { return a - b; });
      roots.forEach(function (x) {
        result.push({ x: x, y: lineY(which, x), label: which === 0 ? (result.length === 0 ? "A" : "B") : (result.length === 2 ? "C" : "D") });
      });
    }
    return result;
  }

  var fixedPoints = solvePoints();

  function worldToScreen(x, y, layout) {
    return {
      x: layout.left + (x - view.xMin) / (view.xMax - view.xMin) * layout.width,
      y: layout.top + (view.yMax - y) / (view.yMax - view.yMin) * layout.height
    };
  }

  function getLayout() {
    var compact = state.width < 620;
    return {
      left: compact ? 34 : 54,
      top: compact ? 34 : 28,
      width: state.width - (compact ? 58 : 84),
      height: state.height - (compact ? 95 : 90),
      compact: compact
    };
  }

  function setStroke(color, width, alpha) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  function drawArrowHead(x, y, dx, dy, color) {
    var length = Math.hypot(dx, dy) || 1;
    var ux = dx / length;
    var uy = dy / length;
    var head = 8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - ux * head - uy * head * 0.42, y - uy * head + ux * head * 0.42);
    ctx.lineTo(x - ux * head + uy * head * 0.42, y - uy * head - ux * head * 0.42);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawAxes(layout) {
    var origin = worldToScreen(0, 0, layout);
    var right = worldToScreen(view.xMax, 0, layout);
    var top = worldToScreen(0, view.yMax, layout);
    ctx.save();
    setStroke(colors.axis, 1.5, 0.7);
    ctx.beginPath();
    ctx.moveTo(layout.left, origin.y);
    ctx.lineTo(right.x, origin.y);
    ctx.moveTo(origin.x, layout.top + layout.height);
    ctx.lineTo(origin.x, top.y);
    ctx.stroke();
    drawArrowHead(right.x, origin.y, 1, 0, colors.axis);
    drawArrowHead(origin.x, top.y, 0, -1, colors.axis);
    ctx.fillStyle = colors.axis;
    ctx.font = "italic 16px Cambria, Georgia, serif";
    ctx.fillText("x", right.x - 11, origin.y + 24);
    ctx.fillText("y", origin.x + 9, top.y + 16);
    ctx.fillText("O", origin.x - 17, origin.y + 19);
    ctx.restore();
  }

  function drawEllipse(layout, alpha) {
    var center = worldToScreen(0, 0, layout);
    var rx = 3 / (view.xMax - view.xMin) * layout.width;
    var ry = 2 / (view.yMax - view.yMin) * layout.height;
    ctx.save();
    setStroke(colors.purple, 3.2, alpha);
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawLineEquation(which, layout, alpha) {
    var x1 = view.xMin + 0.1;
    var x2 = view.xMax - 0.1;
    var p1 = worldToScreen(x1, lineY(which, x1), layout);
    var p2 = worldToScreen(x2, lineY(which, x2), layout);
    ctx.save();
    setStroke(colors.blue, 2.5, alpha);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  }

  function crossing(x1, y1, f1, x2, y2, f2) {
    var t = f1 / (f1 - f2);
    return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t };
  }

  function drawImplicit(lambda, layout, color, width, alpha, resolution) {
    var nx = resolution || (layout.compact ? 92 : 150);
    var ny = resolution || (layout.compact ? 82 : 126);
    var values = new Float64Array((nx + 1) * (ny + 1));
    var xs = new Float64Array(nx + 1);
    var ys = new Float64Array(ny + 1);
    for (var ix = 0; ix <= nx; ix++) xs[ix] = view.xMin + (view.xMax - view.xMin) * ix / nx;
    for (var iy = 0; iy <= ny; iy++) ys[iy] = view.yMin + (view.yMax - view.yMin) * iy / ny;
    for (var yy = 0; yy <= ny; yy++) {
      for (var xx = 0; xx <= nx; xx++) values[yy * (nx + 1) + xx] = evalFamily(xs[xx], ys[yy], lambda);
    }

    ctx.save();
    setStroke(color, width, alpha);
    ctx.beginPath();
    for (var jy = 0; jy < ny; jy++) {
      for (var jx = 0; jx < nx; jx++) {
        var p = [
          { x: xs[jx], y: ys[jy], v: values[jy * (nx + 1) + jx] },
          { x: xs[jx + 1], y: ys[jy], v: values[jy * (nx + 1) + jx + 1] },
          { x: xs[jx + 1], y: ys[jy + 1], v: values[(jy + 1) * (nx + 1) + jx + 1] },
          { x: xs[jx], y: ys[jy + 1], v: values[(jy + 1) * (nx + 1) + jx] }
        ];
        var crossings = [];
        for (var edge = 0; edge < 4; edge++) {
          var a = p[edge];
          var b = p[(edge + 1) % 4];
          if ((a.v < 0 && b.v >= 0) || (a.v >= 0 && b.v < 0)) crossings.push(crossing(a.x, a.y, a.v, b.x, b.y, b.v));
        }
        if (crossings.length === 2) {
          var s1 = worldToScreen(crossings[0].x, crossings[0].y, layout);
          var s2 = worldToScreen(crossings[1].x, crossings[1].y, layout);
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
        } else if (crossings.length === 4) {
          for (var pair = 0; pair < crossings.length; pair += 2) {
            var q1 = worldToScreen(crossings[pair].x, crossings[pair].y, layout);
            var q2 = worldToScreen(crossings[pair + 1].x, crossings[pair + 1].y, layout);
            ctx.moveTo(q1.x, q1.y);
            ctx.lineTo(q2.x, q2.y);
          }
        }
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawPoints(layout, alpha) {
    fixedPoints.forEach(function (point) {
      var pos = worldToScreen(point.x, point.y, layout);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5.2, 0, Math.PI * 2);
      ctx.fillStyle = colors.ink;
      ctx.fill();
      ctx.fillStyle = colors.ink;
      ctx.font = (layout.compact ? 13 : 16) + "px Cambria, Georgia, serif";
      ctx.fillText(point.label, pos.x + (point.label === "C" || point.label === "A" ? -22 : 9), pos.y + (point.label === "A" || point.label === "D" ? 22 : -10));
      ctx.restore();
    });
  }

  function drawScene() {
    var layout = getLayout();
    ctx.clearRect(0, 0, state.width, state.height);

    var t = state.time;
    var revealF = state.manual ? 1 : smoothstep((t - 0.2) / 1.1);
    var revealG = state.manual ? 1 : smoothstep((t - 1.25) / 1.2);
    var revealPoints = state.manual ? 1 : smoothstep((t - 2.35) / 0.7);
    var showFamily = state.manual || t >= 3.25;
    var familyAlpha = state.manual ? 1 : smoothstep((t - 3.25) / 0.75);

    drawAxes(layout);
    if (revealF > 0) drawEllipse(layout, revealF * 0.92);
    if (revealG > 0) {
      drawLineEquation(0, layout, revealG * 0.85);
      drawLineEquation(1, layout, revealG * 0.85);
    }
    if (showFamily && Math.abs(state.lambda) > 0.012) {
      drawImplicit(state.lambda, layout, colors.green, 2.5, familyAlpha * 0.95, layout.compact ? 86 : 138);
    }
    if (revealPoints > 0) drawPoints(layout, revealPoints);

    if (revealF > 0) {
      ctx.save();
      ctx.globalAlpha = revealF * 0.66;
      ctx.fillStyle = colors.purple;
      ctx.font = (layout.compact ? 14 : 18) + "px Cambria, Georgia, serif";
      var ellipsePos = worldToScreen(-2.2, 2.36, layout);
      ctx.fillText("f = 0", ellipsePos.x, ellipsePos.y);
      ctx.restore();
    }
    if (revealG > 0) {
      ctx.save();
      ctx.globalAlpha = revealG * 0.6;
      ctx.fillStyle = colors.blue;
      ctx.font = (layout.compact ? 14 : 18) + "px Cambria, Georgia, serif";
      var linePos1 = worldToScreen(-3.85, 1.88, layout);
      var linePos2 = worldToScreen(3.05, -2.0, layout);
      ctx.fillText("g = 0", linePos1.x, linePos1.y);
      ctx.fillText("g = 0", linePos2.x, linePos2.y);
      ctx.restore();
    }
  }

  function updateStory() {
    var t = Math.min(state.time, state.duration);
    var lambdaProgress = smoothstep((t - 3.25) / (state.duration - 3.25));
    state.lambda = state.manual ? state.lambda : lambdaProgress;
    lambdaInput.value = state.lambda.toFixed(2);

    var noteIndex = t < 2.4 ? 1 : t < 3.25 ? 2 : 3;
    for (var i = 1; i <= 3; i++) document.getElementById("note" + i).classList.toggle("active", i === noteIndex);

    if (state.manual) {
      captionIndex.textContent = "λ";
      captionText.textContent = "改变 λ，曲线形状随之变化；四个交点始终保留。";
      statusText.textContent = "自由探索中";
      document.getElementById("chapterNumber").textContent = "λ";
    } else if (t < 1.45) {
      captionIndex.textContent = "01";
      captionText.textContent = "先把椭圆写成方程 f = 0。满足方程的点都在曲线上。";
      statusText.textContent = "正在建立基础曲线";
      document.getElementById("chapterNumber").textContent = "01";
    } else if (t < 2.65) {
      captionIndex.textContent = "02";
      captionText.textContent = "两条直线也能看成一个二次方程：乘积为零，表示点在其中一条直线上。";
      statusText.textContent = "两条直线合并成 g = 0";
      document.getElementById("chapterNumber").textContent = "02";
    } else if (t < 3.65) {
      captionIndex.textContent = "03";
      captionText.textContent = "A、B、C、D 同时满足 f = 0 和 g = 0，这四个交点被保留下来。";
      statusText.textContent = "标出四个公共交点";
      document.getElementById("chapterNumber").textContent = "03";
    } else if (t < state.duration) {
      captionIndex.textContent = "04";
      captionText.textContent = "观察 f + λg = 0：λ 从 0 变到 1，椭圆连续转变成双曲线。";
      statusText.textContent = "λ 正在从 0 变到 1";
      document.getElementById("chapterNumber").textContent = "04";
    } else {
      captionIndex.textContent = "05";
      captionText.textContent = "曲线形状变了，A、B、C、D 仍在曲线上。拖动 λ 可以继续验证。";
      statusText.textContent = "演示完成，可拖动 λ";
      document.getElementById("chapterNumber").textContent = "05";
    }

    lambdaValue.textContent = state.lambda.toFixed(2).replace("-", "−");
    expanded.classList.toggle("show", Math.abs(state.lambda - 1) < 0.055);
    progressBar.style.width = clamp(t / state.duration * 100, 0, 100) + "%";
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = rect.width;
    state.height = rect.height;
    state.dpr = dpr;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function finish() {
    state.time = state.duration;
    state.running = false;
    state.manual = false;
    state.lambda = 1;
    lambdaInput.value = "1.00";
    playButton.textContent = "重播";
    playButton.setAttribute("aria-label", "重新播放");
    updateStory();
    drawScene();
  }

  function tick(now) {
    var dt = Math.min(0.05, Math.max(0, (now - state.lastFrame) / 1000));
    state.lastFrame = now;
    if (state.running && !state.manual) {
      state.time += dt;
      if (state.time >= state.duration) finish();
    }
    updateStory();
    drawScene();
    requestAnimationFrame(tick);
  }

  function reset() {
    state.time = 0;
    state.running = true;
    state.manual = false;
    state.lambda = 0;
    lambdaInput.value = "0";
    playButton.textContent = "暂停";
    playButton.setAttribute("aria-label", "暂停");
    updateStory();
    playButton.blur();
  }

  lambdaInput.addEventListener("input", function () {
    state.manual = true;
    state.running = false;
    state.lambda = Number(this.value);
    state.time = state.duration;
    playButton.textContent = "从头演示";
    playButton.setAttribute("aria-label", "从头演示");
    updateStory();
    drawScene();
  });

  playButton.addEventListener("click", function () {
    if (state.manual || state.time >= state.duration) reset();
    else {
      state.running = !state.running;
      state.lastFrame = performance.now();
      playButton.textContent = state.running ? "暂停" : "继续";
    }
  });

  resetButton.addEventListener("click", reset);

  var returnCloud = document.getElementById("returnCloud");
  if (returnCloud) {
    returnCloud.addEventListener("click", function () {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "gml-close-conics" }, location.origin);
      } else {
        location.href = "../?v=118#/";
      }
    });
  }

  var lessonButton = document.getElementById("lessonButton");
  var closeLesson = document.getElementById("closeLesson");
  var lessonDrawer = document.getElementById("lessonDrawer");
  var lessonBackdrop = document.getElementById("lessonBackdrop");
  var resumeAfterLesson = false;

  function openLesson() {
    resumeAfterLesson = state.running && !state.manual && state.time < state.duration;
    state.running = false;
    lessonDrawer.classList.add("open");
    lessonBackdrop.classList.add("open");
    lessonDrawer.setAttribute("aria-hidden", "false");
    lessonDrawer.scrollTop = 0;
    closeLesson.focus();
  }

  function closeLessonPanel() {
    lessonDrawer.classList.remove("open");
    lessonBackdrop.classList.remove("open");
    lessonDrawer.setAttribute("aria-hidden", "true");
    lessonButton.focus();
    if (resumeAfterLesson) {
      state.running = true;
      state.lastFrame = performance.now();
      playButton.textContent = "暂停";
    }
    resumeAfterLesson = false;
  }

  if (lessonButton && lessonDrawer && closeLesson && lessonBackdrop) {
    lessonButton.addEventListener("click", openLesson);
    closeLesson.addEventListener("click", closeLessonPanel);
    lessonBackdrop.addEventListener("click", closeLessonPanel);
  }

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && lessonDrawer && lessonDrawer.classList.contains("open")) {
      closeLessonPanel();
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      playButton.click();
    }
    if (event.key.toLowerCase() === "r") reset();
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(function () {
      resize();
      drawScene();
    }).observe(canvas);
  } else {
    window.addEventListener("resize", function () {
      resize();
      drawScene();
    });
  }

  resize();
  updateStory();
  requestAnimationFrame(tick);
}());
