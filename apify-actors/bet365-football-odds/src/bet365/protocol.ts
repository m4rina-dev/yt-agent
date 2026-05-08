// Bet365 zap-protocol frame parser.
//
// Confirmed from DevTools captures (2026-05-08, ES region, pshudws v1):
//
//   Server → client text frame body:
//     [#]<topic>,<topic>,<topic>,...
//   where the leading `#` (when present) marks a snapshot / initial state
//   and each <topic> is one of the forms:
//     P__time                   server time
//     P-ENDP                    endpoint / lifecycle marker
//     P_<NAME>                  push value      (e.g. P_CONFIG)
//     PV_<NAME>                 push variable   (e.g. PV_CHARTS)
//     PVG_<NAME>                push variable group (e.g. PVG_IPPG)
//     S_<32-hex>                session token
//     A_<base64>                auth blob
//
//   Client → server text frame body (25 bytes seen):
//     <3-digit-code><connection-id>
//   Codes observed: 101 (initial register), 100 (subsequent — likely
//   heartbeat/keepalive). Connection id is opaque (e.g. I3PRW21-EGheZdQi35zO)
//   and reused across heartbeats within the same WS lifetime.
//
// What the captures DON'T yet show:
//   - The exact code Bet365 uses to subscribe to a topic from the client
//   - Field-level update payloads (the captures so far were just the bootstrap
//     handshake). Per-fixture market updates carry a payload after the topic
//     name. We need a few of those frames captured next.

export type TopicKind = 'time' | 'endp' | 'push' | 'pushVar' | 'pushVarGroup' | 'session' | 'auth' | 'unknown';

export interface Frame {
    /** Raw record (one comma-separated chunk). */
    raw: string;
    /** Whether this frame was part of a snapshot (server frame began with `#`). */
    snapshot: boolean;
    /** Topic prefix kind. */
    kind: TopicKind;
    /** Full topic identifier (e.g. `P_CONFIG`, `S_9133...`, `P__time`). */
    topic: string;
    /** Topic name without prefix (e.g. `CONFIG`, `9133...`, `time`). */
    name: string;
    /** Inline payload after the topic, if any (Bet365 sometimes appends
     *  a value with another delimiter — present only in market updates). */
    payload: string;
}

const RECORD_SEPARATOR = ',';

const PREFIX_KINDS: Array<{ prefix: string; kind: TopicKind }> = [
    { prefix: 'P__', kind: 'time' },
    { prefix: 'P-', kind: 'endp' },
    { prefix: 'PVG_', kind: 'pushVarGroup' },
    { prefix: 'PV_', kind: 'pushVar' },
    { prefix: 'P_', kind: 'push' },
    { prefix: 'S_', kind: 'session' },
    { prefix: 'A_', kind: 'auth' },
];

export function decodeFrames(text: string): Frame[] {
    let body = text;
    let snapshot = false;
    if (body.startsWith('#')) {
        snapshot = true;
        body = body.slice(1);
    }
    const records = body.split(RECORD_SEPARATOR).filter((r) => r.length > 0);
    return records.map((record) => parseRecord(record, snapshot));
}

function parseRecord(record: string, snapshot: boolean): Frame {
    for (const { prefix, kind } of PREFIX_KINDS) {
        if (record.startsWith(prefix)) {
            const after = record.slice(prefix.length);
            // Some records carry an inline payload after the topic name.
            // The known separators inside a topic record are `=` and `;`.
            const sepIdx = findFirstOf(after, ['=', ';']);
            const name = sepIdx === -1 ? after : after.slice(0, sepIdx);
            const payload = sepIdx === -1 ? '' : after.slice(sepIdx + 1);
            return {
                raw: record,
                snapshot,
                kind,
                topic: prefix + name,
                name,
                payload,
            };
        }
    }
    return { raw: record, snapshot, kind: 'unknown', topic: record, name: record, payload: '' };
}

function findFirstOf(s: string, chars: string[]): number {
    let min = -1;
    for (const c of chars) {
        const i = s.indexOf(c);
        if (i !== -1 && (min === -1 || i < min)) min = i;
    }
    return min;
}

// Outbound encoding. Codes confirmed from capture: 101 = initial register,
// 100 = heartbeat / keepalive. The connection id is server-assigned — we
// receive it on the first server frame (TODO: extract from S_ topic).

export const OUTBOUND_CODE = {
    initial: '101',
    heartbeat: '100',
} as const;

export function encodeOutbound(code: string, connectionId: string): string {
    return `${code}${connectionId}`;
}
