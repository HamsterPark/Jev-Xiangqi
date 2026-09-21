export const GOMOKU_SIZE = 15;

const SIDES = new Set(["player", "jev"]);
const DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]];

/** Coordinates are zero-based: board[y][x], with (0, 0) at the top left. */
export function createGomokuState() {
  return {
    board: Array.from({ length: GOMOKU_SIZE }, () => Array(GOMOKU_SIZE).fill(null)),
    turn: "player",
    winner: null,
    moves: [],
  };
}

function inBounds(x, y) {
  return Number.isInteger(x) && Number.isInteger(y) &&
    x >= 0 && x < GOMOKU_SIZE && y >= 0 && y < GOMOKU_SIZE;
}

function countDirection(board, side, x, y, dx, dy) {
  let count = 0;
  for (let nx = x + dx, ny = y + dy;
    inBounds(nx, ny) && board[ny][nx] === side;
    nx += dx, ny += dy) count++;
  return count;
}

function advance(state, side, x, y) {
  if (state.winner !== null || state.turn === null) throw new Error("Gomoku game is over");
  if (!SIDES.has(side) || side !== state.turn) throw new Error("Not this side's turn");
  if (!inBounds(x, y)) throw new Error("Gomoku coordinates are out of bounds");
  if (state.board[y][x] !== null) throw new Error("Gomoku square is occupied");

  const board = state.board.map((row) => row.slice());
  board[y][x] = side;
  const moves = [...state.moves, { side, x, y }];
  const won = DIRECTIONS.some(([dx, dy]) =>
    1 + countDirection(board, side, x, y, dx, dy) +
    countDirection(board, side, x, y, -dx, -dy) >= 5);
  const winner = won ? side : moves.length === GOMOKU_SIZE ** 2 ? "draw" : null;
  return {
    board,
    turn: winner === null ? (side === "player" ? "jev" : "player") : null,
    winner,
    moves,
  };
}

/** Reject tampered or internally inconsistent state by replaying the history. */
export function validateGomokuState(state) {
  if (!state || !Array.isArray(state.board) || state.board.length !== GOMOKU_SIZE ||
    !Array.isArray(state.moves) || state.moves.length > GOMOKU_SIZE ** 2) {
    throw new Error("Invalid Gomoku state");
  }
  for (const row of state.board) {
    if (!Array.isArray(row) || row.length !== GOMOKU_SIZE ||
      row.some((cell) => cell !== null && !SIDES.has(cell))) {
      throw new Error("Invalid Gomoku board");
    }
  }
  let replayed = createGomokuState();
  for (const move of state.moves) {
    if (!move || typeof move !== "object") throw new Error("Invalid Gomoku move history");
    replayed = advance(replayed, move.side, move.x, move.y);
  }
  if (state.turn !== replayed.turn || state.winner !== replayed.winner ||
    state.board.some((row, y) => row.some((cell, x) => cell !== replayed.board[y][x]))) {
    throw new Error("Gomoku state does not match move history");
  }
  return replayed;
}

/** Immutable transition; five or more in any direction wins immediately. */
export function playGomokuMove(state, side, x, y) {
  return advance(validateGomokuState(state), side, x, y);
}

/** Every empty square is legal until the game ends (no Renju restrictions). */
export function getLegalGomokuMoves(state) {
  const valid = validateGomokuState(state);
  if (valid.winner !== null) return [];
  const moves = [];
  for (let y = 0; y < GOMOKU_SIZE; y++) {
    for (let x = 0; x < GOMOKU_SIZE; x++) {
      if (valid.board[y][x] === null) moves.push({ x, y });
    }
  }
  return moves;
}
