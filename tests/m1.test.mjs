/*
 * M1 测试：全量 config 数值、save 注入式存档、菜单选关状态机、离屏精灵缓存。
 * 运行：node --test tests/m1.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const CFG = require("../js/config.js");
const save = require("../js/save.js");
const menu = require("../js/menu.js");
const rngMod = require("../js/rng.js");
const sprites = require("../js/render/sprites.js");

/* ---------- config：植物/僵尸/关卡全量数值（对齐 pvs/config.py） ---------- */

test("config：17 植物，PLANT_ORDER 与 PLANT_SPECS 一致且字段齐全", function () {
  assert.strictEqual(CFG.PLANT_ORDER.length, 17);
  assert.deepStrictEqual(CFG.PLANT_ORDER.slice().sort(), Object.keys(CFG.PLANT_SPECS).sort());
  CFG.PLANT_ORDER.forEach(function (k) {
    var s = CFG.PLANT_SPECS[k];
    assert.ok(s.name && typeof s.name === "string", k + " name");
    ["cost", "cooldown", "hp", "unlock"].forEach(function (f) {
      assert.ok(typeof s[f] === "number", k + "." + f);
    });
  });
  // 抽检数值
  assert.deepStrictEqual(
    [CFG.PLANT_SPECS.sunflower.cost, CFG.PLANT_SPECS.sunflower.cooldown, CFG.PLANT_SPECS.sunflower.hp],
    [50, 5.0, 300]
  );
  assert.strictEqual(CFG.PLANT_SPECS.wallnut.hp, 4000);
  assert.strictEqual(CFG.PLANT_SPECS.pumpkin.unlock, 6);
  assert.strictEqual(CFG.PLANT_SPECS.puffshroom.cost, 0);
});

test("config：10 僵尸，特殊字段对齐", function () {
  assert.strictEqual(Object.keys(CFG.ZOMBIE_SPECS).length, 10);
  assert.strictEqual(CFG.ZOMBIE_SPECS.gargantuar.hp, 3000);
  assert.strictEqual(CFG.ZOMBIE_SPECS.gargantuar.giant, true);
  assert.strictEqual(CFG.ZOMBIE_SPECS.gargantuar.damage, 99999);
  assert.strictEqual(CFG.ZOMBIE_SPECS.pole.speed, 40);
  assert.strictEqual(CFG.ZOMBIE_SPECS.pole.walk_speed, 21);
  assert.strictEqual(CFG.ZOMBIE_SPECS.newspaper.paper_hp, 200);
  assert.strictEqual(CFG.ZOMBIE_SPECS.newspaper.rage_speed, 45);
  assert.strictEqual(CFG.ZOMBIE_SPECS.flag.speed, 30);
});

test("config：6 关结构与白/夜差异", function () {
  assert.deepStrictEqual([1, 2, 3, 4, 5, 6], Object.keys(CFG.LEVELS).map(Number).sort((a, b) => a - b));
  var l1 = CFG.LEVELS[1];
  assert.deepStrictEqual(l1.plants, ["sunflower", "peashooter"]);
  assert.strictEqual(l1.zombies.length, 6);
  assert.strictEqual(l1.first_delay, 16.0);
  assert.deepStrictEqual(l1.huge_waves, []);
  assert.strictEqual(l1.flag_count, 0);
  var l6 = CFG.LEVELS[6];
  assert.strictEqual(l6.theme, "night");
  assert.strictEqual(l6.sky_sun, false);
  assert.strictEqual(l6.start_sun, 75);
  assert.strictEqual(l6.plants.length, 10);
  assert.ok(l6.plants.includes("iceshroom"));
  assert.strictEqual(l6.zombies.filter(function (z) { return z === "screendoor"; }).length, 3);
  var l5 = CFG.LEVELS[5];
  assert.ok(l5.zombies.includes("gargantuar"));
  // 所有关卡引用的植物都存在且不超卡槽上限
  Object.keys(CFG.LEVELS).forEach(function (lv) {
    var cfg = CFG.LEVELS[lv];
    assert.ok(cfg.plants.length <= CFG.HUD_MAX_CARDS, "L" + lv + " 卡槽数");
    cfg.plants.forEach(function (p) { assert.ok(CFG.PLANT_SPECS[p], "L" + lv + " 未知植物 " + p); });
    cfg.zombies.forEach(function (z) { assert.ok(CFG.ZOMBIE_SPECS[z], "L" + lv + " 未知僵尸 " + z); });
  });
});

test("config：经济/行为/HUD 布局常量与夜色调色板", function () {
  assert.strictEqual(CFG.START_SUN, 100);
  assert.strictEqual(CFG.SUN_VALUE, 25);
  assert.strictEqual(CFG.SMALL_SUN_VALUE, 15);
  assert.strictEqual(CFG.NIGHT_START_SUN, 75);
  assert.strictEqual(CFG.SKY_SUN_INTERVAL, 6.5);
  assert.strictEqual(CFG.PEA_DAMAGE, 20);
  assert.strictEqual(CFG.PEA_SPEED, 380.0);
  assert.strictEqual(CFG.FREEZE_DURATION, 7.5);
  assert.strictEqual(CFG.FINAL_WAVE_PROGRESS, 0.86);
  assert.ok(Math.abs(CFG.WALLNUT_CRACK_HP[0] - 4000 / 3) < 1e-9);
  assert.strictEqual(CFG.HUD_MAX_CARDS, 10);
  assert.deepStrictEqual(CFG.SUN_PLATE, [16, 12, 78, 78]);
  assert.deepStrictEqual([CFG.CARD_X0, CFG.CARD_Y, CFG.CARD_W, CFG.CARD_H, CFG.CARD_GAP], [104, 12, 62, 78, 6]);
  assert.deepStrictEqual(CFG.SHOVEL_RECT, [796, 14, 60, 74]);
  assert.deepStrictEqual(CFG.BAR_RECT, [870, 30, 158, 20]);
  ["soil", "soil_dot", "sky_top", "sky_bot", "lawn_a", "lawn_b", "edge", "track", "track_line"].forEach(function (k) {
    assert.strictEqual(CFG.NIGHT[k].length, 3, "NIGHT." + k);
  });
});

/* ---------- save：注入式存储 ---------- */

function memStorage(initial) {
  var m = new Map(initial || []);
  return {
    get: function (k) { return m.has(k) ? m.get(k) : ""; },
    set: function (k, v) { m.set(k, v); },
    _map: m
  };
}

test("save：缺省存档与坏数据回退", function () {
  assert.deepStrictEqual(save.loadSave(memStorage()), { unlocked: 1, completed: [], music: true });
  var bad = memStorage([["pvz_save", "{not json"]]);
  assert.deepStrictEqual(save.loadSave(bad), { unlocked: 1, completed: [], music: true });
});

test("save：部分字段合并（旧存档缺键补默认）", function () {
  var s = save.loadSave(memStorage([["pvz_save", JSON.stringify({ unlocked: 3 })]]));
  assert.strictEqual(s.unlocked, 3);
  assert.deepStrictEqual(s.completed, []);
  assert.strictEqual(s.music, true);
});

test("save：写入后可回读，存储异常被吞", function () {
  var st = memStorage();
  save.writeSave(st, { unlocked: 2, completed: [1], music: false });
  assert.deepStrictEqual(JSON.parse(st.get("pvz_save")).completed, [1]);
  var boom = { get: function () { throw new Error("x"); }, set: function () { throw new Error("x"); } };
  assert.doesNotThrow(function () { save.writeSave(boom, save.defaultSave()); });
  assert.doesNotThrow(function () { save.loadSave(boom); });
});

test("save：recordWin 不可变、去重、解锁推进；toggleMusic 翻转", function () {
  var d0 = { unlocked: 1, completed: [], music: true };
  var d1 = save.recordWin(d0, 1);
  assert.deepStrictEqual(d1, { unlocked: 2, completed: [1], music: true });
  assert.deepStrictEqual(d0.completed, [], "输入不被修改");
  var d2 = save.recordWin(d1, 1); // 重复通关不重复记
  assert.deepStrictEqual(d2.completed, [1]);
  assert.strictEqual(d2.unlocked, 2);
  var d3 = save.recordWin(d2, 3); // 跳关解锁取 max
  assert.strictEqual(d3.unlocked, 4);
  assert.deepStrictEqual(save.toggleMusic(d3).music, false);
  assert.strictEqual(d3.music, true, "toggleMusic 不可变");
});

/* ---------- menu：选关状态机（纯逻辑） ---------- */

test("menu：6 张选关卡水平居中、y=356、150x150 gap20", function () {
  var rects = menu.levelRects();
  assert.strictEqual(rects.length, 6);
  assert.strictEqual(rects[0].x, 40); // (1080 - (6*150+5*20))/2
  assert.strictEqual(rects[0].y, 356);
  assert.deepStrictEqual([rects[0].w, rects[0].h], [150, 150]);
  assert.strictEqual(rects[1].x, 40 + 170);
  assert.strictEqual(rects[5].x + 150, 1040);
});

test("menu：tapAt 解锁关卡进关、锁关拦截、空白无效", function () {
  var rng = rngMod.mulberry32(1);
  var m = menu.createMenuModel(save.defaultSave(), rng);
  assert.deepStrictEqual(menu.tapAt(m, 115, 430), { type: "level", level: 1 }); // 第 1 张卡中心
  var locked = menu.tapAt(m, 115 + 170, 430);
  assert.strictEqual(locked.type, "locked");
  assert.strictEqual(locked.level, 2);
  assert.strictEqual(menu.tapAt(m, 20, 200), null);
  // 全解锁后第 6 张可进
  var m2 = menu.createMenuModel({ unlocked: 6, completed: [1, 2, 3, 4, 5], music: true }, rng);
  assert.deepStrictEqual(menu.tapAt(m2, 40 + 5 * 170 + 75, 430), { type: "level", level: 6 });
});

test("menu：音乐按钮命中区", function () {
  var m = menu.createMenuModel(save.defaultSave(), rngMod.mulberry32(1));
  assert.strictEqual(menu.tapAt(m, CFG.SCREEN_W - 84, 36).type, "music");
  assert.strictEqual(menu.tapAt(m, CFG.SCREEN_W - 84, 100), null);
});

test("menu：装饰阳光按 3.2s 间隔生成、9s 寿命消失（注入 rng）", function () {
  var m = menu.createMenuModel(save.defaultSave(), rngMod.mulberry32(7));
  assert.strictEqual(m.suns.length, 0);
  menu.update(m, 1.0);
  assert.strictEqual(m.suns.length, 1); // 初始 sun_t=1.0
  menu.update(m, 3.3);                  // 首个后重置为完整 3.2s 间隔
  assert.strictEqual(m.suns.length, 2);
  // 快进超过寿命
  for (var i = 0; i < 600; i++) menu.update(m, 1 / 60);
  assert.ok(m.suns.length < 20, "阳光必须按时消失，不能无限堆积: " + m.suns.length);
  var oldestDead = m.suns.every(function (s) { return s.life > 0 && s.life <= 9; });
  assert.ok(oldestDead);
});

/* ---------- sprites：离屏工厂 + 缓存（Node 打桩） ---------- */

function fakeCtx() {
  return new Proxy({}, {
    get: function (t, p) {
      if (p === "canvas") return {};
      if (!(p in t)) t[p] = function () {};
      return t[p];
    },
    set: function (t, p, v) { t[p] = v; return true; }
  });
}

test("sprites：同 key 只绘制一次，缓存复用同一 canvas", function () {
  var calls = 0;
  var kit = sprites.createKit(function () { return { getContext: function () { return fakeCtx(); }, width: 0, height: 0 }; });
  var c1 = kit.get("a|0|0", 96, 96, function () { calls++; });
  var c2 = kit.get("a|0|0", 96, 96, function () { calls++; });
  assert.strictEqual(c1, c2);
  assert.strictEqual(calls, 1);
  var c3 = kit.get("a|1|0", 96, 96, function () { calls++; });
  assert.notStrictEqual(c3, c1);
  assert.strictEqual(calls, 2);
});

test("sprites：silhouette 走 source-in 合成白色遮罩", function () {
  var ops = [];
  var composites = [];
  function recordingCtx() {
    return new Proxy({}, {
      get: function (t, p) {
        if (p in t) return t[p];
        t[p] = function () {};
        return t[p];
      },
      set: function (t, p, v) {
        if (p === "globalCompositeOperation") composites.push(v);
        t[p] = v;
        return true;
      }
    });
  }
  var ctx = recordingCtx();
  ctx.drawImage = function () { ops.push("drawImage"); };
  ctx.fillRect = function () { ops.push("fillRect"); };
  var made = 0;
  var kit = sprites.createKit(function () {
    made++;
    return {
      width: 0, height: 0,
      getContext: function () {
        return made === 1 ? recordingCtx() : ctx; // 第一个给 src，第二个给遮罩
      }
    };
  });
  var src = kit.get("src", 96, 96, function () {});
  var sil = kit.silhouette(src);
  assert.ok(sil, "返回剪影 canvas");
  assert.ok(ops.indexOf("drawImage") < ops.indexOf("fillRect"), "先画原图再填白");
  assert.ok(composites.includes("source-in"), "使用 source-in 生成 alpha 遮罩");
});
