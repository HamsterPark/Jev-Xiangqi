import { getClassicLegalMoves, isInClassicCheck } from '../../assets/js/xiangqi-classic.js';
import { createInitialPosition } from '../../assets/js/setup.js';

const JEV_URL = 'https://www.jevai.org/api/v1/decisions';
const DEFAULT_ORIGIN = 'https://hamsterpark.github.io';
const CLASSIC_META = createInitialPosition({ width: 9, height: 10 }).meta;
const MAX_REQUEST_BYTES = 16 * 1024;
const MAX_JEV_BYTES = 32 * 1024;
const JEV_QUOTA_ERROR = 'Jev 今日额度已用完，请稍后再试';
const JEV_AUTH_ERROR = 'Jev API key 无效或无权访问，请检查密钥。';
const CLASSIC_TYPES = new Set(['g', 'a', 'e', 'h', 'r', 'c', 'p']);
const XIANGQI_NAMES = Object.freeze({
  g: 'general', a: 'advisor', e: 'elephant', h: 'horse', r: 'rook', c: 'cannon', p: 'pawn',
});
const XIANGQI_RULES = Object.freeze([
  'General (g): one square orthogonally within its own palace; the generals may not face each other on an open file.',
  'Advisor (a): one square diagonally within its own palace.',
  'Elephant (e): two squares diagonally; its midpoint must be empty and it cannot cross the river.',
  'Horse (h): one square orthogonally then one diagonally outward; an occupied adjacent orthogonal leg blocks it.',
  'Rook (r): any number of empty squares orthogonally, capturing the first enemy in its path.',
  'Cannon (c): moves through empty squares orthogonally; a capture requires exactly one intervening piece as a screen.',
  'Pawn (p): one square forward; after crossing the river it may also move one square sideways, but never backward.',
  'Every candidate is already legal: it does not leave the moving side in check or the generals facing on an open file.',
]);

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
  if (!Array.isArray(history) || history.length > 16 ||
    history.some((id) => typeof id !== 'string' || !/^[0-8],[0-9]-[0-8],[0-9]$/.test(id))) {
    throw new Error('history must contain at most 16 Xiangqi move IDs');
  }
  return history;
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
    criteria[id] = `Black ${XIANGQI_NAMES[piece.type]} from (${fromX},${fromY}) to (${toX},${toY}); ${target ? `captures red ${XIANGQI_NAMES[target.type]}` : 'no capture'}.`;
  }
  return {
    criteria,
    modelState: {
      game: 'Standard Xiangqi on a 9x10 board',
      goal: 'Win as black by capturing the red general or leaving red with no legal move. With no legal move, red loses by checkmate if in check and by stalemate otherwise. The same conditions can make black lose.',
      side_to_move: 'black',
      coordinates: 'board[y][x], with x=0..8 left to right and y=0..9 top to bottom. Black starts at the top and advances toward larger y; red starts at the bottom and advances toward smaller y. The river lies between rows 4 and 5; each palace occupies columns 3..5 and its own back three rows.',
      piece_codes: XIANGQI_NAMES,
      rules: XIANGQI_RULES,
      board: state.board,
      last_move: state.lastMove || null,
      black_in_check: isInClassicCheck({ board: state.board, width: 9, height: 10, meta: CLASSIC_META }, 'black'),
    },
    instructions: 'You play black. Study the full board and choose exactly one move ID from the complete legal candidate list. Consider checks, forced wins by capture/checkmate/stalemate, the opponent\'s likely replies, and the safety of your general and other pieces. The descriptions explain moves; they are not rankings or scores.',
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
  if (upstream.status === 429) return json({ error: JEV_QUOTA_ERROR }, 429);
  if (upstream.status === 401 || upstream.status === 403) return json({ error: JEV_AUTH_ERROR }, 401);
  if (!upstream.ok) return json({ error: 'Jev request failed' }, 502);
  let result;
  try {
    result = await upstream.json();
  } catch {
    return json({ error: 'Invalid Jev response' }, 502);
  }
  if (result?.code !== 0 && typeof result?.message === 'string' &&
    /today['’]s request limit has been reached/i.test(result.message)) {
    return json({ error: JEV_QUOTA_ERROR }, 429);
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
    try {
      input = await readLimitedBody(request);
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid request');
      if (input.game !== 'xiangqi') throw new Error('Unknown game');
      const history = validateHistory(input.history);
      const game = validateXiangqi(input.state);
      const response = await askJev(env, game.modelState, game.criteria, game.instructions, history);
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Vary', 'Origin');
      return response;
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Invalid request' }, 400, origin);
    }
  },
};
