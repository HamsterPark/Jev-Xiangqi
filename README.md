# Jev 中国象棋

一个浏览器象棋小游戏：你执红棋，Jev 执黑棋。棋盘、合法走法、将军和胜负由本地规则代码判定；Jev 只从合法黑方着法中选择一步。

网页已发布在 [GitHub Pages](https://hamsterpark.github.io/Jev-Xiangqi/)。**想实际对弈，需要自行部署棋步服务并使用自己的 Jev API key。** 此仓库和网页不包含任何人的 key，也不提供共享 API 服务。

## 自行部署并对弈

1. 安装 [Node.js](https://nodejs.org/) 并取得自己的 [Jev API key](https://www.jevai.org/agent/keys)。把本仓库下载或克隆到本机。
2. 在 `worker` 目录运行 `npx wrangler login`，按浏览器提示登录自己的 Cloudflare 账号。
3. 在同一目录运行 `npx wrangler secret put JEV_API_KEY`，在提示符中输入自己的 key。不要把 key 写进源码、命令参数或 Git 提交。此命令会发布带有密钥的 Worker。
4. 运行 `npx wrangler deploy`，记下输出的 `https://…workers.dev` 地址。
5. 打开[象棋网页](https://hamsterpark.github.io/Jev-Xiangqi/)，把 Worker 地址粘贴到“服务地址”栏。网页会自动补上 `/api/move`，随后即可执红对弈。

默认 Worker 只允许来自 `https://hamsterpark.github.io` 的网页请求。如果你把网页也部署在自己的域名或 GitHub Pages 账号下，先将 `worker/wrangler.jsonc` 的 `ALLOWED_ORIGINS` 改为该网页的完整来源地址，再部署 Worker。

Jev key 只存于你自己的 Worker Secret。网页只在本地保存服务地址；Jev API 可能有每日请求额度，用完后棋局会显示提示。

## 本地开发

```sh
npm test
npm run check
python -m http.server 8000
```

打开 `http://localhost:8000/`。Worker 接受本机开发来源；正式网页由 GitHub Pages 提供。

## 项目来源

初始棋盘和基础走法模块基于同一作者的 [Better-Xiangqi](https://github.com/HamsterPark/Better-Xiangqi)，按 MIT 许可证使用；本项目增加经典 9×10 对弈所需的将军与将死判定。
