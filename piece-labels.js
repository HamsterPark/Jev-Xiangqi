import { RED } from './assets/js/constants.js';

const RED_CHARS = { g: '帅', a: '仕', e: '相', h: '马', r: '车', c: '炮', p: '兵' };
const BLACK_CHARS = { g: '将', a: '士', e: '象', h: '马', r: '车', c: '炮', p: '卒' };

export function getPieceChar(piece) {
  if (!piece) return '';
  return (piece.color === RED ? RED_CHARS : BLACK_CHARS)[piece.type] || '';
}
