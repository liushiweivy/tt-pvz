/*
 * main.js — 植物大战僵尸 · 抖音小游戏平台层（M0 脚手架/横屏探针）
 * 横屏 1080x720 逻辑世界，等比缩放 letterbox；固定 60Hz 步长（M2 起接 level.update）。
 * M0 职责：平台四件套打通、触摸坐标归一/横屏旋向探针、音频能力探测、生命周期。
 */
var CFG = require("./config.js");
var RNG = require("./rng.js");
var Touch = require("./touch.js");
var PvZAudio = require("./audio.js");
var R = require("./render.js");

// 平台对象：抖音 tt 优先，兼容微信 wx（浏览器 harness 注入 tt shim）
var api = (typeof tt !== "undefined" && tt) || (typeof wx !== "undefined" && wx) || null;

var sysInfo = api.getWindowInfo ? api.getWindowInfo() : api.getSystemInfoSync();
var dpr = sysInfo.pixelRatio || 1;
var vw = sysInfo.windowWidth;
var vh = sysInfo.windowHeight;

var canvas = api.createCanvas();
canvas.width = Math.round(vw * dpr);
canvas.height = Math.round(vh * dpr);
var ctx = canvas.getContext("2d");

var scale = Math.min(vw / R.W, vh / R.H);
var offX = (vw - R.W * scale) / 2;
var offY = (vh - R.H * scale) / 2;

/* ---------- 触摸 / 模型 ---------- */

var touchState = Touch.createState();
var touchInfo = {
  vw: vw, vh: vh, dpr: dpr,
  screenW: sysInfo.screenWidth || vw,
  screenH: sysInfo.screenHeight || vh
};

var model = {
  touches: {},          // identifier -> {x, y}（世界坐标）
  info: touchInfo,
  audioSupported: PvZAudio.isAudioSupported(),
  paused: false,
  hintDismissed: false
};

function toWorld(touch) {
  var r = Touch.normalizePoint(touch, touchInfo, touchState);
  if (r.probe) {
    try { console.log("[probe] touch", JSON.stringify(r.probe)); } catch (e) {}
  }
  if (r.stillOut) {
    try { console.warn("[probe] touch still out of window after DPR normalize", JSON.stringify({ x: r.x, y: r.y, vw: vw, vh: vh })); } catch (e) {}
  }
  return { x: (r.x - offX) / scale, y: (r.y - offY) / scale };
}

api.onTouchStart(function (e) {
  PvZAudio.ensure();
  model.hintDismissed = true;
  var touches = e.changedTouches || [];
  for (var i = 0; i < touches.length; i++) {
    var t = touches[i];
    var p = toWorld(t);
    model.touches[t.identifier] = p;
  }
});

api.onTouchMove(function (e) {
  var touches = e.changedTouches || [];
  for (var i = 0; i < touches.length; i++) {
    var t = touches[i];
    if (!model.touches[t.identifier]) continue;
    model.touches[t.identifier] = toWorld(t);
  }
});

function endTouches(e) {
  var touches = e.changedTouches || [];
  for (var i = 0; i < touches.length; i++) delete model.touches[touches[i].identifier];
}
api.onTouchEnd(endTouches);
api.onTouchCancel(endTouches);

/* ---------- 生命周期 ---------- */

if (api.setKeepScreenOn) {
  try { api.setKeepScreenOn({ keepScreenOn: true }); } catch (e) {}
}

var last = Date.now();
if (api.onHide) api.onHide(function () {
  model.paused = true;
  model.touches = {};
  last = Date.now();
});
if (api.onShow) api.onShow(function () {
  model.paused = false;
  last = Date.now();
  PvZAudio.resetFailed(); // 后台期间音频服务可能已恢复，放行一次重试
  PvZAudio.ensure();
});

// 音频能力探针（基础库 ≥1.34.0 才有 tt.getAudioContext）
try {
  console.log("[probe] audio", JSON.stringify({
    hasGetAudioContext: typeof tt !== "undefined" && !!tt && typeof tt.getAudioContext === "function",
    supported: PvZAudio.isAudioSupported()
  }));
} catch (e) {}

/* ---------- 固定步长主循环（M0 暂无逻辑步，框架先立，M2 接 level.update） ---------- */

var STEP = 1 / CFG.FPS;
var acc = 0;

function frame() {
  var now = Date.now();
  var dt = (now - last) / 1000;
  last = now;
  acc += Math.min(dt, 0.1);
  var guard = 0;
  while (acc >= STEP && guard < 5) {
    // M2：level.update(STEP, rng)
    acc -= STEP;
    guard++;
  }
  acc = Math.min(acc, STEP * 2);

  model.audioReady = !!PvZAudio.getContext(); // 实际创建结果（区别于启动时的 API 存在性快照）

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, vw * dpr, vh * dpr);

  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offX, dpr * offY);
  R.draw(ctx, model);

  requestAnimationFrame(frame);
}

if (typeof globalThis !== "undefined") {
  globalThis.__pvz = {
    model: model,
    config: CFG,
    rng: RNG,
    touchState: touchState,
    sysInfo: sysInfo,
    audio: function () { return PvZAudio.getContext(); } // 真机核对实际音频上下文
  };
}
requestAnimationFrame(frame);
