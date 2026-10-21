# Codex 桌面版 —— 逆向分析 · 外观复刻

> 目标机器上装的是 `OpenAI.Codex 26.1013.4894.0 x64`。
> 下面每一条都是从那台机器上实际拆出来的，不是猜的。

---

## 0. 结论先行

| 问题 | 答案 |
|---|---|
| 它是什么 | Chromium 壳（OpenAI 内部叫 `owl` 运行时）+ 一个 560MB 的 React 前端 + 一个 341MB 的 Rust 后端 |
| 前端在哪 | `app/resources/app.asar` → `/webview/` |
| 设计系统 | Tailwind v4 + CSS Modules，25 档中性色阶，双主题，全部走 CSS 变量 |
| 外观真值从哪来 | 包内自带一段 13.6s 的 `appshot-demo` 录屏（819 帧），逐帧采样 |
| 复刻产物 | `app/` —— 零依赖静态前端，双击即开，暗/亮双主题 |

---

## 1. 包的身份

```
Name            : OpenAI.Codex
PackageFullName : OpenAI.Codex_26.1013.4894.0_x64__2p2nqsd0c76g0
InstallLocation : C:\Program Files\WindowsApps\OpenAI.Codex_26.1013.4894.0_x64__2p2nqsd0c76g0
Version         : 26.1013.4894.0
```

`resources/owl-app.ini`

```ini
[Owl]
UserDataDirectoryName=Codex
AppVersion=26.1013.40934
```

`resources/owl-electron-app.json`

```json
{
  "packagedFrom": "C:\\a\\minirepo\\minirepo\\codex\\codex-apps\\electron\\out\\Codex-win32-x64",
  "runtimeArchiveSha": "1487ec3563a0989f8af4eb9daab8ca4e232ecda6ddee5d668326b44cdc781740",
  "runtimeName": "owl"
}
```

内部源码路径 `codex/codex-apps/electron/`，运行时名 `owl`。用户数据目录是 `%USERPROFILE%\.codex`（`-rw-r--r--` 的 `.codex-global-state.json` 265KB 就在那儿）。

---

## 2. 目录解剖

`app/` 下面：

| 文件 | 大小 | 说明 |
|---|---|---|
| `chrome.dll` | 329 MB | Chromium 本体 |
| `ChatGPT.exe` | 4.8 MB | 主进程（Electron 主进程，产品名还叫 ChatGPT） |
| `Codex.exe` | 20 KB | 启动器 |
| `resources/app.asar` | 582 MB | 前端 + 主进程代码 |
| `resources/codex.exe` | 341 MB | Codex agent 本体（Rust） |
| `resources/codex-code-mode-host.exe` | 75 MB | 代码模式宿主 |
| `resources/codex-windows-sandbox-service.exe` | 56 MB | Windows 沙箱服务 |
| `resources/rg.exe` | 4.4 MB | ripgrep |
| `resources/tectonic/tectonic.exe` | 55 MB | LaTeX 引擎 |
| `resources/codex-classic.wav` | 266 KB | 完成提示音 |
| `resources/codex-notification.wav` | 110 KB | 通知音 |

`app.asar.unpacked/node_modules/` 只有三个原生模块：`better-sqlite3`、`node-pty`、`@worklouder/device-kit-oai`（Codex Micro 那套硬件键盘的驱动）。

`resources/plugins/openai-bundled/plugins/` 里是插件：`code-review`、`computer-use`、`deep-research`、`latex`、`visualize`、`image-guided-assets`、`codex-app-tools`、`unified-computer-use`。

`resources/skills/skills/.curated/` 里有一个 `hatch-pet`（宠物孵化），带完整的 sprite 图集生成脚本链——那套 `codex-spritesheet-v6.webp` 1.3MB 就是它。

---

## 3. asar 结构（自己写的解析器）

没装 `@electron/asar`，直接读头：

```
offset 0   uint32  4
offset 4   uint32  headerPickleSize      (5,852,972)
offset 8   uint32  jsonSize              (5,852,968)
offset 12  uint32  jsonSize'             (5,852,962)
offset 16  ...     JSON header
data start = 8 + headerPickleSize        (5,852,980)
```

全包 **21,073 个条目**，`/webview/` 占 560 MB。

前端骨架 `/webview/index.html`（15 KB）只做一件事：先把 OpenAI blossom 的 shimmer 动画画出来占位，再挂 `index-*.js`。它的 `--startup-logo-mask` 是内联的 base64 SVG path。

样式表：

| 文件 | 大小 |
|---|---|
| `app-shared-*.css` | 1,307,139 B |
| `app-initial-*.css` | 277,453 B |
| `app-primary-*.css` | 41,521 B |

JS 主包 `app-initial-*.js` 14.4 MB，`app-shared-*.js` 5.8 MB，其余是 100+ 个语言包（每个 3–5 MB）和 lazy chunk。

---

## 4. 设计系统（真值）

类名形如 `_Button_eg66f_2`、`_ComposerLayoutRoot_5est5_2` —— Tailwind v4 + CSS Modules。

### 基础

```css
--spacing: 4px;
--radius-xl-base: .75rem;      /* 12px */
--corner-radius-scale: 1;
--font-sans-default: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono-default: ui-monospace, "SFMono-Regular", "SF Mono", menlo, consolas, ...;
```

### 中性色阶（25 档，light / dark 双列，产品原值）

| token | light | dark |
|---|---|---|
| `--gray-0` | `#ffffff` | `#0d0d0d` |
| `--gray-25` | `#fcfcfc` | `#101010` |
| `--gray-50` | `#f9f9f9` | `#131313` |
| `--gray-75` | `#f3f3f3` | `#161616` |
| `--gray-100` | `#ededed` | `#181818` |
| `--gray-150` | `#dfdfdf` | `#1c1c1c` |
| `--gray-200` | `#cdcdcd` | `#212121` |
| `--gray-250` | `#b9b9b9` | `#282828` |
| `--gray-300` | `#afafaf` | `#303030` |
| `--gray-350` | `#9f9f9f` | `#393939` |
| `--gray-400` | `#8f8f8f` | `#414141` |
| `--gray-450` | `#767676` | `#4f4f4f` |
| `--gray-550` | `#4f4f4f` | `#767676` |
| `--gray-600` | `#414141` | `#8f8f8f` |
| `--gray-700` | `#303030` | `#afafaf` |
| `--gray-800` | `#212121` | `#cdcdcd` |
| `--gray-900` | `#181818` | `#ededed` |
| `--gray-950` | `#131313` | `#f3f3f3` |
| `--gray-1000` | `#0d0d0d` | `#ffffff` |

### 双主题的实现手法

Lightning CSS 的坑：一条声明里塞两个 `var()`，靠"哪个变量被定义"来决定取值。

```css
--gray-0: var(--lightningcss-light, #fff) var(--lightningcss-dark, #0d0d0d);
```

暗色模式下 `--lightningcss-dark` 是空值、`--lightningcss-light` 未定义，于是前半段塌成空、后半段生效。复刻时我直接把两列解析成两张真值表，没搬这套机制。

### 语义 token（节选）

```
--color-surface              → #212121 (dark)
--color-surface-secondary    → #303030
--color-surface-tertiary     → #414141
--color-surface-elevated     → #1b1b1b
--color-text-secondary       → #cdcdcd
--color-text-tertiary        → #afafaf
--color-border               → #ffffff26
--color-border-strong        → color-mix(in oklab, #fff 16%, transparent)
--color-border-light         → #ffffff0d
```

### 壳层 token（一整套 `--app-shell-*`）

```
--app-shell-titlebar-height            var(--height-toolbar)
--app-shell-main-surface-clip-start-radius  var(--app-shell-window-radius, var(--radius-xl-base))
--app-shell-main-surface-top-start-radius   var(--radius-xl-base)
--app-shell-sidebar-popover-radius     calc(var(--radius-xl-base) - var(--spacing))   /* 12 - 4 = 8 */
--app-shell-main-content-border-width  var(--border-width-hairline)
--app-shell-page-inline-end-inset      var(--spacing)
```

还有 `:root[data-codex-os=win32]`、`:root[data-codex-window-chrome=application-menu]` 这类平台分支——Windows 上标题栏走应用菜单，不是 mac 的交通灯。

---

## 5. 界面真值（逐帧）

包里有 `webview/assets/appshot-demo-*.mp4`：901×1095，819 帧，13.65 秒，一段 macOS 上真实使用 Codex 的录屏。

抽帧 + 像素采样得到（light）：

| 区域 | 采样值 |
|---|---|
| 窗口外桌面 | `#72c2f4` |
| 标题栏/tab 条底 | `#e2e5e6` ~ `#edefef` |
| 侧栏底 | `#f3f3f5`（≈ `--gray-75`） |
| 主内容面 | `#ffffff` |
| 激活 tab | `#ffffff` + 0.5px 描边 + 1px 投影 |

结构（从上到下）：

```
┌ 交通灯 ●●●  ▣ ⌄ │ ← tab 条（pill，激活项白底）→ │ ⇪ + ▤ ┐
├──────────────┬──────────────────────────────────────────┤
│ New chat     │  Summarize this  ⋯                       │
│ Search       │ ┌──────────────────────┬───────────────┐ │
│ Plugins      │ │ 消息流                │ Preview/Files │ │
│ Automations  │ │                      │ /Changes      │ │
│ Codex mobile │ │                      │               │ │
│              │ └──────────────────────┴───────────────┘ │
│ Pinned       │  ┌────────────────────────────────────┐  │
│  Create...2h │  │ Ask for follow-up changes          │  │
│ Projects     │  │ + ⊙Auto-review⌄   ◇5.5 Low⌄ 🎤 ↑ │  │
│  designtool  │  └────────────────────────────────────┘  │
│ Chats        │                                          │
│  summarize 2h│                                          │
│ ⚙ Settings   │                                          │
│ (H) He  Plus │                                          │
└──────────────┴──────────────────────────────────────────┘
```

Composer 细节（放大 3× 采样）：占位文案 `Ask for follow-up changes`；左下有 `+` 和蓝字 `◎ Auto-review ⌄`；右下 `◇ 5.5 Low ⌄`、麦克风、**纯黑圆形**发送键（白色向上箭头，禁用态降透明度）。

侧栏图标是 16px 线性图标：方框+笔、放大镜、四宫格、时钟、手机。项目和会话行右侧跟时间戳（`2h` / `1.3m` / `2.1m`）。

---

## 6. 复刻实现

### 技术选择

零依赖静态前端。理由：外观复刻要的是"打开就能对着看"，不是先装 node_modules 再等构建。

```
codex-clone/
├─ app/
│  ├─ index.html          结构 + 内联 SVG sprite（28 个图标）
│  ├─ css/tokens.css      设计 token，light/dark 双列，值来自第 4 节
│  ├─ css/app.css         壳层 / 侧栏 / 消息流 / diff / composer / 菜单
│  ├─ js/app.js           diff 渲染、语法着色、面板切换、菜单、发送
│  └─ assets/             官方 cloud logo（dark/light still）
├─ ref/                   从 asar 抽出来的原始素材（css/svg/录屏帧）—— 不进仓库，用 tools 重生成
│  └─ codex-ui-kit/      上游 tokens.css + style.css 参考副本
├─ tools/                 asar 解析器、token 解析器、像素采样器
├─ screenshots/           渲染结果
├─ docs/UPSTREAM.md       从 codex-ui-kit 取了哪些值、哪里对不上
└─ README.md              仓库门面
```

### 已经对上的

- 窗口壳：46px 标题栏、交通灯 12px/间距 8px、tab pill（30px 高、8px 圆角、激活白底 + 双层阴影）
- 侧栏 274px，行高 30–32px，8px 圆角，hover `rgba(0,0,0,.045)`，壳层字重 445
- 主内容面：12px 圆角 + 0.5px 描边 + 1px 投影，`--shadow-surface`；正文栏 768px，内边距 33/24/32，行高 22px，字号 14px
- 消息流：用户气泡右对齐 16px 圆角；`Thought for 6s`；工具卡（`Ran` / `Edited` + 退出码 + 等宽终端块）；diff 卡（行号列 + `+/−` + 绿/红底）
- 右栏三页签：Preview / Files / Changes，宽度 667px（上限 44% 视口）
- Composer：25px 圆角、`--shadow-composer` 三层阴影、聚焦时 3px 蓝色光晕、控件 28px、占位文案、`+` / `Auto-review` / `5.5 Low` / 麦克风 / 黑色圆形发送
- 暗色主题：`#0d0d0d` 壳 → `#131313` 侧栏 → `#181818` 主面 → `#171717` 对话区 → `#282828` 浮层，全部来自色阶原值

### 交互

- `⌘/Ctrl + B` 或左上按钮折叠侧栏
- 主题切换（右上 ✦ 按钮），存 localStorage
- 模型 / 审批模式下拉菜单（`5.5 Low` / `5.5 High` / `5.1-Codex-Max`…；`Auto-review` / `Read only` / `Full access`）
- Composer 自动撑高、`Enter` 发送、`Shift+Enter` 换行；发送后走一遍"思考 → 工具调用"的假回合
- `New chat` → 首页空态（cloud logo + `What are we building?` + 建议 chip）
- 右栏三页签切换；`Files` 页签是真的语法着色（关键字/字符串/注释/数字）
- URL 参数：`?theme=light|dark`、`?view=home`、`?static=1`（关动画，截图用）

### 打开方式

```
双击 app/index.html
```

或

```bat
start "" "app\index.html"
```

---

## 7. 差距与下一步

**已知差距**

1. 图标是手绘的 16px 线性图标（1.4px stroke），不是官方那套内联 SVG 组件——原包的图标编译进 React chunk 里，没有独立文件。1:1 形态一致，节点级不同。
2. 消息内容是我编的一段真实感的会话（侧栏折叠动画 + 回归测试），不是你的历史 thread。
3. 平台差异：真机 Windows 版标题栏走 `data-codex-window-chrome=application-menu`（应用菜单），录屏是 macOS 版（交通灯）。复刻按录屏走，因为那是唯一有像素真值的形态。

**下一步（按性价比排）**

1. 接真后端：`resources/codex.exe` 支持 `app-server` 的 JSON-RPC，接上就能跑真任务，前端不用改。
2. 打包成窗口：Electron（`ChatGPT.exe` 同款壳）或 Tauri，加 `-webkit-app-region: drag` 让标题栏可拖。
3. 补全页面：Settings、Plugins 市场、Search、Codex mobile 配对、diff 侧栏的全文件视图。
4. 提取官方图标：从 `app-initial-*.js` 里把 SVG path 抠出来替换手绘版。

---

## 8. 复现步骤（工具脚本）

```bash
# 1. 列 asar
python tools/asar_tool.py list "<install>/app/resources/app.asar"

# 2. 抽单个文件
python tools/asar_tool.py cat "<asar>" /webview/index.html > ref/index.html

# 3. 解析 token（解析 var() 链，暗色列优先）
python tools/tokens.py --color-surface --color-border --radius-xl-base

# 4. 录屏抽帧
ffmpeg -i appshot-demo.mp4 -vf "select='eq(n,0)+eq(n,420)+eq(n,800)'" -fps_mode passthrough frames/f%02d.png

# 5. 像素采样
python tools/sample.py ref/img/frames/f05.png
```


---

## 9. 与 `codex-ui-kit` 对账（2026-10-21 追加）

`github.com/JaminZhou/codex-ui-kit` —— 一个人把 Codex 桌面版 UI 逆向成 58 个 React 组件，MIT，npm 上是 `codex-ui-kit@0.1.2`。
抓下来当参考副本放在 `ref/codex-ui-kit/`（`npm pack` 取的，GitHub raw 这条网络走不通，代理 502）。

### 对得上的

灰度阶 **10 / 14 档完全一致**（50 / 75 / 100 / 300 / 550 / 600 / 700 / 800 / 900 / 1000）——他确实拿到了真值，不是凭眼睛调的。
圆角阶也完全一致（4 / 6 / 8 / 10 / 12 / 16 / 20）。

### 对不上的

| token | 他 | 渲染层真值 |
|---|---|---|
| `gray-450` | `#626262` | `#767676` |
| `gray-500` | `#5d5d5d` | 真色阶里没这一档 |
| `gray-750` | `#282828` | 那是 `gray-250` 的 dark 值 |

他的色阶还缺 25 / 150 / 200 / 250 / 350 / 400 / 650 / 850 / 925 / 950 / 975 共 11 档。

### 从他那儿回填的（都已标注 upstream 名）

我原来靠录屏采样 + 推理出来的几个数，他给了确定值：

| 项 | 我原来 | 回填后 | 来源 |
|---|---|---|---|
| 侧栏宽 | 260px | **274px** | `--app-sidebar-width: 17.125rem` |
| 标题栏高 | 44px | **46px** | `--app-window-chrome-height: 2.875rem` |
| 会话头高 | 40px | **46px** | `--conversation-thread-header-height` |
| 正文栏宽 | 720px | **768px** | `--thread-content-max-width: 48rem` |
| 正文顶部内边距 | 22px | **33px** | `--conversation-thread-content-top-inset: 2.0625rem` |
| 轮次间距 | 18px | **12px**（用户轮 34px） | `--thread-turn-gap` / `--user-turn-gap` |
| 正文字号/行高 | 15px / 1.62 | **14px / 22px** | `--conversation-thread-font-size` / `-line-height` |
| Composer 圆角 | 16px | **25px** | `--radius-composer: 1.5625rem` |
| Composer 控件 | 26px | **28px** | `--composer-control-size: 1.75rem` |
| 侧栏字重 | 400 | **445** | `--font-weight-shell` |
| 暗色主面 | `#212121` | **`#181818`** | `--background-surface: gray-900` |
| 暗色对话区 | — | **`#171717`** | `--conversation-thread-background` |
| 浅色正文 | `#0d0d0d` | **`#1a1c1f`** | `--text-foreground` |
| 暗色描边 | `white 10%` | **`white 8%`**（heavy 16%） | `--border` / `--border-heavy` |

最要紧的两条：**正文字号是 14px 不是 16px**（他那个 `--font-size-md: 1rem` 是通用阶，真正用在会话里的是 `.875rem`），
**暗色主面是 `#181818` 不是 `#212121`**。我原来两处都偏了。

### 他的状况

1 star / 0 fork / 405 下载每月；2026-07-14 建，10-14 起转 on-demand 维护，像素匹配暂停，基线停在 `26.930`（真机已 `26.1013`）。

`PARITY.md` 里有句话值得留着：

> 通过 `pnpm check` 意味着仓库内部契约健康。它不会扩大观察到的产品分母，不得被报告为产品级对齐。

工程 9 分，产品 2 分。它回答了"Codex UI 长什么样"，但答得太彻底，把自己锁死在一次快照上。
对我们有用的不是那 58 个组件，是这批验证过的数值，和那套"什么才算验证过"的定义。
