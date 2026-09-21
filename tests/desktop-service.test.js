import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesktopService } from '../desktop/service.mjs';
import { createInitialPosition } from '../assets/js/setup.js';
import { getLegalMoves as getRaceLegalMoves } from '../assets/js/huarongdao-core.js';

const KEY = 'test-only-key';

function input() {
  const { board } = createInitialPosition({ width: 9, height: 10 });
  return { game: 'xiangqi', state: { board, currentPlayer: 'black' }, history: [] };
}

test('keeps the key in memory and rejects invalid keys', () => {
  const service = createDesktopService();
  assert.equal(service.hasKey(), false);
  assert.throws(() => service.setKey('  '), /有效/);
  assert.throws(() => service.setKey('one\ntwo'), /有效/);
  assert.deepEqual(service.setKey(` ${KEY} `), { ok: true });
  assert.equal(service.hasKey(), true);
  assert.deepEqual(service.clearKey(), { ok: true });
  assert.equal(service.hasKey(), false);
});

test('submits a validated board to Jev and returns only safe move data', async () => {
  const service = createDesktopService();
  service.setKey(KEY);
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url, 'https://www.jevai.org/api/v1/decisions');
    assert.equal(options.headers.Authorization, `Bearer ${KEY}`);
    const body = JSON.parse(options.body);
    const move = Object.keys(body.questions.move.criteria)[0];
    return Response.json({ code: 0, data: { answers: { move: {
      choice: move,
      confidence: 0.7,
      probabilities: { [move]: 0.7, forged: 0.3 },
    } } } });
  };
  try {
    const result = await service.requestMove(input());
    assert.match(result.move, /^[0-8],[0-9]-[0-8],[0-9]$/);
    assert.equal(result.confidence, 0.7);
    assert.equal(result.probabilities.forged, undefined);
    assert.equal(JSON.stringify(result).includes(KEY), false);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('does not send invalid positions upstream or expose the key in errors', async () => {
  const service = createDesktopService();
  service.setKey(KEY);
  const invalid = input();
  invalid.state.currentPlayer = 'red';
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Should not reach Jev'); };
  try {
    await assert.rejects(service.requestMove(invalid), /棋局数据无效/);
    await assert.rejects(service.requestMove({ ...input(), history: ['ignore rules'] }), /棋局数据无效/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('quota errors are readable and failed authentication does not leak server details', async () => {
  const service = createDesktopService();
  service.setKey(KEY);
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('', { status: 429 });
    await assert.rejects(service.requestMove(input()), /Jev 今日额度/);
    globalThis.fetch = async () => new Response(`private ${KEY}`, { status: 401 });
    await assert.rejects(service.requestMove(input()), (error) => {
      assert.equal(error.message, 'Jev API key 无效或无权访问，请检查密钥。');
      assert.equal(error.message.includes(KEY), false);
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Huarongdao race alternates player and live Jev moves on independent boards', async () => {
  const service = createDesktopService();
  service.setKey(KEY);
  const opening = service.startRace();
  const playerMove = getRaceLegalMoves(opening.boards.player)[0];
  const afterPlayer = service.playRaceMove(playerMove);
  assert.equal(afterPlayer.turn, 'jev');
  assert.equal(afterPlayer.moves.player.length, 1);
  assert.equal(afterPlayer.moves.jev.length, 0);
  const originalFetch = globalThis.fetch;
  let offered;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://www.jevai.org/api/v1/decisions');
    assert.equal(options.headers.Authorization, `Bearer ${KEY}`);
    const body = JSON.parse(options.body);
    offered = Object.keys(body.questions.move.criteria);
    assert.ok(offered.length > 0);
    return Response.json({ code: 0, data: { answers: { move: { choice: offered[0] } } } });
  };
  try {
    const result = await service.requestRaceMove();
    assert.equal(result.moveId, offered[0]);
    assert.equal(result.race.turn, 'player');
    assert.deepEqual(result.race.moves.player, [playerMove]);
    assert.deepEqual(result.race.moves.jev, [offered[0]]);
    assert.notStrictEqual(result.race.boards.player, result.race.boards.jev);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Huarongdao race rejects illegal moves and leaves Jev turn unchanged on API failure', async () => {
  const service = createDesktopService();
  service.setKey(KEY);
  const opening = service.startRace();
  assert.throws(() => service.playRaceMove('C:U'), /华容道走法无效/);
  const afterPlayer = service.playRaceMove(getRaceLegalMoves(opening.boards.player)[0]);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('', { status: 429 });
  try {
    await assert.rejects(service.requestRaceMove(), /Jev 今日额度/);
    assert.equal(afterPlayer.turn, 'jev');
    assert.equal(afterPlayer.moves.jev.length, 0);
    await assert.rejects(service.requestRaceMove(), /Jev 今日额度/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
