# Jev move service

This Cloudflare Worker serves both public games. The Xiangqi rules are bundled from this repository; the fixed 4×5 Huarongdao slide rules are checked inside the Worker. Browser requests never receive the Jev credential.

## Deploy

From this directory, create the secret in Cloudflare and then deploy:

```sh
npx wrangler secret put JEV_API_KEY
npx wrangler deploy
```

The secret value is entered into Wrangler's prompt and is **never stored in this repository**. To add a custom site, set `ALLOWED_ORIGINS` in `wrangler.jsonc` to a comma-separated list of exact origins. The two GitHub Pages sites under `hamsterpark.github.io` share the same origin. Local development accepts `http://localhost` and `http://127.0.0.1` with optional ports.

The configured Cloudflare rate limit is 120 requests per minute per connecting IP. Origin checks limit browser access but are not authentication; the rate limit also applies to direct callers.

## Request

`POST /api/move` with `Content-Type: application/json`:

```json
{
  "game": "xiangqi",
  "state": { "board": "9×10 array of null or {type,color}", "currentPlayer": "black" },
  "history": ["0,0-0,1"]
}
```

For Huarongdao, use `game: "huarongdao"` and `state: {positions, legalMoves}`. `positions` maps `C`, `V1`–`V4`, `H`, and `S1`–`S4` to `[x,y]`. `legalMoves` is a subset of actual one-cell slides such as `S1:D`; the page may remove moves that revisit recent states. The Worker recomputes every offered move before forwarding choices to Jev.

The success response is `{ "move": "...", "confidence": 0.67, "probabilities": { "...": 0.67 } }`. If only one move is available, the Worker returns it without an upstream call and sets `confidence` to `null`.

Run `npm test` in this directory to check validation and Jev response handling without a real key.
