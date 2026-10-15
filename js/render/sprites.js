/*
 * render/sprites.js — 离屏 canvas 工厂 + Map 缓存。
 * 替代 Python 版 @functools.lru_cache + pygame.Surface：
 * Python 每帧 new Surface 在手机上必爆，所有静态图元一次性烘到离屏 canvas。
 * createCanvas 注入：真机 tt.createCanvas 第二次起返回离屏画布；harness 用 document.createElement。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PvZSprites = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function createKit(createCanvas) {
    var cache = new Map();

    function canvas(w, h) {
      var c = createCanvas();
      c.width = w;
      c.height = h;
      return c;
    }

    // key 命中直接复用；否则建 w×h 离屏画布交给 fn(ctx, canvas) 烘绘
    function get(key, w, h, fn) {
      if (cache.has(key)) return cache.get(key);
      var c = canvas(w, h);
      fn(c.getContext("2d"), c);
      cache.set(key, c);
      return c;
    }

    function has(key) { return cache.has(key); }
    function clear() { cache.clear(); }

    // 整株白色剪影（受击/冰冻闪白，对应 plant_silhouette 的 mask.to_surface）
    function silhouette(src, key) {
      if (key && cache.has(key)) return cache.get(key);
      var w = src.width, h = src.height;
      var c = canvas(w, h);
      var ctx = c.getContext("2d");
      ctx.drawImage(src, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      if (key) cache.set(key, c);
      return c;
    }

    return { canvas: canvas, get: get, has: has, clear: clear, silhouette: silhouette };
  }

  return { createKit: createKit };
});
