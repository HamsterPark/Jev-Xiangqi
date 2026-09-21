/**
 * Board geometry helpers: palaces, the river and how the classic 9x10 layout
 * is stretched onto boards of other sizes. Everything here is pure.
 */
import {
  BASE_WIDTH,
  BASE_HEIGHT,
  BASE_PALACE_WIDTH,
  BASE_PALACE_HEIGHT,
  MAX_BOARD_HEIGHT,
  MAX_BOARD_WIDTH,
  MIN_BOARD_HEIGHT,
  MIN_BOARD_WIDTH,
} from './constants.js';

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Keeps a generated board within the supported size range. */
export function clampBoardSize(width, height) {
  return {
    width: clamp(width, MIN_BOARD_WIDTH, MAX_BOARD_WIDTH),
    height: clamp(height, MIN_BOARD_HEIGHT, MAX_BOARD_HEIGHT),
  };
}

export function parseIntOr(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/** Parses a board dimension; anything unparsable falls back, anything below 1 becomes 1. */
export function parseSize(value, fallback) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return typeof fallback === 'number' ? fallback : 1;
  return Math.max(1, parsed);
}

export function createEmptyBoard(width, height) {
  const board = [];
  for (let y = 0; y < height; y++) {
    board.push(new Array(width).fill(null));
  }
  return board;
}

/** Clamps a palace rectangle so that it lies inside a width x height board. */
export function normalizePalace(palace, width, height) {
  const left = clamp(parseIntOr(palace.left, 0), 0, Math.max(0, width - 1));
  const top = clamp(parseIntOr(palace.top, 0), 0, Math.max(0, height - 1));
  const maxWidth = Math.max(1, width - left);
  const maxHeight = Math.max(1, height - top);
  const palaceWidth = clamp(parseIntOr(palace.width, 1), 1, maxWidth);
  const palaceHeight = clamp(parseIntOr(palace.height, 1), 1, maxHeight);
  return {
    left,
    top,
    width: palaceWidth,
    height: palaceHeight,
    right: left + palaceWidth - 1,
    bottom: top + palaceHeight - 1,
  };
}

/**
 * Builds the plain-data description of a board: where the river is and where
 * the two palaces are. `riverRow` is the last row on the black side.
 */
export function buildBoardMeta(width, height, riverRow, blackPalace, redPalace) {
  const safeRiverRow = clamp(
    parseIntOr(riverRow, Math.floor(height / 2) - 1),
    0,
    Math.max(0, height - 2),
  );
  return {
    riverRow: safeRiverRow,
    riverSplit: safeRiverRow + 1,
    palace: {
      black: normalizePalace(blackPalace, width, height),
      red: normalizePalace(redPalace, width, height),
    },
  };
}

export function isInPalace(meta, color, x, y) {
  const palace = color === 'black' ? meta.palace.black : meta.palace.red;
  return x >= palace.left && x <= palace.right && y >= palace.top && y <= palace.bottom;
}

/** Evenly spreads `count` positions over `size` cells (used for pawn and general files). */
export function spreadPositions(count, size) {
  if (size <= 0) return [];
  const safeCount = clamp(count, 1, size);
  if (safeCount === 1) return [Math.floor((size - 1) / 2)];
  const positions = [];
  for (let i = 0; i < safeCount; i++) {
    positions.push(Math.round((i * (size - 1)) / (safeCount - 1)));
  }
  return positions;
}

/** Makes sure every required column is present, replacing the nearest free column. */
export function includeRequiredColumns(columns, requiredColumns) {
  const result = columns.slice();
  const requiredSet = new Set(requiredColumns);
  requiredColumns.forEach((col) => {
    if (result.includes(col)) return;
    let bestIndex = -1;
    let bestDistance = Infinity;
    for (let i = 0; i < result.length; i++) {
      const candidate = result[i];
      if (requiredSet.has(candidate)) continue;
      const distance = Math.abs(candidate - col);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    if (bestIndex >= 0) {
      result[bestIndex] = col;
    } else {
      result.push(col);
    }
  });
  return Array.from(new Set(result)).sort((a, b) => a - b);
}

/** Columns inside a palace on which `count` generals can stand, avoiding the palace edges when possible. */
export function getPalaceColumns(palace, count) {
  let left = palace.left + 1;
  let right = palace.right - 1;
  if (right < left) {
    left = palace.left;
    right = palace.right;
  }
  const width = Math.max(1, right - left + 1);
  const safeCount = Math.min(count, width);
  return spreadPositions(safeCount, width).map((pos) => pos + left);
}

/**
 * Derives river, palaces and coordinate scaling for an arbitrary board size
 * from the classic 9x10 layout.
 */
export function calcGeometry(width, height) {
  const scaleX = (x) => Math.round((x * (width - 1)) / (BASE_WIDTH - 1));
  const scaleY = (y) => Math.round((y * (height - 1)) / (BASE_HEIGHT - 1));
  const riverRow = Math.floor(height / 2) - 1;
  const palaceWidth = clamp(
    Math.ceil((width * BASE_PALACE_WIDTH) / BASE_WIDTH),
    BASE_PALACE_WIDTH,
    width,
  );
  const palaceHeight = clamp(
    Math.ceil((height * BASE_PALACE_HEIGHT) / BASE_HEIGHT),
    BASE_PALACE_HEIGHT,
    Math.floor(height / 2),
  );
  const palaceLeft = Math.floor((width - palaceWidth) / 2);
  const blackPalace = { left: palaceLeft, top: 0, width: palaceWidth, height: palaceHeight };
  const redPalace = {
    left: palaceLeft,
    top: height - palaceHeight,
    width: palaceWidth,
    height: palaceHeight,
  };
  return {
    meta: buildBoardMeta(width, height, riverRow, blackPalace, redPalace),
    scaleX,
    scaleY,
  };
}
