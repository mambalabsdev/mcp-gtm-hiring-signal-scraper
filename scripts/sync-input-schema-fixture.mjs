#!/usr/bin/env node
// Regenerates test/fixtures/live-input-schema.json from the live actor.
// Reads GET /v2/acts/{id}, then the latest tagged build, and copies its input
// schema verbatim with a _provenance block. The parity test derives its
// expected input list from this file, never from the tool, so a field the actor
// gains and the tool lacks turns the test red.
//
// Usage: APIFY_TOKEN=... node scripts/sync-input-schema-fixture.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ACTOR_ID = "D7O1SA2EqwHGsGr1P";
const token = process.env.APIFY_TOKEN;
if (!token) {
  console.error("APIFY_TOKEN is not set.");
  process.exit(1);
}
const headers = { Authorization: `Bearer ${token}` };
const get = async (url) => {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${url} answered ${r.status}`);
  return (await r.json()).data;
};

const act = await get(`https://api.apify.com/v2/acts/${ACTOR_ID}`);
const latest = act.taggedBuilds?.latest;
if (!latest?.buildId) throw new Error("the actor has no latest tagged build");
const build = await get(`https://api.apify.com/v2/actor-builds/${latest.buildId}`);
const input = build.actorDefinition?.input;
if (!input?.properties) throw new Error("the build carries no input schema");

const fixture = {
  _provenance: {
    actorId: ACTOR_ID,
    buildId: latest.buildId,
    buildNumber: latest.buildNumber,
    readAt: new Date().toISOString(),
  },
  ...input,
};
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "test", "fixtures", "live-input-schema.json");
writeFileSync(out, JSON.stringify(fixture, null, 2) + "\n");
console.log(`wrote ${out} from build ${latest.buildNumber}`);
