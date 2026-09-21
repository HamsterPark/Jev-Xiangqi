# Jev 中国象棋

一个公开的浏览器象棋小游戏。访客执红棋，Jev 每回合从合法黑方着法中选择一步。棋盘、合法着法、将军和胜负判定都由本地规则代码处理。前端以静态 HTML 部署在 GitHub Pages；`worker/` 中的 Cloudflare Worker 持有 Jev API 密钥并代发请求。

## 本地运行

```sh
python -m http.server 8000
```

打开 `http://localhost:8000/`。运行 `npm test` 验证规则。要让 Jev 实际落子，需部署 Worker 后把 `main.js` 中的 `API_ENDPOINT` 设为 Worker 的 `/api/move` 地址；密钥只设为 Worker Secret `JEV_API_KEY`，绝不要写入网页或 Git 仓库。

## 项目来源

初始棋盘和基础走法模块基于同一作者的 [Better-Xiangqi](https://github.com/HamsterPark/Better-Xiangqi)，按 MIT 许可证使用；本项目增加标准 9×10 对弈所需的将军与将死判定。
