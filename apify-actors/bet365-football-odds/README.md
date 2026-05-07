# Bet365 Football Pre-Match 1X2 Odds — Apify Actor

Vertical-slice actor that scrapes Bet365 pre-match Full Time Result (1X2) odds
for football fixtures via Bet365's live data WebSocket. Decimal, fractional,
and American formats supported.

This is **v0.1** — a working scaffold. The protocol layer ships with defaults
derived from public reverse-engineering writeups; the first live test will
either confirm them or reveal which constants need adjustment (see
[Calibrating the protocol](#calibrating-the-protocol) below).

## Layout

```
.actor/
  actor.json          # Apify actor manifest
  input_schema.json   # User-facing input form
  Dockerfile          # Build for Apify platform
src/
  main.ts                       # Entrypoint
  types.ts                      # Input + output types
  odds.ts                       # decimal / fractional / American conversion
  bet365/
    protocol-constants.ts       # *** Edit this after first capture ***
    protocol.ts                 # Frame encode/decode
    session.ts                  # HTTP cookie + token bootstrap
    client.ts                   # WebSocket client w/ heartbeat + subs
  scrapers/
    football-prematch.ts        # 1X2 directory + per-fixture market scraper
```

## Local development

```bash
npm install
npm run build
APIFY_LOCAL_STORAGE_DIR=./storage npm start
```

Or hot-reload: `npm run start:dev`.

## Deploying to Apify

```bash
npm install -g apify-cli
apify login
apify push
```

## Input

| Field          | Type              | Default         | Notes                                    |
| -------------- | ----------------- | --------------- | ---------------------------------------- |
| `competitions` | `string[]`        | `[]` (all)      | Competition IDs / names to filter on     |
| `oddsFormat`   | enum              | `decimal`       | `decimal`, `fractional`, `american`      |
| `maxFixtures`  | int               | `0` (no cap)    | Stop after N records                     |
| `proxy`        | proxy config      | Apify residential | Residential strongly recommended       |
| `geoCountry`   | ISO-3166 alpha-2  | `GB`            | Controls regional Bet365 markets         |
| `debug`        | boolean           | `false`         | Log raw frames                           |

## Output

One row per fixture per emit. Subsequent updates re-push (downstream is
expected to dedupe by `fixtureId` + `scrapedAt`).

```json
{
  "fixtureId": "150123456",
  "competition": "English Premier League",
  "competitionId": "1",
  "kickoffAt": "20260510120000",
  "home": "Arsenal",
  "away": "Manchester United",
  "homeWin": "1.85",
  "draw": "3.60",
  "awayWin": "4.20",
  "format": "decimal",
  "scrapedAt": "2026-05-07T14:00:00.000Z"
}
```

## Calibrating the protocol

Bet365 doesn't publish their feed protocol; values in
`src/bet365/protocol-constants.ts` are best-effort defaults. If the first run
connects but receives no frames, capture a real session:

1. Chrome DevTools → Network → WS filter → load `bet365.com` → click into
   football → pre-match.
2. Copy the WSS URL, request headers, and the first ~20 frames in each
   direction from the WebSocket "Messages" tab.
3. Drop the capture into `captures/session-1.txt` (gitignored).
4. Update `protocol-constants.ts` (`wsUrl`, `markers`, `topics`, delimiter
   bytes) and field names in `scrapers/football-prematch.ts` (`NA`, `OD`, `FI`,
   `BC`, etc.) to match what's in the real frames.

Everything bytes-level lives in **one file** (`protocol-constants.ts`) and
field-name mappings live in **one file** (`scrapers/football-prematch.ts`).
That's the deliberate v0.1 design: the discovery loop is short.

## Roadmap

- v0.2: live odds + Standby mode (persistent subscriptions, push-mode actor)
- v0.3: more markets (Asian Handicap, Over/Under, Player Props, Outrights)
- v0.4: more sports (basketball, tennis, hockey)
- v1.0: feature parity with competing actors (lineups, transfers, player profiles)

## Legal / ToS

Scraping Bet365 violates their Terms of Service. This actor is published for
the same use cases as existing competing actors on the Apify store (odds
aggregation, model training, market research). Operators are responsible for
compliance with local law and Bet365's ToS. Use residential proxies and
respect rate limits.
