# Jev 对弈：象棋与华容道

简体中文 | [English](README.en.md)

## 下载后直接玩

[下载 Windows 便携版 EXE](https://github.com/HamsterPark/Jev-Xiangqi/releases/download/v1.1.0/Jev-Games-1.1.0-x64-portable.exe)，双击打开，输入自己的 Jev API key，就可以选择中国象棋或华容道。程序内可切换「中文 / English」。**无需安装 Node.js，也无需部署 Cloudflare Worker。**

还没有 key？打开 [Jev AI 社区的 API Hub](https://www.jevai.org/jev-api)，点击 **Get API Key**；按[密钥页面](https://www.jevai.org/agent/keys)提示登录并创建个人 key。完整 key 只在创建或替换时显示，请当时妥善保存。不要把 key 分享给别人或提交到 Git。

对弈时需要联网，桌面版只在本次运行的内存中使用 key，关闭后不会保留。本程序目前未进行代码签名，Windows 可能显示安全提示；请只从本仓库的 [Releases 页面](https://github.com/HamsterPark/Jev-Xiangqi/releases)下载。

## 两种玩法

- **中国象棋：**你执红棋先行，Jev 执黑棋。合法走法、将军、将死与困毙由本地规则判定，Jev 只从合法着法中选择。
- **华容道竞速：**Jev 在左、玩家在右，双方从相同的「横刀立马」开局各走各的棋盘。玩家先走，之后严格轮流，每次只滑动一格；谁先让曹操到达底部出口，谁获胜。Jev 每回合通过 API 在能缩短最短通关距离的合法候选中选择——这是**路径引导的 Jev**，并非无引导独立解题。API 失败时可重试，不会伪装成本地走法。

## 开发者

```sh
npm ci
npm test
npm run check
npm run start:desktop
npm run build:exe
```

`start:desktop` 用于本地调试，`build:exe` 生成 Windows x64 便携版。网页版象棋仍在 [GitHub Pages](https://hamsterpark.github.io/Jev-Xiangqi/)；它需要自行部署 Worker，详见 [`worker/README.md`](worker/README.md)。

象棋的初始棋盘和基础走法基于同一作者的 [Better-Xiangqi](https://github.com/HamsterPark/Better-Xiangqi)。华容道规则与路径引导逻辑来自 [Jev-Huarongdao](https://github.com/HamsterPark/Jev-Huarongdao)。本仓库采用 [MIT 许可证](LICENSE)。
