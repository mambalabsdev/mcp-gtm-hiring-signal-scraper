// Hosted Smithery deployment entry (TypeScript runtime).
// Smithery bundles this, hosts it over streamable HTTP, runs it, and reads
// tools/list to populate capabilities. The stdio entry (index.ts) is unchanged
// and remains the npx-distributed path. Same tool, same Apify actor call.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Config the user supplies through Smithery's config UI. Marked optional so the
// build-time tool scan (which runs with empty config) can list tools; the token
// is enforced inside the handler at call time.
export const configSchema = z.object({
  apifyToken: z
    .string()
    .optional()
    .describe(
      "Your Apify API token (required to run scans). Create one free at https://console.apify.com/account/integrations.",
    ),
});

export const stateful = false;

const ACTOR_ENDPOINT =
  "https://api.apify.com/v2/acts/D7O1SA2EqwHGsGr1P/run-sync-get-dataset-items?timeout=300";
const USER_AGENT =
  "mambalabs-mcp @mambalabsdev/mcp-gtm-hiring-signal-scraper (smithery-hosted)";

// Permissive output schema: real fields with descriptions for capability quality,
// all optional/nullable with tolerant primitives so structuredContent never fails
// validation on live data. (z.object strips unknown keys, so extra fields are fine.)
const num = z.union([z.number(), z.string()]).nullable().optional();
const bool = z.union([z.boolean(), z.string()]).nullable().optional();
const str = z.string().nullable().optional();

export default function ({ config }: { config: z.infer<typeof configSchema> }) {
  const server = new McpServer({
    name: "mamba-gtm-hiring-signal-scraper",
    version: "1.0.0",
  });

  server.registerTool(
    "scan_gtm_hiring_signals",
    {
      title: "Scan GTM Hiring Signals",
      description:
        "Scan a company's career pages to detect go-to-market hiring activity across Greenhouse, Lever, and Ashby. Returns a flat, Clay-ready row with the open GTM role count, a high/medium/low signal strength, the top GTM role, and the resolved ATS platform.",
      inputSchema: {
        domain: z
          .string()
          .describe(
            "Bare company domain without https:// and without a trailing slash. Example: stripe.com",
          ),
        role_filter: z
          .array(z.string())
          .optional()
          .describe(
            "Optional list of GTM role keywords to filter on. Defaults to the built-in GTM keyword list if omitted. Example: [\"Account Executive\", \"RevOps\"]",
          ),
        ats_slug: z
          .string()
          .optional()
          .describe(
            "Optional ATS board slug override for when it differs from the domain. Example: clay.com uses claylabs on Ashby. If omitted, the scraper auto-probes common slug variants.",
          ),
      },
      outputSchema: {
        domain: str.describe("The company domain that was scanned."),
        company_name: str.describe("Resolved company name, or null."),
        gtm_hiring_signal: bool.describe("True if GTM hiring activity was detected."),
        ats_platform: str.describe("Detected ATS: greenhouse, lever, ashby, or null if none matched."),
        gtm_role_count: num.describe("Number of open GTM roles found."),
        signal_strength: str.describe("Signal strength: high, medium, or low."),
        top_gtm_role: str.describe("Highest-signal open GTM role title, or null."),
        career_page_url: str.describe("Resolved careers or ATS board URL, or null."),
        run_date: str.describe("ISO timestamp of the run."),
      },
      annotations: {
        title: "Scan GTM Hiring Signals",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ domain, role_filter, ats_slug }) => {
      const token = config?.apifyToken || process.env.APIFY_TOKEN;
      if (!token) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Apify token is not set. Add apifyToken in the server configuration. Create one free at https://console.apify.com/account/integrations.",
            },
          ],
        };
      }

      const input: Record<string, unknown> = { domain };
      if (role_filter !== undefined) input.role_filter = role_filter;
      if (ats_slug !== undefined) input.ats_slug = ats_slug;

      let response: Response;
      try {
        response = await fetch(ACTOR_ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
          },
          body: JSON.stringify(input),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { isError: true, content: [{ type: "text", text: `Could not reach the Apify API: ${message}` }] };
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
            message = "Invalid Apify token. Check the apifyToken in your server configuration.";
            break;
          case 402:
            message = "Insufficient Apify credits. Check your account balance at https://console.apify.com/billing";
            break;
          case 408:
            message = "Actor run timed out after 300 seconds. Try again, or run the actor on Apify directly for longer jobs.";
            break;
          default:
            message = `Apify request failed with status ${response.status}.${detail}`;
        }
        return { isError: true, content: [{ type: "text", text: message }] };
      }

      const items = await response.json();
      const first = Array.isArray(items) && items[0] && typeof items[0] === "object" ? items[0] : {};
      return {
        content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
        structuredContent: first,
      };
    },
  );

  return server.server;
}
