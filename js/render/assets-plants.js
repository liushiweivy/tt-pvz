/*
 * render/assets-plants.js — 17 植物程序化立绘，1:1 移植 pvs/assets_plants.py。
 * plantImage(kit,name,state,frame) 按 (种类,状态,帧) 烘 96×96 离屏 canvas 并缓存。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./draw.js"), require("./text.js"));
  } else {
    root.PvZAssetsPlants = factory(root.PvZDraw, root.PvZText);
  }
})(typeof self !== "undefined" ? self : this, function (D, Text) {
  "use strict";

  var S = 96;
  var BASE_Y = 84;
  var TAU = Math.PI * 2;

  /* ---------- 通用部件 ---------- */

  function stem(ctx, x, top, color, width, sway) {
    x = x == null ? 48 : x;
    top = top == null ? 52 : top;
    color = color || [58, 130, 44];
    width = width || 8;
    sway = sway || 0;
    D.line(ctx, x, BASE_Y, x + sway, top, width, color);
    D.ellipse(ctx, x - 20, BASE_Y - 22, 22, 12, color);
    D.ellipse(ctx, x + 2, BASE_Y - 30, 22, 12, [78, 158, 58]);
  }

  function outlineBlob(ctx, cx, cy, r, color, outline, sx, sy) {
    sx = sx == null ? 1 : sx;
    sy = sy == null ? 1 : sy;
    outline = outline || [30, 60, 24];
    var rx = Math.round(r * sx) + 3;
    var ry = Math.round(r * sy) + 3;
    D.ellipse(ctx, cx - rx, cy - ry, rx * 2, ry * 2, outline);
    D.ellipse(ctx, cx - rx + 3, cy - ry + 3, (rx - 3) * 2, (ry - 3) * 2, color);
  }

  function rotatedEllipse(ctx, cx, cy, w, h, col, rotRad) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotRad);
    D.ellipse(ctx, -w, -h, w * 2, h * 2, col);
    ctx.restore();
  }

  // 嘴管离屏 sprite（各射手一套配色）
  function tubeSprite(kit, key, dark, snout, mouth, tw, th, mouthR, mouthW) {
    tw = tw || 32; th = th || 16;
    var wCanvas = tw + 2, hCanvas = th + 4;
    return kit.get("tube:" + key, wCanvas, hCanvas, function (ctx) {
      D.ellipse(ctx, 0, 2, tw, th, dark);
      D.ellipse(ctx, 2, 4, tw - 4, th - 4, snout);
      D.circle(ctx, tw - 2, hCanvas / 2, mouthR || 6, mouth || [40, 80, 30], mouthW || 2);
    });
  }

  function stampRotated(ctx, img, cx, cy, deg) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(deg * Math.PI / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }

  function shooterBody(ctx, kit, body, dark, snout, mouth, ice, dbl, frameBlink, three) {
    stem(ctx, 48, 46);
    var cx = 46, cy = 38;
    outlineBlob(ctx, cx, cy, 21, body);
    var tube = three
      ? tubeSprite(kit, "three", dark, snout, mouth, 28, 12, 4)
      : tubeSprite(kit, dbl ? "rep" : (ice ? "snow" : "pea"), dark, snout, mouth);
    // tube surface 34×20，blit 于 (cx+12, cy-10)，中心 (cx+29, cy)
    ctx.drawImage(tube, cx + 12, cy - 10);
    if (dbl) stampRotated(ctx, tube, cx + 29, cy - 12, -8);
    if (three) {
      stampRotated(ctx, tube, cx + 22, cy - 24, 22);
      stampRotated(ctx, tube, cx + 22, cy + 14, -26);
    }
    D.eyes(ctx, cx - 4, cy - 5, 7, { look: [3, 0], spacing: 14, pupilR: 3 });
    if (ice) {
      [[-8, -20, 5], [2, -23, 6], [10, -18, 4]].forEach(function (p) {
        var ox = p[0], oy = p[1], rr = p[2];
        D.polygon(ctx, [
          [cx + ox, cy + oy - rr],
          [cx + ox - rr * 0.7, cy + oy + rr * 0.7],
          [cx + ox + rr * 0.7, cy + oy + rr * 0.7]
        ], [220, 248, 255]);
      });
      D.circle(ctx, cx + 18, cy - 14, 2, [220, 250, 255]);
    }
  }

  /* ---------- 具体植物 ---------- */

  function sunflower(ctx, state, frame) {
    var sway = frame ? 2 : 0;
    stem(ctx, 48, 50, undefined, undefined, sway);
    var cx = 48 + sway, cy = 40;
    var petal = frame ? [255, 206, 48] : [255, 216, 64];
    var petalDark = [238, 178, 30];
    var n = 12;
    for (var i = 0; i < n; i++) {
      var ang = TAU * i / n + (frame ? 0.08 : 0);
      var px = cx + Math.cos(ang) * 24;
      var py = cy + Math.sin(ang) * 24;
      var w = i % 2 === 0 ? 13 : 10;
      var h = i % 2 === 0 ? 20 : 17;
      var rot = -ang + Math.PI / 2;
      rotatedEllipse(ctx, px, py, w, h, petalDark, rot);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rot);
      D.ellipse(ctx, -(w - 2), -(h - 1.5), w * 2 - 4, h * 2 - 3, petal);
      ctx.restore();
    }
    outlineBlob(ctx, cx, cy, 20, [112, 74, 36], [74, 48, 22]);
    D.ellipse(ctx, cx - 16, cy - 15, 32, 31, [134, 92, 48]);
    if (frame === 2) {
      D.arc(ctx, cx - 12, cy - 8, 10, 8, 3.4, 6.1, 2, [30, 20, 10]);
      D.arc(ctx, cx + 2, cy - 8, 10, 8, 3.4, 6.1, 2, [30, 20, 10]);
    } else {
      D.eyes(ctx, cx, cy - 4, 6, { spacing: 13, pupilR: 3 });
    }
    D.circle(ctx, cx - 11, cy + 6, 3, [220, 140, 90]);
    D.circle(ctx, cx + 11, cy + 6, 3, [220, 140, 90]);
    D.arc(ctx, cx - 8, cy + 2, 16, 12, 3.4, 6.05, 2, [50, 28, 12]);
  }

  function peashooter(ctx, kit, state, frame) {
    shooterBody(ctx, kit, [84, 178, 54], [54, 130, 36], [104, 200, 64], null, false, false, frame === 1, false);
  }

  function snowpea(ctx, kit, state, frame) {
    shooterBody(ctx, kit, [96, 196, 214], [60, 140, 170], [140, 224, 240], [50, 120, 160], true, false, frame === 1, false);
  }

  function repeater(ctx, kit, state, frame) {
    shooterBody(ctx, kit, [70, 158, 64], [44, 110, 40], [96, 188, 72], null, false, true, frame === 1, false);
  }

  function threepeater(ctx, kit, state, frame) {
    stem(ctx, 48, 46);
    var cx = 42, cy = 42;
    outlineBlob(ctx, cx, cy, 19, [84, 178, 54], [50, 122, 34]);
    shooterTubes3(ctx, kit, cx, cy);
    D.eyes(ctx, cx - 5, cy - 6, 6, { look: [3, 0], spacing: 12, pupilR: 3 });
  }

  function shooterTubes3(ctx, kit, cx, cy) {
    var tube = tubeSprite(kit, "three", [50, 122, 34], [104, 200, 64], [40, 82, 30], 28, 12, 4);
    ctx.drawImage(tube, cx + 12, cy - 8);
    stampRotated(ctx, tube, cx + 4 + 15, cy - 32 + 8, 22);
    stampRotated(ctx, tube, cx + 4 + 15, cy + 6 + 8, -26);
  }

  function wallnut(ctx, state, frame) {
    var cx = 48;
    D.ellipse(ctx, 20, 82, 56, 10, [0, 0, 0, 50]);
    D.ellipse(ctx, 16, 14, 64, 74, [120, 76, 36]);
    D.ellipse(ctx, 20, 18, 56, 66, [190, 138, 78]);
    D.ellipse(ctx, 26, 22, 40, 28, [214, 164, 100]);
    D.rect(ctx, 44, 8, 8, 10, [72, 100, 40], 0, 3);
    if (state >= 1) {
      D.lines(ctx, [[36, 24], [42, 38], [34, 50], [40, 64]], 3, [90, 52, 22]);
    }
    if (state >= 2) {
      D.lines(ctx, [[62, 26], [56, 42], [64, 56], [56, 74]], 3, [90, 52, 22]);
      D.lines(ctx, [[30, 68], [40, 72], [46, 80]], 2, [90, 52, 22]);
    }
    if (state >= 2 && frame) {
      D.line(ctx, 34, 46, 44, 46, 3, [50, 30, 14]);
      D.line(ctx, 54, 46, 64, 48, 3, [50, 30, 14]);
    } else {
      D.eyes(ctx, cx, 44, 7, { spacing: 20, pupilR: 3 });
    }
    D.arc(ctx, 36, 52, 24, 14, 3.4, 6.1, 3, [90, 52, 22]);
    D.line(ctx, 48, 58, 48, 66, 2, [250, 240, 210]);
  }

  function cherry(ctx, state, frame) {
    [[36, 58, [206, 36, 44]], [62, 60, [220, 44, 50]]].forEach(function (b) {
      var cx = b[0], cy = b[1];
      D.ellipse(ctx, cx - 20, cy + 14, 40, 12, [0, 0, 0, 45]);
      D.circle(ctx, cx, cy, 22, [130, 18, 26]);
      D.circle(ctx, cx, cy, 20, b[2]);
      D.circle(ctx, cx - 7, cy - 8, 6, [250, 120, 110]);
    });
    D.arc(ctx, 30, 8, 26, 44, 0.4, 3.6, 5, [60, 120, 40]);
    D.arc(ctx, 44, 10, 26, 44, 5.6, 2.6 + TAU, 5, [60, 120, 40]);
    D.ellipse(ctx, 40, 6, 20, 12, [76, 156, 52]);
    var mad = frame === 1;
    if (mad) {
      [36, 62].forEach(function (ex) {
        D.line(ctx, ex - 8, 52, ex + 6, 57, 3, [40, 10, 10]);
        D.circle(ctx, ex, 60, 5, [255, 250, 230]);
        D.circle(ctx, ex + 2, 60, 2, [30, 10, 10]);
      });
    } else {
      D.eyes(ctx, 36, 58, 5, { spacing: 12, pupilR: 2, white: [255, 250, 230] });
      D.eyes(ctx, 62, 60, 5, { spacing: 12, pupilR: 2, white: [255, 250, 230] });
    }
  }

  function potato(ctx, state, frame) {
    if (state === 0) {
      D.ellipse(ctx, 24, 52, 48, 32, [96, 64, 36]);
      D.ellipse(ctx, 28, 48, 40, 24, [150, 108, 62]);
      D.line(ctx, 44, 50, 38, 34, 3, [80, 160, 60]);
      D.line(ctx, 52, 50, 58, 36, 3, [80, 160, 60]);
      D.ellipse(ctx, 30, 30, 12, 8, [110, 190, 80]);
      D.ellipse(ctx, 54, 32, 12, 8, [110, 190, 80]);
      D.eyes(ctx, 48, 60, 4, { spacing: 14, pupilR: 2 });
    } else {
      D.ellipse(ctx, 20, 80, 56, 10, [0, 0, 0, 45]);
      D.ellipse(ctx, 22, 44, 52, 38, [120, 80, 44]);
      D.ellipse(ctx, 26, 40, 44, 30, [168, 120, 68]);
      var lamp = frame ? [255, 60, 40] : [180, 30, 20];
      D.circle(ctx, 48, 36, 9, [90, 20, 14]);
      D.circle(ctx, 48, 36, 6, lamp);
      if (frame) D.circle(ctx, 48, 36, 11, [255, 220, 180, 90]);
      [-16, 16].forEach(function (ox) {
        D.rect(ctx, 48 + ox - 4, 74, 8, 10, [120, 120, 130], 0, 2);
      });
      D.eyes(ctx, 48, 58, 5, { spacing: 16, pupilR: 2 });
      D.line(ctx, 36, 50, 42, 53, 2, [80, 50, 20]);
      D.line(ctx, 60, 50, 54, 53, 2, [80, 50, 20]);
    }
  }

  function jalapeno(ctx, state, frame) {
    ctx.save();
    ctx.translate(12 + 35, 28 + 23);
    ctx.rotate(-12 * Math.PI / 180);
    D.ellipse(ctx, -35 + 4, -23 + 6, 60, 34, [140, 20, 16]);
    D.ellipse(ctx, -35 + 8, -23 + 8, 52, 26, [214, 44, 30]);
    D.ellipse(ctx, -35 + 14, -23 + 11, 20, 10, [250, 110, 80]);
    ctx.restore();
    D.polygon(ctx, [[34, 34], [26, 22], [40, 28]], [60, 120, 44]);
    var fx = 64, fy = 52;
    if (frame) {
      D.line(ctx, fx - 10, fy - 8, fx - 2, fy - 3, 3, [60, 10, 8]);
      D.line(ctx, fx + 2, fy - 8, fx + 10, fy - 3, 3, [60, 10, 8]);
    }
    D.eyes(ctx, fx, fy - 2, 5, { spacing: 14, pupilR: 2, white: [255, 248, 230] });
    D.ellipse(ctx, fx - 6, fy + 4, 14, 10, [70, 12, 10]);
    D.ellipse(ctx, fx - 3, fy + 6, 8, 6, [20, 6, 4]);
  }

  function chomper(ctx, state, frame) {
    stem(ctx, 50, 58, undefined, 10);
    var cx = 50, cy = 44;
    D.ellipse(ctx, 18, 58, 64, 18, [60, 130, 48]);
    if (state === 2) {
      chomperHead(ctx, cx, cy, 1.0);
    } else if (state === 1) {
      D.ellipse(ctx, cx - 26, cy - 20, 52, 42, [70, 30, 80]);
      D.ellipse(ctx, cx - 22, cy - 17, 44, 34, [150, 86, 172]);
      if (frame) D.circle(ctx, cx + 6, cy + 8, 7, [110, 50, 130]);
      D.eyes(ctx, cx, cy - 16, 6, { spacing: 18, pupilR: 3, look: [2, 2] });
    } else {
      chomperHead(ctx, cx, cy, 0.55);
    }
  }

  function chomperHead(ctx, cx, cy, openT) {
    var jawH = Math.floor(6 + 16 * openT); // Python int() 截断
    D.ellipse(ctx, cx - 24, cy - 24 - jawH / 2, 56, 28, [84, 40, 100]);
    D.ellipse(ctx, cx - 21, cy - 22 - jawH / 2, 50, 22, [134, 72, 158]);
    D.ellipse(ctx, cx - 24, cy - 4 + jawH / 2, 56, 28, [84, 40, 100]);
    D.ellipse(ctx, cx - 21, cy - 2 + jawH / 2, 50, 22, [150, 86, 172]);
    D.ellipse(ctx, cx - 20, cy - 12 - jawH / 3, 40, 24 + jawH, [96, 30, 60]);
    for (var i = 0; i < 5; i++) {
      var tx = cx - 18 + i * 9;
      D.polygon(ctx, [
        [tx, cy - 8 - jawH / 2], [tx + 5, cy - 8 - jawH / 2],
        [tx + 2, cy - 1 - jawH / 3]
      ], [250, 246, 220]);
      D.polygon(ctx, [
        [tx, cy + 8 + jawH / 2], [tx + 5, cy + 8 + jawH / 2],
        [tx + 2, cy + 1 + jawH / 3]
      ], [250, 246, 220]);
    }
    D.eyes(ctx, cx, cy - 26 - jawH / 2, 6, { spacing: 20, pupilR: 3, look: [4, 0] });
  }

  /* ---------- 蘑菇部件 ---------- */

  function mushroomStem(ctx, cx, top, w, h, col, outline) {
    col = col || [222, 208, 230];
    outline = outline || [112, 90, 128];
    D.ellipse(ctx, cx - Math.floor(w / 2) - 2, top - 2, w + 4, h + 4, outline);
    D.ellipse(ctx, cx - Math.floor(w / 2) + 1, top + 1, w - 2, h, col);
  }

  function mushroomCap(ctx, cx, cy, rx, ry, col, dark, spots, jagged) {
    if (!jagged) {
      D.ellipse(ctx, cx - rx - 2, cy - ry - 2, (rx + 2) * 2, (ry + 2) * 2, dark);
      D.ellipse(ctx, cx - rx, cy - ry, rx * 2, ry * 2, col);
    } else {
      var n = 7;
      var pts = [];
      for (var i = 0; i <= n; i++) {
        pts.push([
          cx + (rx + 2) * Math.cos(Math.PI - Math.PI * i / n),
          cy - (ry + 2) * Math.sin(Math.PI * i / n) * 0.92
        ]);
      }
      var width = rx * 2 + 4;
      for (var j = 0; j < n; j++) {
        var fHi = 1 - (j + 0.5) / n;
        var fLo = 1 - (j + 1) / n;
        pts.push([cx - (rx + 2) + width * fHi, cy - 5]);
        pts.push([cx - (rx + 2) + width * fLo, cy + 2]);
      }
      D.polygon(ctx, pts, dark);
      var inner = pts.map(function (p) {
        return [cx + (p[0] - cx) * 0.93, cy + (p[1] - cy) * 0.9 + 1];
      });
      D.polygon(ctx, inner, col);
    }
    if (spots) {
      spots.forEach(function (sp) {
        D.circle(ctx, cx + sp[0], cy + sp[1], sp[2] + 1, [236, 222, 250]);
        D.circle(ctx, cx + sp[0], cy + sp[1], sp[2], [205, 168, 232]);
      });
    }
  }

  function puffshroom(ctx, state, frame) {
    var squish = frame ? 3 : 0;
    var cx = 44;
    mushroomStem(ctx, cx, 56 + squish, 24, 28 - squish);
    D.eyes(ctx, cx, 66 + squish, 3, { spacing: 10, pupilR: 2 });
    var capCy = 42 + squish;
    mushroomCap(ctx, cx, capCy, 22, 16 - Math.floor(squish / 2),
      [150, 98, 188], [92, 52, 124],
      [[-7, -3, 3], [6, -6, 2.5], [9, 2, 2]]);
    var nx = cx + 18 + (frame ? 3 : 0);
    D.ellipse(ctx, nx - 4, capCy - 2, 13, 9, [92, 52, 124]);
    D.ellipse(ctx, nx - 2, capCy, 9, 5, [176, 128, 210]);
  }

  function sunshroom(ctx, state, frame) {
    var grown = state === 1;
    var cx = 48;
    var stemTop = grown ? 48 : 52;
    var stemH = grown ? 36 : 30;
    mushroomStem(ctx, cx, stemTop, grown ? 26 : 22, stemH, [232, 222, 200], [150, 120, 80]);
    var capCy = grown ? 36 : 44;
    mushroomCap(ctx, cx, capCy, grown ? 25 : 19, grown ? 21 : 15,
      grown ? [255, 176, 56] : [255, 202, 84], grown ? [204, 116, 24] : [214, 146, 40],
      [[-8, -4, 3], [5, -8, 3.5], [9, 1, 2.5]]);
    D.circle(ctx, cx, capCy - 1, grown ? 5 : 4, [255, 240, 170]);
    var ey = stemTop + (grown ? 16 : 12);
    if (frame === 2) {
      D.arc(ctx, cx - 11, ey - 4, 9, 7, 3.4, 6.1, 2, [90, 60, 20]);
      D.arc(ctx, cx + 2, ey - 4, 9, 7, 3.4, 6.1, 2, [90, 60, 20]);
    } else {
      D.eyes(ctx, cx, ey, grown ? 3 : 2.5, { spacing: 11, pupilR: 2 });
    }
    D.arc(ctx, cx - 7, ey + 4, 14, 9, 3.6, 5.9, 2, [150, 96, 30]);
  }

  function iceshroom(ctx, state, frame) {
    var cx = 46;
    mushroomStem(ctx, cx, 50, 25, 34, [226, 240, 250], [96, 146, 178]);
    if (frame) {
      ctx.save();
      ctx.globalAlpha = 70 / 255;
      D.ellipse(ctx, cx - 30, 8, 60, 50, [180, 236, 255]);
      ctx.restore();
    }
    mushroomCap(ctx, cx, 40, 24, 19, [140, 218, 250], [70, 140, 190], null, true);
    [[-14, 30, 7], [0, 22, 9], [14, 30, 7]].forEach(function (p) {
      var ox = p[0], oy = p[1], rr = p[2];
      D.polygon(ctx, [
        [cx + ox, oy - rr], [cx + ox - rr * 0.62, oy + 2],
        [cx + ox + rr * 0.62, oy + 2]
      ], [224, 248, 255]);
      D.polygon(ctx, [
        [cx + ox, oy - rr], [cx + ox, oy + 2],
        [cx + ox + rr * 0.62, oy + 2]
      ], [170, 226, 250]);
    });
    D.eyes(ctx, cx, 62, 3.5, { spacing: 11, pupilR: 2 });
    D.line(ctx, cx - 7, 72, cx + 7, 72, 2, [70, 110, 140]);
  }

  function hypnoshroom(ctx, state, frame) {
    var cx = 46;
    mushroomStem(ctx, cx, 52, 25, 32, [228, 212, 234], [120, 86, 134]);
    mushroomCap(ctx, cx, 40, 25, 20, [186, 84, 198], [118, 40, 132]);
    var swirl = [250, 226, 255];
    [15, 10, 5].forEach(function (rr) {
      D.arc(ctx, cx - rr, 40 - rr, rr * 2, rr * 2, 0.4 + rr, 4.6 + rr, 3, swirl);
    });
    D.circle(ctx, cx, 40, 3, [255, 244, 255]);
    [[-16, 44], [17, 45]].forEach(function (p) {
      D.circle(ctx, cx + p[0], p[1], 2.5, [240, 200, 250]);
    });
    [-5, 6].forEach(function (ox) {
      D.arc(ctx, cx + ox - 4, 62, 9, 7, 3.4, 6.1, 2, [90, 60, 100]);
    });
    if (frame) {
      Text.drawText(ctx, "z", cx + 13, 48, { size: 15, color: [190, 130, 210] });
    }
  }

  function spikeweed(ctx, state, frame) {
    D.ellipse(ctx, 16, 70, 64, 14, [56, 74, 40]);
    D.ellipse(ctx, 20, 72, 56, 9, [84, 106, 56]);
    var spikes = [[28, 20], [38, 27], [48, 30], [58, 27], [68, 20]];
    var sway = frame ? 1 : 0;
    spikes.forEach(function (sp) {
      var bx = sp[0], h = sp[1];
      D.polygon(ctx, [[bx - 6, 78], [bx + 6, 78], [bx + sway, 78 - h]], [88, 96, 84]);
      D.polygon(ctx, [[bx - 3, 77], [bx + 1, 77], [bx + sway, 78 - h]], [176, 184, 168]);
    });
    D.ellipse(ctx, 24, 66, 12, 7, [96, 130, 60]);
    D.ellipse(ctx, 60, 66, 12, 7, [96, 130, 60]);
  }

  function pumpkin(ctx, state, frame) {
    var cx = 48;
    D.ellipse(ctx, 18, 82, 60, 10, [0, 0, 0, 50]);
    D.ellipse(ctx, 14, 16, 68, 68, [150, 70, 14]);
    D.ellipse(ctx, 18, 19, 60, 62, [232, 120, 28]);
    [-22, 0, 22].forEach(function (ox) {
      D.arc(ctx, cx - 34 + ox, 20, 24, 60, 1.2, 5.1, 2, [196, 90, 18]);
    });
    D.ellipse(ctx, 26, 26, 16, 22, [255, 168, 80]);
    D.rect(ctx, 44, 8, 8, 12, [72, 100, 40], 0, 3);
    var dark = [74, 30, 10];
    D.polygon(ctx, [[32, 42], [42, 40], [38, 52]], dark);
    D.polygon(ctx, [[64, 42], [54, 40], [58, 52]], dark);
    D.polygon(ctx, [[30, 62], [36, 58], [42, 62], [48, 58], [54, 62],
                    [60, 58], [66, 62], [66, 70], [30, 70]], dark);
    D.polygon(ctx, [[39, 62], [43, 62], [41, 67]], [248, 200, 120]);
    D.polygon(ctx, [[53, 62], [57, 62], [55, 67]], [248, 200, 120]);
    if (state >= 1) {
      D.lines(ctx, [[26, 24], [32, 34], [28, 44]], 3, [120, 52, 14]);
    }
    if (state >= 2) {
      D.lines(ctx, [[70, 28], [64, 40], [70, 52], [62, 64]], 3, [120, 52, 14]);
      D.lines(ctx, [[22, 66], [30, 72], [34, 80]], 2, [120, 52, 14]);
    }
  }

  function squash(ctx, state, frame) {
    var cx = 48;
    var bodyBox, darkBox;
    if (state === 2) {
      bodyBox = [24, 14, 48, 66];
      darkBox = [20, 10, 56, 72];
    } else if (state === 1) {
      bodyBox = [16, 40, 64, 44];
      darkBox = [12, 36, 72, 50];
    } else {
      bodyBox = [20, 30, 56, 52];
      darkBox = [16, 26, 64, 58];
    }
    D.ellipse(ctx, 22, 82, 52, 10, [0, 0, 0, 50]);
    D.ellipse(ctx, darkBox[0], darkBox[1], darkBox[2], darkBox[3], [56, 96, 30]);
    D.ellipse(ctx, bodyBox[0], bodyBox[1], bodyBox[2], bodyBox[3], [128, 184, 72]);
    var x = bodyBox[0], y = bodyBox[1], w = bodyBox[2], h = bodyBox[3];
    [0.3, 0.55, 0.8].forEach(function (frac) {
      var gx = x + w * frac;
      D.arc(ctx, Math.round(gx) - 7, y + 4, 14, h - 8, 1.3, 5.0, 2, [84, 134, 44]);
    });
    D.ellipse(ctx, x + 8, y + 6, 14, h - 16, [172, 222, 104]);
    D.rect(ctx, cx - 4, y - 8, 8, 10, [72, 100, 40], 0, 3);
    D.ellipse(ctx, cx - 18, y - 6, 14, 8, [96, 150, 56]);
    D.ellipse(ctx, cx + 4, y - 6, 14, 8, [96, 150, 56]);
    var ey = y + Math.floor(h * 0.42);
    if (state === 2) {
      D.eyes(ctx, cx, ey - 6, 4, { spacing: 16, pupilR: 2, look: [0, 4] });
      D.ellipse(ctx, cx - 9, ey + 4, 18, 14, [60, 30, 16]);
      D.ellipse(ctx, cx - 6, ey + 7, 12, 8, [20, 10, 6]);
    } else {
      var ang = state === 1 ? -16 : -8;
      D.line(ctx, cx - 16, ey - 8, cx - 6, ey - 8 + Math.floor(ang / 3), 3, [40, 70, 22]);
      D.line(ctx, cx + 16, ey - 8, cx + 6, ey - 8 + Math.floor(ang / 3), 3, [40, 70, 22]);
      D.eyes(ctx, cx, ey - 2, 4.5, { spacing: 16, pupilR: 2, look: [state === 1 ? 4 : 0, 0] });
      D.arc(ctx, cx - 9, ey + 10, 18, 8, 5.0, 7.4, 3, [60, 96, 30]);
    }
  }

  var DRAWERS = {
    sunflower: function (ctx, kit, state, frame) { sunflower(ctx, state, frame); },
    peashooter: peashooter,
    wallnut: function (ctx, kit, state, frame) { wallnut(ctx, state, frame); },
    cherrybomb: function (ctx, kit, state, frame) { cherry(ctx, state, frame); },
    snowpea: snowpea,
    potatomine: function (ctx, kit, state, frame) { potato(ctx, state, frame); },
    repeater: repeater,
    jalapeno: function (ctx, kit, state, frame) { jalapeno(ctx, state, frame); },
    chomper: function (ctx, kit, state, frame) { chomper(ctx, state, frame); },
    threepeater: threepeater,
    puffshroom: function (ctx, kit, state, frame) { puffshroom(ctx, state, frame); },
    sunshroom: function (ctx, kit, state, frame) { sunshroom(ctx, state, frame); },
    iceshroom: function (ctx, kit, state, frame) { iceshroom(ctx, state, frame); },
    hypnoshroom: function (ctx, kit, state, frame) { hypnoshroom(ctx, state, frame); },
    spikeweed: function (ctx, kit, state, frame) { spikeweed(ctx, state, frame); },
    pumpkin: function (ctx, kit, state, frame) { pumpkin(ctx, state, frame); },
    squash: function (ctx, kit, state, frame) { squash(ctx, state, frame); }
  };

  function plantImage(kit, name, state, frame) {
    state = state || 0;
    frame = frame || 0;
    var key = "plant:" + name + ":" + state + ":" + frame;
    return kit.get(key, S, S, function (ctx) {
      DRAWERS[name](ctx, kit, state, frame);
    });
  }

  return { S: S, BASE_Y: BASE_Y, plantImage: plantImage };
});
