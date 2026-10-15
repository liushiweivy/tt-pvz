/*
 * util.js — 数学/场地坐标辅助（移植自 pvs/util.py，纯函数无平台依赖）。
 * 注意：Python // 是地板除，JS 对负数向零截断，移植代码统一用 floorDiv。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./config.js"));
  } else {
    root.PvZUtil = factory(root.PvZConfig);
  }
})(typeof self !== "undefined" ? self : this, function (CFG) {
  "use strict";

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function easeOutCubic(t) {
    t = clamp(t, 0, 1);
    return 1 - Math.pow(1 - t, 3);
  }

  function easeOutBack(t) {
    t = clamp(t, 0, 1);
    var c1 = 1.70158;
    var c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // 地板除（Python // 语义）
  function floorDiv(a, b) { return Math.floor(a / b); }

  /** 格子矩形（col 0..8, row 0..4） */
  function cellRect(col, row) {
    return { x: CFG.LAWN_X + col * CFG.CELL_W, y: CFG.LAWN_Y + row * CFG.CELL_H, w: CFG.CELL_W, h: CFG.CELL_H };
  }

  function cellCenter(col, row) {
    var r = cellRect(col, row);
    // CELL_W/H 当前为偶数结果相同；统一走 floorDiv，若改奇数尺寸仍符合 Python // 语义
    return { x: r.x + floorDiv(r.w, 2), y: r.y + floorDiv(r.h, 2) };
  }

  function rowOfY(y) {
    return clamp(Math.floor((y - CFG.LAWN_Y) / CFG.CELL_H), 0, CFG.ROWS - 1);
  }

  function colOfX(x) {
    return clamp(Math.floor((x - CFG.LAWN_X) / CFG.CELL_W), 0, CFG.COLS - 1);
  }

  function pointInLawn(x, y) {
    return x >= CFG.LAWN_X && x < CFG.LAWN_X + CFG.COLS * CFG.CELL_W &&
           y >= CFG.LAWN_Y && y < CFG.LAWN_Y + CFG.ROWS * CFG.CELL_H;
  }

  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

  return {
    clamp: clamp, lerp: lerp, easeOutCubic: easeOutCubic, easeOutBack: easeOutBack,
    floorDiv: floorDiv, cellRect: cellRect, cellCenter: cellCenter,
    rowOfY: rowOfY, colOfX: colOfX, pointInLawn: pointInLawn, dist: dist
  };
});
