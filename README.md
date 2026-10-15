# 植物大战僵尸（tt-pvz · 抖音小游戏版）

17 植物 / 10 僵尸 / 6 关横版塔防的纯 Canvas 抖音小游戏移植。源：`E:\1workspace\pythonCode\plants_vs_zombies`（Pygame 版，机制以其 58 个 Python 测试为规格书）。**当前处于 M0 里程碑**：平台脚手架与横屏触摸探针已完成，可玩内容从 M1/M2 起逐里程碑交付，断点与路线见 [PROGRESS.md](./PROGRESS.md)。

## 架构（UMD 四层，与 tt-kickball/tt-sekiro/tt-jianpu-piano 同范式）

- `js/config.js` — 场地常量与配色（数值真源，移植 pvs/config.py；颜色 [r,g,b] 数组）
- `js/util.js` — 纯数学/场地几何（含 **floorDiv 地板除**，移植 Python `//`）
- `js/rng.js` — 注入式 mulberry32（平衡矩阵可复现，替代 Python random.\*）
- `js/touch.js` — 触摸坐标归一纯函数（物理像素 1/dpr 自校正、横屏探针）
- `js/audio.js` — tt/wx/浏览器三分支音频适配（ensure 静默降级、resetFailed 放行瞬时失败后的重试；M0 仅探测，M4 搬 20 音效+BGM）
- `js/render.js` — M0 探针画面（M1 起拆 render/ 多模块：离屏精灵缓存）
- `js/main.js` — 平台层：createCanvas、DPR letterbox（横屏 1080×720）、60Hz 固定步长、生命周期

## 运行

1. **抖音开发者工具**（4.5.6）→ 导入本目录 → 类型「小游戏」→ AppID 选**测试号**（`project.config.json` 中 appid 留空）。
2. 基础库 ≥1.34.0（`tt.getAudioContext()` 门槛，M4 起需要）。
3. **真机首触必查** console：`[probe] touch {...,"norm":1,"landscape":true}`；手指处十字应精准跟随，落格读数正确。若出现 `[probe] touch still out of window` warn，说明横屏轴对调/坐标语义异常，需平台层处理。

浏览器联调：

```powershell
# 双击 start.bat，或 Git Bash：
"/c/Users/4v/AppData/Local/Programs/Python/Python312/python.exe" -m http.server 8824
# http://127.0.0.1:8824/harness/index.html
```

harness 查询参数：

| 参数 | 模拟 |
|---|---|
| `?strict=1` | 严格抖音契约：Touch 只给 screenX/screenY |
| `?dpr=3` | 高 DPR 设备 pixelRatio=3 |
| `?physical=1` | 触摸按物理像素上报（验证 1/dpr 自校正，一般与 dpr 联用） |
| `?swapped=1` | 横屏轴对调（screenX/Y 交换，观察 stillOut warn） |
| `?sound=1` | 真实 AudioContext（受信点击解锁后 HUD 显 `ctx ok`，验证音频创建/重试路径） |

`globalThis.__pvz` 暴露 model/config/rng/touchState/sysInfo/audio()；`tt._life.hide()/show()` 模拟前后台（show 走 resetFailed→ensure）。

## 测试

```powershell
node --test tests/core.test.mjs
```

**17 个测试**：rng 黄金序列与注入 API、util（缓动/地板除/格子几何）、config 不变量与颜色通道、touch 八场景（client 优先、物理像素一次性归一、screenWidth 小越窗不误判、dpr1 不判定、stillOut、首触 probe、**校正后 clientX 混报不二次缩放**）、audio 无环境降级与抛错/resetFailed/重试异常路径。M0 已过 code review（APPROVE，0 C/H；2 MEDIUM + 6 LOW 全修复，清单见 PROGRESS.md）。

截图见 `docs/`（m0-home 首屏、m0-touch 落格探针、m0-audio-ctx 真实音频解锁后 HUD `ctx ok`）。

## 里程碑（详见 PROGRESS.md）

M0 脚手架/探针 ✅ → M1 静态草地+HUD+菜单 → **M2 白天核心循环 L1 可玩** → M3 植物僵尸扩展 L2–L5 → M4 特效音频 → M5 月夜 L6 → M6 autopilot 平衡矩阵 → M7 平台收尾/性能。

## 发布备注（暂未做）

测试号不能上传；正式发布需抖音开放平台小游戏 AppID（游戏类目通常需企业主体 + 版号）。上传预检必接「侧边栏复访」`tt.navigateToScene`。
