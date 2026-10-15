/*
 * rng.js — 注入式确定性随机源（移植自 Python random.* 调用点的替代）。
 * 平衡矩阵/bot 测试用固定种子复现；真机由 main 注入时间种子。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PvZRng = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 替代 Python random.uniform(a,b)：rng 注入
  function uniform(rng, a, b) {
    return a + (b - a) * rng();
  }

  // 整数 [lo, hi]（替代 randint）
  function randint(rng, lo, hi) {
    return Math.floor(lo + rng() * (hi - lo + 1));
  }

  // 从数组取一项
  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  return { mulberry32: mulberry32, uniform: uniform, randint: randint, pick: pick };
});
