/**
 * Builds starting positions: either the classic layout stretched to a board
 * size, or a position described by a preset / saved-board config.
 */
import {
  BASE_WIDTH,
  BASE_HEIGHT,
  BASE_PAWN_COUNT,
  BASE_PALACE_WIDTH,
  BASE_PALACE_HEIGHT,
  PIECE,
  RED,
  BLACK,
} from './constants.js';
import {
  buildBoardMeta,
  calcGeometry,
  createEmptyBoard,
  getPalaceColumns,
  includeRequiredColumns,
  parseIntOr,
  parseSize,
  spreadPositions,
} from './geometry.js';

/** Places a piece unless the square is off-board or already taken. */
function placePiece(position, x, y, type, color) {
  const { board, width, height } = position;
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  if (board[y][x]) return;
  board[y][x] = { type, color: color ?? null };
}

/** The classic 9x10 opening minus advisors, generals and pawns, which are placed by size-aware rules. */
const CLASSIC_PLACEMENTS = [
  { x: 0, y: 0, type: PIECE.ROOK, color: BLACK },
  { x: 1, y: 0, type: PIECE.HORSE, color: BLACK },
  { x: 2, y: 0, type: PIECE.ELEPHANT, color: BLACK },
  { x: 6, y: 0, type: PIECE.ELEPHANT, color: BLACK },
  { x: 7, y: 0, type: PIECE.HORSE, color: BLACK },
  { x: 8, y: 0, type: PIECE.ROOK, color: BLACK },
  { x: 1, y: 2, type: PIECE.CANNON, color: BLACK },
  { x: 7, y: 2, type: PIECE.CANNON, color: BLACK },
  { x: 1, y: 7, type: PIECE.CANNON, color: RED },
  { x: 7, y: 7, type: PIECE.CANNON, color: RED },
  { x: 0, y: 9, type: PIECE.ROOK, color: RED },
  { x: 1, y: 9, type: PIECE.HORSE, color: RED },
  { x: 2, y: 9, type: PIECE.ELEPHANT, color: RED },
  { x: 6, y: 9, type: PIECE.ELEPHANT, color: RED },
  { x: 7, y: 9, type: PIECE.HORSE, color: RED },
  { x: 8, y: 9, type: PIECE.ROOK, color: RED },
];

function placeAdvisors(position) {
  const { black, red } = position.meta.palace;
  placePiece(position, black.left, black.top, PIECE.ADVISOR, BLACK);
  placePiece(position, black.right, black.top, PIECE.ADVISOR, BLACK);
  placePiece(position, red.left, red.bottom, PIECE.ADVISOR, RED);
  placePiece(position, red.right, red.bottom, PIECE.ADVISOR, RED);
}

function placeGenerals(position, extraGenerals) {
  const { black, red } = position.meta.palace;
  let count = 1;
  if (extraGenerals) {
    const baseWidth = Math.min(black.width, red.width);
    count = Math.max(1, Math.round(baseWidth / BASE_PALACE_WIDTH));
  }
  const blackColumns = getPalaceColumns(black, count);
  const redColumns = getPalaceColumns(red, count);
  const finalCount = Math.min(blackColumns.length, redColumns.length);
  for (let i = 0; i < finalCount; i++) {
    placePiece(position, blackColumns[i], black.top, PIECE.GENERAL, BLACK);
    placePiece(position, redColumns[i], red.bottom, PIECE.GENERAL, RED);
  }
}

function getGeneralColumns(position) {
  const columns = new Set();
  for (let y = 0; y < position.height; y++) {
    for (let x = 0; x < position.width; x++) {
      const piece = position.board[y][x];
      if (piece && piece.type === PIECE.GENERAL) columns.add(x);
    }
  }
  return Array.from(columns).sort((a, b) => a - b);
}

function placePawns(position, extraPawns, scaleY) {
  const { width } = position;
  const pawnCount = extraPawns
    ? Math.max(BASE_PAWN_COUNT, Math.round((BASE_PAWN_COUNT * width) / BASE_WIDTH))
    : BASE_PAWN_COUNT;
  // Every general gets a pawn in front of it, as in the classic layout.
  const columns = includeRequiredColumns(
    spreadPositions(pawnCount, width),
    getGeneralColumns(position),
  );
  const blackRow = scaleY(3);
  const redRow = scaleY(6);
  columns.forEach((col) => {
    placePiece(position, col, blackRow, PIECE.PAWN, BLACK);
    placePiece(position, col, redRow, PIECE.PAWN, RED);
  });
}

/**
 * Classic layout stretched onto a width x height board.
 * `pieceMode` is one of standard | pawns | generals | both and controls whether
 * extra pawns and generals are added on wide boards.
 */
export function createInitialPosition({ width, height, pieceMode = 'standard' }) {
  const { meta, scaleX, scaleY } = calcGeometry(width, height);
  const position = { board: createEmptyBoard(width, height), width, height, meta };
  CLASSIC_PLACEMENTS.forEach((item) => {
    placePiece(position, scaleX(item.x), scaleY(item.y), item.type, item.color);
  });
  placeAdvisors(position);
  placeGenerals(position, pieceMode === 'generals' || pieceMode === 'both');
  placePawns(position, pieceMode === 'pawns' || pieceMode === 'both', scaleY);
  return position;
}

/** Position from a preset or a saved custom board. Invalid pieces are skipped. */
export function createPositionFromConfig(config) {
  const width = parseSize(config.width, BASE_WIDTH);
  const height = parseSize(config.height, BASE_HEIGHT);
  const fallbackLeft = Math.floor((width - BASE_PALACE_WIDTH) / 2);
  const riverRow = parseIntOr(config.riverRow, Math.floor(height / 2) - 1);
  const blackPalace = (config.palace && config.palace.black) || {
    left: fallbackLeft,
    top: 0,
    width: BASE_PALACE_WIDTH,
    height: BASE_PALACE_HEIGHT,
  };
  const redPalace = (config.palace && config.palace.red) || {
    left: fallbackLeft,
    top: height - BASE_PALACE_HEIGHT,
    width: BASE_PALACE_WIDTH,
    height: BASE_PALACE_HEIGHT,
  };
  const position = {
    board: createEmptyBoard(width, height),
    width,
    height,
    meta: buildBoardMeta(width, height, riverRow, blackPalace, redPalace),
  };
  if (Array.isArray(config.pieces)) {
    config.pieces.forEach((piece) => {
      if (!piece || typeof piece.x !== 'number' || typeof piece.y !== 'number' || !piece.type) {
        return;
      }
      placePiece(position, piece.x, piece.y, piece.type, piece.color ?? null);
    });
  }
  return position;
}
