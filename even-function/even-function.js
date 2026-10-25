(function () {
  "use strict";

  var canvas = document.getElementById("board");
  var ctx = canvas.getContext("2d");
  var xSlider = document.getElementById("xSlider");
  var xValue = document.getElementById("xValue");
  var axisF = document.getElementById("axisF");
  var axisG = document.getElementById("axisG");
  var liveText = document.getElementById("liveText");
  var stateIndex = document.getElementById("stateIndex");
  var modeButtons = document.querySelectorAll("[data-mode]");
  var guideButton = document.getElementById("guideButton");
  var openGuide = document.getElementById("openGuide");
  var closeGuide = document.getElementById("closeGuide");
  var guideDrawer = document.getElementById("guideDrawer");
  var drawerBackdrop = document.getElementById("drawerBackdrop");
  var returnCloud = document.getElementById("returnCloud");

  var state = {
    mode: "fEven",
    x: 0.8,
    width: 0,
    height: 0,
    dpr: 1
  };

  var modes = {
    fEven: {
      f: function (u) { return u * u; },
      g: function (x) { var u = 2 * x + 1; return u * u; },
      axisF: 0,
      axisG: -0.5,
      xRange: [-2.5, 3.5],
      gRange: [-1.2, 1.2],
      yMax: 12.5,
      label: "f(x) 是偶函数",
      index: "01",
      message: "f(x)=x² 关于 x=0 对称；但 f(2x+1)=(2x+1)² 关于 x=−0.5 对称，不是偶函数。"
    },
    compositeEven: {
      f: function (u) { return (u - 1) * (u - 1); },
      g: function (x) { return 4 * x * x; },
      axisF: 1,
      axisG: 0,
      xRange: [-2, 4],
      gRange: [-1.5, 1.5],
      yMax: 10,
      label: "f(2x+1) 是偶函数",
      index: "02",
      message: "f(x)=(x−1)² 本身不是偶函数；但 f(2x+1)=4x² 关于 x=0 对称。"
    }
  };

  function active() { return modes[state.mode]; }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = rect.width;
    state.height = rect.height;
    state.dpr = dpr;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function drawPanel(config, x, y, width, height, kind) {
    var mode = active();
    var worldX = kind === "f" ? mode.xRange : mode.gRange;
    var f = kind === "f" ? mode.f : mode.g;
    var axis = kind === "f" ? mode.axisF : mode.axisG;
    var left = x + 34;
    var right = x + width - 16;
    var top = y + 32;
    var bottom = y + height - 30;
    var zeroY = bottom;
    var yMax = mode.yMax;

    function sx(value) {
      return left + (value - worldX[0]) / (worldX[1] - worldX[0]) * (right - left);
    }
    function sy(value) {
      return bottom - Math.max(0, value) / yMax * (bottom - top);
    }

    ctx.save();
    ctx.fillStyle = "rgba(255,253,247,.72)";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = "rgba(66,76,86,.14)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + .5, y + .5, width - 1, height - 1);

    ctx.fillStyle = "#414a53";
    ctx.font = "600 11px 'Microsoft YaHei', sans-serif";
    ctx.fillText(kind === "f" ? "原函数 f(u)" : "复合函数 g(x)=f(2x+1)", x + 12, y + 19);

    var zeroX = sx(0);
    ctx.strokeStyle = "rgba(76,87,97,.42)";
    ctx.beginPath();
    ctx.moveTo(left, zeroY);
    ctx.lineTo(right, zeroY);
    ctx.moveTo(zeroX, top);
    ctx.lineTo(zeroX, bottom);
    ctx.stroke();

    var axisX = sx(axis);
    ctx.save();
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = "rgba(107,67,199,.48)";
    ctx.beginPath();
    ctx.moveTo(axisX, top);
    ctx.lineTo(axisX, bottom);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#6b43c7";
    ctx.font = "9px 'Cascadia Mono', Consolas, monospace";
    ctx.fillText("轴 " + axis.toFixed(1), Math.min(right - 32, axisX + 4), top + 9);

    var color = kind === "f" ? "#6b43c7" : "#1a63c8";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    var started = false;
    for (var i = 0; i <= 240; i++) {
      var wx = worldX[0] + (worldX[1] - worldX[0]) * i / 240;
      var pixelX = sx(wx);
      var pixelY = sy(f(wx));
      if (!started) {
        ctx.moveTo(pixelX, pixelY);
        started = true;
      } else {
        ctx.lineTo(pixelX, pixelY);
      }
    }
    ctx.stroke();

    var inputs = kind === "f" ? [1 - 2 * state.x, 1 + 2 * state.x] : [-state.x, state.x];
    inputs.forEach(function (input, idx) {
      var px = sx(input);
      var py = sy(f(input));
      ctx.beginPath();
      ctx.arc(px, py, 4.4, 0, Math.PI * 2);
      ctx.fillStyle = idx === 0 ? "#b54d42" : "#1a63b8";
      ctx.fill();
      ctx.fillStyle = "#39434d";
      ctx.font = "9px 'Cascadia Mono', Consolas, monospace";
      ctx.fillText(kind === "f" ? input.toFixed(2) : (input < 0 ? "−x" : "x"), px - (idx ? 8 : 16), py - 8);
    });

    ctx.fillStyle = "#68727d";
    ctx.font = "8px 'Cascadia Mono', Consolas, monospace";
    ctx.fillText("0", zeroX - 4, bottom + 13);
    ctx.restore();
  }

  function draw() {
    if (!state.width || !state.height) return;
    ctx.clearRect(0, 0, state.width, state.height);
    var gap = 10;
    var panelWidth = (state.width - gap * 3) / 2;
    drawPanel(active(), gap, gap, panelWidth, state.height - gap * 2, "f");
    drawPanel(active(), gap * 2 + panelWidth, gap, panelWidth, state.height - gap * 2, "g");
  }

  function refreshText() {
    var mode = active();
    xValue.textContent = "x = " + state.x.toFixed(2).replace("-", "−");
    axisF.textContent = "x = " + mode.axisF.toFixed(1).replace("-", "−");
    axisG.textContent = "x = " + mode.axisG.toFixed(1).replace("-", "−");
    stateIndex.textContent = mode.index;
    liveText.textContent = mode.message;
  }

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      state.mode = button.getAttribute("data-mode");
      modeButtons.forEach(function (item) { item.classList.toggle("active", item === button); });
      refreshText();
      draw();
    });
  });

  xSlider.addEventListener("input", function () {
    state.x = Number(this.value);
    refreshText();
    draw();
  });

  function showGuide() {
    guideDrawer.classList.add("open");
    drawerBackdrop.classList.add("open");
    guideDrawer.setAttribute("aria-hidden", "false");
    guideDrawer.scrollTop = 0;
    closeGuide.focus();
  }

  function hideGuide() {
    guideDrawer.classList.remove("open");
    drawerBackdrop.classList.remove("open");
    guideDrawer.setAttribute("aria-hidden", "true");
    guideButton.focus();
  }

  guideButton.addEventListener("click", showGuide);
  openGuide.addEventListener("click", showGuide);
  closeGuide.addEventListener("click", hideGuide);
  drawerBackdrop.addEventListener("click", hideGuide);
  if (returnCloud) {
    returnCloud.addEventListener("click", function () {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "gml-close-even" }, location.origin);
      } else {
        location.href = "../?v=118#/";
      }
    });
  }
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && guideDrawer.classList.contains("open")) hideGuide();
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(resize).observe(canvas);
  } else {
    window.addEventListener("resize", resize);
  }

  refreshText();
  resize();
}());
