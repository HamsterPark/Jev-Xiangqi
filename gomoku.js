const $ = (id) => document.getElementById(id);
const bridge = window.jevDesktop;
const LANGUAGE_KEY = 'jev-games-language';
const SIZE = 15;
const STARS = new Set(['3,3', '11,3', '7,7', '3,11', '11,11']);
const COPY = {
  zh: {
    pageTitle: 'Jev 五子棋', brand: '棋局实验室 ↗', navigation: '游戏导航', xiangqi: '中国象棋', race: '华容道赛跑', gomoku: '五子棋',
    headlineStart: '落下一子，', headlineEnd: '连成五颗。', intro: '你执黑棋先行，Jev 执白棋。点击空交叉点落子；横、竖或斜线连成五颗及以上即获胜，无禁手。棋盘规则在本地运行，Jev 在线选择下一步。',
    arena: '五子棋对局', boardKicker: '15 × 15 棋盘', boardHeading: '一手黑，一手白。', boardLabel: '五子棋棋盘', youBlack: '你 · 黑棋', jevWhite: 'Jev · 白棋', you: '你',
    yourTurn: '你的回合', jevTurn: 'Jev 的回合', finished: '已结束', waiting: '等待', statusHeading: '01 / 对局状态', keyHeading: '02 / 连接 Jev',
    keyLabel: '你的 Jev API key（仅本次运行）', keyPlaceholder: '输入自己的 Jev API key', useKey: '使用 key', clearKey: '清除当前 key',
    keyHelpBefore: '还没有 key？打开 ', keyHelpAfter: ' 并点击 Get API Key。密钥只在本次桌面程序运行的内存中使用。',
    moveHeading: '03 / 落子', moveHint: '轮到你时，点击一个空交叉点。第 1 手由黑棋先走。', moveCountLabel: '已落子', restart: '重新开局', retry: '重试 Jev 这一步',
    failureNote: '如果 Jev 请求失败，棋盘会停在 Jev 回合，不会自动代走。可以重试或重新开局。', footer: '本地规则判断落子与胜负 · Jev 在线从合法空位中选择',
    desktopOnly: '请在桌面版中打开', desktopOnlyDetail: '此浏览器页面不会接收 API key。请下载并运行桌面版，在那里安全连接 Jev。',
    loading: '正在载入棋盘…', loadingDetail: '正在准备 15 × 15 对局。', startFailed: '无法开始对局', startFailedDetail: '棋盘准备失败，请点击“重新开局”再试。',
    needKey: '先输入自己的 Jev API key', needKeyDetail: '密钥输入后即可执黑棋落下第一子。',
    playerStatus: '轮到你了', playerDetail: '点击棋盘上的空交叉点落下黑棋。', jevThinking: 'Jev 正在思考…', jevThinkingDetail: 'Jev 正在从合法空位中选择白棋落点。',
    jevWaiting: '轮到 Jev', jevWaitingDetail: '准备请求 Jev 的下一步。', jevFailed: 'Jev 这一步失败了', jevFailedDetail: '棋盘没有改变，也没有代走。请重试 Jev 这一步。',
    playerFailed: '落子未完成', playerFailedDetail: '请重新选择空位再试。', playerWon: '你赢了！', jevWon: 'Jev 赢了', draw: '平局', winDetail: '五颗棋子连成一线。点击“重新开局”再来一局。', drawDetail: '棋盘已满，没有一方连成五颗。可以重新开局。',
    keyChecking: '检查密钥状态中…', keyMissing: '尚未输入 key', keyReady: 'key 已输入；仅保存在本次运行的内存中。', keyFailure: '无法使用此 key，请检查后重试。', keyStatusFailure: '无法读取密钥状态，请重新输入。',
    authFailed: 'Jev API key 无效或无权访问，请检查密钥后重试。', quotaFailed: 'Jev 今日额度已用完，请稍后再试。',
    cell: (x, y, side, last) => `第 ${x + 1} 列、第 ${y + 1} 行，${side}${last ? '，最近一步' : ''}`,
    empty: '空位', black: '黑棋', white: '白棋',
  },
  en: {
    pageTitle: 'Jev Gomoku', brand: 'Game Lab ↗', navigation: 'Game navigation', xiangqi: 'Xiangqi', race: 'Huarong Dao Race', gomoku: 'Gomoku',
    headlineStart: 'One stone at a time. ', headlineEnd: 'Make five.', intro: 'You play black and move first; Jev plays white. Click an empty intersection to place a stone. Five or more in a row horizontally, vertically, or diagonally wins; there are no forbidden moves. Local rules control the board while Jev chooses its moves online.',
    arena: 'Gomoku match', boardKicker: '15 × 15 BOARD', boardHeading: 'Black moves. White answers.', boardLabel: 'Gomoku board', youBlack: 'You · Black', jevWhite: 'Jev · White', you: 'You',
    yourTurn: 'Your turn', jevTurn: "Jev's turn", finished: 'Finished', waiting: 'Waiting', statusHeading: '01 / MATCH STATUS', keyHeading: '02 / CONNECT JEV',
    keyLabel: 'Your Jev API key (this run only)', keyPlaceholder: 'Enter your own Jev API key', useKey: 'Use key', clearKey: 'Clear current key',
    keyHelpBefore: 'Need a key? Open ', keyHelpAfter: ' and select Get API Key. The key stays in desktop-app memory for this run only.',
    moveHeading: '03 / PLACE A STONE', moveHint: 'On your turn, click an empty intersection. Black makes the first move.', moveCountLabel: 'Stones placed', restart: 'New game', retry: "Retry Jev's move",
    failureNote: "If Jev's request fails, the board stays on Jev's turn. No substitute move is made. Retry or start a new game.", footer: 'Local rules validate moves and wins · Jev chooses from legal empty intersections online',
    desktopOnly: 'Open this in the desktop app', desktopOnlyDetail: 'This browser page never accepts an API key. Download and run the desktop app to connect to Jev safely.',
    loading: 'Preparing the board…', loadingDetail: 'Setting up a 15 × 15 match.', startFailed: 'Could not start the match', startFailedDetail: 'Board setup failed. Choose “New game” to try again.',
    needKey: 'Enter your Jev API key first', needKeyDetail: 'Once your key is entered, you can place the first black stone.',
    playerStatus: 'Your turn', playerDetail: 'Click an empty intersection to place a black stone.', jevThinking: 'Jev is thinking…', jevThinkingDetail: 'Jev is choosing a white move from legal empty intersections.',
    jevWaiting: "Jev's turn", jevWaitingDetail: "Ready to request Jev's next move.", jevFailed: "Jev's move failed", jevFailedDetail: "The board did not change and no substitute move was made. Retry Jev's move.",
    playerFailed: 'Move not completed', playerFailedDetail: 'Choose an empty intersection and try again.', playerWon: 'You win!', jevWon: 'Jev wins', draw: 'Draw', winDetail: 'Five stones in a row. Start a new game to play again.', drawDetail: 'The board is full, and neither side connected five. Start a new game to play again.',
    keyChecking: 'Checking key status…', keyMissing: 'No key entered yet', keyReady: 'Key entered; held in memory for this run only.', keyFailure: 'Could not use this key. Check it and try again.', keyStatusFailure: 'Could not read key status. Please enter your key again.',
    authFailed: 'Jev API key is invalid or not authorized. Check your key and retry.', quotaFailed: "Jev's daily quota is exhausted. Please try again later.",
    cell: (x, y, side, last) => `Column ${x + 1}, row ${y + 1}, ${side}${last ? ', last move' : ''}`,
    empty: 'empty', black: 'black stone', white: 'white stone',
  },
};

let language = navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
try {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (saved === 'zh' || saved === 'en') language = saved;
} catch { /* Storage may be unavailable. */ }
let game = null;
let keyReady = false;
let keyChecking = true;
let keyError = false;
let starting = false;
let moving = false;
let waiting = false;
let requestFailed = false;
let playerFailed = false;
let startFailed = false;
let lastJevError = '';
let generation = 0;

function t(key) { return COPY[language][key]; }
function hasBridge() {
  return Boolean(bridge?.hasKey && bridge?.setKey && bridge?.clearKey &&
    bridge?.startGomoku && bridge?.playGomokuMove && bridge?.requestGomokuMove);
}

function validatedState(value) {
  if (!value || !Array.isArray(value.board) || value.board.length !== SIZE ||
    value.board.some((row) => !Array.isArray(row) || row.length !== SIZE ||
      row.some((cell) => cell !== null && cell !== 'player' && cell !== 'jev')) ||
    !['player', 'jev', null].includes(value.turn) ||
    !['player', 'jev', 'draw', null].includes(value.winner) ||
    !Array.isArray(value.moves) || value.moves.some((move) =>
      !move || !['player', 'jev'].includes(move.side) ||
      !Number.isInteger(move.x) || move.x < 0 || move.x >= SIZE ||
      !Number.isInteger(move.y) || move.y < 0 || move.y >= SIZE)) {
    throw new Error('Invalid desktop Gomoku state');
  }
  return value;
}

function applyLanguage() {
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  document.title = t('pageTitle');
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach((node) => { node.setAttribute('aria-label', t(node.dataset.i18nAria)); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  $('languageToggle').textContent = language === 'en' ? '中文' : 'EN';
  $('languageToggle').setAttribute('aria-label', language === 'en' ? '切换到中文' : 'Switch to English');
  render();
}

function renderBoard() {
  const board = $('board');
  board.replaceChildren();
  if (!game) return;
  const active = game.turn === 'player' && !game.winner && keyReady && !keyChecking && !starting && !moving && !waiting;
  const last = game.moves.at(-1);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const side = game.board[y][x];
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'intersection';
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      cell.setAttribute('role', 'gridcell');
      const isLast = last?.x === x && last?.y === y;
      if (STARS.has(`${x},${y}`) && !side) cell.classList.add('star');
      if (isLast) cell.classList.add('last');
      cell.disabled = !active || side !== null;
      cell.setAttribute('aria-label', t('cell')(x, y, t(side === 'player' ? 'black' : side === 'jev' ? 'white' : 'empty'), isLast));
      if (side) {
        const stone = document.createElement('span');
        stone.className = `stone ${side}`;
        stone.setAttribute('aria-hidden', 'true');
        cell.append(stone);
      }
      board.append(cell);
    }
  }
}

function renderStatus() {
  let title, detail, tone = '';
  if (!hasBridge()) {
    title = t('desktopOnly'); detail = t('desktopOnlyDetail'); tone = 'error';
  } else if (startFailed && !game) {
    title = t('startFailed'); detail = t('startFailedDetail'); tone = 'error';
  } else if (!game || starting) {
    title = t('loading'); detail = t('loadingDetail');
  } else if (game.winner) {
    title = t(game.winner === 'player' ? 'playerWon' : game.winner === 'jev' ? 'jevWon' : 'draw');
    detail = t(game.winner === 'draw' ? 'drawDetail' : 'winDetail'); tone = 'won';
  } else if (keyChecking || !keyReady) {
    title = keyChecking ? t('loading') : t('needKey'); detail = keyChecking ? t('loadingDetail') : t('needKeyDetail');
  } else if (game.turn === 'jev') {
    title = t(requestFailed ? 'jevFailed' : waiting ? 'jevThinking' : 'jevWaiting');
    if (requestFailed) {
      detail = language === 'zh' && lastJevError ? `${lastJevError} ${t('jevFailedDetail')}` :
        /API key/i.test(lastJevError) ? t('authFailed') :
        /额度/.test(lastJevError) ? t('quotaFailed') : t('jevFailedDetail');
    } else {
      detail = t(waiting ? 'jevThinkingDetail' : 'jevWaitingDetail');
    }
    tone = requestFailed ? 'error' : 'jev';
  } else {
    title = t(playerFailed ? 'playerFailed' : 'playerStatus');
    detail = t(playerFailed ? 'playerFailedDetail' : 'playerDetail');
    tone = playerFailed ? 'error' : 'player';
  }
  $('statusTitle').textContent = title;
  $('statusDetail').textContent = detail;
  $('statusIcon').textContent = tone === 'won' ? '★' : tone === 'error' ? '!' : '●';
  $('statusIcon').dataset.tone = tone;
}

function render() {
  renderBoard();
  renderStatus();
  const available = hasBridge();
  $('keyForm').hidden = !available || keyReady;
  $('clearKey').hidden = !available || !keyReady;
  $('apiKey').disabled = keyChecking || starting || moving || waiting;
  $('saveKey').disabled = keyChecking || starting || moving || waiting;
  $('clearKey').disabled = starting || moving || waiting;
  $('keyState').textContent = !available ? t('desktopOnlyDetail') : keyChecking ? t('keyChecking') :
    keyError ? t('keyFailure') : keyReady ? t('keyReady') : t('keyMissing');
  $('restart').disabled = !available || starting || moving || waiting;
  $('retry').hidden = !requestFailed || game?.turn !== 'jev';
  $('retry').disabled = !keyReady || starting || moving || waiting;
  $('moveCount').textContent = String(game?.moves.length ?? 0);
  $('moveHint').textContent = t('moveHint');
  const playerActive = game?.turn === 'player' && !game?.winner;
  const jevActive = game?.turn === 'jev' && !game?.winner;
  $('turnPill').textContent = t(game?.winner ? 'finished' : jevActive ? 'jevTurn' : 'yourTurn');
  $('turnPill').classList.toggle('active', playerActive);
  $('playerTrack').classList.toggle('active', playerActive);
  $('jevTrack').classList.toggle('active', jevActive);
}

async function startGame() {
  if (!hasBridge() || starting || moving || waiting) return;
  starting = true;
  requestFailed = false;
  playerFailed = false;
  startFailed = false;
  lastJevError = '';
  generation++;
  render();
  try {
    game = validatedState(await bridge.startGomoku());
  } catch {
    game = null;
    startFailed = true;
  } finally {
    starting = false;
    render();
  }
}

async function requestJev() {
  if (!game || game.turn !== 'jev' || game.winner || !keyReady || waiting || moving) return;
  const currentGeneration = generation;
  waiting = true;
  requestFailed = false;
  lastJevError = '';
  render();
  try {
    const result = await bridge.requestGomokuMove();
    if (currentGeneration !== generation) return;
    game = validatedState(result?.state);
  } catch (error) {
    if (currentGeneration === generation) {
      requestFailed = true;
      lastJevError = error instanceof Error ? error.message : '';
    }
  } finally {
    if (currentGeneration === generation) {
      waiting = false;
      render();
    }
  }
}

async function playPlayer(x, y) {
  if (!game || game.turn !== 'player' || game.winner || !keyReady || moving || waiting ||
    !Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= SIZE || y < 0 || y >= SIZE || game.board[y][x] !== null) return;
  moving = true;
  playerFailed = false;
  render();
  try {
    game = validatedState(await bridge.playGomokuMove(x, y));
  } catch {
    playerFailed = true;
  } finally {
    moving = false;
    render();
  }
  if (!playerFailed && game?.turn === 'jev') await requestJev();
}

$('board').addEventListener('click', (event) => {
  const cell = event.target.closest('.intersection');
  if (!cell || cell.disabled) return;
  void playPlayer(Number(cell.dataset.x), Number(cell.dataset.y));
});
$('languageToggle').addEventListener('click', () => {
  language = language === 'en' ? 'zh' : 'en';
  try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* This page only. */ }
  applyLanguage();
});
$('restart').addEventListener('click', () => { void startGame(); });
$('retry').addEventListener('click', () => { void requestJev(); });
$('keyForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!hasBridge() || keyChecking || starting || moving || waiting) return;
  const key = $('apiKey').value.trim();
  if (!key) return;
  $('saveKey').disabled = true;
  keyError = false;
  try {
    await bridge.setKey(key);
    keyReady = true;
    if (game?.turn === 'jev') void requestJev();
  } catch {
    keyReady = false;
    keyError = true;
  } finally {
    $('apiKey').value = '';
    render();
  }
});
$('clearKey').addEventListener('click', async () => {
  if (!hasBridge() || waiting || moving || starting) return;
  $('clearKey').disabled = true;
  try {
    await bridge.clearKey();
    keyReady = false;
    keyError = false;
  } catch {
    keyError = true;
  } finally {
    render();
  }
});

applyLanguage();
if (hasBridge()) {
  void startGame();
  Promise.resolve().then(() => bridge.hasKey()).then((value) => {
    keyReady = Boolean(value);
    keyChecking = false;
    render();
  }).catch(() => {
    keyChecking = false;
    keyError = true;
    render();
  });
} else {
  keyChecking = false;
  render();
}
