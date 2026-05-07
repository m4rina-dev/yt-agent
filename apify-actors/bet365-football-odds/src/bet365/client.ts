import { EventEmitter } from 'node:events';
import { HttpsProxyAgent } from 'https-proxy-agent';
import WebSocket from 'ws';
import { log } from 'crawlee';
import { PROTOCOL } from './protocol-constants.js';
import {
    decodeFrames,
    encodeHandshake,
    encodeHeartbeat,
    encodeSubscribe,
    encodeUnsubscribe,
    isHeartbeat,
    isUpdate,
    type Frame,
} from './protocol.js';
import type { SessionContext } from './session.js';

export interface Bet365ClientEvents {
    update: (frame: Frame) => void;
    open: () => void;
    close: (code: number, reason: string) => void;
    error: (err: Error) => void;
}

export declare interface Bet365Client {
    on<K extends keyof Bet365ClientEvents>(event: K, listener: Bet365ClientEvents[K]): this;
    emit<K extends keyof Bet365ClientEvents>(event: K, ...args: Parameters<Bet365ClientEvents[K]>): boolean;
}

export class Bet365Client extends EventEmitter {
    private ws: WebSocket | null = null;
    private heartbeatTimer: NodeJS.Timeout | null = null;
    private buffer = '';
    private readonly subscriptions = new Set<string>();
    private opened = false;

    constructor(private readonly session: SessionContext) {
        super();
    }

    async connect(): Promise<void> {
        const agent = this.session.proxyUrl
            ? new HttpsProxyAgent(this.session.proxyUrl)
            : undefined;

        this.ws = new WebSocket(PROTOCOL.wsUrl, {
            agent,
            origin: PROTOCOL.httpOrigin,
            headers: {
                Cookie: this.session.cookieHeader,
            },
        });

        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(
                () => reject(new Error('Bet365 WS handshake timeout')),
                PROTOCOL.handshakeTimeoutMs,
            );

            this.ws!.once('open', () => {
                clearTimeout(timeout);
                this.ws!.send(encodeHandshake(this.session.wsToken));
                this.opened = true;
                this.startHeartbeat();
                this.emit('open');
                resolve();
            });
            this.ws!.once('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });

        this.ws.on('message', (data) => this.onMessage(data.toString('utf8')));
        this.ws.on('close', (code, reason) => {
            this.opened = false;
            this.stopHeartbeat();
            this.emit('close', code, reason.toString('utf8'));
        });
        this.ws.on('error', (err) => this.emit('error', err));
    }

    subscribe(topic: string): void {
        if (!this.opened || !this.ws) throw new Error('Bet365Client not connected');
        if (this.subscriptions.has(topic)) return;
        this.subscriptions.add(topic);
        this.ws.send(encodeSubscribe(topic));
        log.debug(`Bet365 subscribe: ${topic}`);
    }

    unsubscribe(topic: string): void {
        if (!this.opened || !this.ws) return;
        if (!this.subscriptions.delete(topic)) return;
        this.ws.send(encodeUnsubscribe(topic));
    }

    close(): void {
        this.stopHeartbeat();
        this.ws?.close();
        this.ws = null;
    }

    private onMessage(text: string): void {
        this.buffer += text;
        const lastTerminator = this.buffer.lastIndexOf(PROTOCOL.messageTerminator);
        if (lastTerminator < 0) return;
        const complete = this.buffer.slice(0, lastTerminator + 1);
        this.buffer = this.buffer.slice(lastTerminator + 1);
        for (const frame of decodeFrames(complete)) {
            if (isHeartbeat(frame)) continue;
            if (isUpdate(frame)) this.emit('update', frame);
        }
    }

    private startHeartbeat(): void {
        this.heartbeatTimer = setInterval(() => {
            this.ws?.send(encodeHeartbeat());
        }, PROTOCOL.heartbeatIntervalMs);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
}
