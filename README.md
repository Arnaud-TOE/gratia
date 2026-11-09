# Gratia — the AI development director for small nonprofits

[![CI](https://github.com/Arnaud-TOE/gratia/actions/workflows/ci.yml/badge.svg)](https://github.com/Arnaud-TOE/gratia/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Four out of five first-time donors don't come back the next year.**[^fep] Small nonprofits collect through PayPal, but
nobody on a team of volunteers has time to watch who is drifting away, thank people properly or chase the business
pledges that never arrived. Gratia turns a nonprofit's PayPal account into a live dashboard and an AI teammate that does
that work, and never sends anything without a human click.

[^fep]: The Fundraising Effectiveness Project's [Q4 2025 report](https://publications.fepreports.org/archive/2025-q4/) puts overall donor retention at 43.3% and calls first-time retention "essentially flat"; [Bloomerang](https://bloomerang.com/nonprofit-glossary/donor-retention), citing that report, gives 18.9% for first-time donors.

Built for the [PayPal AI Hackathon 2026](https://paypalaihackathon.devpost.com/) on the PayPal sandbox, for a fictional
shelter, **Harbor Lane Animal Rescue**.

| | |
|---|---|
| Live demo | [gratia-peach.vercel.app](https://gratia-peach.vercel.app) |
| Demo video | [Watch on YouTube](https://youtu.be/NrOm-yoPO7Y) |
| Donation page | [gratia-peach.vercel.app/donate](https://gratia-peach.vercel.app/donate) |
| Sandbox buyer login | in the Devpost testing instructions |

![The dashboard: the director has drafted a personal note for each donor at risk, beside the live gift feed and the loyalty heatmap](docs/dashboard.png)

## TL;DR for judges

- **Dashboard:** every gift, monthly sponsorship and business pledge from PayPal in one [AG Studio](https://www.ag-grid.com/studio/) dashboard, re-themed as Gratia, with **four custom widgets** AG Studio doesn't ship: campaign goal bars, a live gift feed, a donor-by-month loyalty heatmap and a donor wall. Clicking a campaign or a donor filters the page.
- **Agent:** on the dashboard, click **Ask your director** and pick a suggestion. The **Development Director** finds donors at risk, drafts personal notes, sends pledge reminders through **PayPal Invoicing** after you approve them, and delegates dashboard building to **AG Studio's five built-in agents**.
- **Donations:** `/donate` takes a real (sandbox) PayPal payment with the **JavaScript SDK v6**. The order is created and captured with the **PayPal Server SDK**, and a paid receipt lands in PayPal Invoicing. Keep the dashboard open in another tab: it notices the gift within seconds, updates every widget and announces it.
- **Human in the loop:** the model drafts and asks; only a person can press "Send through PayPal". The server re-checks the pledge and rate-limits reminders.

## How we use PayPal

| Capability | API | Where |
|---|---|---|
| Donations | Orders v2: create and capture, through the APIMatic-generated **PayPal Server SDK** (`@paypal/paypal-server-sdk`) | `lib/donations.ts`, `app/api/donations` |
| Checkout button | **PayPal JavaScript SDK v6** (`paypal-payments` donate button) | `app/donate/donate-form.tsx` |
| Gifts, pledges, receipts | Invoicing v2: create, send, record payment, record refund, **remind** | `lib/donations.ts`, `app/api/pledges`, `scripts/seed-demo-data.mjs` |
| Live updates | Invoicing v2 search: the count of paid invoices, polled while a dashboard is open, then a re-read of what changed | `app/api/gifts/pulse`, `app/dashboard/use-live-gifts.ts`, `lib/paypal.ts` |
| Ledger | Transaction Search (three 31-day windows) and Balances | `lib/paypal.ts`, `lib/dashboard-data.ts` |
| Programs and giving plans | Catalog Products and Billing Plans | `lib/paypal.ts` |
| Demo data | All of the above, plus sandbox card captures and a refund | `scripts/seed-demo-data.mjs` |
| Keeping the demo current | Invoicing v2, from a daily **Vercel Cron** job: sponsors who are still giving give again when their month comes round, and someone new gives every other day. All fictional, sandbox only. Sponsors who stopped stay stopped, so the agent still has someone to win back. | `lib/daily-gifts.ts`, `app/api/cron/daily-gifts` |

## How we use AI

- **Model:** OpenAI `gpt-5.4-mini`, called from the browser through a server proxy (`app/api/ai/responses`) that holds the key, allows only configured models and this site's own pages, limits calls per visitor and per day (`lib/ai-guard.ts`) and caps output tokens.
- **Agent framework:** AG Studio's Studio Agent Framework. Our **Development Director** (`app/dashboard/studio/ai.ts`) is the primary agent. It talks to AG Studio's built-in **lead** agent through `delegate_to`, and the lead coordinates the planning, data, page and widget agents to build what it asks for.
- **Our tools** (`app/dashboard/studio/donor-tools.ts`):
  - `find_donors_at_risk`: lapsed monthly sponsors, quiet repeat donors and first gifts never followed up, from the PayPal giving history (`lib/insights.ts`).
  - `list_overdue_pledges`: open business pledges past their due date.
  - `send_pledge_reminder`: opens an approval dialog with the exact message; only after a click does PayPal email the reminder.
  - In the chat, these calls read in plain words and expand to show the donors and pledges found (`app/dashboard/studio/tool-display.tsx`).
- **Our widgets are open to the agents too:** each carries AI metadata and data-mapping descriptions (`app/dashboard/studio/widgets`), so the built-in agents can place them on a page.
- **Studio tools** the director also uses: `view_report`, `view_schema`, `execute_query`.
- **Built with AI:** the code was written with Claude Code, using APIMatic's PayPal Context Plugin skills for the PayPal Server SDK and AG Studio's own type definitions. Every change was verified in the browser and covered by tests where it holds logic.

## What makes this different

- **It acts, not just reports.** Reminders go out through PayPal Invoicing, and gifts are captured through Checkout, with a human approving every outbound message.
- **A custom agent that works with AG Studio's own team** of agents, instead of a single chatbot over a chart.
- **Four widgets AG Studio doesn't ship**, built on its widget API, so filters and cross-filters apply and the agents can place them: **campaign goals** (one progress bar per campaign, against its goal), the **gift feed**, the **loyalty heatmap** (who keeps coming back, month by month, and who has gone quiet) and the **donor wall**. Like the built-in charts, they use Studio's highlight mode: a selection elsewhere fades what it leaves out instead of hiding it.
- **A command palette.** Ctrl K (⌘K on a Mac) from anywhere in the dashboard: the director's suggestions, every page and report, the donation page. It presses the same prompt starters as the chat, so it runs exactly what a click would.
- **A live dashboard on a read API.** Each online gift is mirrored as a PayPal invoice receipt, so an open dashboard picks it up within seconds, instead of waiting hours for Transaction Search.

## Architecture

```mermaid
flowchart LR
  donor((Donor)) -->|JS SDK v6| donate[/donate page/]
  donate --> api[Next.js route handlers]
  api -->|PayPal Server SDK| orders[PayPal Orders v2]
  api -->|receipt, reminders| invoicing[PayPal Invoicing v2]
  team((Volunteer)) --> dash[AG Studio dashboard]
  dash -->|reads, and polls for new gifts| rest[PayPal REST: invoices, transactions, balances, products, plans]
  dash --> director[Development Director]
  director -->|delegate_to| builtin[AG Studio built-in agents]
  director -->|tools| tools[donors at risk · overdue pledges · send reminder]
  tools -->|after approval| invoicing
  director -->|Responses API via proxy| llm[OpenAI gpt-5.4-mini]
```

## Run it locally

You need Node.js 20.9 or later, a [PayPal developer](https://developer.paypal.com) sandbox app (with **Invoicing** and **Transaction search** enabled, linked to a US sandbox business account) and an OpenAI API key.

1. `npm install`
2. Copy `env.example` to `.env.local` and fill in `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `AG_STUDIO_OPENAI_API_KEY` and, optionally, an AG Studio licence in `AG_STUDIO`.
3. `npm run seed` (fills the sandbox with Harbor Lane's year of giving), then `npm run dev` and open http://localhost:3000.

Card donations created by the seed take up to three hours to show in PayPal Transaction Search; invoices and receipts show at once.

To watch the dashboard pick up a gift without going through checkout, leave it open and run `npm run simulate-gift -- 50 "Winter Shelter Drive" "Alex Rivera"`.

## Checks

```bash
npm run lint
npm run typecheck
npm test
```

`/api/health` on a running deployment says whether PayPal answers and whether the licence and the model key are set, without showing them.

CI (`.github/workflows/ci.yml`) runs all three on every push.

## What it doesn't do (yet)

- It runs on the PayPal **sandbox** only; no real money or donor data.
- It doesn't send email itself: reminders go through PayPal Invoicing, and thank-you notes are drafted for a person to send.
- Reports are saved in the browser, not shared between team members.
- The public demo's assistant has a daily budget. When it is used up, the assistant says so until the next day; the demo video shows it at work.
- The agent's donor list reads the gifts recorded in PayPal; it knows nothing about a donor beyond them, and is told not to invent anything.
- One organization per deployment.

## Credits

Started from PayPal's official [AG Grid hackathon boilerplate](https://github.com/paypaldev/hackathon-paypal-ag-grid-boilerplate) (its history is kept; our work starts after commit `5de114e`): the PayPal REST client, the AG Studio setup and the OpenAI adapter come from there. Everything else (the seed, donations, the agent and its tools, the approval flow, the custom widgets, live updates, the Gratia theme and the tests) was built during the hackathon.

## License

[MIT](LICENSE)
