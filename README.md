# GTM Hiring Signal Scraper MCP Server

[![Smithery](https://smithery.ai/badge/@mambabuilt/mcp-gtm-hiring-signal-scraper)](https://smithery.ai/server/@mambabuilt/mcp-gtm-hiring-signal-scraper) [![Glama score](https://glama.ai/mcp/servers/mambalabsdev/mcp-gtm-hiring-signal-scraper/badges/score.svg)](https://glama.ai/mcp/servers/mambalabsdev/mcp-gtm-hiring-signal-scraper) [![MCP Registry](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fregistry.modelcontextprotocol.io%2Fv0%2Fservers%3Fsearch%3Dcom.mambabuilt%252Fmcp-gtm-hiring-signal-scraper%26limit%3D1&query=%24.servers%5B0%5D._meta%5B%22io.modelcontextprotocol.registry%2Fofficial%22%5D.status&label=mcp%20registry&color=blue)](https://registry.modelcontextprotocol.io/v0/servers?search=com.mambabuilt/mcp-gtm-hiring-signal-scraper&limit=1) [![npm version](https://img.shields.io/npm/v/@mambalabsdev/mcp-gtm-hiring-signal-scraper)](https://www.npmjs.com/package/@mambalabsdev/mcp-gtm-hiring-signal-scraper) [![npm downloads](https://img.shields.io/npm/dm/@mambalabsdev/mcp-gtm-hiring-signal-scraper)](https://www.npmjs.com/package/@mambalabsdev/mcp-gtm-hiring-signal-scraper) [![license](https://img.shields.io/github/license/mambalabsdev/mcp-gtm-hiring-signal-scraper)](https://github.com/mambalabsdev/mcp-gtm-hiring-signal-scraper/blob/main/LICENSE) [![mcpservers.org](https://img.shields.io/badge/mcpservers.org-listed-blue)](https://mcpservers.org/servers/mambalabsdev/mcp-gtm-hiring-signal-scraper)

An MCP server that detects go-to-market hiring activity from company career pages. It wraps the Mamba Labs GTM Hiring Signal Scraper on Apify and returns Clay-ready flat JSON to any MCP client.

## What it does

Give it a company domain and it scans that company's job board for sales, marketing, and revenue operations roles across Greenhouse, Lever, and Ashby. You get back a structured read on how hard that company is hiring for go-to-market, ready to drop into Clay, a CRM, or an AI agent workflow. All of the scraping runs on Apify. This package is a thin client that calls the actor and hands back the result.

## Quick start

You need Node.js 18 or newer and an Apify account with an API token.

Add this to your Claude Desktop config:

```json
{
  "mcpServers": {
    "mamba-gtm-hiring": {
      "command": "npx",
      "args": ["-y", "@mambalabsdev/mcp-gtm-hiring-signal-scraper"],
      "env": {
        "APIFY_TOKEN": "your-apify-token"
      }
    }
  }
}
```

Get your token at https://console.apify.com/account/integrations, paste it in, and restart Claude Desktop. The `scan_gtm_hiring_signals` tool will be available.

## Prerequisites

- Node.js 18 or newer
- An Apify account with an API token

## Example prompts

- "Check if stripe.com is hiring for go-to-market roles right now."
- "Scan openai.com for sales and revenue operations job postings."
- "Is datadoghq.com ramping up GTM hiring? Use the GTM hiring scanner."
- "Pull the GTM hiring signal for figma.com and list which roles are open."

## Inputs

- `domain` (required): the bare company domain, no `https://` and no trailing slash. Example: `stripe.com`
- `role_filter` (optional): a list of GTM role keywords to filter on. Leave it out to use the built-in keyword list.
- `ats_slug` (optional): override the ATS board slug when it differs from the domain. Example: `clay.com` uses `claylabs` on Ashby.

## Output

The tool returns the actor's flat JSON for the scanned company. Fields include the detected ATS platform, the count of open GTM roles, the matched role titles and their categories, and a seniority read. Companies on an ATS outside Greenhouse, Lever, and Ashby come back with a null platform, a zero role count, and no error. See the Apify Store page for the full output schema.

## Example output

```json
{
  "domain": "stripe.com",
  "company_name": "Stripe",
  "gtm_hiring_signal": true,
  "ats_platform": "greenhouse",
  "gtm_role_count": 12,
  "signal_strength": "high",
  "top_gtm_role": "Head of Revenue",
  "career_page_url": "https://boards.greenhouse.io/stripe",
  "run_date": "2026-05-28"
}
```

## Features

- Cascading ATS detection: Greenhouse, Lever, Ashby
- GTM role filtering with 3-tier signal strength (high, medium, low)
- Flat JSON output designed for Clay column mapping
- Optional role_filter and ats_slug inputs

## Full actor documentation

This server is a thin client and holds no scraping logic. For the complete input and output reference, pricing, and run history, see the Apify Store page:

https://apify.com/mambalabs/gtm-hiring-signal-scraper

---

## Mamba Labs GTM Suite

This server is part of the **Mamba Labs GTM Suite**, a fleet of eight specialized MCP servers for go-to-market signal intelligence, each backed by a dedicated Apify actor.

| Actor | Immutable Actor ID |
|---|---|
| [GTM Hiring Signal Scraper](https://console.apify.com/actors/D7O1SA2EqwHGsGr1P) | `D7O1SA2EqwHGsGr1P` |
| [GTM Tech Stack Signal Enrichment](https://console.apify.com/actors/qyd7nNyqFPelQViBx) | `qyd7nNyqFPelQViBx` |
| [GTM Signals Aggregator](https://console.apify.com/actors/xKdRfnfFNkdMpFuNs) | `xKdRfnfFNkdMpFuNs` |
| [Job Board Keyword Signal Scanner](https://console.apify.com/actors/4DvqpvhMR74NLcDDY) | `4DvqpvhMR74NLcDDY` |
| [Domain to LinkedIn URL Resolver](https://console.apify.com/actors/3HtnSaqPHOg1Qg5gx) | `3HtnSaqPHOg1Qg5gx` |
| [ICP Fit Scorer](https://console.apify.com/actors/W161DT8W4kW55dMFh) | `W161DT8W4kW55dMFh` |
| [Domain Deliverability Checker](https://console.apify.com/actors/0tVgxI7A6o9jMlxmc) | `0tVgxI7A6o9jMlxmc` |
| [Company Firmographic Enricher](https://console.apify.com/actors/YlUtLWjfPpqykmB8g) | `YlUtLWjfPpqykmB8g` |

> Built by [Mamba Labs](https://github.com/mambalabsdev) | [npm](https://www.npmjs.com/org/mambalabsdev) | [Apify Store](https://apify.com/mambabuilt)

## License

MIT

Built by Mamba Labs. https://apify.com/mambalabs
