// Bet365 live-feed connection configuration.
//
// VERIFIED (DevTools captures 2026-05-08, region ES):
//   - URL pattern: `wss://<host>/zap/?uid=<random>` on a regional bet365 host
//   - Two distinct hosts:
//       pshudws.bet365.<tld>     → zap-protocol-v1 (main hub, per-match)
//       premws-pt{N}.bet365.<tld>→ zap-protocol-v2 (sport directories /
//                                                   pre-match listings)
//   - Origin must be `https://www.bet365.<tld>` matching the regional site
//   - Cloudflare-fronted, permessage-deflate negotiated automatically
//   - Frame format is text: comma-separated topic records, optional `#`
//     prefix on snapshot frames. See protocol.ts for the parser.
//   - Outbound codes: 101 = initial register, 100 = heartbeat/keepalive.
//
// STILL TO VERIFY (need a fresh capture of premws-pt{N} v2 with a fixture
// clicked through to a pre-match 1X2 market):
//   - The exact subscription request format (how the client tells the server
//     "send me topic X"). Bootstrap frames don't reveal this.
//   - Field structure inside per-market update frames (where the actual odds
//     numbers live: 1X2 prices, fixture names, kickoff times).

export type ZapProtocolVersion = 'zap-protocol-v1' | 'zap-protocol-v2';

export interface HostProfile {
    /** WSS host pattern. `{tld}` is replaced with the regional TLD. */
    host: string;
    subprotocol: ZapProtocolVersion;
}

export const HOSTS = {
    /** Sport directories / pre-match listings (used for football pre-match 1X2). */
    sportDirectory: {
        host: process.env.BET365_PREMWS_HOST ?? 'premws-pt3.bet365.{tld}',
        subprotocol: 'zap-protocol-v2',
    } satisfies HostProfile,
    /** Main hub + per-match push streams. */
    mainHub: {
        host: process.env.BET365_PSHUDWS_HOST ?? 'pshudws.bet365.{tld}',
        subprotocol: 'zap-protocol-v1',
    } satisfies HostProfile,
} as const;

export function buildWsUrl(profile: HostProfile, tld: string, uid: string): string {
    const host = profile.host.replace('{tld}', tld);
    return `wss://${host}/zap/?uid=${uid}`;
}

export function buildOrigin(tld: string): string {
    return process.env.BET365_HTTP_ORIGIN ?? `https://www.bet365.${tld}`;
}

/** Maps an ISO-3166 alpha-2 country code to the Bet365 regional TLD. */
export function geoToTld(geo: string): string {
    const g = geo.toUpperCase();
    if (g === 'ES') return 'es';
    if (g === 'DE' || g === 'AT') return 'de';
    if (g === 'IT') return 'it';
    if (g === 'DK') return 'dk';
    if (g === 'AU') return 'com.au';
    return 'com';
}

/** Generate the random uid the browser sends in the WS query string. */
export function generateUid(): string {
    let s = '';
    for (let i = 0; i < 16; i++) s += Math.floor(Math.random() * 10);
    return s;
}

export const TIMING = {
    heartbeatIntervalMs: 25_000,
    handshakeTimeoutMs: 15_000,
    /** Max time to wait for the first server frame carrying the session id. */
    sessionIdTimeoutMs: 10_000,
} as const;

/** Topic name patterns for football pre-match 1X2.
 *  These are guesses; will be refined after the next capture. */
export const TOPIC_PATTERNS = {
    /** Marker the football pre-match directory snapshot announces itself with. */
    footballPrematchDirectory: process.env.BET365_TOPIC_DIR ?? 'OVM_PRE_1',
    footballFixturePrefix: process.env.BET365_TOPIC_FIXTURE_PREFIX ?? 'OVM_FI_',
    footballMarket1X2Suffix: process.env.BET365_TOPIC_1X2_SUFFIX ?? '_FTRES',
} as const;
