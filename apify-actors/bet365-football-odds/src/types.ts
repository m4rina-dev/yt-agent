export type OddsFormat = 'decimal' | 'fractional' | 'american';

export interface ActorInput {
    competitions: string[];
    oddsFormat: OddsFormat;
    maxFixtures: number;
    proxy: {
        useApifyProxy?: boolean;
        apifyProxyGroups?: string[];
        apifyProxyCountry?: string;
        proxyUrls?: string[];
    };
    geoCountry: string;
    debug: boolean;
}

export interface FixtureOdds1X2 {
    fixtureId: string;
    competition: string;
    competitionId: string;
    kickoffAt: string;
    home: string;
    away: string;
    homeWin: string;
    draw: string;
    awayWin: string;
    format: OddsFormat;
    scrapedAt: string;
}
