import { PROTOCOL } from './protocol-constants.js';

export interface Frame {
    marker: string;
    topic?: string;
    fields: Record<string, string>;
    raw: string;
}

export function encodeSubscribe(topic: string): string {
    return `${PROTOCOL.markers.subscribe}_${topic}${PROTOCOL.messageTerminator}`;
}

export function encodeUnsubscribe(topic: string): string {
    return `${PROTOCOL.markers.unsubscribe}_${topic}${PROTOCOL.messageTerminator}`;
}

export function encodeHandshake(token: string): string {
    return [
        PROTOCOL.markers.handshake,
        `version=${1}`,
        `token=${token}`,
    ].join(PROTOCOL.fieldSeparator) + PROTOCOL.messageTerminator;
}

export function encodeHeartbeat(): string {
    return PROTOCOL.markers.heartbeat + PROTOCOL.messageTerminator;
}

export function* decodeFrames(buffer: string): Generator<Frame> {
    const messages = buffer.split(PROTOCOL.messageTerminator).filter(Boolean);
    for (const message of messages) {
        const [head, ...recordParts] = message.split(PROTOCOL.recordSeparator);
        if (!head) continue;
        const marker = head[0]!;
        const topic = head.slice(1).split(PROTOCOL.fieldSeparator)[0] || undefined;
        const fields: Record<string, string> = {};
        for (const record of recordParts) {
            for (const pair of record.split(PROTOCOL.fieldSeparator)) {
                const eq = pair.indexOf('=');
                if (eq <= 0) continue;
                fields[pair.slice(0, eq)] = pair.slice(eq + 1);
            }
        }
        yield { marker, topic, fields, raw: message };
    }
}

export function isHeartbeat(frame: Frame): boolean {
    return frame.marker === PROTOCOL.markers.heartbeat;
}

export function isUpdate(frame: Frame): boolean {
    return frame.marker === PROTOCOL.markers.message;
}
