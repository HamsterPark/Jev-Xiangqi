import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLACK, PIECE, RED } from '../assets/js/constants.js';
import { createInitialPosition } from '../assets/js/setup.js';
import {
  classicMoveId,
  getClassicLegalMoves,
  getClassicResult,
  isInClassicCheck,
} from '../assets/js/xiangqi-classic.js';

function emptyPosition(pieces) {
  const position = createInitialPosition({ width: 9, height: 10 });
  position.board = Array.from({ length: 10 }, () => Array(9).fill(null));
  for (const [x, y, type, color] of pieces) position.board[y][x] = { type, color };
  return position;
}

test('initial position has legal red moves and no check', () => {
  const position = createInitialPosition({ width: 9, height: 10 });
  const before = JSON.stringify(position.board);
  const moves = getClassicLegalMoves(position, RED);
  assert.ok(moves.length >= 35);
  assert.equal(isInClassicCheck(position, RED), false);
  assert.equal(isInClassicCheck(position, BLACK), false);
  assert.equal(JSON.stringify(position.board), before, 'move generation must not change the board');
});

test('a side in check cannot play an unrelated move', () => {
  const position = emptyPosition([
    [3, 0, PIECE.GENERAL, BLACK],
    [4, 9, PIECE.GENERAL, RED],
    [4, 5, PIECE.ROOK, BLACK],
    [0, 6, PIECE.PAWN, RED],
  ]);
  assert.equal(isInClassicCheck(position, RED), true);
  assert.ok(!getClassicLegalMoves(position, RED).some((move) => move.fromX === 0));
});

test('horse leg and cannon screens are respected in check detection', () => {
  const horse = emptyPosition([
    [3, 0, PIECE.GENERAL, BLACK],
    [4, 9, PIECE.GENERAL, RED],
    [3, 7, PIECE.HORSE, BLACK],
  ]);
  assert.equal(isInClassicCheck(horse, RED), true);
  horse.board[8][3] = { type: PIECE.PAWN, color: BLACK };
  assert.equal(isInClassicCheck(horse, RED), false);

  const cannon = emptyPosition([
    [3, 0, PIECE.GENERAL, BLACK],
    [4, 9, PIECE.GENERAL, RED],
    [4, 0, PIECE.CANNON, BLACK],
    [4, 5, PIECE.PAWN, BLACK],
  ]);
  assert.equal(isInClassicCheck(cannon, RED), true);
  cannon.board[6][4] = { type: PIECE.PAWN, color: BLACK };
  assert.equal(isInClassicCheck(cannon, RED), false);
});

test('exposing facing generals is illegal', () => {
  const position = emptyPosition([
    [4, 0, PIECE.GENERAL, BLACK],
    [4, 9, PIECE.GENERAL, RED],
    [4, 5, PIECE.ROOK, RED],
  ]);
  const ids = getClassicLegalMoves(position, RED).map(classicMoveId);
  assert.ok(!ids.includes('4,5-5,5'));
});

test('checkmate ends the game for the side with no legal escape', () => {
  const position = emptyPosition([
    [3, 0, PIECE.GENERAL, BLACK],
    [4, 9, PIECE.GENERAL, RED],
    [3, 5, PIECE.ROOK, BLACK],
    [4, 5, PIECE.ROOK, BLACK],
    [5, 5, PIECE.ROOK, BLACK],
  ]);
  assert.deepEqual(getClassicResult(position, RED), { winner: BLACK, reason: 'checkmate' });
});
