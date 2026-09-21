/**
 * The rules engine. A "position" is a plain object
 * `{ board, width, height, meta }` where `board[y][x]` is either `null` or
 * `{ type, color }`. All functions are pure except the make/unmake pair that
 * the search uses to avoid copying boards.
 */
import { PIECE, RED, BLACK } from './constants.js';
import { isInPalace } from './geometry.js';

const ORTHOGONAL = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
];
const DIAGONAL = [
  { dx: 1, dy: 1 },
  { dx: 1, dy: -1 },
  { dx: -1, dy: 1 },
  { dx: -1, dy: -1 },
];
const ALL_DIRECTIONS = ORTHOGONAL.concat(DIAGONAL);
const HORSE_STEPS = [
  { dx: 2, dy: 1, legX: 1, legY: 0 },
  { dx: 2, dy: -1, legX: 1, legY: 0 },
  { dx: -2, dy: 1, legX: -1, legY: 0 },
  { dx: -2, dy: -1, legX: -1, legY: 0 },
  { dx: 1, dy: 2, legX: 0, legY: 1 },
  { dx: -1, dy: 2, legX: 0, legY: 1 },
  { dx: 1, dy: -2, legX: 0, legY: -1 },
  { dx: -1, dy: -2, legX: 0, legY: -1 },
];

export function opponent(color) {
  return color === RED ? BLACK : RED;
}

/** Positions of every general on the board, grouped by colour. */
export function getGenerals(position) {
  const { board, width, height } = position;
  const generals = { red: [], black: [] };
  for (let y = 0; y < height; y++) {
    const row = board[y];
    for (let x = 0; x < width; x++) {
      const piece = row[x];
      if (piece && piece.type === PIECE.GENERAL) {
        generals[piece.color === RED ? 'red' : 'black'].push({ x, y });
      }
    }
  }
  return generals;
}

/**
 * The "flying general" rule: after the move the two sides' generals may not
 * face each other on an open file. Checked against the board with the move
 * applied virtually, so no copy of the board is needed.
 */
function violatesFlyingGeneral(board, generals, fromX, fromY, toX, toY, piece) {
  const movesGeneral = piece.type === PIECE.GENERAL;
  for (const red of generals.red) {
    let rx = red.x;
    let ry = red.y;
    if (rx === toX && ry === toY) continue; // captured by this move
    if (movesGeneral && piece.color === RED && rx === fromX && ry === fromY) {
      rx = toX;
      ry = toY;
    }
    for (const black of generals.black) {
      let bx = black.x;
      let by = black.y;
      if (bx === toX && by === toY) continue; // captured by this move
      if (movesGeneral && piece.color === BLACK && bx === fromX && by === fromY) {
        bx = toX;
        by = toY;
      }
      if (rx !== bx) continue;
      const x = rx;
      const start = Math.min(ry, by) + 1;
      const end = Math.max(ry, by);
      let blocked = false;
      for (let cy = start; cy < end; cy++) {
        let occupied;
        if (x === toX && cy === toY) occupied = true;
        else if (x === fromX && cy === fromY) occupied = false;
        else occupied = board[cy][x] !== null;
        if (occupied) {
          blocked = true;
          break;
        }
      }
      if (!blocked) return true;
    }
  }
  return false;
}

/**
 * Legal destinations for the piece standing on (x, y).
 * `generals` may be passed in when generating moves for many pieces of the
 * same position so the board is only scanned once.
 */
export function calcMoves(position, x, y, piece, generals = getGenerals(position)) {
  const { board, width, height, meta } = position;
  const { riverRow, riverSplit } = meta;
  const color = piece.color;
  const moves = [];

  const inBounds = (tx, ty) => tx >= 0 && tx < width && ty >= 0 && ty < height;
  const push = (tx, ty) => {
    if (!violatesFlyingGeneral(board, generals, x, y, tx, ty, piece)) moves.push({ x: tx, y: ty });
  };
  const canMoveTo = (tx, ty) => {
    if (!inBounds(tx, ty)) return false;
    const target = board[ty][tx];
    if (!target) return true;
    if (target.type === PIECE.BLOCK) return false;
    return target.color !== color;
  };
  const slide = (directions) => {
    for (const dir of directions) {
      let tx = x + dir.dx;
      let ty = y + dir.dy;
      while (inBounds(tx, ty)) {
        const target = board[ty][tx];
        if (!target) {
          push(tx, ty);
        } else {
          if (target.type !== PIECE.BLOCK && target.color !== color) push(tx, ty);
          break;
        }
        tx += dir.dx;
        ty += dir.dy;
      }
    }
  };

  switch (piece.type) {
    case PIECE.ROOK:
      slide(ORTHOGONAL);
      break;
    case PIECE.QUEEN:
      slide(ALL_DIRECTIONS);
      break;
    case PIECE.HORSE:
      for (const step of HORSE_STEPS) {
        const legX = x + step.legX;
        const legY = y + step.legY;
        if (!inBounds(legX, legY) || board[legY][legX]) continue; // hobbled horse
        const tx = x + step.dx;
        const ty = y + step.dy;
        if (canMoveTo(tx, ty)) push(tx, ty);
      }
      break;
    case PIECE.ELEPHANT:
      for (const dir of DIAGONAL) {
        const tx = x + dir.dx * 2;
        const ty = y + dir.dy * 2;
        if (!inBounds(tx, ty)) continue;
        if (board[y + dir.dy][x + dir.dx]) continue; // blocked elephant eye
        if (color === BLACK && ty > riverRow) continue; // may not cross the river
        if (color === RED && ty < riverSplit) continue;
        if (canMoveTo(tx, ty)) push(tx, ty);
      }
      break;
    case PIECE.ADVISOR:
      for (const dir of DIAGONAL) {
        const tx = x + dir.dx;
        const ty = y + dir.dy;
        if (isInPalace(meta, color, tx, ty) && canMoveTo(tx, ty)) push(tx, ty);
      }
      break;
    case PIECE.GENERAL:
      for (const dir of ORTHOGONAL) {
        const tx = x + dir.dx;
        const ty = y + dir.dy;
        if (isInPalace(meta, color, tx, ty) && canMoveTo(tx, ty)) push(tx, ty);
      }
      break;
    case PIECE.CANNON:
      for (const dir of ORTHOGONAL) {
        let tx = x + dir.dx;
        let ty = y + dir.dy;
        let jumped = false;
        while (inBounds(tx, ty)) {
          const target = board[ty][tx];
          if (!jumped) {
            if (!target) push(tx, ty);
            else jumped = true; // anything, even a block, can serve as the screen
          } else if (target) {
            if (target.type !== PIECE.BLOCK && target.color !== color) push(tx, ty);
            break;
          }
          tx += dir.dx;
          ty += dir.dy;
        }
      }
      break;
    case PIECE.PAWN: {
      const forwardY = y + (color === RED ? -1 : 1);
      if (canMoveTo(x, forwardY)) push(x, forwardY);
      const crossedRiver = color === RED ? y <= riverRow : y >= riverSplit;
      if (crossedRiver) {
        if (canMoveTo(x - 1, y)) push(x - 1, y);
        if (canMoveTo(x + 1, y)) push(x + 1, y);
      }
      break;
    }
    default:
      break; // blocks never move
  }

  return moves;
}

/** Every legal move for one side as `{ fromX, fromY, toX, toY }`. */
export function getAllMovesForColor(position, color) {
  const { board, width, height } = position;
  const generals = getGenerals(position);
  const moves = [];
  for (let y = 0; y < height; y++) {
    const row = board[y];
    for (let x = 0; x < width; x++) {
      const piece = row[x];
      if (!piece || piece.type === PIECE.BLOCK || piece.color !== color) continue;
      const targets = calcMoves(position, x, y, piece, generals);
      for (const target of targets) {
        moves.push({ fromX: x, fromY: y, toX: target.x, toY: target.y });
      }
    }
  }
  return moves;
}

export function hasAnyLegalMove(position, color) {
  const { board, width, height } = position;
  const generals = getGenerals(position);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const piece = board[y][x];
      if (!piece || piece.type === PIECE.BLOCK || piece.color !== color) continue;
      if (calcMoves(position, x, y, piece, generals).length) return true;
    }
  }
  return false;
}

export function isLegalMove(position, move) {
  const row = position.board[move.fromY];
  const piece = row ? row[move.fromX] : null;
  if (!piece || piece.type === PIECE.BLOCK) return false;
  return calcMoves(position, move.fromX, move.fromY, piece).some(
    (target) => target.x === move.toX && target.y === move.toY,
  );
}

export function countGenerals(position, color) {
  const { board, width, height } = position;
  let count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const piece = board[y][x];
      if (piece && piece.type === PIECE.GENERAL && piece.color === color) count++;
    }
  }
  return count;
}

/** A side loses as soon as it has no general left. Red is checked first. */
export function winnerFromGeneralCounts(redCount, blackCount) {
  if (redCount === 0) return BLACK;
  if (blackCount === 0) return RED;
  return null;
}

export function checkWinner(position) {
  return winnerFromGeneralCounts(countGenerals(position, RED), countGenerals(position, BLACK));
}

/** Applies a move in place and returns the captured piece (or null) for `unmakeMove`. */
export function makeMove(board, move) {
  const captured = board[move.toY][move.toX];
  board[move.toY][move.toX] = board[move.fromY][move.fromX];
  board[move.fromY][move.fromX] = null;
  return captured;
}

export function unmakeMove(board, move, captured) {
  board[move.fromY][move.fromX] = board[move.toY][move.toX];
  board[move.toY][move.toX] = captured;
}
