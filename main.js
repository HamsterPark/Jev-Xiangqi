import { BLACK, RED } from './assets/js/constants.js';
import { getPieceChar } from './piece-labels.js';
import { createInitialPosition } from './assets/js/setup.js';
import { makeMove } from './assets/js/rules.js';
import {
  classicMoveId,
  getClassicLegalMoves,
  getClassicResult,
  isInClassicCheck,
} from './assets/js/xiangqi-classic.js';

const SERVICE_STORAGE_KEY = 'jev-xiangqi-service-url';
// Shared with the other Jev game: use the same key and values on the same origin.
const LANGUAGE_STORAGE_KEY = 'jev-games-language';
const COPY = {
  zh: {
    pageTitle: '与 Jev 对弈 · 中国象棋', pageDescription: '执红先行，与 Jev 实时对弈中国象棋。每一步由 Jev 在合法着法中选择。',
    brandName: '棋局实验室', gameNav: '游戏导航', xiangqiNav: '中国象棋', huarongdaoNav: 'Jev 玩华容道', huarongdaoRaceNav: '华容道赛跑', download: '下载 Windows 版',
    heroFirst: '下一步，', heroSecond: '交给 Jev。', introWeb: '你执红棋先行。连接自己部署的 Jev 服务后，Jev 每回合从合法着法里作一次实时选择。将军、将死和困毙由棋局规则判定。',
    introDesktop: '你执红棋先行。输入自己的 Jev API key 后即可对弈，无需部署服务。将军、将死和困毙仍由本地规则判定。',
    arena: '中国象棋对弈', blackTag: '黑方 · 实时决策', riverChu: '楚 河', riverHan: '汉 界', board: '中国象棋棋盘', youShort: '你', you: '你', redTag: '红方 · 先行',
    connectionWeb: '01 / 连接自己的 Jev 服务', connectionDesktop: '01 / 输入你的 Jev API key', disconnected: '未连接', addressSaved: '地址已保存', invalidAddress: '地址无效',
    keyMissing: '未输入 key', keyEntered: 'key 已输入', invalidKey: 'key 无效', keyStatusFailed: '无法读取 key 状态',
    keyLabel: '你的 Jev API key（仅本次运行使用）', keyPlaceholder: '输入自己的 Jev API key', useKey: '使用此 key', clearKey: '清除 key',
    keyHintBefore: '还没有 key？前往 ', keyHintAfter: '，点击 Get API Key。对弈需要联网；密钥只保存在本次运行的内存中，不会写入文件。',
    serviceLabel: '服务地址', servicePlaceholder: 'https://你的服务地址/api/move', useAddress: '使用此地址', serviceHintBefore: '先按', deployGuide: '部署说明 ↗',
    serviceHintAfter: '运行自己的服务，再把地址填在这里。Jev key 只存于你部署的服务中。', serviceSavedHint: '地址已保存。Jev key 只保存在你部署的服务中，此页面不会接收密钥。',
    gameStatusHeading: '02 / 对局状态', newGame: '重新开局', undo: '悔棋', retry: '重试 Jev 落子', decisionHeading: '03 / Jev 的选择',
    decisionNote: '显示的是 Jev 对候选着法的选择倾向，不代表这步棋的胜率。', logHeading: '04 / 对局记录', apiDocs: 'Jev API 文档 ↗',
    footerWeb: '棋盘规则在本地执行 · Jev 只选择黑方下一步 · Jev key 保存在你自己的服务中',
    footerDesktop: '棋盘规则在本地执行 · Jev 只选择黑方下一步 · Jev key 仅在本次运行的内存中使用',
    firstMove: '等待你走出第一步。', returnedToTurn: '已退回到你的回合。', forcedMove: '黑方只有一步合法着法，按规则自动落子。',
    emptyLog: '开局待走', round: '第 {number} 回合', squareEmpty: '{file}路{rank}，空位', squarePiece: '{file}路{rank}，{color}{piece}',
    red: '红', black: '黑', moveCapture: ' · 吃{piece}', moveNotation: '{piece} {fromFile}路{fromRank} → {toFile}路{toRank}{capture}',
    wonYou: '你赢了！', wonJev: 'Jev 赢了', checkmate: '将死，对局结束。', stalemate: '困毙，对局结束。', capturedGeneral: '将被吃掉，对局结束。',
    needKey: '先输入 Jev API key', needKeyDetail: '在上方输入自己的 key，即可开始对弈。', needKeyShort: '请输入你自己的 key。',
    needService: '先连接 Jev 服务', needServiceDetail: '按部署说明运行自己的服务，并在上方填入地址。', needServiceShort: '请输入你部署的服务地址。',
    jevFailed: 'Jev 暂时没能落子', jevThinking: 'Jev 正在思考…', jevWaiting: '等待 Jev 落子', thinkingDetail: '正在从合法着法中选择下一步。', waitingDetail: '等待下一步。',
    inCheck: '你被将军了', escapeCheck: '请走出一步能够解将的棋。', yourTurn: '轮到你了', selectDestination: '点击高亮的格子落子，或改选另一枚棋。', selectPiece: '点击一枚红棋，再点击高亮的落点。',
    confidence: '信心 {percent}%', selected: 'Jev 已选择', httpsRequired: '请输入 HTTPS 服务地址。', endpointParams: '服务地址不能包含账号信息、参数或片段。', endpointPath: '服务地址应以 /api/move 结尾。',
    missingKeyError: '请先输入自己的 Jev API key。', missingServiceError: '网站需要先配置安全的服务端连接。', quotaError: 'Jev 今日额度已用完，请稍后再试。',
    invalidMove: 'Jev 返回了无效着法', timeout: '连接超时，请重试。', connectionFailed: '连接失败，请重试。', invalidKeyDetail: 'Jev API key 无效或无权访问，请检查密钥。', invalidBoard: '棋局数据无效，请重新开局。',
    general: '将', advisor: '士', elephant: '象', horse: '马', rook: '车', cannon: '炮', pawn: '兵',
  },
  en: {
    pageTitle: 'Play Xiangqi with Jev', pageDescription: 'Play Xiangqi as Red against Jev. Jev chooses each move from the legal options.',
    brandName: 'Game Lab', gameNav: 'Game navigation', xiangqiNav: 'Xiangqi', huarongdaoNav: 'Jev Plays Huarong Dao', huarongdaoRaceNav: 'Huarong Dao Race', download: 'Download for Windows',
    heroFirst: 'Your move. ', heroSecond: 'Then Jev’s.', introWeb: 'You play Red and move first. Connect your own Jev service to let Jev choose each Black move in real time. Check, checkmate, and stalemate are enforced by the local rules.',
    introDesktop: 'You play Red and move first. Enter your own Jev API key to play without deploying a service. Check, checkmate, and stalemate are enforced locally.',
    arena: 'Xiangqi game', blackTag: 'Black · live decisions', riverChu: 'CHU RIVER', riverHan: 'HAN BORDER', board: 'Xiangqi board', youShort: 'You', you: 'You', redTag: 'Red · moves first',
    connectionWeb: '01 / Connect your Jev service', connectionDesktop: '01 / Enter your Jev API key', disconnected: 'Not connected', addressSaved: 'Address saved', invalidAddress: 'Invalid address',
    keyMissing: 'No key entered', keyEntered: 'Key entered', invalidKey: 'Invalid key', keyStatusFailed: 'Could not check key status',
    keyLabel: 'Your Jev API key (this session only)', keyPlaceholder: 'Enter your Jev API key', useKey: 'Use this key', clearKey: 'Clear key',
    keyHintBefore: 'Need a key? Visit ', keyHintAfter: ' and click Get API Key. Playing requires internet access. Your key is kept in memory for this session and is not saved to a file.',
    serviceLabel: 'Service address', servicePlaceholder: 'https://your-service.example/api/move', useAddress: 'Use this address', serviceHintBefore: 'Follow the ', deployGuide: 'deployment guide ↗',
    serviceHintAfter: ' to run your own service, then enter its address here. Your Jev key stays on that service.', serviceSavedHint: 'Address saved. Your Jev key stays on your own service; this page never receives it.',
    gameStatusHeading: '02 / Game status', newGame: 'New game', undo: 'Undo', retry: 'Retry Jev’s move', decisionHeading: '03 / Jev’s choice',
    decisionNote: 'These are Jev’s preferences among candidate moves, not each move’s chance of winning.', logHeading: '04 / Move history', apiDocs: 'Jev API docs ↗',
    footerWeb: 'Rules run locally · Jev chooses only Black’s next move · Your Jev key stays on your own service',
    footerDesktop: 'Rules run locally · Jev chooses only Black’s next move · Your Jev key is used only in memory for this session',
    firstMove: 'Waiting for your first move.', returnedToTurn: 'Returned to your turn.', forcedMove: 'Black has only one legal move, so it was played automatically.',
    emptyLog: 'No moves yet', round: 'Round {number}', squareEmpty: 'File {file}, rank {rank}, empty', squarePiece: 'File {file}, rank {rank}, {color} {piece}',
    red: 'Red', black: 'Black', moveCapture: ' · captures {piece}', moveNotation: '{piece} {fromFile},{fromRank} → {toFile},{toRank}{capture}',
    wonYou: 'You won!', wonJev: 'Jev won', checkmate: 'Checkmate. Game over.', stalemate: 'Stalemate. Game over.', capturedGeneral: 'General captured. Game over.',
    needKey: 'Enter a Jev API key', needKeyDetail: 'Enter your own key above to start playing.', needKeyShort: 'Enter your own key.',
    needService: 'Connect a Jev service', needServiceDetail: 'Deploy your own service using the guide above, then enter its address.', needServiceShort: 'Enter the address of your deployed service.',
    jevFailed: 'Jev could not move', jevThinking: 'Jev is thinking…', jevWaiting: 'Waiting for Jev', thinkingDetail: 'Choosing from the legal moves.', waitingDetail: 'Waiting for the next move.',
    inCheck: 'You are in check', escapeCheck: 'Choose a move that gets out of check.', yourTurn: 'Your turn', selectDestination: 'Click a highlighted square to move, or choose another piece.', selectPiece: 'Click a Red piece, then a highlighted destination.',
    confidence: 'Confidence {percent}%', selected: 'Jev has chosen', httpsRequired: 'Enter an HTTPS service address.', endpointParams: 'The service address cannot contain credentials, parameters, or a fragment.', endpointPath: 'The service address must end in /api/move.',
    missingKeyError: 'Enter your own Jev API key first.', missingServiceError: 'This website needs a secure server connection first.', quotaError: 'Your Jev quota is exhausted for today. Please try again later.',
    invalidMove: 'Jev returned an invalid move', timeout: 'Connection timed out. Please retry.', connectionFailed: 'Connection failed. Please retry.', invalidKeyDetail: 'The Jev API key is invalid or lacks access. Please check it.', invalidBoard: 'The game position is invalid. Please start a new game.',
    general: 'General', advisor: 'Advisor', elephant: 'Elephant', horse: 'Horse', rook: 'Rook', cannon: 'Cannon', pawn: 'Soldier',
  },
};
const PIECE_NAME = { g: 'general', a: 'advisor', e: 'elephant', h: 'horse', r: 'rook', c: 'cannon', p: 'pawn' };
let language = (() => {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch { /* storage may be unavailable */ }
  return navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
})();
function tr(key, values = {}) {
  return (COPY[language][key] ?? COPY.zh[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}

function errorText() {
  return COPY.zh[connectionError] ? tr(connectionError) : connectionError;
}

function desktopErrorKey(message) {
  if (/额度|quota|request limit|429/i.test(message)) return 'quotaError';
  if (/key 无效|密钥无效|unauthori[sz]ed|\b401\b|\b403\b/i.test(message)) return 'invalidKeyDetail';
  if (/棋局数据无效|invalid (?:board|position)/i.test(message)) return 'invalidBoard';
  if (/超时|timed out/i.test(message)) return 'timeout';
  return 'connectionFailed';
}
const boardElement = document.querySelector('#board');
const statusTitle = document.querySelector('#statusTitle');
const statusText = document.querySelector('#statusText');
const statusIcon = document.querySelector('#statusIcon');
const moveCount = document.querySelector('#moveCount');
const decisionElement = document.querySelector('#decision');
const moveLog = document.querySelector('#moveLog');
const retryButton = document.querySelector('#retry');
const undoButton = document.querySelector('#undo');
const serviceForm = document.querySelector('#serviceForm');
const serviceInput = document.querySelector('#serviceUrl');
const serviceState = document.querySelector('#serviceState');
const serviceHint = document.querySelector('#serviceHint');
const desktopMode = Boolean(window.jevDesktop);
const desktopKeyForm = document.querySelector('#desktopKeyForm');
const desktopKeyInput = document.querySelector('#desktopKey');
const clearDesktopKeyButton = document.querySelector('#clearDesktopKey');

let position;
let turn;
let selected = null;
let lastMove = null;
let result = null;
let history = [];
let moves = [];
let waiting = false;
let connectionError = '';
let generation = 0;
let pendingController = null;
let apiEndpoint = '';
let desktopHasKey = false;
let serviceStateKey = 'disconnected';
let serviceHintState = 'default';
let serviceHintErrorKey = '';
let decisionState = { kind: 'firstMove' };

function applyLanguage() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = tr('pageTitle');
  document.querySelector('meta[name="description"]').content = tr('pageDescription');
  document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = tr(element.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach((element) => { element.setAttribute('aria-label', tr(element.dataset.i18nAria)); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => { element.placeholder = tr(element.dataset.i18nPlaceholder); });
  const toggle = document.querySelector('#languageToggle');
  toggle.textContent = language === 'zh' ? 'EN' : '中文';
  toggle.setAttribute('aria-label', language === 'zh' ? 'Switch to English' : '切换为中文');
  document.querySelector('#connectionTitle').textContent = tr(desktopMode ? 'connectionDesktop' : 'connectionWeb');
  document.querySelector('#introText').textContent = tr(desktopMode ? 'introDesktop' : 'introWeb');
  document.querySelector('#footerText').textContent = tr(desktopMode ? 'footerDesktop' : 'footerWeb');
  document.querySelector('#deployLink').href = 'https://github.com/HamsterPark/Jev-Xiangqi/blob/main/worker/README.md';
  if (desktopMode) document.querySelector('#huarongdaoNav').textContent = tr('huarongdaoRaceNav');
  serviceState.textContent = tr(serviceStateKey);
  if (serviceHintState !== 'default') {
    serviceHint.textContent = tr(serviceHintState === 'saved' ? 'serviceSavedHint' : serviceHintErrorKey);
  }
  if (position) {
    renderDecision();
    render();
  }
}

document.querySelector('#languageToggle').addEventListener('click', () => {
  language = language === 'zh' ? 'en' : 'zh';
  try { localStorage.setItem(LANGUAGE_STORAGE_KEY, language); } catch { /* this tab only */ }
  applyLanguage();
});

function normalizeEndpoint(value) {
  const url = new URL(value.trim());
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw Object.assign(new Error(tr('httpsRequired')), { translationKey: 'httpsRequired' });
  }
  if (url.username || url.password || url.search || url.hash) {
    throw Object.assign(new Error(tr('endpointParams')), { translationKey: 'endpointParams' });
  }
  if (url.pathname === '/' || !url.pathname) url.pathname = '/api/move';
  if (url.pathname !== '/api/move') throw Object.assign(new Error(tr('endpointPath')), { translationKey: 'endpointPath' });
  return url.href;
}

try {
  const saved = localStorage.getItem(SERVICE_STORAGE_KEY);
  if (saved) apiEndpoint = normalizeEndpoint(saved);
} catch {
  // Storage may be unavailable; the address can still be used in this tab.
}
serviceInput.value = apiEndpoint;
serviceStateKey = apiEndpoint ? 'addressSaved' : 'disconnected';
if (desktopMode) {
  document.querySelector('#downloadLink').hidden = true;
  document.querySelector('#huarongdaoNav').href = './race.html';
  serviceForm.hidden = true;
  desktopKeyForm.hidden = false;
  serviceStateKey = 'keyMissing';
}
applyLanguage();

function snapshot() {
  return {
    board: position.board.map((row) => row.map((piece) => (piece ? { ...piece } : null))),
    turn,
    lastMove: lastMove ? { ...lastMove } : null,
    result: result ? { ...result } : null,
    moves: moves.map((item) => ({ ...item })),
  };
}

function restore(state) {
  position.board = state.board;
  turn = state.turn;
  lastMove = state.lastMove;
  result = state.result;
  moves = state.moves;
  selected = null;
}

function startGame() {
  generation++;
  pendingController?.abort();
  pendingController = null;
  position = createInitialPosition({ width: 9, height: 10 });
  turn = RED;
  selected = null;
  lastMove = null;
  result = null;
  moves = [];
  history = [snapshot()];
  waiting = false;
  connectionError = '';
  decisionState = { kind: 'firstMove' };
  renderDecision();
  retryButton.hidden = true;
  render();
}

function legalMoves(color = turn) {
  return getClassicLegalMoves(position, color);
}

function pieceName(piece) {
  return language === 'en' ? tr(PIECE_NAME[piece?.type] ?? '') : getPieceChar(piece);
}

function moveDescription(move, piece = position.board[move.fromY][move.fromX], target = position.board[move.toY][move.toX]) {
  return tr('moveNotation', {
    piece: pieceName(piece), fromFile: move.fromX + 1, fromRank: 10 - move.fromY,
    toFile: move.toX + 1, toRank: 10 - move.toY,
    capture: target ? tr('moveCapture', { piece: pieceName(target) }) : '',
  });
}

function playMove(move, by) {
  const id = classicMoveId(move);
  const piece = { ...position.board[move.fromY][move.fromX] };
  const target = position.board[move.toY][move.toX] ? { ...position.board[move.toY][move.toX] } : null;
  makeMove(position.board, move);
  lastMove = { ...move };
  moves.push({ id, by, move: { ...move }, piece, target });
  turn = by === RED ? BLACK : RED;
  result = getClassicResult(position, turn);
  history.push(snapshot());
  selected = null;
  render();
  if (by === RED && !result) askJev();
}

function setStatus(title, detail, icon = '●') {
  statusTitle.textContent = title;
  statusText.textContent = detail;
  statusIcon.textContent = icon;
}

function renderBoard() {
  boardElement.innerHTML = '';
  const legal = !result && turn === RED && selected
    ? legalMoves(RED).filter((move) => move.fromX === selected.x && move.fromY === selected.y)
    : [];
  const targets = new Set(legal.map((move) => `${move.toX},${move.toY}`));
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 9; x++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'square';
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.setAttribute('role', 'gridcell');
      const piece = position.board[y][x];
      if (piece) {
        const pieceElement = document.createElement('span');
        pieceElement.className = `piece ${piece.color}`;
        pieceElement.textContent = getPieceChar(piece);
        cell.append(pieceElement);
      }
      cell.setAttribute('aria-label', piece
        ? tr('squarePiece', { file: x + 1, rank: 10 - y, color: tr(piece.color), piece: pieceName(piece) })
        : tr('squareEmpty', { file: x + 1, rank: 10 - y }));
      if (selected?.x === x && selected?.y === y) cell.classList.add('selected');
      if (targets.has(`${x},${y}`)) cell.classList.add('legal');
      if (lastMove?.fromX === x && lastMove?.fromY === y) cell.classList.add('last-from');
      if (lastMove?.toX === x && lastMove?.toY === y) cell.classList.add('last-to');
      boardElement.append(cell);
    }
  }
}

function renderLog() {
  moveLog.innerHTML = '';
  if (!moves.length) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = tr('emptyLog');
    moveLog.append(empty);
    return;
  }
  [...moves].reverse().forEach((item, index) => {
    const li = document.createElement('li');
    if (item.by === BLACK) li.className = 'black';
    const number = document.createElement('span');
    number.className = 'round';
    number.textContent = String(Math.ceil((moves.length - index) / 2)).padStart(2, '0');
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = item.by === RED ? tr('you') : 'Jev';
    const text = document.createElement('span');
    text.className = 'move-text';
    text.textContent = moveDescription(item.move, item.piece, item.target);
    li.append(number, who, text);
    moveLog.append(li);
  });
}

function render() {
  renderBoard();
  renderLog();
  moveCount.textContent = tr('round', { number: Math.floor(moves.length / 2) + 1 });
  document.querySelector('#humanIndicator').classList.toggle('on', turn === RED && !result);
  document.querySelector('#jevIndicator').classList.toggle('on', turn === BLACK && !result);
  undoButton.disabled = history.length < 2 || waiting;
  if (result) {
    const isHuman = result.winner === RED;
    setStatus(
      tr(isHuman ? 'wonYou' : 'wonJev'),
      tr(result.reason === 'checkmate' ? 'checkmate' : result.reason === 'stalemate' ? 'stalemate' : 'capturedGeneral'),
      isHuman ? '★' : '◆',
    );
  } else if (desktopMode && !desktopHasKey) {
    setStatus(tr('needKey'), tr('needKeyDetail'), '◌');
  } else if (!desktopMode && !apiEndpoint) {
    setStatus(tr('needService'), tr('needServiceDetail'), '◌');
  } else if (turn === BLACK) {
    setStatus(
      tr(connectionError ? 'jevFailed' : waiting ? 'jevThinking' : 'jevWaiting'),
      connectionError ? errorText() : tr(waiting ? 'thinkingDetail' : 'waitingDetail'),
      connectionError ? '!' : '◌',
    );
  } else if (isInClassicCheck(position, RED)) {
    setStatus(tr('inCheck'), tr('escapeCheck'), '!');
  } else {
    setStatus(tr('yourTurn'), tr(selected ? 'selectDestination' : 'selectPiece'));
  }
}

function showDecision(move, probabilities = {}, confidence = null) {
  const describe = (candidate) => ({
    move: { ...candidate },
    piece: { ...position.board[candidate.fromY][candidate.fromX] },
    target: position.board[candidate.toY][candidate.toX] ? { ...position.board[candidate.toY][candidate.toX] } : null,
  });
  const options = Object.entries(probabilities || {}).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([id, probability]) => {
      const candidate = legalMoves(BLACK).find((item) => classicMoveId(item) === id);
      return candidate ? { ...describe(candidate), probability } : null;
    }).filter(Boolean);
  decisionState = { kind: 'choice', chosen: describe(move), confidence, options };
  renderDecision();
}

function renderDecision() {
  decisionElement.innerHTML = '';
  if (decisionState.kind !== 'choice') {
    const message = document.createElement('p');
    message.textContent = tr(decisionState.kind);
    decisionElement.append(message);
    return;
  }
  const title = document.createElement('div');
  title.className = 'decision-title';
  const name = document.createElement('strong');
  name.textContent = moveDescription(decisionState.chosen.move, decisionState.chosen.piece, decisionState.chosen.target);
  const conf = document.createElement('span');
  conf.textContent = Number.isFinite(decisionState.confidence) ? tr('confidence', { percent: Math.round(decisionState.confidence * 100) }) : tr('selected');
  title.append(name, conf);
  decisionElement.append(title);
  for (const option of decisionState.options) {
    const line = document.createElement('div');
    line.className = 'bar-line';
    const left = document.createElement('div');
    const label = document.createElement('div');
    label.className = 'bar-label';
    label.textContent = moveDescription(option.move, option.piece, option.target);
    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    fill.style.width = `${Math.max(0, Math.min(100, option.probability * 100))}%`;
    track.append(fill);
    left.append(label, track);
    const value = document.createElement('span');
    value.textContent = `${Math.round(option.probability * 100)}%`;
    line.append(left, value);
    decisionElement.append(line);
  }
}

async function askJev() {
  if (turn !== BLACK || result || waiting) return;
  const choices = legalMoves(BLACK);
  if (choices.length === 1) {
    decisionState = { kind: 'forcedMove' };
    renderDecision();
    playMove(choices[0], BLACK);
    return;
  }
  if (desktopMode ? !desktopHasKey : !apiEndpoint) {
    connectionError = desktopMode ? 'missingKeyError' : 'missingServiceError';
    render();
    retryButton.hidden = false;
    return;
  }
  connectionError = '';
  waiting = true;
  retryButton.hidden = true;
  const currentGeneration = generation;
  const controller = desktopMode ? null : new AbortController();
  pendingController = controller;
  const timeout = controller ? setTimeout(() => controller.abort(), 15000) : null;
  render();
  try {
    const payload = {
      game: 'xiangqi',
      state: { board: position.board, currentPlayer: BLACK, lastMove },
      history: moves.slice(-12).map((item) => item.id),
    };
    let data;
    if (desktopMode) {
      data = await window.jevDesktop.requestMove(payload);
    } else {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!response.ok) {
        const failure = await response.json().catch(() => null);
        throw Object.assign(new Error(response.status === 429 ? failure?.error || tr('quotaError') : `HTTP ${response.status}`), {
          translationKey: response.status === 429 ? 'quotaError' : null,
        });
      }
      data = await response.json();
    }
    if (currentGeneration !== generation) return;
    const move = choices.find((item) => classicMoveId(item) === data.move);
    if (!move) throw Object.assign(new Error(tr('invalidMove')), { translationKey: 'invalidMove' });
    showDecision(move, data.probabilities, data.confidence);
    playMove(move, BLACK);
  } catch (error) {
    if (currentGeneration !== generation) return;
    const message = error instanceof Error ? error.message : '';
    connectionError = error?.name === 'AbortError' ? 'timeout'
      : error?.translationKey || (desktopMode ? desktopErrorKey(message) : 'connectionFailed');
    retryButton.hidden = false;
  } finally {
    if (timeout) clearTimeout(timeout);
    if (currentGeneration === generation) {
      waiting = false;
      pendingController = null;
      render();
    }
  }
}

boardElement.addEventListener('click', (event) => {
  const cell = event.target.closest('.square');
  if (!cell || turn !== RED || result || waiting) return;
  if (desktopMode ? !desktopHasKey : !apiEndpoint) {
    (desktopMode ? desktopKeyInput : serviceInput).focus();
    setStatus(tr(desktopMode ? 'needKey' : 'needService'), tr(desktopMode ? 'needKeyShort' : 'needServiceShort'), '◌');
    return;
  }
  const x = Number(cell.dataset.x);
  const y = Number(cell.dataset.y);
  const piece = position.board[y][x];
  if (selected) {
    const move = legalMoves(RED).find((item) => item.fromX === selected.x && item.fromY === selected.y && item.toX === x && item.toY === y);
    if (move) {
      playMove(move, RED);
      return;
    }
  }
  selected = piece?.color === RED ? { x, y } : null;
  render();
});

document.querySelector('#newGame').addEventListener('click', startGame);
serviceForm.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    apiEndpoint = normalizeEndpoint(serviceInput.value);
    serviceInput.value = apiEndpoint;
    serviceStateKey = 'addressSaved';
    serviceHintState = 'saved';
    serviceState.textContent = tr(serviceStateKey);
    serviceHint.textContent = tr('serviceSavedHint');
    try { localStorage.setItem(SERVICE_STORAGE_KEY, apiEndpoint); } catch { /* tab-only */ }
    connectionError = '';
    if (waiting) {
      generation++;
      pendingController?.abort();
      pendingController = null;
      waiting = false;
    }
    render();
    if (turn === BLACK && !result) askJev();
  } catch (error) {
    serviceStateKey = 'invalidAddress';
    serviceHintState = 'error';
    serviceHintErrorKey = error.translationKey || 'invalidAddress';
    serviceState.textContent = tr(serviceStateKey);
    serviceHint.textContent = tr(serviceHintErrorKey);
    serviceInput.focus();
  }
});
desktopKeyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!desktopMode) return;
  const key = desktopKeyInput.value.trim();
  const submitButton = desktopKeyForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    await window.jevDesktop.setKey(key);
    desktopHasKey = true;
    serviceStateKey = 'keyEntered';
    serviceState.textContent = tr(serviceStateKey);
    clearDesktopKeyButton.hidden = false;
    retryButton.hidden = true;
    connectionError = '';
    render();
    if (turn === BLACK && !result && !waiting) askJev();
  } catch {
    serviceStateKey = 'invalidKey';
    serviceState.textContent = tr(serviceStateKey);
    desktopKeyInput.focus();
  } finally {
    desktopKeyInput.value = '';
    submitButton.disabled = false;
  }
});
clearDesktopKeyButton.addEventListener('click', async () => {
  if (!desktopMode) return;
  await window.jevDesktop.clearKey();
  desktopHasKey = false;
  serviceStateKey = 'keyMissing';
  serviceState.textContent = tr(serviceStateKey);
  clearDesktopKeyButton.hidden = true;
  generation++;
  pendingController?.abort();
  pendingController = null;
  waiting = false;
  connectionError = '';
  retryButton.hidden = true;
  render();
  desktopKeyInput.focus();
});
retryButton.addEventListener('click', askJev);
undoButton.addEventListener('click', () => {
  if (waiting || history.length < 2) return;
  generation++;
  history.pop();
  while (history.length > 1 && history.at(-1).turn !== RED) history.pop();
  restore(history.at(-1));
  connectionError = '';
  decisionState = { kind: 'returnedToTurn' };
  renderDecision();
  retryButton.hidden = true;
  render();
});

startGame();
if (desktopMode) {
  window.jevDesktop.hasKey().then((hasKey) => {
    desktopHasKey = hasKey;
    serviceStateKey = hasKey ? 'keyEntered' : 'keyMissing';
    serviceState.textContent = tr(serviceStateKey);
    clearDesktopKeyButton.hidden = !hasKey;
    render();
  }).catch(() => {
    serviceStateKey = 'keyStatusFailed';
    serviceState.textContent = tr(serviceStateKey);
  });
}
