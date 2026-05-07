// Defaults derived from public reverse-engineering of Bet365's data feed.
// These are the FIRST values to verify with a live DevTools capture if the
// actor stops receiving frames — Bet365 rotates host names and occasionally
// adjusts protocol bytes. Override via env vars in `.actor/actor.json` or
// via `process.env.BET365_*` at runtime.

export const PROTOCOL = {
    // Origin must match the page that bootstrapped the cookie session.
    httpOrigin: process.env.BET365_HTTP_ORIGIN ?? 'https://www.bet365.com',

    // Live data WebSocket. Bet365 routes to several data POPs; the EMEA host
    // is the most commonly observed for European traffic.
    wsUrl: process.env.BET365_WS_URL ?? 'wss://premium-emea.bet365.com/Updates',

    // Frame delimiters (ASCII control codes).
    messageTerminator: '\x01', // end of one logical message
    recordSeparator: '\x02', // separator between records in a message
    fieldSeparator: ';', // separator between key=value fields in a record

    // Handshake / lifecycle markers.
    markers: {
        handshake: 'P',
        subscribe: 'S',
        unsubscribe: 'U',
        message: 'I', // inbound update
        heartbeat: 'H',
        ack: 'A',
        error: 'E',
    },

    // Topic prefixes observed for football pre-match.
    // OV = OddsViewer, M = Markets, FI = FixtureItem, etc.
    topics: {
        footballPrematchDirectory: 'OVM_PRE_1', // sport id 1 = football
        footballFixturePrefix: 'OVM_FI_',
        footballMarket1X2: '_FTRES', // appended to fixture topic
    },

    heartbeatIntervalMs: 25_000,
    handshakeTimeoutMs: 15_000,
} as const;

export type ProtocolConfig = typeof PROTOCOL;
