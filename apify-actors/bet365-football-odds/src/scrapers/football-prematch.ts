import { log } from 'crawlee';
import { Bet365Client } from '../bet365/client.js';
import { PROTOCOL } from '../bet365/protocol-constants.js';
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

    client.on('update', (frame: Frame) => {
        const topic = frame.topic ?? '';
        if (topic.startsWith(PROTOCOL.topics.footballPrematchDirectory)) {
            handleDirectory(frame, fixtures, wantedCompetitions, client);
            return;
        }
        if (topic.startsWith(PROTOCOL.topics.footballFixturePrefix)) {
            handleFixture(frame, fixtures, flush);
        }
    });

    client.subscribe(PROTOCOL.topics.footballPrematchDirectory);

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

function handleDirectory(
    frame: Frame,
    fixtures: Map<string, FixtureState>,
    wantedCompetitions: Set<string>,
    client: Bet365Client,
): void {
    const fixtureId = frame.fields.FI ?? frame.fields.fi;
    const competitionId = frame.fields.CI ?? frame.fields.ci ?? '';
    const competition = frame.fields.CN ?? frame.fields.cn ?? '';
    const home = frame.fields.NA1 ?? frame.fields.na1 ?? '';
    const away = frame.fields.NA2 ?? frame.fields.na2 ?? '';
    const kickoffAt = frame.fields.BC ?? frame.fields.bc ?? '';
    if (!fixtureId || !home || !away) return;
    if (wantedCompetitions.size > 0 && !wantedCompetitions.has(competition.toLowerCase())
        && !wantedCompetitions.has(competitionId.toLowerCase())) {
        return;
    }
    if (fixtures.has(fixtureId)) return;
    fixtures.set(fixtureId, {
        fixtureId,
        competitionId,
        competition,
        home,
        away,
        kickoffAt,
    });
    client.subscribe(`${PROTOCOL.topics.footballFixturePrefix}${fixtureId}${PROTOCOL.topics.footballMarket1X2}`);
    log.debug(`Discovered fixture ${fixtureId}: ${home} vs ${away}`);
}

function handleFixture(
    frame: Frame,
    fixtures: Map<string, FixtureState>,
    flush: (state: FixtureState) => Promise<void>,
): void {
    const fixtureId = (frame.topic ?? '').replace(
        PROTOCOL.topics.footballFixturePrefix,
        '',
    ).replace(PROTOCOL.topics.footballMarket1X2, '');
    const state = fixtures.get(fixtureId);
    if (!state) return;
    const selection = (frame.fields.NA ?? frame.fields.na ?? '').toLowerCase();
    const odds = frame.fields.OD ?? frame.fields.od;
    if (!odds) return;
    if (selection === '1' || selection === state.home.toLowerCase()) state.homeWin = odds;
    else if (selection === 'x' || selection === 'draw') state.draw = odds;
    else if (selection === '2' || selection === state.away.toLowerCase()) state.awayWin = odds;
    void flush(state);
}
