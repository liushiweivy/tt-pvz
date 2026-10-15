/*
 * menu.js — 主菜单/选关纯逻辑（移植 pvs/scenes/menu.py 的布局与交互判定）。
 * 不碰 Canvas：渲染在 render/menu.js，触摸路由由 main 调 tapAt。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./config.js"), require("./rng.js"));
  } else {
    root.PvZMenu = factory(root.PvZConfig, root.PvZRng);
  }
})(typeof self !== "undefined" ? self : this, function (CFG, rngMod) {
  "use strict";

  var CARD_W = 150, CARD_H = 150, CARD_GAP = 20, CARD_Y = 356;
  var DECO_SUN_INTERVAL = 3.2;
  var DECO_SUN_LIFE = 9.0;

  function inRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  function levelRects() {
    var total = CFG.LEVEL_COUNT * CARD_W + (CFG.LEVEL_COUNT - 1) * CARD_GAP;
    var x0 = Math.floor(CFG.SCREEN_W / 2 - total / 2);
    var rects = [];
    for (var lv = 1; lv <= CFG.LEVEL_COUNT; lv++) {
      rects.push({ level: lv, x: x0 + (lv - 1) * (CARD_W + CARD_GAP), y: CARD_Y, w: CARD_W, h: CARD_H });
    }
    return rects;
  }

  function musicRect() {
    return { x: CFG.SCREEN_W - 150, y: 18, w: 132, h: 36 };
  }

  function helpPanel() {
    return { x: CFG.SCREEN_W / 2 - 380, y: 540 - 12, w: 760, h: 118 };
  }

  // save: 存档数据；rng: 注入式随机源（装饰阳光落点）
  function createMenuModel(saveData, rng) {
    return {
      save: saveData,
      t: 0,
      hover: -1,          // 触摸按住的卡片 level（高亮用），-1 无
      sunTimer: 1.0,
      suns: [],           // {x,y,life,age,ang0,pulse0}
      rng: rng || rngMod.mulberry32(0)
    };
  }

  function update(m, dt) {
    m.t += dt;
    m.sunTimer -= dt;
    if (m.sunTimer <= 0) {
      m.sunTimer = DECO_SUN_INTERVAL;
      m.suns.push({
        x: rngMod.randint(m.rng, 170, CFG.SCREEN_W - 170),
        y: rngMod.randint(m.rng, 170, 300),
        life: DECO_SUN_LIFE,
        age: 0,
        ang0: m.rng() * 360,
        pulse0: m.rng() * Math.PI * 2
      });
    }
    for (var i = 0; i < m.suns.length; i++) {
      var s = m.suns[i];
      s.age += dt;
      s.life -= dt;
    }
    m.suns = m.suns.filter(function (s) { return s.life > 0; });
  }

  // 返回 {type:'music'} | {type:'level',level} | {type:'locked',level} | null
  function tapAt(m, x, y) {
    if (inRect(x, y, musicRect())) return { type: "music" };
    var rects = levelRects();
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (inRect(x, y, r)) {
        return r.level <= (m.save.unlocked || 1)
          ? { type: "level", level: r.level }
          : { type: "locked", level: r.level };
      }
    }
    return null;
  }

  return {
    CARD_W: CARD_W, CARD_H: CARD_H, CARD_GAP: CARD_GAP, CARD_Y: CARD_Y,
    inRect: inRect,
    levelRects: levelRects,
    musicRect: musicRect,
    helpPanel: helpPanel,
    createMenuModel: createMenuModel,
    update: update,
    tapAt: tapAt
  };
});
