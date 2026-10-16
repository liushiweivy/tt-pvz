/*
 * render/draw.js — Canvas 图元（对齐 pygame.draw 调用习惯）+ 颜色拼装。
 * 全部函数吃 ctx，无平台依赖；颜色一律 config 的 [r,g,b] / [r,g,b,a] 数组。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("../config.js"));
  } else {
    root.PvZDraw = factory(root.PvZConfig);
  }
})(typeof self !== "undefined" ? self : this, function (CFG) {
  "use strict";

  // a 仅对三通道色生效；四通道色自带 alpha
  function rgb(c, a) {
    if (a == null) {
      return c.length === 4
        ? "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (c[3] / 255) + ")"
        : "rgb(" + c.slice(0, 3).join(",") + ")";
    }
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  function fillCircle(ctx, x, y, r, col) {
    ctx.fillStyle = rgb(col);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // width>0 描边（对应 pygame.draw.circle(..., width)）
  function circle(ctx, x, y, r, col, width) {
    if (!width) return fillCircle(ctx, x, y, r, col);
    ctx.strokeStyle = rgb(col);
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // pygame ellipse(surf, color, rect=(x,y,w,h), width)
  function ellipse(ctx, x, y, w, h, col, width) {
    if (!width) {
      ctx.fillStyle = rgb(col);
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = rgb(col);
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function rect(ctx, x, y, w, h, col, width, radius) {
    if (radius) {
      roundRectPath(ctx, x, y, w, h, radius);
      if (!width) { ctx.fillStyle = rgb(col); ctx.fill(); }
      else { ctx.strokeStyle = rgb(col); ctx.lineWidth = width; ctx.stroke(); }
      return;
    }
    if (!width) {
      ctx.fillStyle = rgb(col);
      ctx.fillRect(x, y, w, h);
    } else {
      ctx.strokeStyle = rgb(col);
      ctx.lineWidth = width;
      ctx.strokeRect(x, y, w, h);
    }
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function polygon(ctx, pts, col, width) {
    if (!pts.length) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (!width) { ctx.fillStyle = rgb(col); ctx.fill(); }
    else { ctx.strokeStyle = rgb(col); ctx.lineWidth = width; ctx.stroke(); }
  }

  function line(ctx, x1, y1, x2, y2, width, col) {
    ctx.strokeStyle = rgb(col);
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function lines(ctx, pts, width, col) {
    if (pts.length < 2) return;
    ctx.strokeStyle = rgb(col);
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }

  // pygame.draw.arc(surf, col, rect, startRad, endRad, width)；y 向下，角度正向视觉顺时针，与 canvas 一致
  function arc(ctx, x, y, w, h, a0, a1, width, col) {
    ctx.strokeStyle = rgb(col);
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, a0, a1);
    ctx.stroke();
  }

  // 一对朝右看的眼睛（assets_common.eyes）
  function eyes(ctx, x, y, r, opts) {
    opts = opts || {};
    var spacing = opts.spacing != null ? opts.spacing : Math.floor(r * 1.3);
    var pr = opts.pupilR != null ? opts.pupilR : Math.max(2, Math.floor(r / 2));
    var look = opts.look || [2, 0];
    var white = opts.white || [250, 250, 250];
    var dark = opts.dark || [30, 30, 30];
    var dx;
    for (var i = -1; i <= 1; i += 2) {
      dx = (i < 0 ? -Math.floor(spacing / 2) : Math.floor(spacing / 2));
      fillCircle(ctx, x + dx, y, r, white);
      fillCircle(ctx, x + dx + look[0], y + (look[1] || 0), pr, dark);
    }
  }

  return {
    rgb: rgb, circle: circle, fillCircle: fillCircle, ellipse: ellipse,
    rect: rect, roundRectPath: roundRectPath, polygon: polygon,
    line: line, lines: lines, arc: arc, eyes: eyes
  };
});
