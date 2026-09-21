import { getLegalGomokuMoves, validateGomokuState } from "./gomoku-core.js";

export const JEV_GOMOKU_API_URL = "https://www.jevai.org/api/v1/decisions";
export const JEV_GOMOKU_MODEL = "typesafe/jev-1.13";

/** Offer every empty square to Jev, without local ranking or filtering. */
export function createJevGomokuDecisionRequest(state) {
  const valid = validateGomokuState(state);
  if (valid.turn !== "jev" || valid.winner !== null) {
    throw new Error("It is not Jev's Gomoku turn");
  }
  const legalMoves = getLegalGomokuMoves(valid);
  const criteria = Object.fromEntries(legalMoves.map(({ x, y }) =>
    [`${x},${y}`, `Place WHITE at column ${x}, row ${y}`]));
  return {
    model: JEV_GOMOKU_MODEL,
    state: {
      game: "Freestyle Gomoku on a 15 by 15 board",
      rules: "The human plays BLACK (player) and moves first. You play WHITE (jev). Players alternate placing one stone on any empty square. Five or more contiguous stones horizontally, vertically, or diagonally win immediately. There are no Renju forbidden moves. A full board without a five-in-a-row is a draw.",
      coordinates: "Zero-based coordinates: x is the column from left to right (0-14), y is the row from top to bottom (0-14). board[y][x] is null for empty, 'player' for BLACK, and 'jev' for WHITE.",
      your_side: "jev (WHITE)",
      side_to_move: "jev",
      board: valid.board,
      move_history: valid.moves,
      goal: "Choose a strong WHITE placement. Win when possible, block threats, and plan your own lines. Select only one of the offered empty squares.",
    },
    questions: {
      move: {
        type: "choice",
        instructions: "Choose exactly one legal empty square for WHITE from the offered choices. The choice ID is x,y, both zero-based. No move outside the offered choices is allowed.",
        criteria,
      },
    },
  };
}

/** Never invent a fallback move or return an unoffered API choice. */
export async function requestJevGomokuMove(state, key, options = {}) {
  if (typeof key !== "string" || !key.trim() || /[\r\n]/.test(key)) {
    throw new Error("A valid Jev API key is required");
  }
  const body = createJevGomokuDecisionRequest(state);
  const fetcher = options.fetch ?? globalThis.fetch;
  if (typeof fetcher !== "function") throw new Error("Fetch is unavailable");
  const response = await fetcher(JEV_GOMOKU_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: options.signal ?? AbortSignal.timeout(90000),
  });
  if (!response?.ok) throw new Error(`Jev API HTTP ${response?.status ?? "error"}`);
  const result = await response.json().catch(() => null);
  if (result?.code !== 0) {
    const message = typeof result?.message === "string" ? result.message : "";
    if (result?.code === 42901 || /quota|request limit|额度|限额/i.test(message)) {
      throw new Error("Jev quota exceeded");
    }
    if (result?.code === 401 || result?.code === 403 || /invalid.*key|unauthori[sz]ed/i.test(message)) {
      throw new Error("Jev API HTTP 401");
    }
    throw new Error("Jev did not return a successful decision");
  }
  const choice = result.data?.answers?.move?.choice;
  if (typeof choice !== "string" || !Object.hasOwn(body.questions.move.criteria, choice)) {
    throw new Error("Jev returned a move outside the offered legal choices");
  }
  const [x, y] = choice.split(",").map(Number);
  return { x, y };
}
