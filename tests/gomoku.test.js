import test from "node:test";
import assert from "node:assert/strict";
import {
  createGomokuState,
  getLegalGomokuMoves,
  playGomokuMove,
  validateGomokuState,
} from "../assets/js/gomoku-core.js";
import {
  createJevGomokuDecisionRequest,
  requestJevGomokuMove,
} from "../assets/js/gomoku-jev.js";

const KEY = "test-only-key";

function afterOpening() {
  return playGomokuMove(createGomokuState(), "player", 7, 7);
}

test("starts on an empty 15×15 board and alternates immutable moves", () => {
  const start = createGomokuState();
  assert.equal(start.board.length, 15);
  assert.ok(start.board.every((row) => row.length === 15 && row.every((cell) => cell === null)));
  assert.equal(start.turn, "player");
  assert.equal(start.winner, null);
  assert.deepEqual(start.moves, []);
  assert.equal(getLegalGomokuMoves(start).length, 225);

  const first = playGomokuMove(start, "player", 7, 7);
  assert.equal(start.board[7][7], null);
  assert.deepEqual(start.moves, []);
  assert.equal(first.board[7][7], "player");
  assert.equal(first.turn, "jev");
  assert.deepEqual(first.moves, [{ side: "player", x: 7, y: 7 }]);
  const second = playGomokuMove(first, "jev", 0, 0);
  assert.equal(second.turn, "player");
  assert.equal(first.board[0][0], null);
  assert.equal(getLegalGomokuMoves(second).length, 223);
});

test("rejects wrong turns, occupied or out-of-range squares, and tampered state", () => {
  const first = afterOpening();
  assert.throws(() => playGomokuMove(first, "player", 0, 0), /turn/);
  assert.throws(() => playGomokuMove(first, "jev", 7, 7), /occupied/);
  for (const [x, y] of [[-1, 0], [15, 0], [0, 15], [1.5, 0], ["1", 0]]) {
    assert.throws(() => playGomokuMove(first, "jev", x, y), /bounds/);
  }
  const forged = { ...first, board: first.board.map((row) => row.slice()) };
  forged.board[0][0] = "jev";
  assert.throws(() => validateGomokuState(forged), /history/);
  assert.throws(() => getLegalGomokuMoves(forged), /history/);
});

test("five in every direction wins immediately, with no extra move allowed", () => {
  for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
    let state = createGomokuState();
    const originY = dy < 0 ? 8 : 2;
    for (let i = 0; i < 5; i++) {
      state = playGomokuMove(state, "player", 2 + dx * i, originY + dy * i);
      if (i < 4) state = playGomokuMove(state, "jev", 14 - i * 2, 14);
    }
    assert.equal(state.winner, "player");
    assert.equal(state.turn, null);
    assert.deepEqual(getLegalGomokuMoves(state), []);
    assert.throws(() => playGomokuMove(state, "jev", 0, 0), /over/);
  }
});

test("Jev can win and an overline of six counts as a win", () => {
  let white = createGomokuState();
  for (let i = 0; i < 5; i++) {
    white = playGomokuMove(white, "player", i * 2, 14);
    white = playGomokuMove(white, "jev", 4 + i, 4);
  }
  assert.equal(white.winner, "jev");

  let overline = createGomokuState();
  const order = [0, 1, 2, 4, 5, 3];
  for (let i = 0; i < order.length; i++) {
    overline = playGomokuMove(overline, "player", order[i], 5);
    if (i < order.length - 1) overline = playGomokuMove(overline, "jev", i * 2, 14);
  }
  assert.equal(overline.winner, "player");
  assert.equal(overline.board[5].slice(0, 6).filter((cell) => cell === "player").length, 6);
});

test("a full board without a line is a draw", () => {
  // This four-phase pattern has 113 BLACK and 112 WHITE cells and no line of five.
  const cells = { player: [], jev: [] };
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) {
      cells[(x + 2 * y) % 4 < 2 ? "player" : "jev"].push({ x, y });
    }
  }
  assert.equal(cells.player.length, 113);
  assert.equal(cells.jev.length, 112);
  const moves = [];
  for (let i = 0; i < 112; i++) {
    moves.push({ side: "player", ...cells.player[i] }, { side: "jev", ...cells.jev[i] });
  }
  const board = createGomokuState().board;
  for (const { side, x, y } of moves) board[y][x] = side;
  const before = { board, turn: "player", winner: null, moves };
  assert.deepEqual(getLegalGomokuMoves(before), [cells.player[112]]);
  const drawn = playGomokuMove(before, "player", cells.player[112].x, cells.player[112].y);
  assert.equal(drawn.winner, "draw");
  assert.equal(drawn.turn, null);
  assert.deepEqual(getLegalGomokuMoves(drawn), []);
});

test("Jev receives every empty square, same endpoint and model, and an offered choice is returned", async () => {
  const state = afterOpening();
  const offered = getLegalGomokuMoves(state).map(({ x, y }) => `${x},${y}`);
  const decision = createJevGomokuDecisionRequest(state);
  assert.equal(decision.model, "typesafe/jev-1.13");
  assert.deepEqual(Object.keys(decision.questions.move.criteria), offered);
  assert.equal(offered.length, 224);
  assert.equal(Object.hasOwn(decision.questions.move.criteria, "7,7"), false);
  assert.equal(decision.state.board[7][7], "player");
  assert.match(decision.state.rules, /five or more/i);
  assert.match(decision.state.rules, /no Renju forbidden moves/i);

  const signal = new AbortController().signal;
  const result = await requestJevGomokuMove(state, KEY, {
    signal,
    fetch: async (url, options) => {
      assert.equal(url, "https://www.jevai.org/api/v1/decisions");
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, `Bearer ${KEY}`);
      assert.equal(options.signal, signal);
      const body = JSON.parse(options.body);
      assert.deepEqual(Object.keys(body.questions.move.criteria), offered);
      return Response.json({ code: 0, data: { answers: { move: { choice: "14,14" } } } });
    },
  });
  assert.deepEqual(result, { x: 14, y: 14 });
});

test("Jev request fails closed on invalid state, key, API failure, or unoffered answer", async () => {
  let calls = 0;
  const fetch = async () => { calls++; return Response.json({ code: 0, data: { answers: { move: { choice: "7,7" } } } }); };
  await assert.rejects(requestJevGomokuMove(createGomokuState(), KEY, { fetch }), /turn/);
  await assert.rejects(requestJevGomokuMove(afterOpening(), " ", { fetch }), /key/);
  assert.equal(calls, 0);
  await assert.rejects(requestJevGomokuMove(afterOpening(), KEY, { fetch }), /outside/);
  assert.equal(calls, 1);
  await assert.rejects(requestJevGomokuMove(afterOpening(), KEY, {
    fetch: async () => new Response("secret test-only-key", { status: 503 }),
  }), (error) => !error.message.includes(KEY));
  await assert.rejects(requestJevGomokuMove(afterOpening(), KEY, {
    fetch: async () => Response.json({ code: 1, message: `secret ${KEY}` }),
  }), (error) => !error.message.includes(KEY));
  await assert.rejects(requestJevGomokuMove(afterOpening(), KEY, {
    fetch: async () => Response.json({ code: 42901, message: "Today's request limit has been reached" }),
  }), /quota exceeded/);
  await assert.rejects(requestJevGomokuMove(afterOpening(), KEY, {
    fetch: async () => new Response("not JSON"),
  }), /successful decision/);
});
