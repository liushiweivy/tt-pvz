/*
 * M0 脚手架测试：rng 确定性、util 数值/场地几何、config 不变量、触摸归一纯函数。
 * 不依赖 Canvas / tt / 音频对象。运行：node --test tests/core.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const rngMod = require("../js/rng.js");
const util = require("../js/util.js");
const CFG = require("../js/config.js");
const touch = require("../js/touch.js");
const audio = require("../js/audio.js");

/* ---------- rng ---------- */

test("rng：mulberry32(42) 黄金序列 + 同种子重现", function () {
  var golden = [0.601103751920, 0.448290558998, 0.852465793490, 0.669734041439];
  var r = rngMod.mulberry32(42);
  golden.forEach(function (g) {
    assert.ok(Math.abs(r() - g) < 1e-9);
  });
  var r2 = rngMod.mulberry32(42);
  assert.ok(Math.abs(r2() - golden[0]) < 1e-9); // 同种子重现
  // 值域 [0,1)
  var r3 = rngMod.mulberry32(7);
  for (var i = 0; i < 1000; i++) {
    var v = r3();
    assert.ok(v >= 0 && v < 1);
  }
});

test("rng：uniform(rng,a,b) 注入式区间随机", function () {
  var r = rngMod.mulberry32(1);
  for (var i = 0; i < 200; i++) {
    var v = rngMod.uniform(r, -10, 10);
    assert.ok(v >= -10 && v < 10);
  }
  var fixed = rngMod.mulberry32(1);
  assert.ok(Math.abs(rngMod.uniform(fixed, 5, 5) - 5) < 1e-12);
});

/* ---------- util ---------- */

test("util：clamp / lerp", function () {
  assert.strictEqual(util.clamp(5, 0, 10), 5);
  assert.strictEqual(util.clamp(-1, 0, 10), 0);
  assert.strictEqual(util.clamp(11, 0, 10), 10);
  assert.strictEqual(util.lerp(0, 10, 0.5), 5);
  assert.strictEqual(util.lerp(2, 4, 0), 2);
});

test("util：缓动端点与单调性", function () {
  assert.ok(Math.abs(util.easeOutCubic(0)) < 1e-12);
  assert.ok(Math.abs(util.easeOutCubic(1) - 1) < 1e-12);
  assert.ok(util.easeOutCubic(0.5) > 0.5); // 先快后慢
  assert.ok(Math.abs(util.easeOutBack(0)) < 1e-12);
  assert.ok(Math.abs(util.easeOutBack(1) - 1) < 1e-9);
  assert.ok(util.easeOutBack(0.8) > 1); // 末端越过终值（back 缓动特征）
});

test("util：floorDiv 是地板除（移植 Python //，JS // 对负数向零截断）", function () {
  assert.strictEqual(util.floorDiv(7, 2), 3);
  assert.strictEqual(util.floorDiv(-7, 2), -4); // JS (-7)/2|0 会错成 -3
  assert.strictEqual(util.floorDiv(-8, 2), -4);
});

test("util：场地格子几何（移植自 util.py）", function () {
  assert.deepStrictEqual(util.cellRect(0, 0), { x: 132, y: 112, w: 92, h: 104 });
  assert.deepStrictEqual(util.cellRect(1, 2), { x: 224, y: 320, w: 92, h: 104 });
  var c = util.cellCenter(0, 0);
  assert.ok(Math.abs(c.x - 178) < 1e-9 && Math.abs(c.y - 164) < 1e-9);
  assert.strictEqual(util.rowOfY(112), 0);
  assert.strictEqual(util.rowOfY(112 + 4 * 104 + 50), 4); // 钳到末行
  assert.strictEqual(util.rowOfY(0), 0);
  assert.strictEqual(util.colOfX(132), 0);
  assert.strictEqual(util.colOfX(132 + 9 * 92 + 999), 8);
  assert.strictEqual(util.pointInLawn(178, 164), true);
  assert.strictEqual(util.pointInLawn(0, 0), false);
  assert.strictEqual(util.pointInLawn(132 + 9 * 92, 112), false); // 右边界外
  assert.ok(Math.abs(util.dist(0, 0, 3, 4) - 5) < 1e-9);
});

/* ---------- config ---------- */

test("config：场地尺寸不变量（对齐 Python config.py）", function () {
  assert.strictEqual(CFG.SCREEN_W, 1080);
  assert.strictEqual(CFG.SCREEN_H, 720);
  assert.strictEqual(CFG.COLS * CFG.CELL_W, 828);
  assert.strictEqual(CFG.ROWS * CFG.CELL_H, 520);
  assert.strictEqual(CFG.LAWN_X + CFG.LAWN_W, 960);
  assert.ok(CFG.SCREEN_W > CFG.SCREEN_H, "M0 为横屏世界");
});

test("config：颜色为 0-255 通道数组", function () {
  Object.keys(CFG.C).forEach(function (name) {
    var c = CFG.C[name];
    assert.ok(Array.isArray(c), name + " 应为数组");
    assert.ok(c.length === 3 || c.length === 4, name + " 通道数");
    c.forEach(function (ch) {
      assert.ok(Number.isInteger(ch) && ch >= 0 && ch <= 255, name + " 通道越界");
    });
  });
});

/* ---------- 触摸归一（横屏探针核心，纯函数可测） ---------- */

function info(over) {
  return Object.assign({ vw: 1080, vh: 720, dpr: 1, screenW: 1080, screenH: 720 }, over || {});
}

test("touch：clientX/clientY 优先", function () {
  var st = touch.createState();
  var r = touch.normalizePoint({ clientX: 100, clientY: 50, screenX: 9999, screenY: 9999 }, info(), st);
  assert.deepStrictEqual([r.x, r.y], [100, 50]);
  assert.strictEqual(r.normalized, false);
});

test("touch：dpr>1 物理像素上报首次自动 1/dpr 归一（不可逆只触发一次）", function () {
  var st = touch.createState();
  var r = touch.normalizePoint({ screenX: 3240, screenY: 2160 }, info({ dpr: 3 }), st);
  assert.strictEqual(r.normalized, true);
  assert.ok(Math.abs(r.x - 1080) < 1e-9);
  assert.ok(Math.abs(r.y - 720) < 1e-9);
  // 之后即使再来正常值也保持已校正缩放（模拟真机一旦物理像素则恒物理像素）
  var r2 = touch.normalizePoint({ screenX: 100, screenY: 100 }, info({ dpr: 3 }), st);
  assert.ok(Math.abs(r2.x - 100 / 3) < 1e-9);
});

test("touch：小越窗（≤screenWidth，Android 状态栏窗口窄于屏幕）不触发归一", function () {
  var st = touch.createState();
  var r = touch.normalizePoint({ screenX: 1081, screenY: 700 }, info({ vw: 1050, vh: 720, dpr: 3, screenW: 1080, screenH: 720 }), st);
  assert.strictEqual(r.normalized, false);
  assert.strictEqual(r.x, 1081);
});

test("touch：dpr=1 时即使越界也无法判定，保持原样", function () {
  var st = touch.createState();
  var r = touch.normalizePoint({ screenX: 5000, screenY: 10 }, info({ dpr: 1 }), st);
  assert.strictEqual(r.normalized, false);
  assert.strictEqual(r.x, 5000);
});

test("touch：归一后仍越窗（横屏轴对调嫌疑）置 stillOut 标志，不做轴交换", function () {
  var st = touch.createState();
  // 物理像素但量级对不上：x 按屏幕短边物理像素上报 → 归一后 x=720 尚在窗内；
  // 构造真正仍越界：x 物理像素远超 vw*dpr
  var r = touch.normalizePoint({ screenX: 4000, screenY: 100 }, info({ dpr: 3 }), st);
  assert.strictEqual(r.normalized, true);
  assert.ok(r.x > 1080 + 4);
  assert.strictEqual(r.stillOut, true);
});

test("touch：物理像素校正后，clientX 触点不被二次缩放（混报机型不变量）", function () {
  var st = touch.createState();
  // 先以物理 screenX 触发自校正
  touch.normalizePoint({ screenX: 3240, screenY: 2160 }, info({ dpr: 3 }), st);
  assert.ok(Math.abs(st.scaleX - 1 / 3) < 1e-12);
  // 之后某机型改报逻辑 clientX：必须原样使用，不能再 /3
  var r = touch.normalizePoint({ clientX: 300, clientY: 200, screenX: 900, screenY: 600 }, info({ dpr: 3 }), st);
  assert.strictEqual(r.x, 300);
  assert.strictEqual(r.y, 200);
});

test("touch：首触返回 probe 载荷，其后为 null；screenW 缺省回退 vw", function () {
  var st = touch.createState();
  var r1 = touch.normalizePoint({ clientX: 1, clientY: 2 }, { vw: 1080, vh: 720, dpr: 2 }, st);
  assert.ok(r1.probe && r1.probe.norm === 1);
  assert.strictEqual(r1.probe.vw, 1080);
  var r2 = touch.normalizePoint({ clientX: 3, clientY: 4 }, { vw: 1080, vh: 720, dpr: 2 }, st);
  assert.strictEqual(r2.probe, null);
});

/* ---------- 音频适配探测 ---------- */

test("audio：Node 无音频环境时 supported=false，ensure 不抛、currentTime 为有限数", function () {
  assert.strictEqual(audio.isAudioSupported(), false);
  assert.doesNotThrow(function () { audio.ensure(); });
  assert.strictEqual(typeof audio.currentTime(), "number");
  assert.ok(Number.isFinite(audio.currentTime()));
});

test("audio：创建抛错后静默失败，resetFailed 放行后可重试成功", function () {
  var fakeCtx = { state: "running", resume: function () {} };
  audio.resetFailed(); // 清除上一测试（无音频环境）留下的失败标记
  // 1) API 存在但首次创建瞬时抛错（冷启动音频服务未就绪）
  globalThis.tt = { getAudioContext: function () { throw new Error("not ready"); } };
  assert.strictEqual(audio.isAudioSupported(), true); // API 探测仍为真
  assert.strictEqual(audio.ensure(), false);
  assert.strictEqual(audio.getContext(), null);
  // 2) 未 reset 前永久短路，不再尝试创建
  globalThis.tt = { getAudioContext: function () { return fakeCtx; } };
  assert.strictEqual(audio.ensure(), false);
  // 3) onShow 调 resetFailed → 重试成功（模拟回前台音频服务恢复）
  audio.resetFailed();
  assert.strictEqual(audio.ensure(), true);
  assert.strictEqual(audio.getContext(), fakeCtx);
  delete globalThis.tt;
});
