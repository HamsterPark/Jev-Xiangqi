const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { app, BrowserWindow, ipcMain, net, protocol, session, shell } = require('electron');

const ROOT = path.resolve(__dirname, '..');
const APP_URL = 'app://bundle/index.html';
const RACE_URL = 'app://bundle/race.html';
const GOMOKU_URL = 'app://bundle/gomoku.html';
const EXTERNAL_HOSTS = new Set(['www.jevai.org', 'jevai.org', 'github.com', 'hamsterpark.github.io']);
const APP_FILES = /^(?:index\.html|main\.js|piece-labels\.js|style\.css|service\.css|race\.html|race\.js|race\.css|gomoku\.html|gomoku\.js|gomoku\.css|favicon\.svg|assets\/js\/[a-z0-9-]+\.js)$/;
const MIME = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
});
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

protocol.registerSchemesAsPrivileged([{
  scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true },
}]);

let mainWindow;
let desktopService;

function openExternalIfAllowed(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !EXTERNAL_HOSTS.has(url.hostname) || url.username || url.password) return;
    shell.openExternal(url.href).catch(() => {});
  } catch {
    // Unknown destinations are deliberately ignored.
  }
}

function isTrustedSender(event) {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  const contents = mainWindow.webContents;
  const currentUrl = contents.getURL();
  return event.sender === contents && event.senderFrame === contents.mainFrame &&
    (currentUrl === APP_URL || currentUrl === RACE_URL || currentUrl === GOMOKU_URL || currentUrl === 'app://bundle/');
}

function registerIpc() {
  const actions = {
    'jev:set-key': (key) => desktopService.setKey(key),
    'jev:clear-key': () => desktopService.clearKey(),
    'jev:has-key': () => desktopService.hasKey(),
    'jev:request-move': (payload) => desktopService.requestMove(payload),
    'jev:start-race': () => desktopService.startRace(),
    'jev:play-race-move': (moveId) => desktopService.playRaceMove(moveId),
    'jev:request-race-move': () => desktopService.requestRaceMove(),
    'jev:start-gomoku': () => desktopService.startGomoku(),
    'jev:play-gomoku-move': ({ x, y }) => desktopService.playGomokuMove(x, y),
    'jev:request-gomoku-move': () => desktopService.requestGomokuMove(),
  };
  for (const [channel, action] of Object.entries(actions)) {
    ipcMain.handle(channel, async (event, value) => {
      if (!isTrustedSender(event)) return { ok: false, error: '操作被拒绝。' };
      try {
        return { ok: true, value: await action(value) };
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        const safe = /^(?:请输入|请先输入|Jev 正在思考|Jev 今日额度|Jev API key 无效|Jev 连接失败|棋局数据无效|华容道走法无效|五子棋落点无效|当前不是 Jev 的回合|Jev 连接超时|对局已重开)/.test(message);
        return { ok: false, error: safe ? message : '操作失败，请重试。' };
      }
    });
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1250,
    height: 880,
    minWidth: 960,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#132f2c',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      webviewTag: false,
      allowRunningInsecureContent: false,
    },
  });
  mainWindow = window;
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternalIfAllowed(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-frame-navigate', (details) => {
    if (details.url === APP_URL || details.url === RACE_URL || details.url === GOMOKU_URL || details.url === 'app://bundle/') return;
    details.preventDefault();
    if (details.isMainFrame) openExternalIfAllowed(details.url);
  });
  window.webContents.on('will-attach-webview', (event) => event.preventDefault());
  window.once('ready-to-show', () => window.show());
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = null;
  });
  window.loadURL(APP_URL);
}

app.whenReady().then(async () => {
  const { createDesktopService } = await import('./service.mjs');
  desktopService = createDesktopService();
  registerIpc();

  protocol.handle('app', async (request) => {
    let relative;
    try {
      const url = new URL(request.url);
      if (url.hostname !== 'bundle' || url.username || url.password || url.search || url.hash || request.method !== 'GET') {
        return new Response('Not found', { status: 404 });
      }
      relative = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
      if (!APP_FILES.test(relative)) return new Response('Not found', { status: 404 });
    } catch {
      return new Response('Bad request', { status: 400 });
    }
    const filePath = path.join(ROOT, ...relative.split('/'));
    let fileResponse;
    try {
      fileResponse = await net.fetch(pathToFileURL(filePath).toString());
    } catch {
      return new Response('Not found', { status: 404 });
    }
    if (!fileResponse.ok) return new Response('Not found', { status: 404 });
    const headers = new Headers(fileResponse.headers);
    headers.set('Content-Type', MIME[path.extname(filePath)]);
    headers.set('Content-Security-Policy', CSP);
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(fileResponse.body, { status: fileResponse.status, headers });
  });

  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_details, callback) => {
    callback({ cancel: true });
  });
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && desktopService) createWindow();
});
app.on('window-all-closed', () => app.quit());
