# Jev Games: Xiangqi and Huarong Dao

[简体中文](README.md) | English

## Download and play

[Download the portable Windows EXE](https://github.com/HamsterPark/Jev-Xiangqi/releases/download/v1.1.0/Jev-Games-1.1.0-x64-portable.exe), open it, enter your own Jev API key, and choose Xiangqi or Huarong Dao. You can switch between **中文 / English** inside the app. **No Node.js installation or Cloudflare Worker deployment is required.**

Need a key? Open the [Jev AI Community API Hub](https://www.jevai.org/jev-api), click **Get API Key**, then follow the [key page](https://www.jevai.org/agent/keys) to sign in and create a personal key. The full key is shown only when created or replaced, so save it securely at that time. Never share it or commit it to Git.

Playing requires an internet connection. The desktop app uses the key only in memory for the current run and does not keep it after closing. The app is currently unsigned, so Windows may display a security warning; download it only from this repository's [Releases page](https://github.com/HamsterPark/Jev-Xiangqi/releases).

## Games

- **Xiangqi:** You play Red and move first; Jev plays Black. Local rules determine legal moves, check, checkmate, and stalemate. Jev chooses only among legal moves.
- **Huarong Dao race:** Jev is on the left and you are on the right, each with an independent board in the same classic opening. You move first, then alternate strictly, sliding one piece by one cell per turn. The first to guide Cao Cao to the bottom exit wins. On each turn, Jev uses the API to choose among legal moves that reduce the shortest remaining distance. This is **path-guided Jev**, not unguided independent solving. If the API fails, you can retry; no local move is passed off as Jev's.

## For developers

```sh
npm ci
npm test
npm run check
npm run start:desktop
npm run build:exe
```

`start:desktop` runs the app locally; `build:exe` produces the portable Windows x64 build. The Xiangqi web version remains on [GitHub Pages](https://hamsterpark.github.io/Jev-Xiangqi/); it requires your own Worker, as described in [`worker/README.md`](worker/README.md).

Xiangqi's initial board and basic moves build on the same author's [Better-Xiangqi](https://github.com/HamsterPark/Better-Xiangqi). The Huarong Dao rules and path guidance come from [Jev-Huarongdao](https://github.com/HamsterPark/Jev-Huarongdao). This repository is [MIT licensed](LICENSE).
