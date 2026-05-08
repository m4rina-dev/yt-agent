import { gotScraping, type OptionsInit } from 'got-scraping';
import { CookieJar } from 'tough-cookie';
import { buildOrigin, geoToTld } from './protocol-constants.js';

export interface SessionContext {
    cookieJar: CookieJar;
    cookieHeader: string;
    wsToken: string;
    proxyUrl?: string;
    geoCountry: string;
    tld: string;
    origin: string;
}

export interface SessionOptions {
    proxyUrl?: string;
    geoCountry: string;
    userAgent?: string;
}

const TOKEN_RE = /"pstk":"([^"]+)"|window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/;

export async function createSession(opts: SessionOptions): Promise<SessionContext> {
    const tld = geoToTld(opts.geoCountry);
    const origin = buildOrigin(tld);
    const cookieJar = new CookieJar();
    const requestOptions: OptionsInit = {
        cookieJar,
        proxyUrl: opts.proxyUrl,
        headerGeneratorOptions: {
            browsers: [{ name: 'chrome', minVersion: 120 }],
            devices: ['desktop'],
            locales: [`en-${opts.geoCountry}`],
            operatingSystems: ['windows', 'macos'],
        },
        timeout: { request: 30_000 },
    };

    const homepage = await gotScraping(origin, requestOptions);
    if (homepage.statusCode >= 400) {
        throw new Error(`Bet365 homepage returned ${homepage.statusCode}`);
    }

    // Token is embedded in the bootstrap script. The exact field name has
    // historically been one of: pstk, _vis_opt_session, sessTok. If extraction
    // fails, fall back to a synthetic token derived from the session cookie.
    const match = homepage.body.match(TOKEN_RE);
    const wsToken = match?.[1] ?? deriveTokenFromCookies(cookieJar);

    const cookieHeader = await cookieJar.getCookieString(origin);

    return {
        cookieJar,
        cookieHeader,
        wsToken,
        proxyUrl: opts.proxyUrl,
        geoCountry: opts.geoCountry,
        tld,
        origin,
    };
}

function deriveTokenFromCookies(jar: CookieJar): string {
    const serialized = jar.serializeSync();
    const cookies = serialized?.cookies ?? [];
    const session = cookies.find((c) => c.key === 'pstk' || c.key === 'sessTok');
    return session?.value ?? '';
}
