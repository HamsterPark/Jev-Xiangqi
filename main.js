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

// Set during deployment. Visitors never receive the Jev API key.
const API_ENDPOINT = '';
const boardElement = document.querySelector('#board');
const statusTitle = document.querySelector('#statusTitle');
const statusText = document.querySelector('#statusText');
const statusIcon = document.querySelector('#statusIcon');
const moveCount = document.querySelector('#moveCount');
const decisionElement = document.querySelector('#decision');
const moveLog = document.querySelector('#moveLog');
const retryButton = document.querySelector('#retry');
const undoButton = document.querySelector('#undo');

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
  decisionElement.innerHTML = '<p>等待你走出第一步。</p>';
  retryButton.hidden = true;
  render();
}

function legalMoves(color = turn) {
  return getClassicLegalMoves(position, color);
}

function moveDescription(move) {
  const piece = position.board[move.fromY][move.fromX];
  const target = position.board[move.toY][move.toX];
  return `${getPieceChar(piece)} ${move.fromX + 1}路${10 - move.fromY} → ${move.toX + 1}路${10 - move.toY}${target ? ` · 吃${getPieceChar(target)}` : ''}`;
}

function playMove(move, by) {
  const description = moveDescription(move);
  const id = classicMoveId(move);
  makeMove(position.board, move);
  lastMove = { ...move };
  moves.push({ id, by, description });
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
      cell.setAttribute('aria-label', `${x + 1}路${10 - y}${piece ? `，${piece.color === RED ? '红' : '黑'}${getPieceChar(piece)}` : '，空位'}`);
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
    empty.textContent = '开局待走';
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
    who.textContent = item.by === RED ? '你' : 'Jev';
    const text = document.createElement('span');
    text.className = 'move-text';
    text.textContent = item.description;
    li.append(number, who, text);
    moveLog.append(li);
  });
}

function render() {
  renderBoard();
  renderLog();
  moveCount.textContent = `第 ${Math.floor(moves.length / 2) + 1} 回合`;
  document.querySelector('#humanIndicator').classList.toggle('on', turn === RED && !result);
  document.querySelector('#jevIndicator').classList.toggle('on', turn === BLACK && !result);
  undoButton.disabled = history.length < 2 || waiting;
  if (result) {
    const isHuman = result.winner === RED;
    setStatus(
      isHuman ? '你赢了！' : 'Jev 赢了',
      result.reason === 'checkmate' ? '将死，对局结束。' : result.reason === 'stalemate' ? '困毙，对局结束。' : '将被吃掉，对局结束。',
      isHuman ? '★' : '◆',
    );
  } else if (turn === BLACK) {
    setStatus(
      connectionError ? 'Jev 暂时没能落子' : waiting ? 'Jev 正在思考…' : '等待 Jev 落子',
      connectionError || (waiting ? '正在从合法着法中选择下一步。' : '等待下一步。'),
      connectionError ? '!' : '◌',
    );
  } else if (isInClassicCheck(position, RED)) {
    setStatus('你被将军了', '请走出一步能够解将的棋。', '!');
  } else {
    setStatus('轮到你了', selected ? '点击高亮的格子落子，或改选另一枚棋。' : '点击一枚红棋，再点击高亮的落点。');
  }
}

function showDecision(move, probabilities = {}, confidence = null) {
  decisionElement.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'decision-title';
  const name = document.createElement('strong');
  name.textContent = moveDescription(move);
  const conf = document.createElement('span');
  conf.textContent = Number.isFinite(confidence) ? `信心 ${Math.round(confidence * 100)}%` : 'Jev 已选择';
  title.append(name, conf);
  decisionElement.append(title);
  const options = Object.entries(probabilities).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (!options.length) return;
  for (const [id, probability] of options) {
    const candidate = legalMoves(BLACK).find((item) => classicMoveId(item) === id);
    if (!candidate) continue;
    const line = document.createElement('div');
    line.className = 'bar-line';
    const left = document.createElement('div');
    const label = document.createElement('div');
    label.className = 'bar-label';
    label.textContent = moveDescription(candidate);
    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    fill.style.width = `${Math.max(0, Math.min(100, probability * 100))}%`;
    track.append(fill);
    left.append(label, track);
    const value = document.createElement('span');
    value.textContent = `${Math.round(probability * 100)}%`;
    line.append(left, value);
    decisionElement.append(line);
  }
}

async function askJev() {
  if (turn !== BLACK || result || waiting) return;
  const choices = legalMoves(BLACK);
  if (choices.length === 1) {
    decisionElement.innerHTML = '<p>黑方只有一步合法着法，按规则自动落子。</p>';
    playMove(choices[0], BLACK);
    return;
  }
  if (!API_ENDPOINT) {
    connectionError = '网站需要先配置安全的服务端连接。';
    render();
    retryButton.hidden = false;
    return;
  }
  connectionError = '';
  waiting = true;
  retryButton.hidden = true;
  const currentGeneration = generation;
  const controller = new AbortController();
  pendingController = controller;
  const timeout = setTimeout(() => controller.abort(), 15000);
  render();
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game: 'xiangqi',
        state: { board: position.board, currentPlayer: BLACK, lastMove },
        history: moves.slice(-12).map((item) => item.id),
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (currentGeneration !== generation) return;
    const move = choices.find((item) => classicMoveId(item) === data.move);
    if (!move) throw new Error('Jev 返回了无效着法');
    showDecision(move, data.probabilities, data.confidence);
    playMove(move, BLACK);
  } catch (error) {
    if (currentGeneration !== generation) return;
    connectionError = error.name === 'AbortError' ? '连接超时，请重试。' : '连接失败，请重试。';
    retryButton.hidden = false;
  } finally {
    clearTimeout(timeout);
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
retryButton.addEventListener('click', askJev);
undoButton.addEventListener('click', () => {
  if (waiting || history.length < 2) return;
  generation++;
  history.pop();
  while (history.length > 1 && history.at(-1).turn !== RED) history.pop();
  restore(history.at(-1));
  connectionError = '';
  decisionElement.innerHTML = '<p>已退回到你的回合。</p>';
  retryButton.hidden = true;
  render();
});

startGame();
