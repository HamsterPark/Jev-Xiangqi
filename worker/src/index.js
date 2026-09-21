import { getClassicLegalMoves } from '../../assets/js/xiangqi-classic.js';
import { createInitialPosition } from '../../assets/js/setup.js';

const JEV_URL = 'https://www.jevai.org/api/v1/decisions';
const DEFAULT_ORIGIN = 'https://hamsterpark.github.io';
const CLASSIC_META = createInitialPosition({ width: 9, height: 10 }).meta;
const MAX_REQUEST_BYTES = 16 * 1024;
const MAX_JEV_BYTES = 32 * 1024;
const CLASSIC_TYPES = new Set(['g', 'a', 'e', 'h', 'r', 'c', 'p']);
const PIECES = Object.freeze({ C: [2, 2], V1: [1, 2], V2: [1, 2], V3: [1, 2], V4: [1, 2], H: [2, 1], S1: [1, 1], S2: [1, 1], S3: [1, 1], S4: [1, 1] });
const XIANGQI_NAMES = Object.freeze({ g: '将', a: '士', e: '象', h: '马', r: '车', c: '炮', p: '兵' });
const DIRECTIONS = Object.freeze({ U: '上', D: '下', L: '左', R: '右' });

function json(body, status = 200, origin = null) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  const origins = (env.ALLOWED_ORIGINS || DEFAULT_ORIGIN).split(',').map((item) => item.trim());
  if (origins.includes(origin)) return origin;
  if (/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/.test(origin)) return origin;
  return null;
}

async function readLimitedBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Request body is required');
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new Error('Request body is too large');
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Request body must be valid JSON');
  }
}

function validateHistory(history) {
  if (history === undefined) return [];
  if (!Array.isArray(history) || history.length > 16 || history.some((id) => typeof id !== 'string' || id.length > 32)) {
    throw new Error('history must contain at most 16 short move IDs');
  }
  return history;
}

function validateGameHistory(history, game) {
  const pattern = game === 'xiangqi' ? /^[0-8],[0-9]-[0-8],[0-9]$/ : /^(?:C|V[1-4]|H|S[1-4]):[UDLR]$/;
  if (history.some((id) => !pattern.test(id))) throw new Error('Invalid move history');
}

function getHuarongdaoLegalMoves(positions) {
  const occupied = new Map();
  for (const [id, [width, height]] of Object.entries(PIECES)) {
    const [x, y] = positions[id];
    for (let cy = y; cy < y + height; cy++) {
      for (let cx = x; cx < x + width; cx++) occupied.set(`${cx},${cy}`, id);
    }
  }
  const moves = [];
  const directions = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  for (const [id, [width, height]] of Object.entries(PIECES)) {
    const [x, y] = positions[id];
    for (const [direction, [dx, dy]] of Object.entries(directions)) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx + width > 4 || ny + height > 5) continue;
      let clear = true;
      for (let cy = ny; cy < ny + height && clear; cy++) {
        for (let cx = nx; cx < nx + width; cx++) {
          const occupant = occupied.get(`${cx},${cy}`);
          if (occupant && occupant !== id) { clear = false; break; }
        }
      }
      if (clear) moves.push(`${id}:${direction}`);
    }
  }
  return moves;
}

function validateXiangqi(state) {
  if (!state || state.currentPlayer !== 'black' || !Array.isArray(state.board) || state.board.length !== 10) {
    throw new Error('Expected a classic 9×10 board with black to move');
  }
  const counts = { red: Object.create(null), black: Object.create(null) };
  for (const row of state.board) {
    if (!Array.isArray(row) || row.length !== 9) throw new Error('Expected a classic 9×10 board');
    for (const cell of row) {
      if (cell === null) continue;
      if (!cell || typeof cell !== 'object' || !CLASSIC_TYPES.has(cell.type) || !['red', 'black'].includes(cell.color)) {
        throw new Error('Invalid classic chess piece');
      }
      counts[cell.color][cell.type] = (counts[cell.color][cell.type] || 0) + 1;
    }
  }
  for (const color of ['red', 'black']) {
    if (counts[color].g !== 1 || (counts[color].a || 0) > 2 || (counts[color].e || 0) > 2 ||
      (counts[color].h || 0) > 2 || (counts[color].r || 0) > 2 || (counts[color].c || 0) > 2 ||
      (counts[color].p || 0) > 5) {
      throw new Error('Invalid classic chess piece counts');
    }
  }
  if (state.lastMove !== undefined) {
    const m = state.lastMove;
    if (!m || !['fromX', 'fromY', 'toX', 'toY'].every((key) => Number.isInteger(m[key])) ||
      m.fromX < 0 || m.fromX > 8 || m.toX < 0 || m.toX > 8 ||
      m.fromY < 0 || m.fromY > 9 || m.toY < 0 || m.toY > 9) {
      throw new Error('Invalid last move');
    }
  }
  const legalMoves = getClassicLegalMoves({ board: state.board, width: 9, height: 10, meta: CLASSIC_META }, 'black');
  if (!Array.isArray(legalMoves)) throw new Error('Cannot generate legal moves');
  const criteria = {};
  for (const move of legalMoves) {
    const { fromX, fromY, toX, toY } = move;
    const id = `${fromX},${fromY}-${toX},${toY}`;
    const piece = state.board[fromY]?.[fromX];
    const target = state.board[toY]?.[toX];
    if (!piece || piece.color !== 'black' || Object.hasOwn(criteria, id)) throw new Error('Invalid legal move generation');
    criteria[id] = `${XIANGQI_NAMES[piece.type]} ${fromX},${fromY} → ${toX},${toY}${target ? `，吃${XIANGQI_NAMES[target.type]}` : ''}`;
  }
  return {
    criteria,
    modelState: {
      game: '中国象棋，标准 9×10 棋盘',
      goal: '黑方争取吃掉红将，同时保护己方将。棋盘坐标 x 从左到右 0–8，y 从上到下 0–9。',
      side_to_move: 'black',
      board: state.board,
      last_move: state.lastMove || null,
    },
    instructions: '你执黑。根据当前局面选择一个有利的合法着法。考虑将军、吃子、应将和避免己方将被吃。只从给出的候选着法中选一个。',
  };
}

function validateHuarongdao(state) {
  if (!state || typeof state !== 'object' || !state.positions || !Array.isArray(state.legalMoves)) {
    throw new Error('Invalid Huarongdao state');
  }
  const cells = new Set();
  const keys = Object.keys(state.positions);
  if (keys.length !== Object.keys(PIECES).length || keys.some((key) => !Object.hasOwn(PIECES, key))) {
    throw new Error('Invalid Huarongdao pieces');
  }
  for (const [id, [width, height]] of Object.entries(PIECES)) {
    const point = state.positions[id];
    if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isInteger)) throw new Error('Invalid Huarongdao position');
    const [x, y] = point;
    if (x < 0 || y < 0 || x + width > 4 || y + height > 5) throw new Error('Huarongdao piece is off-board');
    for (let cy = y; cy < y + height; cy++) {
      for (let cx = x; cx < x + width; cx++) {
        const key = `${cx},${cy}`;
        if (cells.has(key)) throw new Error('Huarongdao pieces overlap');
        cells.add(key);
      }
    }
  }
  if (cells.size !== 18) throw new Error('Invalid Huarongdao coverage');
  const allMoves = new Set(getHuarongdaoLegalMoves(state.positions));
  if (state.legalMoves.length > 40 || new Set(state.legalMoves).size !== state.legalMoves.length ||
    state.legalMoves.some((id) => typeof id !== 'string' || !allMoves.has(id))) {
    throw new Error('Huarongdao legalMoves must be a subset of actual legal moves');
  }
  const criteria = {};
  for (const id of state.legalMoves) {
    const [pieceId, direction] = id.split(':');
    criteria[id] = `${pieceId} 向${DIRECTIONS[direction]}移动一格`;
  }
  return {
    criteria,
    modelState: {
      game: '华容道，4 列 5 行滑块谜题',
      goal: '让 2×2 的 C（曹操）移动到出口：左上角坐标 (1,3)，棋盘底边中间。每步只能移动一个滑块一格，避免重复局面。',
      positions: state.positions,
    },
    instructions: '从候选动作中选择最可能帮助曹操 C 抵达出口的一步，尽量避免近期往返和重复。只选择给出的动作。',
  };
}

function validProbabilities(probabilities, criteria) {
  if (!probabilities || typeof probabilities !== 'object' || Array.isArray(probabilities)) return {};
  const clean = {};
  for (const [id, value] of Object.entries(probabilities)) {
    if (Object.hasOwn(criteria, id) && typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1) {
      clean[id] = value;
    }
  }
  return clean;
}

async function askJev(env, modelState, criteria, instructions, history) {
  const ids = Object.keys(criteria);
  if (ids.length === 0) return json({ error: 'No legal moves' }, 422);
  if (ids.length === 1) return json({ move: ids[0], confidence: null, probabilities: { [ids[0]]: 1 } });
  if (ids.length > 255) return json({ error: 'Too many legal moves for Jev' }, 422);
  if (!env.JEV_API_KEY) return json({ error: 'Jev API key is not configured' }, 503);
  const body = JSON.stringify({
    model: 'typesafe/jev-1.13',
    state: { ...modelState, recent_moves: history },
    questions: { move: { type: 'choice', instructions, criteria } },
  });
  if (new TextEncoder().encode(body).byteLength > MAX_JEV_BYTES) return json({ error: 'Jev request is too large' }, 422);
  let upstream;
  try {
    upstream = await fetch(JEV_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.JEV_API_KEY}`, 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return json({ error: 'Jev is temporarily unavailable' }, 502);
  }
  if (!upstream.ok) return json({ error: 'Jev request failed' }, 502);
  let result;
  try {
    result = await upstream.json();
  } catch {
    return json({ error: 'Invalid Jev response' }, 502);
  }
  const answer = result?.code === 0 ? result.data?.answers?.move : null;
  const move = answer?.choice;
  if (typeof move !== 'string' || !Object.hasOwn(criteria, move)) {
    return json({ error: 'Jev did not return a legal move' }, 502);
  }
  const confidence = typeof answer.confidence === 'number' && Number.isFinite(answer.confidence) &&
    answer.confidence >= 0 && answer.confidence <= 1 ? answer.confidence : null;
  return json({ move, confidence, probabilities: validProbabilities(answer.probabilities, criteria) });
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (!origin) return json({ error: 'Origin is not allowed' }, 403);
    const url = new URL(request.url);
    if (url.pathname !== '/api/move') return json({ error: 'Not found' }, 404, origin);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      } });
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin);
    if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
      return json({ error: 'Content-Type must be application/json' }, 415, origin);
    }
    if (env.MOVE_RATE_LIMITER) {
      const key = request.headers.get('CF-Connecting-IP') || 'unknown';
      const { success } = await env.MOVE_RATE_LIMITER.limit({ key });
      if (!success) return json({ error: 'Please slow down' }, 429, origin);
    }
    let input;
    let game;
    try {
      input = await readLimitedBody(request);
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid request');
      const history = validateHistory(input.history);
      if (input.game !== 'xiangqi' && input.game !== 'huarongdao') throw new Error('Unknown game');
      validateGameHistory(history, input.game);
      if (input.game === 'xiangqi') game = validateXiangqi(input.state);
      else game = validateHuarongdao(input.state);
      const response = await askJev(env, game.modelState, game.criteria, game.instructions, history);
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Vary', 'Origin');
      return response;
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Invalid request' }, 400, origin);
    }
  },
};
