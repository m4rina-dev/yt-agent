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

Bet365 doesn't publish their feed protocol. The transport layer (URL pattern,
hosts, subprotocols, origin) was confirmed from a real DevTools capture on
2026-05-08 in the ES region:

| What                  | Value                                              |
| --------------------- | -------------------------------------------------- |
| Sport directory host  | `wss://premws-pt{N}.bet365.<tld>/zap/?uid=<rand>`  |
| Main hub / per-match  | `wss://pshudws.bet365.<tld>/zap/?uid=<rand>`       |
| Subprotocol (dir)     | `zap-protocol-v2`                                  |
| Subprotocol (hub)     | `zap-protocol-v1`                                  |
| Origin                | `https://www.bet365.<tld>` (must match)            |
| Compression           | permessage-deflate (handled by `ws` automatically) |

The **frame-level format** was confirmed on 2026-05-08 from a `pshudws` v1
match-page capture:

- Server frames are plain text, comma-separated topic records.
- A leading `#` on a frame marks it as a snapshot (initial state); deltas
  drop the `#`.
- Topic prefixes seen: `P_`, `P__`, `P-`, `PV_`, `PVG_`, `S_<connId>`,
  `A_<authBlob>`.
- Outbound: 25-byte `<3-digit-code><connId>` text. `101` = register,
  `100` = heartbeat.

What's still **best-effort and needs another capture** — specifically from
the `premws-pt{N}` v2 directory feed with a fixture clicked through to its
1X2 market:

1. The exact subscription request format (how the client requests a topic).
2. Per-fixture market field names — currently the code looks for
   `NA`/`OD`/`FI`/`BC` etc. inside a `;`-separated payload. That field set
   is a placeholder.

To capture:

1. Chrome DevTools → Network → WS filter, BEFORE loading bet365.es.
2. Click Football → a pre-match league → click into one fixture.
3. On the `premws-pt{N}` connection (subprotocol `zap-protocol-v2`), open
   the "Messages" tab.
4. Copy ~20 frames in each direction into
   `captures/session-2.txt` (gitignored).

After that capture, the only files that need updating are
`src/bet365/protocol-constants.ts` (`TOPIC_PATTERNS`, possibly subscription
opcodes) and `src/scrapers/football-prematch.ts` (field-name mapping in
`parseDirectoryFrame` and `parseMarketFrame`).

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
