/*
 * render/assets-common.js — 程序化通用素材：日夜背景、太阳、图标。
 * 1:1 移植 pvs/assets_common.py；静态图元全部烘进离屏 canvas 缓存。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("../config.js"), require("./draw.js"),
                             require("../rng.js"), require("./text.js"));
  } else {
    root.PvZAssetsCommon = factory(root.PvZConfig, root.PvZDraw, root.PvZRng, root.PvZText);
  }
})(typeof self !== "undefined" ? self : this, function (CFG, D, rngMod, Text) {
  "use strict";

  var W = CFG.SCREEN_W, H = CFG.SCREEN_H;

  /* ---------- 太阳 ---------- */

  function sunGlow(kit) {
    return kit.get("sun_glow", 72, 72, function (ctx) {
      for (var i = 10; i > 0; i--) {
        var a = 10 * (i / 10);
        D.circle(ctx, 36, 36, 6 + i * 3, CFG.C.SUN.concat([a]));
      }
    });
  }

  function sunRay(kit) {
    return kit.get("sun_ray", 52, 52, function (ctx) {
      for (var i = 0; i < 8; i++) {
        var ang = Math.PI * 2 * i / 8;
        var x = 26 + Math.cos(ang) * 17;
        var y = 26 + Math.sin(ang) * 17;
        D.polygon(ctx, [
          [x + Math.cos(ang) * 7, y + Math.sin(ang) * 7],
          [26 + Math.cos(ang + 0.35) * 9, 26 + Math.sin(ang + 0.35) * 9],
          [26 + Math.cos(ang - 0.35) * 9, 26 + Math.sin(ang - 0.35) * 9]
        ], CFG.C.SUN);
      }
      D.circle(ctx, 26, 26, 16, CFG.C.SUN);
      D.circle(ctx, 22, 22, 9, CFG.C.SUN_CORE);
    });
  }

  // angle 度，pulse 呼吸倍率（对应 draw_sun）
  function drawSun(ctx, kit, x, y, radius, angle, pulse) {
    angle = angle || 0;
    pulse = pulse == null ? 1 : pulse;
    var gs = Math.max(1, Math.round(72 * radius / 24 * pulse));
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(sunGlow(kit), x - gs / 2, y - gs / 2, gs, gs);
    ctx.restore();
    var rs = Math.max(1, Math.round(52 * radius / 24));
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * Math.PI / 180);
    ctx.drawImage(sunRay(kit), -rs / 2, -rs / 2, rs, rs);
    ctx.restore();
  }

  /* ---------- 背景 ---------- */

  function background(kit, theme) {
    theme = theme || "day";
    return kit.get("bg:" + theme, W, H, function (ctx) {
      var night = theme === "night";
      var pal = night ? CFG.NIGHT : null;
      // 泥土底
      D.rect(ctx, 0, 0, W, H, night ? pal.soil : [124, 86, 52]);
      // 天空渐变
      var g = ctx.createLinearGradient(0, 0, 0, CFG.LAWN_Y);
      g.addColorStop(0, D.rgb(night ? pal.sky_top : [110, 172, 226]));
      g.addColorStop(1, D.rgb(night ? pal.sky_bot : [178, 216, 240]));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, CFG.LAWN_Y);
      if (!night) {
        var clouds = [[260, 30, 1.0], [620, 18, 1.3], [880, 42, 0.9]];
        clouds.forEach(function (cl) {
          var cx = cl[0], cy = cl[1], sc = cl[2];
          [[0, 0, 22], [24, 6, 18], [-24, 6, 16], [10, -10, 16]].forEach(function (p) {
            D.circle(ctx, Math.round(cx + p[0] * sc), Math.round(cy + p[1] * sc),
                     Math.round(p[2] * sc), [245, 250, 255]);
          });
        });
      }
      // 草坪棋盘
      for (var r = 0; r < CFG.ROWS; r++) {
        for (var c = 0; c < CFG.COLS; c++) {
          var col;
          if (night) col = (r + c) % 2 === 0 ? pal.lawn_a : pal.lawn_b;
          else col = (r + c) % 2 === 0 ? CFG.C.LAWN_A : CFG.C.LAWN_B;
          D.rect(ctx, CFG.LAWN_X + c * CFG.CELL_W, CFG.LAWN_Y + r * CFG.CELL_H,
                 CFG.CELL_W, CFG.CELL_H, col);
        }
      }
      // 外框
      D.rect(ctx, CFG.LAWN_X - 6, CFG.LAWN_Y - 6, CFG.LAWN_W + 12, CFG.LAWN_H + 12,
             night ? pal.edge : CFG.C.LAWN_EDGE, 6);
      // 右侧出怪土带
      var soilX = CFG.LAWN_X + CFG.LAWN_W + 6;
      var soilW = W - CFG.LAWN_X - CFG.LAWN_W;
      D.rect(ctx, soilX, CFG.LAWN_Y - 6, soilW, CFG.LAWN_H + 12, night ? pal.soil : [124, 86, 52]);
      soilDots(ctx, soilX, CFG.LAWN_Y - 6, soilW, CFG.LAWN_H + 12, 26, 0, night);
      // 下方泥土带
      var bandX = CFG.HOUSE_W + 10;
      var bandY = CFG.LAWN_Y + CFG.LAWN_H + 6;
      var bandW = W - CFG.HOUSE_W - 10;
      var bandH = H - CFG.LAWN_Y - CFG.LAWN_H;
      soilDots(ctx, bandX, bandY, bandW, bandH, 34, 100, night);
      if (night) drawNightBoard(ctx, kit);
      drawHouse(ctx, night);
      // 车道
      var track = night ? pal.track : [168, 150, 118];
      var trackLine = night ? pal.track_line : [140, 122, 92];
      for (var rr = 0; rr < CFG.ROWS; rr++) {
        var ty = CFG.LAWN_Y + rr * CFG.CELL_H + CFG.CELL_H - 20;
        D.rect(ctx, CFG.HOUSE_W, ty - 8, CFG.LAWN_X - CFG.HOUSE_W + 4, 16, track);
        D.line(ctx, CFG.HOUSE_W, ty - 8, CFG.LAWN_X + 4, ty - 8, 2, trackLine);
      }
    });
  }

  function soilDots(ctx, x, y, w, h, count, seedBase, night) {
    var dot = night ? CFG.NIGHT.soil_dot : [108, 72, 42];
    for (var i = 0; i < count; i++) {
      var rng = rngMod.mulberry32(seedBase + i);
      var dx = x + Math.floor(rng() * (w - 14)) + 4;
      var dy = y + Math.floor(rng() * (h - 12)) + 6;
      var dr = Math.floor(rng() * 3) + 2;
      D.circle(ctx, dx, dy, dr, dot);
    }
  }

  function drawNightBoard(ctx, kit) {
    var rng = rngMod.mulberry32(6);
    var mx = CFG.LAWN_X + CFG.LAWN_W - 92;
    var my = CFG.LAWN_Y + 52;
    var mr = 24;
    for (var i = 0; i < 46; i++) {
      var x, y;
      if (rng() < 0.75) {
        x = CFG.LAWN_X + 12 + Math.floor(rng() * (CFG.LAWN_W - 24));
        y = CFG.LAWN_Y + 8 + Math.floor(rng() * (CFG.CELL_H * 2 - 18));
      } else {
        x = CFG.LAWN_X + CFG.LAWN_W + 14 + Math.floor(rng() * (W - CFG.LAWN_X - CFG.LAWN_W - 26));
        y = CFG.LAWN_Y + 10 + Math.floor(rng() * (CFG.LAWN_H - 30));
      }
      if ((x - mx) * (x - mx) + (y - my) * (y - my) < (mr + 16) * (mr + 16)) continue;
      var rr = rng() < 0.8 ? 1 : 2;
      var col = rng() < 0.7 ? [190, 200, 230] : [140, 152, 196];
      D.circle(ctx, x, y, rr, col);
    }
    // 月光晕：径向衰减烘进 RGB（对应 Python PixelArray 版本）
    var gs = 124, gh = 62;
    var img = ctx.createImageData(gs, gs);
    var data = img.data;
    var span = gh - 1 - mr;
    for (var iy = 0; iy < gs; iy++) {
      var dy = iy - gh + 0.5;
      for (var ix = 0; ix < gs; ix++) {
        var d = Math.hypot(ix - gh + 0.5, dy);
        if (d <= mr) continue;
        var u = Math.min(1, (d - mr) / span);
        var f = Math.pow(1 - u, 1.5);
        if (f > 0.02) {
          var p = (iy * gs + ix) * 4;
          data[p] = Math.round(44 * f);
          data[p + 1] = Math.round(47 * f);
          data[p + 2] = Math.round(54 * f);
          data[p + 3] = 255;
        }
      }
    }
    // putImageData 不参与合成（直接替换像素），加性发光要先烘到离屏再 drawImage(lighter)
    var glowC = kit.canvas(gs, gs);
    glowC.getContext("2d").putImageData(img, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(glowC, mx - gh, my - gh);
    ctx.restore();
    D.circle(ctx, mx, my, mr, [246, 246, 228]);
    D.circle(ctx, mx - 6, my - 8, 16, [252, 252, 238]);
    D.circle(ctx, mx - 8, my - 4, 5, [224, 224, 200]);
    D.circle(ctx, mx + 8, my + 8, 4, [224, 224, 200]);
    D.circle(ctx, mx + 3, my - 11, 3, [224, 224, 200]);
  }

  function drawHouse(ctx, night) {
    var x = 0, y = CFG.LAWN_Y - 10;
    var wall = night ? [146, 128, 106] : [236, 214, 170];
    D.rect(ctx, x, y + 110, CFG.HOUSE_W + 10, CFG.LAWN_H + 20, wall);
    D.polygon(ctx, [[x - 10, y + 120], [x + 64, y + 30], [x + CFG.HOUSE_W + 16, y + 120]], [178, 60, 46]);
    D.polygon(ctx, [[x - 10, y + 120], [x + 64, y + 30], [x + 64, y + 120]], [150, 46, 36]);
    var doorY = y + 110 + 2 * CFG.CELL_H + 6;
    D.rect(ctx, x + 38, doorY, 46, CFG.CELL_H - 12, [110, 72, 40], 0, 6);
    D.rect(ctx, x + 38, doorY, 46, 10, [90, 56, 30], 0, 6);
    D.circle(ctx, x + 74, doorY + 40, 4, [240, 210, 90]);
    var winCol = night ? [255, 206, 120] : [150, 200, 225];
    var frame = night ? [120, 92, 60] : [240, 230, 200];
    [y + 110 + 18, y + 110 + CFG.CELL_H * 3 + 18].forEach(function (wy) {
      D.rect(ctx, x + 18, wy, 34, 34, winCol, 0, 4);
      D.rect(ctx, x + 18, wy, 34, 34, frame, 4, 4);
      D.line(ctx, x + 35, wy, x + 35, wy + 34, 3, frame);
      D.line(ctx, x + 18, wy + 17, x + 52, wy + 17, 3, frame);
    });
  }

  /* ---------- 图标 ---------- */

  function shovelIcon(kit) {
    return kit.get("icon_shovel", 56, 64, function (ctx) {
      D.line(ctx, 42, 8, 20, 40, 7, [146, 100, 56]);
      D.line(ctx, 40, 6, 18, 38, 3, [176, 128, 78]);
      D.line(ctx, 38, 4, 48, 14, 6, [120, 80, 44]);
      D.polygon(ctx, [[18, 38], [10, 50], [22, 58], [30, 46]], [170, 178, 190]);
      D.polygon(ctx, [[18, 38], [14, 48], [22, 56], [26, 46]], [210, 216, 226]);
    });
  }

  function pauseIcon(kit) {
    return kit.get("icon_pause", 40, 40, function (ctx) {
      D.rect(ctx, 10, 8, 7, 24, CFG.C.TEXT, 0, 2);
      D.rect(ctx, 23, 8, 7, 24, CFG.C.TEXT, 0, 2);
    });
  }

  function speedIcon(kit) {
    return kit.get("icon_speed", 40, 40, function (ctx) {
      Text.drawText(ctx, "2x", 20, 21, { size: 20, color: CFG.C.TEXT, bold: true, center: true });
    });
  }

  return {
    drawSun: drawSun,
    background: background,
    shovelIcon: shovelIcon,
    pauseIcon: pauseIcon,
    speedIcon: speedIcon
  };
});
