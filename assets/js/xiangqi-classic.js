/** Standard 9×10 Xiangqi checks on top of the shared movement rules. */
import { BLACK, PIECE, RED } from './constants.js';
import { isInPalace } from './geometry.js';
import { getAllMovesForColor, getGenerals, makeMove, unmakeMove } from './rules.js';

function clearBetween(board, x1, y1, x2, y2) {
  if (x1 !== x2 && y1 !== y2) return -1;
  const dx = Math.sign(x2 - x1);
  const dy = Math.sign(y2 - y1);
  let occupied = 0;
  for (let x = x1 + dx, y = y1 + dy; x !== x2 || y !== y2; x += dx, y += dy) {
    if (board[y][x]) occupied++;
  }
  return occupied;
}

function attacks(position, piece, x, y, tx, ty) {
  const { board, meta } = position;
  const dx = tx - x;
  const dy = ty - y;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  switch (piece.type) {
    case PIECE.ROOK:
      return clearBetween(board, x, y, tx, ty) === 0;
    case PIECE.CANNON:
      return clearBetween(board, x, y, tx, ty) === 1;
    case PIECE.HORSE:
      if (ax === 2 && ay === 1) return !board[y][x + Math.sign(dx)];
      if (ax === 1 && ay === 2) return !board[y + Math.sign(dy)][x];
      return false;
    case PIECE.ELEPHANT:
      return (
        ax === 2 &&
        ay === 2 &&
        !board[y + Math.sign(dy)][x + Math.sign(dx)] &&
        (piece.color === RED ? ty >= meta.riverSplit : ty <= meta.riverRow)
      );
    case PIECE.ADVISOR:
      return ax === 1 && ay === 1 && isInPalace(meta, piece.color, tx, ty);
    case PIECE.GENERAL:
      return (
        (ax + ay === 1 && isInPalace(meta, piece.color, tx, ty)) ||
        (dx === 0 && clearBetween(board, x, y, tx, ty) === 0)
      );
    case PIECE.PAWN:
      return (
        (dx === 0 && dy === (piece.color === RED ? -1 : 1)) ||
        (ay === 0 && ax === 1 &&
          (piece.color === RED ? y <= meta.riverRow : y >= meta.riverSplit))
      );
    default:
      return false;
  }
}

/** Whether the named side's general is attacked in this position. */
export function isInClassicCheck(position, color) {
  const generals = getGenerals(position)[color];
  if (generals.length !== 1) return true;
  const { x: tx, y: ty } = generals[0];
  for (let y = 0; y < position.height; y++) {
    for (let x = 0; x < position.width; x++) {
      const piece = position.board[y][x];
      if (piece && piece.color !== color && attacks(position, piece, x, y, tx, ty)) return true;
    }
  }
  return false;
}

/** Legal moves under check, checkmate and the facing-generals rule. */
export function getClassicLegalMoves(position, color) {
  if (color !== RED && color !== BLACK) return [];
  return getAllMovesForColor(position, color).filter((move) => {
    const captured = makeMove(position.board, move);
    const safe = !isInClassicCheck(position, color);
    unmakeMove(position.board, move, captured);
    return safe;
  });
}

export function classicMoveId(move) {
  return `${move.fromX},${move.fromY}-${move.toX},${move.toY}`;
}

export function getClassicResult(position, nextColor) {
  if (getGenerals(position)[nextColor].length !== 1) {
    return { winner: nextColor === RED ? BLACK : RED, reason: 'capture' };
  }
  if (getClassicLegalMoves(position, nextColor).length) return null;
  return {
    winner: nextColor === RED ? BLACK : RED,
    reason: isInClassicCheck(position, nextColor) ? 'checkmate' : 'stalemate',
  };
}
