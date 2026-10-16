/*
 * render/text.js — 文本绘制（对齐 pvs/fonts.py 的 text()）。
 * 真机 Android 无微软雅黑时回退系统 sans-serif（抖音平台事实，不挂字体包）。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./draw.js"));
  } else {
    root.PvZText = factory(root.PvZDraw);
  }
})(typeof self !== "undefined" ? self : this, function (D) {
  "use strict";

  // opts: {size,bold,color,center,shadow,align,font}
  function drawText(ctx, s, x, y, opts) {
    opts = opts || {};
    var size = opts.size || 20;
    var weight = opts.bold ? "700" : "400";
    ctx.font = opts.font || (weight + " " + size + "px 'Microsoft YaHei','PingFang SC',sans-serif");
    ctx.textAlign = opts.align || (opts.center ? "center" : "left");
    ctx.textBaseline = opts.center ? "middle" : "top";
    if (opts.shadow) {
      ctx.fillStyle = D.rgb(opts.shadow);
      ctx.fillText(s, x + 2, y + 2);
    }
    ctx.fillStyle = D.rgb(opts.color || [255, 255, 255]);
    ctx.fillText(s, x, y);
  }

  // 预烘文字精灵（图标等不变文字用，如 2x 按钮）
  function textSprite(kit, key, s, size, color, bold) {
    var w = Math.ceil(size * s.length * 1.2) + 8;
    var h = Math.ceil(size * 1.4) + 4;
    return kit.get(key, w, h, function (ctx) {
      drawText(ctx, s, w / 2, h / 2, { size: size, color: color, bold: bold, center: true });
    });
  }

  return { drawText: drawText, textSprite: textSprite };
});
