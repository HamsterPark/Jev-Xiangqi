import { getLegalMoves, PIECES } from './assets/js/huarongdao-core.js';

const $ = (id) => document.getElementById(id);
const bridge = window.jevDesktop;
const LANGUAGE_KEY = 'jev-games-language';
const ENGLISH_PIECES = {
  C: 'Cao Cao', V1: 'Zhang Fei', V2: 'Zhao Yun', V3: 'Ma Chao',
  V4: 'Huang Zhong', H: 'Guan Yu', S1: 'Soldier 1', S2: 'Soldier 2',
  S3: 'Soldier 3', S4: 'Soldier 4',
};
const COPY = {
  zh: {
    pageTitle: 'Jev 华容道赛跑', brand: '棋局实验室 ↗', navigation: '游戏导航', xiangqi: '中国象棋', race: '华容道赛跑', gomoku: '五子棋',
    headlineStart: '同一起点，', headlineEnd: '谁先突围？', intro: '你和 Jev 各有一块独立的华容道棋盘，从相同的“横刀立马”开局出发。你先走，双方严格轮流，每回合只滑动一枚棋子一格。先让曹操到达底部中央出口的一方获胜。',
    guidance: 'Jev 的候选走法由离线最短路径引导，再由 Jev 在其中选择；这是路径引导的对手，不是无辅助解题。', arena: '华容道双棋盘赛跑',
    leftBoard: '左侧棋盘', rightBoard: '右侧棋盘', you: '你', exit: '出 口', waiting: '等待', yourTurn: '你的回合', jevTurn: 'Jev 的回合', finished: '已结束',
    guidedJev: '最短路径引导的 Jev · 已走步数', yourSteps: '你的步数', statusHeading: '01 / 赛跑状态', keyHeading: '02 / 连接 Jev',
    keyLabel: '你的 Jev API key（仅本次运行）', keyPlaceholder: '输入自己的 Jev API key', useKey: '使用 key', clearKey: '清除当前 key',
    keyHelpBefore: '还没有 key？打开 ', keyHelpAfter: ' 并点击 Get API Key。密钥只在桌面程序内存中使用，不会写入文件。',
    moveHeading: '03 / 移动棋子', moveHint: '先在右侧棋盘选择一枚棋子，再点击可用方向。每次只移动一格。',
    directions: '移动方向', moveUp: '向上移动', moveDown: '向下移动', moveLeft: '向左移动', moveRight: '向右移动',
    keyboardHint: '选中棋子后也可使用键盘方向键。', restart: '重新开局', retry: '重试 Jev 这一步',
    failureNote: '如果 Jev 请求失败，比赛会停在 Jev 回合；不会自动代走。可重试或重新开局。',
    footer: '本地规则判断合法移动与胜负 · Jev 在线选择路径引导的候选步骤',
    loading: '正在载入比赛…', loadingDetail: '正在准备两块相同的棋盘。', startFailed: '无法开始比赛', startFailedDetail: '棋盘准备失败，请点击“重新开局”重试。', desktopOnly: '请在桌面版中打开',
    desktopOnlyDetail: '赛跑通过桌面程序安全连接 Jev；浏览器页面不会接收或发送 API key。',
    needKey: '先输入自己的 Jev API key', needKeyDetail: '密钥准备好后，你就可以先走第一步。',
    playerStatus: '轮到你了', playerDetail: '在右侧选择棋子，按方向移动一格。',
    selectedHint: (name, count) => `已选中 ${name} · ${count} 个可用方向。点击方向按钮或按方向键。`,
    jevThinking: 'Jev 正在选择…', jevThinkingDetail: '只从离线最短路径引导的合法一格移动中选择。',
    jevWaiting: '轮到 Jev', jevWaitingDetail: '准备请求 Jev 的下一步。',
    jevFailed: 'Jev 这一步失败了', jevFailedDetail: '棋盘未改变，也没有代走。请点击“重试 Jev 这一步”。',
    playerFailed: '移动未完成', playerFailedDetail: '请重新选择合法方向再试。',
    playerWon: '你先到达出口！', jevWon: 'Jev 先到达出口！', winDetail: '曹操到达底部中央。比赛结束，可重新开局。',
    keyChecking: '检查密钥状态中…', keyMissing: '尚未输入 key', keyReady: 'key 已就绪；仅保存在本次运行的内存中。',
    keyFailure: '无法使用此 key，请检查后重试。', keyStatusFailure: '无法读取密钥状态，请重新输入。',
    previousMove: (name, direction) => `最近一步：${name}向${direction}一格`,
    noMove: '尚未移动', boardLabel: (side, count) => `${side}的华容道棋盘，已走 ${count} 步`,
    sideJev: 'Jev', sidePlayer: '你',
    U: '上', D: '下', L: '左', R: '右',
  },
  en: {
    pageTitle: 'Jev Huarong Dao Race', brand: 'Game Lab ↗', navigation: 'Game navigation', xiangqi: 'Xiangqi', race: 'Huarong Dao Race', gomoku: 'Gomoku',
    headlineStart: 'Same start. ', headlineEnd: 'Who escapes first?', intro: 'You and Jev each have an independent Huarong Dao board with the same classic opening. You move first, then alternate strictly. Slide exactly one piece by one cell per turn. The first to bring Cao Cao to the bottom-center exit wins.',
    guidance: 'Jev chooses among moves guided by a precomputed shortest path. This is a path-guided opponent, not an unaided puzzle solve.', arena: 'Two-board Huarong Dao race',
    leftBoard: 'Left board', rightBoard: 'Right board', you: 'You', exit: 'EXIT', waiting: 'Waiting', yourTurn: 'Your turn', jevTurn: "Jev's turn", finished: 'Finished',
    guidedJev: 'Shortest-path-guided Jev · moves', yourSteps: 'Your moves', statusHeading: '01 / RACE STATUS', keyHeading: '02 / CONNECT JEV',
    keyLabel: 'Your Jev API key (this run only)', keyPlaceholder: 'Enter your own Jev API key', useKey: 'Use key', clearKey: 'Clear current key',
    keyHelpBefore: 'Need a key? Open ', keyHelpAfter: ' and select Get API Key. The key stays in desktop-app memory and is not written to a file.',
    moveHeading: '03 / MOVE A PIECE', moveHint: 'Select a piece on your board, then choose an available direction. Each turn moves one cell.',
    directions: 'Move direction', moveUp: 'Move up', moveDown: 'Move down', moveLeft: 'Move left', moveRight: 'Move right',
    keyboardHint: 'You can also use the arrow keys after selecting a piece.', restart: 'New race', retry: "Retry Jev's move",
    failureNote: "If Jev's request fails, the race stays on Jev's turn. No substitute move is made. Retry or start a new race.",
    footer: 'Local rules validate moves and wins · Jev selects from shortest-path-guided options online',
    loading: 'Preparing the race…', loadingDetail: 'Setting up two identical boards.', startFailed: 'Could not start the race', startFailedDetail: 'Board setup failed. Choose “New race” to try again.', desktopOnly: 'Open this in the desktop app',
    desktopOnlyDetail: 'The race connects to Jev safely through the desktop app; this browser page never accepts or sends an API key.',
    needKey: 'Enter your Jev API key first', needKeyDetail: 'Once the key is ready, you can make the opening move.',
    playerStatus: 'Your turn', playerDetail: 'Choose a piece on the right and move it one cell.',
    selectedHint: (name, count) => `${name} selected · ${count} available directions. Use a direction button or arrow key.`,
    jevThinking: 'Jev is choosing…', jevThinkingDetail: 'Jev chooses from legal one-cell moves guided by the shortest-path table.',
    jevWaiting: "Jev's turn", jevWaitingDetail: "Ready to request Jev's next move.",
    jevFailed: "Jev's move failed", jevFailedDetail: "Neither board changed and no substitute move was made. Choose “Retry Jev's move.”",
    playerFailed: 'Move not completed', playerFailedDetail: 'Please select a legal direction and try again.',
    playerWon: 'You reached the exit first!', jevWon: 'Jev reached the exit first!', winDetail: 'Cao Cao reached the bottom-center exit. Start a new race to play again.',
    keyChecking: 'Checking key status…', keyMissing: 'No key entered yet', keyReady: 'Key ready; held in memory only for this run.',
    keyFailure: 'Could not use this key. Check it and try again.', keyStatusFailure: 'Could not read key status. Please enter your key again.',
    previousMove: (name, direction) => `Last move: ${name} one cell ${direction}`,
    noMove: 'No moves yet', boardLabel: (side, count) => `${side}'s Huarong Dao board, ${count} moves played`,
    sideJev: 'Jev', sidePlayer: 'You',
    U: 'up', D: 'down', L: 'left', R: 'right',
  },
};

let language = navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
try {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (saved === 'zh' || saved === 'en') language = saved;
} catch { /* Storage may be unavailable. */ }
let race = null;
let selectedId = null;
let keyReady = false;
let keyChecking = true;
let keyError = false;
let waiting = false;
let moving = false;
let starting = false;
let requestFailed = false;
let playerFailed = false;
let startFailed = false;
let generation = 0;

function t(key) { return COPY[language][key]; }
function pieceName(id) { return language === 'en' ? ENGLISH_PIECES[id] : PIECES[id].name; }

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

function moveLabel(moveId) {
  if (!moveId) return t('noMove');
  const [id, direction] = moveId.split(':');
  return t('previousMove')(pieceName(id), t(direction));
}

function renderBoard(side) {
  const board = $(side === 'jev' ? 'jevBoard' : 'playerBoard');
  board.replaceChildren();
  if (!race) return;
  const state = race.boards[side];
  const active = side === 'player' && race.turn === 'player' && !race.winner && keyReady && !moving && !waiting && !starting;
  const legal = active ? getLegalMoves(state) : [];
  const movable = new Set(legal.map((move) => move.split(':')[0]));
  for (let index = 0; index < 20; index++) {
    const cell = document.createElement('div');
    cell.className = 'board-cell';
    board.append(cell);
  }
  for (const [id, piece] of Object.entries(PIECES)) {
    const element = document.createElement(side === 'player' ? 'button' : 'div');
    if (side === 'player') element.type = 'button';
    element.className = 'board-piece';
    if (id === 'C') element.classList.add('cao');
    else if (id === 'H') element.classList.add('horizontal');
    else if (id.startsWith('S')) element.classList.add('soldier');
    if (side === 'player') {
      element.disabled = !active || !movable.has(id);
      element.classList.toggle('selected', selectedId === id);
      element.setAttribute('aria-pressed', selectedId === id ? 'true' : 'false');
      element.addEventListener('click', () => {
        selectedId = selectedId === id ? null : id;
        render();
      });
    }
    const [x, y] = state.positions[id];
    element.style.setProperty('--x', x);
    element.style.setProperty('--y', y);
    element.style.setProperty('--w', piece.width);
    element.style.setProperty('--h', piece.height);
    element.textContent = pieceName(id);
    element.setAttribute('aria-label', pieceName(id));
    board.append(element);
  }
  board.setAttribute('aria-label', t('boardLabel')(t(side === 'jev' ? 'sideJev' : 'sidePlayer'), race.moves[side].length));
}

function renderStatus() {
  let title;
  let detail;
  let tone = '';
  if (!bridge?.startRace || !bridge?.playRaceMove || !bridge?.requestRaceMove) {
    title = t('desktopOnly'); detail = t('desktopOnlyDetail'); tone = 'error';
  } else if (startFailed && !race) {
    title = t('startFailed'); detail = t('startFailedDetail'); tone = 'error';
  } else if (!race || starting) {
    title = t('loading'); detail = t('loadingDetail');
  } else if (race.winner) {
    title = t(race.winner === 'player' ? 'playerWon' : 'jevWon'); detail = t('winDetail'); tone = 'won';
  } else if (keyChecking || !keyReady) {
    title = keyChecking ? t('loading') : t('needKey'); detail = keyChecking ? t('loadingDetail') : t('needKeyDetail');
  } else if (race.turn === 'jev') {
    title = t(requestFailed ? 'jevFailed' : waiting ? 'jevThinking' : 'jevWaiting');
    detail = t(requestFailed ? 'jevFailedDetail' : waiting ? 'jevThinkingDetail' : 'jevWaitingDetail');
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
  renderBoard('jev');
  renderBoard('player');
  renderStatus();
  const hasBridge = Boolean(bridge?.startRace && bridge?.playRaceMove && bridge?.requestRaceMove);
  $('keyForm').hidden = !hasBridge || keyReady;
  $('clearKey').hidden = !hasBridge || !keyReady;
  $('apiKey').disabled = keyChecking || starting || waiting || moving;
  $('saveKey').disabled = keyChecking || starting || waiting || moving;
  $('clearKey').disabled = waiting || moving || starting;
  $('keyState').textContent = !hasBridge ? t('desktopOnlyDetail') : keyChecking ? t('keyChecking') : keyError ? t('keyFailure') : keyReady ? t('keyReady') : t('keyMissing');
  $('restart').disabled = !hasBridge || starting || waiting || moving;
  $('retry').hidden = !requestFailed || race?.turn !== 'jev';
  $('retry').disabled = waiting || starting || !keyReady;
  $('jevMoveCount').textContent = String(race?.moves.jev.length ?? 0);
  $('playerMoveCount').textContent = String(race?.moves.player.length ?? 0);
  $('jevLastMove').textContent = moveLabel(race?.moves.jev.at(-1));
  $('playerLastMove').textContent = moveLabel(race?.moves.player.at(-1));
  const jevActive = race?.turn === 'jev' && !race.winner;
  const playerActive = race?.turn === 'player' && !race.winner;
  $('jevTurn').textContent = t(race?.winner ? 'finished' : jevActive ? 'jevTurn' : 'waiting');
  $('playerTurn').textContent = t(race?.winner ? 'finished' : playerActive ? 'yourTurn' : 'waiting');
  $('jevTurn').classList.toggle('active', jevActive);
  $('playerTurn').classList.toggle('active', playerActive);
  $('jevTrack').classList.toggle('active', jevActive);
  $('playerTrack').classList.toggle('active', playerActive);
  const legal = playerActive && keyReady && race ? getLegalMoves(race.boards.player) : [];
  const selectedMoves = selectedId ? legal.filter((move) => move.startsWith(`${selectedId}:`)) : [];
  $('moveHint').textContent = selectedId ? t('selectedHint')(pieceName(selectedId), selectedMoves.length) : t('moveHint');
  document.querySelectorAll('[data-direction]').forEach((button) => {
    button.disabled = !selectedMoves.includes(`${selectedId}:${button.dataset.direction}`) || moving || waiting || starting;
  });
}

async function startRace() {
  if (!bridge?.startRace || waiting || moving || starting) return;
  starting = true;
  requestFailed = false;
  playerFailed = false;
  startFailed = false;
  selectedId = null;
  generation++;
  render();
  try {
    race = await bridge.startRace();
  } catch {
    race = null;
    startFailed = true;
  } finally {
    starting = false;
    render();
  }
}

async function requestJev() {
  if (!race || race.turn !== 'jev' || race.winner || !keyReady || waiting) return;
  const callGeneration = generation;
  waiting = true;
  requestFailed = false;
  render();
  try {
    const result = await bridge.requestRaceMove();
    if (callGeneration !== generation) return;
    if (!result?.race || typeof result.moveId !== 'string') throw new Error('Invalid desktop race response');
    race = result.race;
  } catch {
    if (callGeneration === generation) requestFailed = true;
  } finally {
    if (callGeneration === generation) {
      waiting = false;
      render();
    }
  }
}

async function movePlayer(moveId) {
  if (!race || race.turn !== 'player' || race.winner || !keyReady || moving || waiting) return;
  if (!getLegalMoves(race.boards.player).includes(moveId)) return;
  moving = true;
  playerFailed = false;
  render();
  try {
    race = await bridge.playRaceMove(moveId);
    selectedId = null;
  } catch {
    playerFailed = true;
  } finally {
    moving = false;
    render();
  }
  if (!playerFailed && race?.turn === 'jev') await requestJev();
}

$('languageToggle').addEventListener('click', () => {
  language = language === 'en' ? 'zh' : 'en';
  try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* Storage may be unavailable. */ }
  applyLanguage();
});

document.querySelectorAll('[data-direction]').forEach((button) => {
  button.addEventListener('click', () => {
    if (selectedId) void movePlayer(`${selectedId}:${button.dataset.direction}`);
  });
});
document.addEventListener('keydown', (event) => {
  if (!selectedId || event.target instanceof HTMLInputElement) return;
  const direction = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R' }[event.key];
  if (!direction) return;
  event.preventDefault();
  void movePlayer(`${selectedId}:${direction}`);
});
$('restart').addEventListener('click', () => { void startRace(); });
$('retry').addEventListener('click', () => { void requestJev(); });
$('keyForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!bridge?.setKey || keyChecking || waiting || moving) return;
  const key = $('apiKey').value.trim();
  if (!key) return;
  $('saveKey').disabled = true;
  keyError = false;
  try {
    await bridge.setKey(key);
    keyReady = true;
    if (race?.turn === 'jev') void requestJev();
  } catch {
    keyError = true;
    keyReady = false;
  } finally {
    $('apiKey').value = '';
    render();
  }
});
$('clearKey').addEventListener('click', async () => {
  if (!bridge?.clearKey || waiting || moving) return;
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
if (bridge?.startRace && bridge?.playRaceMove && bridge?.requestRaceMove) {
  void startRace();
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
