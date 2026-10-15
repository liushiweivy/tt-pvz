# 植物大战僵尸抖音版（tt-pvz）— 跨会话进度断点

> 2026-10-16。源：`E:\1workspace\pythonCode\plants_vs_zombies`（pvs/ 22 模块 4643 行，17 植物/10 僵尸/6 关，58 个 Python 测试当机制规格书）。
> 总计划见 `C:\Users\4v\.claude\plans\vivid-gliding-corbato.md` WF4（M0–M7，约 5200 行）。**续做先读本文件。**

## 当前状态：M0 完成并通过 code review（APPROVE，0 C/H；2 MEDIUM + 6 LOW 全修复）+ 浏览器回归闭环；待 DevTools 真机编译（WF0 等用户过 UAC + 抖音号登录）

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
