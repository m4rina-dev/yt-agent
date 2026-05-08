import { EventEmitter } from 'node:events';
import { HttpsProxyAgent } from 'https-proxy-agent';
import WebSocket from 'ws';
import { log } from 'crawlee';
import {
    HOSTS,
    TIMING,
    buildOrigin,
    buildWsUrl,
    generateUid,
    type HostProfile,
} from './protocol-constants.js';
import {
    OUTBOUND_CODE,
    decodeFrames,
    encodeOutbound,
    type Frame,
} from './protocol.js';
import type { SessionContext } from './session.js';

export type Bet365Endpoint = keyof typeof HOSTS;

export interface Bet365ClientOptions {
    endpoint?: Bet365Endpoint;
}

export interface Bet365ClientEvents {
    frame: (frame: Frame) => void;
    snapshot: (frames: Frame[]) => void;
    open: () => void;
    registered: (connectionId: string) => void;
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
    private connectionId = '';
    private opened = false;
    private readonly profile: HostProfile;

    constructor(
        private readonly session: SessionContext,
        opts: Bet365ClientOptions = {},
    ) {
        super();
        this.profile = HOSTS[opts.endpoint ?? 'sportDirectory'];
    }

    async connect(): Promise<void> {
        const agent = this.session.proxyUrl
            ? new HttpsProxyAgent(this.session.proxyUrl)
            : undefined;

        const url = buildWsUrl(this.profile, this.session.tld, generateUid());
        const origin = buildOrigin(this.session.tld);
        log.info(`Bet365 WS connect: ${url} (subprotocol=${this.profile.subprotocol})`);

        this.ws = new WebSocket(url, [this.profile.subprotocol], {
            agent,
            origin,
            headers: {
                Cookie: this.session.cookieHeader,
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
                'Accept-Language': 'en',
            },
        });

        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(
                () => reject(new Error('Bet365 WS handshake timeout')),
                TIMING.handshakeTimeoutMs,
            );
            this.ws!.once('open', () => {
                clearTimeout(timeout);
                this.opened = true;
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

        await this.waitForSessionId();
        this.register();
        this.startHeartbeat();
    }

    /** Send an arbitrary outbound code (e.g. for subscription requests once
     *  the format is reverse-engineered). */
    send(payload: string): void {
        if (!this.opened || !this.ws) throw new Error('Bet365Client not connected');
        this.ws.send(payload);
    }

    close(): void {
        this.stopHeartbeat();
        this.ws?.close();
        this.ws = null;
    }

    private async waitForSessionId(): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(
                () => reject(new Error('Bet365 session id not received')),
                TIMING.sessionIdTimeoutMs,
            );
            const onFrame = (frame: Frame) => {
                if (frame.kind === 'session' && frame.name) {
                    this.connectionId = frame.name;
                    clearTimeout(timeout);
                    this.off('frame', onFrame);
                    this.emit('registered', this.connectionId);
                    resolve();
                }
            };
            this.on('frame', onFrame);
        });
    }

    private register(): void {
        this.ws!.send(encodeOutbound(OUTBOUND_CODE.initial, this.connectionId));
        log.debug(`Bet365 register sent: ${OUTBOUND_CODE.initial}${this.connectionId}`);
    }

    private startHeartbeat(): void {
        this.heartbeatTimer = setInterval(() => {
            if (!this.connectionId || !this.ws) return;
            this.ws.send(encodeOutbound(OUTBOUND_CODE.heartbeat, this.connectionId));
        }, TIMING.heartbeatIntervalMs);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    private onMessage(text: string): void {
        const frames = decodeFrames(text);
        if (frames.length === 0) return;
        if (frames[0]?.snapshot) this.emit('snapshot', frames);
        for (const frame of frames) this.emit('frame', frame);
    }
}
