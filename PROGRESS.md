# 植物大战僵尸抖音版（tt-pvz）— 跨会话进度断点

> 2026-10-16。源：`E:\1workspace\pythonCode\plants_vs_zombies`（pvs/ 22 模块 4643 行，17 植物/10 僵尸/6 关，58 个 Python 测试当机制规格书）。
> 总计划见 `C:\Users\4v\.claude\plans\vivid-gliding-corbato.md` WF4（M0–M7，约 5200 行）。**续做先读本文件。**

## 当前状态：M1 进行中（约 60%）——2026-10-16 关机断点，续做从本节开始

### M1 已落盘且测试全绿（core 17/17 + **m1 14/14**）

| 文件 | 状态 |
|---|---|
| `js/config.js` | ✅ 全量：PLANT_SPECS 17/ZOMBIE_SPECS 10/LEVELS 6/经济行为常量/NIGHT 调色板/HUD 布局（SUN_PLATE/CARD_*/SHOVEL_RECT/BAR_RECT）/HOUSE_W |
| `js/save.js` | ✅ 注入式存档（default/load/write/recordWin/toggleMusic，不可变；存储 key `pvz_save`，坏数据回退+字段防护） |
| `js/menu.js` | ✅ 菜单纯逻辑：levelRects（150 卡 y356 居中 x0=40）/musicRect (930,18,132,36)/helpPanel/tapAt（level/locked/music/null）/createMenuModel+update（装饰阳光 3.2s 间隔 9s 寿命，注入 rng） |
| `js/render/sprites.js` | ✅ createKit(createCanvas)：get(key,w,h,fn) Map 缓存 + silhouette(src,key) source-in 白剪影 + canvas() 离屏工厂 |
| `js/render/draw.js` | ✅ 图元：rgb/circle(描边width)/ellipse/rect(带radius)/polygon/line/lines/arc/eyes；颜色全数组 |
| `js/render/text.js` | ✅ drawText（center 时 middle 基线）+ textSprite |
| `js/render/assets-common.js` | ✅ 日夜背景(缓存 bg:day/bg:night，含云/棋盘/土带石子种子化/房子/车道/夜：星点+月亮 ImageData 径向晕烘离屏后 lighter drawImage)、drawSun（glow lighter + ray 旋转缓存）、shovel/pause/speed 图标 |
| `js/render/assets-plants.js` | ✅ **17 植物立绘全移植** 96×96 缓存 plant:name:state:frame；shooterBody/tubeSprite/stampRotated、蘑菇部件、jagged 冰盖等；土豆卡槽用 state 1 |

### M1 剩余（续做顺序）

1. **`js/render/menu.js`**：组装菜单画面（母本 menu.py draw：bg + 标题 bob sin(t*2)*6 + 两侧 sunflower/peashooter 84px + 六卡（锁/勾/前两植物 52px，卡名 LEVELS[lv].name 去掉"白天 "前缀）+ 帮助面板 540 + 音乐按钮 + 装饰阳光 drawSun）。tapAt 已在 core，render 只吃 hover。
2. **`js/render/hud.js`**：静态 HUD（母本 hud.py：木条/阳光盘 drawSun+数字/种子卡 draw_card（冷却/affordable/selected 三态，plantImage 54px+价格条）/铲子/进度条旗帜标记/pause·2x 按钮）。M1 只画静态假数据（构造演示 scene：sun=175、cooldowns 全 0、progress 0），M2 接真 level。
3. **main.js 场景化**：scene 状态机 `menu` → 点关卡进 `preview`（静态 bg+HUD+返回，M2 换 LevelScene）；M0 探针画面保留为 `?probe=1` harness 参数（触摸归一回归还要用）。接 tt storage 给 save（封装 {get:tt.getStorageSync,set:tt.setStorageSync}，注意 tt 的 API 签名是 (k,v) 同步）；harness shim 补内存 storage。
4. **浏览器验证（未做，首要！）**：assets-plants 从未在真 canvas 画过——harness 开菜单页与 17 植物陈列页（可加 `?sprites=1` 调试陈列：全部 state0 立绘+日夜背景），与 `pythonCode/plants_vs_zombies/screenshots/01_menu.png` 逐屏比图，截图归档 docs/。重点查：tubeSprite 旋转中心、sunflower 花瓣 rotatedEllipse、night 月光 lighter、文字字体回退。
5. **code-reviewer 审查 M1 全部新文件**（render/ 5 个 + menu/save/config），修 C/H/M。
6. 更新 README/PROGRESS/记账。

### M1 测试（tests/m1.test.mjs，14 个）

config 4（17 植物字段+抽检/10 僵尸特殊字段/6 关白夜结构/经济与布局常量+NIGHT）、save 4（缺省坏数据/合并/写入异常/recordWin 不可变去重+toggleMusic）、menu 4（卡片几何/tapAt 三态/音乐区/装饰阳光寿命）、sprites 2（缓存命中一次绘制/silhouette source-in 顺序）。
**注意**：菜单装饰阳光间隔是生成后重置完整 3.2s（非均匀），测试 update(1.0)→1 个、再 update(3.3)→2 个。

---

## M0（已完成并通过 code review：APPROVE，0 C/H；2 MEDIUM + 6 LOW 全修复，浏览器回归闭环；真机编译待 WF0 用户过 UAC + 抖音号登录）

### M0 审查修复（2026-10-16，已全部关闭）

- MEDIUM-1 音频瞬时失败重试：`audio.js` 导出 `resetFailed()` 放行重试；`main.js` onShow 先 `resetFailed()` 再 `ensure()`（回前台音频服务可能恢复）——原计划 M4 才定案的音频重试语义提前落定
- MEDIUM-2 异常路径补测：注入抛错 `tt.getAudioContext` → ensure false 且未 reset 永久短路 → resetFailed 后重试成功（Node 测试覆盖）
- LOW：clientX 恒为逻辑坐标、不参与 screen 系 1/dpr 校正（防混报机型二次缩放，补测试）；config 补 RED 色板（红十字不再裸写）；cellCenter 改 floorDiv（守 Python // 语义）；HUD 改显 `audio api Y/N  ctx ok/–`（audioReady 每帧刷实际创建结果而非启动快照）；rgb 注释 alpha 通道约束；harness swapped 注释修正
- 测试 15 → **17/17 绿**（新增：校正后 clientX 混报不二次缩放；音频抛错/resetFailed/重试）

### M0 已交付（2026-10-16）

| 文件 | 内容 |
|---|---|
| `js/config.js` | 场地常量（1080×720 横屏世界、9×5 格、草坪 132,112/92×104）+ 基础配色 [r,g,b] 数组；移植自 pvs/config.py |
| `js/util.js` | clamp/lerp/easeOutCubic/easeOutBack/**floorDiv（Python // 地板除，JS 负数坑）**/cellRect/cellCenter/rowOfY/colOfX/pointInLawn/dist |
| `js/rng.js` | mulberry32 + uniform/randint/pick 注入式随机（替代所有 Python random.\* 调用点，平衡矩阵可复现） |
| `js/touch.js` | 触摸归一纯函数：clientX 优先、screenWidth 阈值物理像素 1/dpr 一次性自校正、归一后仍越窗 stillOut、首触 probe 载荷 |
| `js/audio.js` | M0 适配层：tt.getAudioContext/wx.createWebAudioContext/浏览器三分支、ensure 静默降级、currentTime 无环境回退墙上时钟；M4 起搬合成音效 |
| `js/render.js` | M0 探针画面：天空/HUD 木栏/9×5 棋盘格/家防线/出怪虚线；触点画十字+坐标读数+落格高亮 |
| `js/main.js` | tt 平台层：createCanvas DPR letterbox、固定 60Hz 累加器（STEP 已立，M2 接 level.update）、多点触摸、onHide 清触点+暂停标记/onShow、setKeepScreenOn、`[probe] touch/audio` 日志、`globalThis.__pvz` 调试钩子 |
| `harness/index.html` | 1080×720 壳；`?strict=1`（只给 screenX/Y）、`?dpr=3`、`?physical=1`（物理像素上报）、`?swapped=1`（轴对调）、`?sound=1`；同步 XHR CommonJS 加载器；鼠标按住拖动 |
| 工程件 | game.js / game.json（landscape）/ project.config.json（appid 空=测试号）/ start.bat（:8824，纯 ASCII，Python312 全路径）/ .gitignore |

### 验证

- `node --test tests/core.test.mjs` → **17/17 绿**：rng 黄金序列（seed42 四值）、util 全函数含负数地板除、config 不变量与颜色通道、touch 八场景（client 优先/物理像素不可逆/小越窗不校正/dpr1 不判定/stillOut/首触 probe/混报不二次缩放）、audio Node 降级+异常路径
- harness 三档真机模拟（修复后回归，0 console error）：
  - A `?strict=1`：点 (546,372) 世界坐标准确、落格 (4,2)、拖动跟踪、抬起清除；首触 probe `{...,vw:1080,vh:720,screenW:1080,norm:1,landscape:true}` 纯 screenX/Y（docs/tt-pvz-m0-touch.png、tt-pvz-m0-home.png）
  - B `?strict=1&dpr=3&physical=1`：screen (1638,1114) 自校正 → (546,371)，probe 日志 `norm:0.333, landscape:true`
  - C `?dpr=3&physical=1&swapped=1`：轴对调右边缘点归一后 y=914 越窗 → `[probe] touch still out of window` warn 触发
  - 音频回归：默认 muted 下 HUD `audio api Y  ctx –`（getAudioContext 抛错静默降级，仍受信点击 ensure）；`?sound=1` 受信 page.mouse.click 后真实 AudioContext running、HUD `ctx ok`（docs/tt-pvz-m0-audio-ctx.png）
  - `tt._life.hide()/show()` → model.paused true/false、触点清空；show 走 resetFailed→ensure 重试路径，音频保持 running 无错
- 横屏轴对调策略：**不自动交换**（单点无法可靠判别），靠 stillOut warn + 真机十字光标肉眼确认；真机首触必查 `[probe] touch`

## M1 起接力要点（给后续会话）

### 模块映射（Python → JS，计划定稿）

- core/：config（M0 已建，M1 补全植物/僵尸/波次数值）、util（M0 已建）、rng（M0 已建）、save.js（storage 注入）、fx.js（只更新状态）、entities: plants/zombies/projectiles/sun/lawnmower、level.js（导演/碰撞/指令，母本 level.py 675 行）、menu.js、autopilot.js（362 行逐行译）、level-fx.js
- render/：sprites.js（**离屏 canvas 工厂+Map 缓存+source-in 白剪影**，Python 每帧 new Surface 手机必爆）、assets-common/plants/zombies.js（1177 行图元 1:1 搬）、fx-draw.js、hud.js、menu.js、text.js
- audio/sfx.js：_tone/_noise/_mix 数值算法逐字搬，Float32→AudioBuffer；20 音效 + 8s 循环 BGM；无 BiquadFilter/Compressor，用增益包络/主 Gain 0.6 限幅
- main.js：M0 平台层已立；M2 接选卡/拖拽种植（**touchend 落种**）/touchstart 最高优先收阳光/铲子两级

### M1 任务：静态草地 + HUD + 菜单

1. config 补齐 PLANT_SPECS/ZOMBIE_SPECS/波次/配色全量（config.py 剩余部分）
2. render 拆 render/ 目录：背景（日夜两版离屏缓存）、HUD（阳光数/卡槽/铲子/进度旗）、菜单（六选关）
3. 17 植物立绘静态移植（assets_plants.py 图元 API 先验收：离屏工厂+缓存模式跑通一个植物）
4. 对照 Python 版 `screenshots/` 逐屏比图
5. M1 测试：config specs 完整性（17 植物/10 僵尸、cost/hp 字段）、save 读写注入、菜单选关状态机
6. **M2 开工前**：先给 main.js 触摸 identifier 生命周期补 CDP 冒烟（多指 down/move/up 各自 identifier 不串、cancel 清除、move 只跟已存点），再写种植拖拽——M0 仅验过单指全周期

### PvZ 19 坑（M2 后逐步兑现，节选自源项目）

- Rect 不可哈希 → 二维植物网格后 autopilot 所有 dict 调用点系统替换
- Fume.hit 用 Set 存对象引用
- dying 0.35s 后才计数
- 慢动作三重时间尺度；fx.update 必须先于 scaled_dt
- 僵尸 CX/FEET 全局坐标消灭 → 改参数传递
- 出生 ±14px 抖动测试强制 z.x=
- 实体 draw() 全剥出 core（core 要 Node 裸跑）；所有 random.* 改注入 rng

### 里程碑

M0 ✅ → M1 静态草地+HUD+菜单（2–3d）→ M2 白天核心循环 L1 可玩（4–6d，复刻 15 个 Python 测，bot 通关 L1）→ M3a/M3b 植物僵尸扩展 L2–L5 → M4 特效音频全量 → M5 月夜 L6（**36 个 expansion 测一条不少**）→ M6 autopilot+平衡矩阵（6 关×5 seed）→ M7 平台收尾/性能。
M2 结束后若全量周期过长，可与用户确认先发「白天 5 关精选版」（默认仍按全量做）。

### 工程约定（与 tt-kickball/tt-sekiro/tt-jianpu-piano 一致）

- UMD 四层；core/render/touch/util/rng/config 无平台依赖可 Node 直接 require
- 测试：`node --test tests/core.test.mjs`（Node 24 显式传文件，不能传目录）
- harness：Python312 全路径起 :8824（系统 python/py 已坏）
- 共享 Playwright 浏览器勿关勿杀；禁镜像 taskkill，按 PID
- 真机待办：DevTools 4.5.6 测试号导入编译 + 模拟器截图 + 音频基础库 ≥1.34.0 核对 + 首触探针；正式上架需企业+版号，上传预检必接 tt.navigateToScene
