// The AG Studio AI assistant. The volunteer talks to a development director: an agent of our own
// that follows up donors and pledges with its own tools (./donor-tools) and hands dashboard building
// to AG Studio's five built-in agents through `delegate_to`. Every agent calls the model through
// `${endpoint}/responses`, i.e. this app's proxy at app/api/ai/responses, which holds the OpenAI key,
// so nothing secret is sent from the browser.

import { createAiHarness, directLlmRunner, type AgAiHarnessSetup, type AgAiPromptStarter } from 'ag-studio';
import type { DashboardData } from '@/lib/dashboard-data';
import { ORGANIZATION } from '@/lib/organization';
import type { RequestApproval } from '../components/approval-dialog';
import { buildDonorTools, type OpenPage } from './donor-tools';
import { openaiAdapter } from './openai-adapter';

// Suggestions shown in a new AI conversation, before anything has been typed.
export const PROMPT_STARTERS: AgAiPromptStarter[] = [
  {
    label: 'Who are we losing?',
    prompt: 'Which donors are we at risk of losing? Draft a short personal note for the top three.',
  },
  {
    label: 'Chase overdue pledges',
    prompt: 'Which business pledges are overdue? Draft a friendly reminder for the largest one and send it through PayPal once I approve it.',
  },
  {
    label: 'Build a board report',
    prompt: 'Build a new page for the board: total given by month, giving by program, and the overdue pledges.',
  },
];

function directorInstructions(data: DashboardData): string {
  const today = data.asOf.slice(0, 10);
  return `You are the AI development director of ${ORGANIZATION}, a small animal shelter run mostly by volunteers.
You work alongside the volunteer chatting with you, on top of the rescue's PayPal sandbox data: gifts, monthly
sponsorships and business pledges recorded in PayPal Invoicing, online donations, programs and giving plans.

What you do:
- Donor follow-up: call find_donors_at_risk, then write short, warm, specific notes (3 to 5 sentences) that thank
  each donor for what their past gifts paid for and invite them back. Never invent facts about a donor.
- Pledges: call list_overdue_pledges, draft a friendly reminder, then call send_pledge_reminder with it straight away.
  Don't ask for approval in the chat: the tool shows the volunteer the exact message in a dialog, and nothing is sent
  until they click "Send through PayPal". Only say a reminder was sent when the tool confirms it.
- Dashboard changes: delegate to the Lead agent with a precise brief (which widgets, which fields and aggregations).
  Widgets go on the page that is open. For a new page, call open_new_page first, then delegate. Only say a page or a
  widget exists once a tool has made it. Delegate rather than describing widgets you could have built.
  Name the fields in your brief, because these are the ones that answer the usual questions:
  - Money given by month: a column chart of invoicePayments.signedAmount (sum) over calendar::month.
  - Giving by program: a bar chart of invoiceItems.lineTotal (sum) by invoiceItems.name.
  - Overdue pledges: don't delegate this one. Call add_overdue_pledges_table yourself, once the page is open, and
    leave it out of the Lead agent's brief.
- Questions about the numbers: use view_report, view_schema and execute_query.

Style: plain, warm and brief, always in English. Use USD. Today is ${today}.`;
}

// `models` are the ids allowed by OPENAI_MODELS on the server; the first is the default, and the
// picker only shows for two or more.
export function buildAi(models: string[], getData: () => DashboardData, requestApproval: RequestApproval, openPage: OpenPage): AgAiHarnessSetup {
  const adapter = openaiAdapter({ endpoint: '/api/ai', model: models[0] });

  return ({ api }) =>
    createAiHarness(api, ({ tools, builtIn }) => {
      const donorTools = buildDonorTools(api, getData, requestApproval, openPage);
      const director = directLlmRunner({
        id: 'director',
        name: 'Development Director',
        description: 'Fronts the conversation: donor follow-up, pledge reminders through PayPal, and briefs for dashboard changes.',
        adapter,
        maxTurns: 40,
        instructions: () => directorInstructions(getData()),
        tools: () => [
          tools.renameThread(),
          tools.delegateTo(['lead']),
          tools.studio.viewReport(),
          tools.studio.viewSchema(),
          tools.studio.executeQuery(),
          ...donorTools,
        ],
      });
      // AG Studio's own team (lead, planning, data, page, widget) builds what the director asks for.
      const builtInAgents = Object.values(builtIn).map((agent) => directLlmRunner({ ...agent, adapter }));

      return {
        agents: [director, ...builtInAgents],
        primary: 'director',
        models: models.length > 1 ? models.map((id) => ({ id, label: id })) : undefined,
        promptStarters: PROMPT_STARTERS,
      };
    });
}
