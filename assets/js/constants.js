/**
 * Game-wide constants shared by every module (main thread, worker and tests).
 */

export const BASE_WIDTH = 9;
export const BASE_HEIGHT = 10;
export const CELL_SIZE = 60;
export const BASE_PAWN_COUNT = 5;
export const BASE_PALACE_WIDTH = 3;
export const BASE_PALACE_HEIGHT = 3;

/**
 * Limits for generated boards. Below 5x6 the stretched classic layout has no
 * room for a general on every side; above 30x30 the board no longer fits a
 * screen and the AI cannot search anything meaningful.
 */
export const MIN_BOARD_WIDTH = 5;
export const MIN_BOARD_HEIGHT = 6;
export const MAX_BOARD_WIDTH = 30;
export const MAX_BOARD_HEIGHT = 30;

export const RED = 'red';
export const BLACK = 'black';

/** Single-letter piece codes used on the board, in presets and in saved boards. */
export const PIECE = Object.freeze({
  GENERAL: 'g',
  ADVISOR: 'a',
  ELEPHANT: 'e',
  HORSE: 'h',
  ROOK: 'r',
  CANNON: 'c',
  PAWN: 'p',
  QUEEN: 'q',
  /** Immovable, uncapturable obstacle; has no colour. */
  BLOCK: 'b',
});

export const PIECE_MODES = Object.freeze(['standard', 'pawns', 'generals', 'both']);

export const STORAGE_KEY = 'betterXiangqiBoards';
