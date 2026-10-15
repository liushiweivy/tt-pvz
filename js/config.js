/*
 * config.js — 全局常量、配色与数值平衡配置（1:1 移植 pvs/config.py）。
 * 颜色统一 [r,g,b] / [r,g,b,a] 0-255 数组，渲染层用 rgba() 拼装。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PvZConfig = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ---------- 窗口与场地 ----------
  var SCREEN_W = 1080;
  var SCREEN_H = 720;
  var FPS = 60;
  var HUD_H = 100;

  var COLS = 9, ROWS = 5;
  var CELL_W = 92, CELL_H = 104;
  var LAWN_X = 132, LAWN_Y = 112;          // 草坪左上角
  var LAWN_W = COLS * CELL_W;             // 828
  var LAWN_H = ROWS * CELL_H;            // 520

  var HOUSE_X = 26;
  var HOUSE_W = 118;                      // 背景房子宽（assets_common.HOUSE_W）
  var ZOMBIE_SPAWN_X = LAWN_X + LAWN_W + 70;
  var ZOMBIE_EAT_X = LAWN_X - 44;

  // ---------- 配色 ----------
  var C = {
    SKY: [122, 184, 234],
    LAWN_A: [116, 178, 70],
    LAWN_B: [98, 162, 58],
    LAWN_EDGE: [74, 120, 40],
    WOOD: [108, 78, 48],
    WOOD_DARK: [78, 54, 32],
    WOOD_LIGHT: [146, 106, 66],
    PANEL: [60, 42, 26],
    TEXT: [255, 246, 220],
    TEXT_DARK: [50, 36, 20],
    SUN: [255, 214, 64],
    SUN_CORE: [255, 246, 170],
    PEA: [122, 208, 60],
    PEA_DARK: [74, 150, 32],
    SNOW: [120, 224, 255],
    FIRE: [255, 110, 30],
    FIRE_HOT: [255, 230, 120],
    ZOMBIE: [142, 168, 118],
    ZOMBIE_DARK: [104, 130, 86],
    ZOMBIE_SKIN: [158, 182, 130],
    ZOMBIE_FROZEN: [150, 205, 235],
    CONE: [228, 130, 52],
    BUCKET: [168, 176, 190],
    POLE: [200, 170, 110],
    PAPER: [238, 226, 190],
    FOOTBALL: [96, 70, 150],
    GARG: [130, 140, 120],
    RED: [230, 60, 50],
    WHITE: [255, 255, 255],
    BLACK: [20, 16, 10],
    SHADOW: [0, 0, 0, 70]
  };

  // ---------- 阳光经济 ----------
  var START_SUN = 100;
  var SUN_VALUE = 25;
  var SMALL_SUN_VALUE = 15;
  var NIGHT_START_SUN = 75;
  var SKY_SUN_INTERVAL = 6.5;
  var SKY_SUN_LIFETIME = 9.0;
  var SUN_FLY_TIME = 0.35;

  // ---------- 植物配置 ----------
  // cost 阳光消耗, cooldown 卡片冷却(秒), hp 生命, unlock 解锁关卡(1 起)
  var PLANT_SPECS = {
    sunflower:  { name: "向日葵",   cost: 50,  cooldown: 5.0,  hp: 300,  unlock: 1 },
    peashooter: { name: "豌豆射手", cost: 100, cooldown: 5.0,  hp: 300,  unlock: 1 },
    wallnut:    { name: "坚果墙",   cost: 50,  cooldown: 20.0, hp: 4000, unlock: 2 },
    cherrybomb: { name: "樱桃炸弹", cost: 150, cooldown: 30.0, hp: 300,  unlock: 2 },
    snowpea:    { name: "寒冰射手", cost: 175, cooldown: 5.0,  hp: 300,  unlock: 3 },
    potatomine: { name: "土豆地雷", cost: 25,  cooldown: 20.0, hp: 300,  unlock: 3 },
    repeater:   { name: "双发射手", cost: 200, cooldown: 5.0,  hp: 300,  unlock: 4 },
    jalapeno:   { name: "火爆辣椒", cost: 125, cooldown: 30.0, hp: 300,  unlock: 4 },
    chomper:    { name: "大嘴花",   cost: 150, cooldown: 5.0,  hp: 300,  unlock: 5 },
    // ---- 夜关 / 扩展植物 ----
    threepeater: { name: "三发射手", cost: 325, cooldown: 7.5,  hp: 300,  unlock: 6 },
    puffshroom:  { name: "小喷菇",   cost: 0,   cooldown: 4.5,  hp: 300,  unlock: 6 },
    sunshroom:   { name: "阳光菇",   cost: 25,  cooldown: 7.5,  hp: 300,  unlock: 6 },
    iceshroom:   { name: "寒冰菇",   cost: 75,  cooldown: 30.0, hp: 300,  unlock: 6 },
    hypnoshroom: { name: "魅惑菇",   cost: 75,  cooldown: 30.0, hp: 300,  unlock: 6 },
    spikeweed:   { name: "地刺",     cost: 100, cooldown: 7.5,  hp: 300,  unlock: 6 },
    pumpkin:     { name: "南瓜头",   cost: 125, cooldown: 30.0, hp: 4000, unlock: 6 },
    squash:      { name: "窝瓜",     cost: 50,  cooldown: 30.0, hp: 300,  unlock: 6 }
  };
  var PLANT_ORDER = ["sunflower", "peashooter", "wallnut", "cherrybomb",
                     "snowpea", "potatomine", "repeater", "jalapeno", "chomper",
                     "threepeater", "puffshroom", "sunshroom", "iceshroom",
                     "hypnoshroom", "spikeweed", "pumpkin", "squash"];

  // 植物行为参数
  var SUNFLOWER_INTERVAL = 22.0;
  var SUNFLOWER_FIRST = 7.0;
  var SHOOTER_INTERVAL = 1.4;
  var SHOOTER_RANGE = LAWN_W + 120;
  var REPEATER_GAP = 0.12;
  var WALLNUT_CRACK_HP = [4000 / 3, 4000 / 3 * 2];   // 裂纹两档
  var CHERRY_FUSE = 0.9;
  var CHERRY_RADIUS = CELL_W * 1.4;
  var CHERRY_DAMAGE = 1800;
  var POTATO_ARM_TIME = 8.0;
  var POTATO_TRIGGER_DIST = 34;
  var POTATO_DAMAGE = 1800;
  var JALAPENO_FUSE = 0.8;
  var JALAPENO_DAMAGE = 1800;
  var CHOMPER_RANGE = CELL_W * 0.95;
  var CHOMPER_CHEW = 30.0;
  var CHOMPER_BITE_DAMAGE = 200;

  // ---- 扩展植物行为参数 ----
  var PUFF_INTERVAL = 1.4;
  var PUFF_RANGE = CELL_W * 3;
  var PUFF_DAMAGE = 20;
  var FUME_SPEED = 260.0;
  var SUNSHROOM_FIRST = 6.0;
  var SUNSHROOM_INTERVAL = 22.0;
  var SUNSHROOM_GROW = 24.0;
  var ICE_FUSE = 0.9;
  var FREEZE_DURATION = 7.5;
  var SPIKE_TICK = 0.5;
  var SPIKE_DAMAGE = 20;
  var SQUASH_DAMAGE = 1800;
  var SQUASH_RANGE = CELL_W * 1.15;
  var SQUASH_AIM = 0.22;
  var SQUASH_JUMP = 0.26;

  var PEA_DAMAGE = 20;
  var PEA_SPEED = 380.0;
  var SNOW_SLOW = 0.5;
  var SNOW_DURATION = 5.0;

  // ---------- 僵尸配置 ----------
  // hp, speed(像素/秒), damage(吃植物 点/秒)
  var ZOMBIE_SPECS = {
    basic:      { name: "普通僵尸", hp: 200,  speed: 21, damage: 100 },
    cone:       { name: "路障僵尸", hp: 560,  speed: 21, damage: 100 },
    bucket:     { name: "铁桶僵尸", hp: 1300, speed: 21, damage: 100 },
    flag:       { name: "摇旗僵尸", hp: 200,  speed: 30, damage: 100 },
    pole:       { name: "撑杆僵尸", hp: 340,  speed: 40, damage: 100, walk_speed: 21 },
    newspaper:  { name: "读报僵尸", hp: 340,  speed: 23, damage: 100, rage_speed: 45, paper_hp: 200 },
    football:   { name: "橄榄球僵尸", hp: 1400, speed: 38, damage: 100 },
    imp:        { name: "小鬼僵尸", hp: 200,  speed: 48, damage: 100 },
    gargantuar: { name: "伽刚特尔", hp: 3000, speed: 16, damage: 99999, giant: true,
                  throw_hp: 1500, smash_time: 0.8 },
    screendoor: { name: "铁栅门僵尸", hp: 1300, speed: 21, damage: 100 }
  };

  // ---------- 关卡波次配置 ----------
  // HUD 种子卡槽上限（卡宽 62 + 间距 6：10 张右缘 778 < 铲子 796）
  var HUD_MAX_CARDS = 10;
  // 每关: 出怪总量按类型给出, huge_waves 为大波出现的进度点(0~1, 按已生成数量计)
  var LEVELS = {
    1: { name: "白天 1-1", plants: ["sunflower", "peashooter"],
         zombies: ["basic"].concat(Array(5).fill("basic")),
         spawn_gap: [10.0, 6.0], first_delay: 16.0,
         huge_waves: [], flag_count: 0 },
    2: { name: "白天 1-2", plants: ["sunflower", "peashooter", "wallnut", "cherrybomb"],
         zombies: Array(8).fill("basic").concat(Array(4).fill("cone")),
         spawn_gap: [9.5, 5.5], first_delay: 14.0,
         huge_waves: [0.55], flag_count: 1 },
    3: { name: "白天 1-3", plants: ["sunflower", "peashooter", "wallnut",
                                    "cherrybomb", "snowpea", "potatomine"],
         zombies: Array(8).fill("basic").concat(Array(5).fill("cone"),
                                                Array(3).fill("bucket"),
                                                Array(2).fill("pole")),
         spawn_gap: [9.0, 4.5], first_delay: 16.0,
         huge_waves: [0.45, 0.72], flag_count: 2 },
    4: { name: "白天 1-4", plants: ["sunflower", "peashooter", "wallnut", "cherrybomb",
                                    "snowpea", "potatomine", "repeater", "jalapeno"],
         zombies: Array(7).fill("basic").concat(Array(5).fill("cone"),
                                                Array(3).fill("bucket"),
                                                Array(3).fill("pole"),
                                                Array(3).fill("newspaper"),
                                                Array(2).fill("football")),
         spawn_gap: [9.5, 4.0], first_delay: 18.0,
         huge_waves: [0.4, 0.68], flag_count: 2 },
    // 显式列出白天 9 种：切勿写 PLANT_ORDER 切片，夜战植物追加后会把卡组撑爆 HUD
    5: { name: "白天 1-5 · 决战",
         plants: ["sunflower", "peashooter", "wallnut", "cherrybomb",
                  "snowpea", "potatomine", "repeater", "jalapeno", "chomper"],
         zombies: Array(9).fill("basic").concat(Array(5).fill("cone"),
                                                Array(4).fill("bucket"),
                                                Array(3).fill("pole"),
                                                Array(4).fill("newspaper"),
                                                Array(3).fill("football"),
                                                Array(2).fill("imp"),
                                                ["gargantuar"]),
         spawn_gap: [9.0, 3.8], first_delay: 16.0,
         huge_waves: [0.38, 0.64], flag_count: 2 },
    6: { name: "月夜 2-1", theme: "night", sky_sun: false,
         start_sun: NIGHT_START_SUN,
         plants: ["sunshroom", "puffshroom", "peashooter", "wallnut",
                  "threepeater", "spikeweed", "pumpkin", "squash",
                  "hypnoshroom", "iceshroom"],
         zombies: Array(10).fill("basic").concat(Array(5).fill("cone"),
                                                 Array(3).fill("bucket"),
                                                 Array(2).fill("pole"),
                                                 Array(2).fill("newspaper"),
                                                 Array(3).fill("screendoor")),
         spawn_gap: [10.0, 5.0], first_delay: 18.0,
         huge_waves: [0.45, 0.72], flag_count: 2 }
  };
  var LEVEL_COUNT = Object.keys(LEVELS).length;

  // 最终波（剩余僵尸一口气放出）开始时总进度
  var FINAL_WAVE_PROGRESS = 0.86;

  // ---------- HUD 布局（pvs/scenes/hud.py） ----------
  var SUN_PLATE = [16, 12, 78, 78];
  // 卡宽 62：10 张卡右缘 104+9*68+62=778，与铲子(796)不撞
  var CARD_X0 = 104, CARD_Y = 12, CARD_W = 62, CARD_H = 78, CARD_GAP = 6;
  var SHOVEL_RECT = [796, 14, 60, 74];
  var BAR_RECT = [870, 30, 158, 20];

  // ---------- 夜景色调（assets_common._NIGHT） ----------
  var NIGHT = {
    soil: [58, 48, 64],
    soil_dot: [44, 36, 52],
    sky_top: [16, 20, 52],
    sky_bot: [52, 58, 96],
    lawn_a: [38, 58, 44],
    lawn_b: [32, 50, 38],
    edge: [26, 36, 30],
    track: [66, 62, 80],
    track_line: [48, 44, 62]
  };

  return {
    SCREEN_W: SCREEN_W, SCREEN_H: SCREEN_H, FPS: FPS, HUD_H: HUD_H,
    COLS: COLS, ROWS: ROWS, CELL_W: CELL_W, CELL_H: CELL_H,
    LAWN_X: LAWN_X, LAWN_Y: LAWN_Y, LAWN_W: LAWN_W, LAWN_H: LAWN_H,
    HOUSE_X: HOUSE_X, HOUSE_W: HOUSE_W,
    ZOMBIE_SPAWN_X: ZOMBIE_SPAWN_X, ZOMBIE_EAT_X: ZOMBIE_EAT_X,
    C: C,
    START_SUN: START_SUN, SUN_VALUE: SUN_VALUE, SMALL_SUN_VALUE: SMALL_SUN_VALUE,
    NIGHT_START_SUN: NIGHT_START_SUN, SKY_SUN_INTERVAL: SKY_SUN_INTERVAL,
    SKY_SUN_LIFETIME: SKY_SUN_LIFETIME, SUN_FLY_TIME: SUN_FLY_TIME,
    PLANT_SPECS: PLANT_SPECS, PLANT_ORDER: PLANT_ORDER,
    SUNFLOWER_INTERVAL: SUNFLOWER_INTERVAL, SUNFLOWER_FIRST: SUNFLOWER_FIRST,
    SHOOTER_INTERVAL: SHOOTER_INTERVAL, SHOOTER_RANGE: SHOOTER_RANGE, REPEATER_GAP: REPEATER_GAP,
    WALLNUT_CRACK_HP: WALLNUT_CRACK_HP,
    CHERRY_FUSE: CHERRY_FUSE, CHERRY_RADIUS: CHERRY_RADIUS, CHERRY_DAMAGE: CHERRY_DAMAGE,
    POTATO_ARM_TIME: POTATO_ARM_TIME, POTATO_TRIGGER_DIST: POTATO_TRIGGER_DIST, POTATO_DAMAGE: POTATO_DAMAGE,
    JALAPENO_FUSE: JALAPENO_FUSE, JALAPENO_DAMAGE: JALAPENO_DAMAGE,
    CHOMPER_RANGE: CHOMPER_RANGE, CHOMPER_CHEW: CHOMPER_CHEW, CHOMPER_BITE_DAMAGE: CHOMPER_BITE_DAMAGE,
    PUFF_INTERVAL: PUFF_INTERVAL, PUFF_RANGE: PUFF_RANGE, PUFF_DAMAGE: PUFF_DAMAGE, FUME_SPEED: FUME_SPEED,
    SUNSHROOM_FIRST: SUNSHROOM_FIRST, SUNSHROOM_INTERVAL: SUNSHROOM_INTERVAL, SUNSHROOM_GROW: SUNSHROOM_GROW,
    ICE_FUSE: ICE_FUSE, FREEZE_DURATION: FREEZE_DURATION,
    SPIKE_TICK: SPIKE_TICK, SPIKE_DAMAGE: SPIKE_DAMAGE,
    SQUASH_DAMAGE: SQUASH_DAMAGE, SQUASH_RANGE: SQUASH_RANGE, SQUASH_AIM: SQUASH_AIM, SQUASH_JUMP: SQUASH_JUMP,
    PEA_DAMAGE: PEA_DAMAGE, PEA_SPEED: PEA_SPEED, SNOW_SLOW: SNOW_SLOW, SNOW_DURATION: SNOW_DURATION,
    ZOMBIE_SPECS: ZOMBIE_SPECS,
    HUD_MAX_CARDS: HUD_MAX_CARDS, LEVELS: LEVELS, LEVEL_COUNT: LEVEL_COUNT,
    FINAL_WAVE_PROGRESS: FINAL_WAVE_PROGRESS,
    SUN_PLATE: SUN_PLATE,
    CARD_X0: CARD_X0, CARD_Y: CARD_Y, CARD_W: CARD_W, CARD_H: CARD_H, CARD_GAP: CARD_GAP,
    SHOVEL_RECT: SHOVEL_RECT, BAR_RECT: BAR_RECT,
    NIGHT: NIGHT
  };
});
