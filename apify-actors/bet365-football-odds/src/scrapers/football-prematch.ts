import { log } from 'crawlee';
import { Bet365Client } from '../bet365/client.js';
import { TOPIC_PATTERNS } from '../bet365/protocol-constants.js';
import type { Frame } from '../bet365/protocol.js';
import { formatOdds } from '../odds.js';
import type { FixtureOdds1X2, OddsFormat } from '../types.js';

export interface ScrapeOptions {
    competitions: string[];
    oddsFormat: OddsFormat;
    maxFixtures: number;
    onRecord: (record: FixtureOdds1X2) => Promise<void>;
}

interface FixtureState {
    fixtureId: string;
    competitionId: string;
    competition: string;
    home: string;
    away: string;
    kickoffAt: string;
    homeWin?: string;
    draw?: string;
    awayWin?: string;
}

/**
 * Football pre-match 1X2 scraper.
 *
 * Connection layer is verified against real captures. The per-fixture market
 * frame layout is NOT yet captured — the market-parsing logic below assumes
 * a payload format (semicolon-separated key=value with NA/OD/FI/BC fields)
 * that's a placeholder. Drop a v2 directory + 1X2 capture into
 * `captures/session-<n>.txt` and update {@link parseDirectoryFrame} and
 * {@link parseMarketFrame} to match.
 */
export async function scrapeFootballPrematch1X2(
    client: Bet365Client,
    opts: ScrapeOptions,
): Promise<number> {
    const fixtures = new Map<string, FixtureState>();
    let emitted = 0;
    const wantedCompetitions = new Set(opts.competitions.map((c) => c.toLowerCase()));

    const flush = async (state: FixtureState) => {
        if (state.homeWin == null || state.draw == null || state.awayWin == null) return;
        if (opts.maxFixtures > 0 && emitted >= opts.maxFixtures) return;
        const record: FixtureOdds1X2 = {
            fixtureId: state.fixtureId,
            competition: state.competition,
            competitionId: state.competitionId,
            kickoffAt: state.kickoffAt,
            home: state.home,
            away: state.away,
            homeWin: formatOdds(state.homeWin, opts.oddsFormat),
            draw: formatOdds(state.draw, opts.oddsFormat),
            awayWin: formatOdds(state.awayWin, opts.oddsFormat),
            format: opts.oddsFormat,
            scrapedAt: new Date().toISOString(),
        };
        await opts.onRecord(record);
        emitted++;
    };

    client.on('frame', (frame: Frame) => {
        if (frame.kind !== 'push' && frame.kind !== 'pushVar' && frame.kind !== 'pushVarGroup') return;

        if (frame.name.startsWith(TOPIC_PATTERNS.footballPrematchDirectory)) {
            parseDirectoryFrame(frame, fixtures, wantedCompetitions, client);
            return;
        }
        if (frame.name.startsWith(TOPIC_PATTERNS.footballFixturePrefix)
            && frame.name.endsWith(TOPIC_PATTERNS.footballMarket1X2Suffix)) {
            parseMarketFrame(frame, fixtures, flush);
        }
    });

    return new Promise<number>((resolve) => {
        const finish = () => resolve(emitted);
        client.on('close', finish);
        if (opts.maxFixtures > 0) {
            const interval = setInterval(() => {
                if (emitted >= opts.maxFixtures) {
                    clearInterval(interval);
                    client.close();
                }
            }, 1_000);
        }
    });
}

/** Parse a directory snapshot record (one fixture entry).
 *  PLACEHOLDER — adjust field names after capturing real v2 directory frames. */
function parseDirectoryFrame(
    frame: Frame,
    fixtures: Map<string, FixtureState>,
    wantedCompetitions: Set<string>,
    _client: Bet365Client,
): void {
    const fields = parseKeyValuePayload(frame.payload);
    const fixtureId = fields.FI ?? fields.fi ?? '';
    const competitionId = fields.CI ?? fields.ci ?? '';
    const competition = fields.CN ?? fields.cn ?? '';
    const home = fields.NA1 ?? fields.na1 ?? '';
    const away = fields.NA2 ?? fields.na2 ?? '';
    const kickoffAt = fields.BC ?? fields.bc ?? '';
    if (!fixtureId || !home || !away) return;
    if (wantedCompetitions.size > 0
        && !wantedCompetitions.has(competition.toLowerCase())
        && !wantedCompetitions.has(competitionId.toLowerCase())) {
        return;
    }
    if (fixtures.has(fixtureId)) return;
    fixtures.set(fixtureId, { fixtureId, competitionId, competition, home, away, kickoffAt });
    log.debug(`Discovered fixture ${fixtureId}: ${home} vs ${away}`);
}

/** Parse a per-fixture 1X2 market record.
 *  PLACEHOLDER — adjust field names after capturing a real fixture frame. */
function parseMarketFrame(
    frame: Frame,
    fixtures: Map<string, FixtureState>,
    flush: (state: FixtureState) => Promise<void>,
): void {
    const fixtureId = frame.name
        .replace(TOPIC_PATTERNS.footballFixturePrefix, '')
        .replace(TOPIC_PATTERNS.footballMarket1X2Suffix, '');
    const state = fixtures.get(fixtureId);
    if (!state) return;
    const fields = parseKeyValuePayload(frame.payload);
    const selection = (fields.NA ?? fields.na ?? '').toLowerCase();
    const odds = fields.OD ?? fields.od;
    if (!odds) return;
    if (selection === '1' || selection === state.home.toLowerCase()) state.homeWin = odds;
    else if (selection === 'x' || selection === 'draw') state.draw = odds;
    else if (selection === '2' || selection === state.away.toLowerCase()) state.awayWin = odds;
    void flush(state);
}

function parseKeyValuePayload(payload: string): Record<string, string> {
    const out: Record<string, string> = {};
    if (!payload) return out;
    for (const pair of payload.split(';')) {
        const eq = pair.indexOf('=');
        if (eq <= 0) continue;
        out[pair.slice(0, eq)] = pair.slice(eq + 1);
    }
    return out;
}
