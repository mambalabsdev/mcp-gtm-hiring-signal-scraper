// Test preload: replaces global fetch so the server's start and poll path runs
// offline. Every request is appended to MOCK_FETCH_LOG as one JSON line.
// MOCK_RUN_STATUS sets the terminal status the poll returns (default SUCCEEDED).
import { appendFileSync } from "node:fs";

const log = process.env.MOCK_FETCH_LOG;
const finalStatus = process.env.MOCK_RUN_STATUS || "SUCCEEDED";
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  const method = (init.method || "GET").toUpperCase();
  if (log) appendFileSync(log, JSON.stringify({ method, url: u, body: init.body ?? null }) + "\n");
  if (method === "POST" && /\/v2\/acts\/[^/]+\/runs\?/.test(u)) {
    return json({ data: { id: "run123", status: "RUNNING", defaultDatasetId: "ds123" } }, 201);
  }
  if (/\/v2\/actor-runs\/run123$/.test(u)) {
    return json({ data: { id: "run123", status: finalStatus, defaultDatasetId: "ds123" } });
  }
  if (/\/v2\/datasets\/ds123\/items/.test(u)) {
    return json([{ mocked: true, row_status: "ok" }]);
  }
  return json({ error: { message: `unmocked ${method} ${u}` } }, 404);
};
