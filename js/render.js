/*
 * render.js — M0 平台探针画面（纯 Canvas 绘制，吃 ctx 与 model，无平台依赖）。
 * 用途：真机一眼确认横屏触摸旋向与 DPR 归一——触点画十字、落格高亮、坐标读数。
 * M1 起本文件拆分为 render/ 多模块（背景/精灵/HUD/菜单）。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./config.js"), require("./util.js"));
  } else {
    root.PvZRender = factory(root.PvZConfig, root.PvZUtil);
  }
})(typeof self !== "undefined" ? self : this, function (CFG, util) {
  "use strict";

  var W = CFG.SCREEN_W, H = CFG.SCREEN_H;

  // a 仅对三通道色生效；四通道色自带 alpha（a 非空时会忽略其第 4 通道，勿这样调用）
  function rgb(c, a) {
    if (a == null) return c.length === 4 ? "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (c[3] / 255) + ")" : "rgb(" + c.slice(0, 3).join(",") + ")";
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  function text(ctx, s, x, y, size, col, align, weight) {
    ctx.fillStyle = col || rgb(CFG.C.TEXT);
    ctx.font = (weight || "600") + " " + size + "px sans-serif";
    ctx.textAlign = align || "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(s, x, y);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBackground(ctx) {
    ctx.fillStyle = rgb(CFG.C.SKY);
    ctx.fillRect(0, 0, W, H);

    // HUD 木栏
    ctx.fillStyle = rgb(CFG.C.WOOD_DARK);
    ctx.fillRect(0, 0, W, CFG.HUD_H - 6);
    ctx.fillStyle = rgb(CFG.C.WOOD);
    ctx.fillRect(0, 0, W, CFG.HUD_H - 12);
    for (var x = 0; x < W; x += 54) {
      ctx.fillStyle = rgb(CFG.C.WOOD_LIGHT, 0.25);
      ctx.fillRect(x + 4, 8, 2, CFG.HUD_H - 24);
    }

    // 草坪棋盘
    for (var r = 0; r < CFG.ROWS; r++) {
      for (var c = 0; c < CFG.COLS; c++) {
        var cell = util.cellRect(c, r);
        ctx.fillStyle = rgb((r + c) % 2 === 0 ? CFG.C.LAWN_A : CFG.C.LAWN_B);
        ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
      }
    }
    ctx.strokeStyle = rgb(CFG.C.LAWN_EDGE, 0.8);
    ctx.lineWidth = 3;
    ctx.strokeRect(CFG.LAWN_X, CFG.LAWN_Y, CFG.LAWN_W, CFG.LAWN_H);

    // 房子/防线
    ctx.fillStyle = rgb(CFG.C.PANEL);
    ctx.fillRect(CFG.HOUSE_X, CFG.LAWN_Y - 10, 40, CFG.LAWN_H + 20);
    text(ctx, "家", CFG.HOUSE_X + 20, CFG.H / 2, 22, rgb(CFG.C.TEXT), "center");

    // 出怪线
    ctx.strokeStyle = rgb(CFG.C.WHITE, 0.35);
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(CFG.ZOMBIE_SPAWN_X, CFG.LAWN_Y);
    ctx.lineTo(CFG.ZOMBIE_SPAWN_X, CFG.LAWN_Y + CFG.LAWN_H);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawHud(ctx, model) {
    text(ctx, "M0 横屏触摸探针", 20, 34, 22, rgb(CFG.C.TEXT), "left", "700");
    text(ctx, "点屏幕任意处：十字=触点，格子高亮=落格（col,row）", 20, 64, 15, rgb(CFG.C.TEXT, 0.85));
    var info = model.info || {};
    var right =
      "window " + info.vw + "×" + info.vh +
      "  screen " + (info.screenW || "?") + "×" + (info.screenH || "?") +
      "  dpr " + info.dpr +
      "  audio api " + (model.audioSupported ? "Y" : "N") +
      "  ctx " + (model.audioReady ? "ok" : "–");
    text(ctx, right, W - 20, 34, 15, rgb(CFG.C.TEXT, 0.9), "right");
    text(ctx, "touches " + Object.keys(model.touches).length + (model.paused ? "  · onHide 已触发" : ""), W - 20, 64, 15, rgb(CFG.C.TEXT, 0.9), "right");
  }

  function drawTouch(ctx, id, p) {
    var inLawn = util.pointInLawn(p.x, p.y);
    if (inLawn) {
      var col = util.colOfX(p.x), row = util.rowOfY(p.y);
      var cell = util.cellRect(col, row);
      ctx.fillStyle = rgb(CFG.C.SUN, 0.35);
      ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
    }

    ctx.strokeStyle = rgb(CFG.C.RED);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p.x - 22, p.y); ctx.lineTo(p.x - 7, p.y);
    ctx.moveTo(p.x + 7, p.y); ctx.lineTo(p.x + 22, p.y);
    ctx.moveTo(p.x, p.y - 22); ctx.lineTo(p.x, p.y - 7);
    ctx.moveTo(p.x, p.y + 7); ctx.lineTo(p.x, p.y + 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = rgb(CFG.C.RED);
    ctx.fill();

    var label = "#" + id + "  (" + Math.round(p.x) + "," + Math.round(p.y) + ")" +
      (inLawn ? "  →" + util.colOfX(p.x) + "," + util.rowOfY(p.y) : "");
    var boxW = 13 * label.length + 16;
    ctx.fillStyle = rgb(CFG.C.BLACK, 0.65);
    roundRect(ctx, p.x + 14, p.y - 30, boxW, 24, 5);
    ctx.fill();
    text(ctx, label, p.x + 22, p.y - 13, 13, rgb(CFG.C.WHITE));
  }

  function drawHint(ctx, model) {
    if (Object.keys(model.touches).length > 0 || model.hintDismissed) return;
    ctx.fillStyle = rgb(CFG.C.BLACK, 0.45);
    roundRect(ctx, W / 2 - 300, H / 2 + 90, 600, 56, 10);
    ctx.fill();
    text(ctx, "真机核对：手指点哪里，十字就应在哪里；若整体偏轴/镜像 → 横屏轴对调，需在平台层交换映射", W / 2, H / 2 + 125, 16, rgb(CFG.C.TEXT), "center");
  }

  function draw(ctx, model) {
    drawBackground(ctx);
    Object.keys(model.touches).forEach(function (id) {
      drawTouch(ctx, id, model.touches[id]);
    });
    drawHud(ctx, model);
    drawHint(ctx, model);
  }

  return { W: W, H: H, draw: draw, rgb: rgb };
});
