/*
 * touch.js — 触摸坐标归一（纯函数，Node 可测），平台层 main.js 注入 touch 与系统信息。
 *
 * 抖音触摸文档只保证 screenX/screenY，浏览器/微信给 clientX。真机个别机型
 * 在高 DPR 下按物理像素上报（越界量达数百~数千 px），首触时自校正 1/dpr（不可逆）。
 *
 * 阈值用 screenWidth/Height 而非 windowWidth/Height：Android 窗口常窄于屏幕
 * （状态栏/导航栏），点到屏幕边缘 screenX 可略大于 vw 但恒 ≤ screenWidth，
 * 用窗口阈值会把这种小越界误判成物理像素，且校正一次不可逆 → 整机触控永久失灵。
 *
 * 横屏轴对调（screenX 沿短边上报）单点无法可靠判别，M0 不自动交换：
 * 只在归一后仍越窗时置 stillOut 标志 + 首触 probe 日志，由真机画面十字光标肉眼确认。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PvZTouch = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function createState() {
    return { scaleX: 1, scaleY: 1, probed: false };
  }

  function normalizePoint(touch, info, st) {
    var hasClient = touch.clientX != null;
    var px = hasClient ? touch.clientX : touch.screenX;
    var py = hasClient ? touch.clientY : touch.screenY;

    var sw = info.screenWidth || info.screenW || info.vw;
    var sh = info.screenHeight || info.screenH || info.vh;
    var dpr = info.dpr || info.pixelRatio || 1;

    var normalized = false;
    if (!hasClient && st.scaleX === 1 && dpr > 1 &&
        (px > sw + 2 || py > sh + 2 || px < -2 || py < -2)) {
      st.scaleX = st.scaleY = 1 / dpr;
      normalized = true;
    }
    // clientX 恒为逻辑坐标，不参与 screen 系的物理像素校正
    // （即便某机型混报「逻辑 clientX + 物理 screenX」也不会被二次缩小）
    var sx = hasClient ? 1 : st.scaleX;
    var sy = hasClient ? 1 : st.scaleY;
    px *= sx;
    py *= sy;

    var stillOut = normalized &&
      (px > info.vw + 4 || py > info.vh + 4 || px < -4 || py < -4);

    var probe = null;
    if (!st.probed) {
      st.probed = true;
      probe = {
        clientX: touch.clientX, clientY: touch.clientY,
        screenX: touch.screenX, screenY: touch.screenY,
        vw: info.vw, vh: info.vh, dpr: dpr,
        screenW: sw, screenH: sh,
        norm: st.scaleX,
        landscape: info.vw > info.vh
      };
    }

    return { x: px, y: py, normalized: normalized, stillOut: stillOut, probe: probe };
  }

  return { createState: createState, normalizePoint: normalizePoint };
});
