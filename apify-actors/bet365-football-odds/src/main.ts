import { Actor, log } from 'apify';
import { Bet365Client } from './bet365/client.js';
import { createSession } from './bet365/session.js';
import { scrapeFootballPrematch1X2 } from './scrapers/football-prematch.js';
import type { ActorInput, FixtureOdds1X2 } from './types.js';

await Actor.init();

const input = (await Actor.getInput<Partial<ActorInput>>()) ?? {};
const config: ActorInput = {
    competitions: input.competitions ?? [],
    oddsFormat: input.oddsFormat ?? 'decimal',
    maxFixtures: input.maxFixtures ?? 0,
    proxy: input.proxy ?? { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
    geoCountry: input.geoCountry ?? 'GB',
    debug: input.debug ?? false,
};

if (config.debug) log.setLevel(log.LEVELS.DEBUG);

const proxyConfiguration = await Actor.createProxyConfiguration(config.proxy);
const proxyUrl = await proxyConfiguration?.newUrl();

log.info('Bootstrapping Bet365 session', { geo: config.geoCountry, proxy: !!proxyUrl });
const session = await createSession({
    proxyUrl,
    geoCountry: config.geoCountry,
});

const client = new Bet365Client(session);
client.on('error', (err) => log.error('Bet365 client error', { err: err.message }));
client.on('close', (code, reason) => log.info('Bet365 WS closed', { code, reason }));

await client.connect();
log.info('Connected to Bet365 data feed');

const dataset = await Actor.openDataset();
const emitted = await scrapeFootballPrematch1X2(client, {
    competitions: config.competitions,
    oddsFormat: config.oddsFormat,
    maxFixtures: config.maxFixtures,
    onRecord: async (record: FixtureOdds1X2) => {
        await dataset.pushData(record);
    },
});

log.info(`Scrape complete. Records pushed: ${emitted}`);
client.close();
await Actor.exit();
