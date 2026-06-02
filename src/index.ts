#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Read the package version so the server reports the same version as the package.
const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(here, "..", "package.json"), "utf8"),
) as { version: string; name: string };

// Distinctive UA so Apify run meta.userAgent marks MCP-originated runs.
const USER_AGENT = `mambalabs-mcp ${pkg.name}@${pkg.version}`;

const APIFY_TOKEN = process.env.APIFY_TOKEN;

// The tilde between the org name and the actor name is Apify's required separator
// for the org/actor path. It is not a slash.
const ACTOR_ENDPOINT =
  "https://api.apify.com/v2/acts/mambalabs~gtm-hiring-signal-scraper/run-sync-get-dataset-items?timeout=300";

const server = new McpServer({
  name: "mamba-gtm-hiring-signal-scraper",
  version: pkg.version,
});

server.tool(
  "scan_gtm_hiring_signals",
  "Scan company career pages to detect GTM hiring activity. Returns structured data on sales, marketing, and revenue operations job postings. Supports Greenhouse, Lever, and Ashby ATS platforms. Output is Clay-ready flat JSON.",
  {
    domain: z
      .string()
      .describe(
        "Bare company domain without https:// and without a trailing slash. Example: stripe.com",
      ),
    role_filter: z
      .array(z.string())
      .optional()
      .describe(
        "Optional list of GTM role keywords to filter on. Defaults to the built-in GTM keyword list if omitted.",
      ),
    ats_slug: z
      .string()
      .optional()
      .describe(
        "Optional ATS board slug override for when it differs from the domain. Example: clay.com uses claylabs on Ashby. If omitted, the scraper auto-probes common slug variants.",
      ),
  },
  async ({ domain, role_filter, ats_slug }) => {
    if (!APIFY_TOKEN) {
      return { isError: true, content: [{ type: "text", text: "APIFY_TOKEN is not set. Create a token at https://console.apify.com/account/integrations and set it as the APIFY_TOKEN environment variable." }] };
    }

    const input: Record<string, unknown> = { domain };
    if (role_filter !== undefined) input.role_filter = role_filter;
    if (ats_slug !== undefined) input.ats_slug = ats_slug;

    let response: Response;
    try {
      response = await fetch(ACTOR_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${APIFY_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": USER_AGENT,
        },
        body: JSON.stringify(input),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: "text", text: `Could not reach the Apify API: ${message}` }],
      };
    }

    if (!response.ok) {
      let detail = "";
      try {
        const body = (await response.json()) as { error?: { message?: string } };
        if (body?.error?.message) detail = ` ${body.error.message}`;
      } catch {
        detail = "";
      }

      let message: string;
      switch (response.status) {
        case 401:
          message = "Invalid Apify token. Check your APIFY_TOKEN environment variable.";
          break;
        case 402:
          message =
            "Insufficient Apify credits. Check your account balance at https://console.apify.com/billing";
          break;
        case 408:
          message =
            "Actor run timed out after 300 seconds. Try again, or run the actor on Apify directly for longer jobs.";
          break;
        default:
          message = `Apify request failed with status ${response.status}.${detail}`;
      }
      return { isError: true, content: [{ type: "text", text: message }] };
    }

    const items = await response.json();
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
