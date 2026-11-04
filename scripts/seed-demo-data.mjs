// Seeds the PayPal sandbox with a year of believable activity for a small animal rescue, so the
// dashboard has something real to show: a program catalog, monthly-giving plans, sponsorships,
// gifts and corporate pledges recorded through Invoicing, and this week's online donations
// captured with PayPal's sandbox test cards.
//
// Usage: npm run seed              refuses to run when the sandbox is already seeded
//        npm run seed -- --force   adds another batch anyway
//
// Sandbox only: the base URL is fixed, and every name and email below is fictional.

import { randomUUID } from 'node:crypto';

const BASE_URL = 'https://api-m.sandbox.paypal.com';
const ORG = 'Harbor Lane Animal Rescue';
const INVOICE_PREFIX = 'HLAR';
const CONCURRENCY = 3;
const force = process.argv.includes('--force');

const { PAYPAL_CLIENT_ID: clientId, PAYPAL_SECRET: secret } = process.env;
if (!clientId || !secret) {
  console.error('PAYPAL_CLIENT_ID and PAYPAL_SECRET must be set (run through `npm run seed`, which loads .env.local).');
  process.exit(1);
}

// --- PayPal REST ---------------------------------------------------------------------

let token;

async function accessToken() {
  if (token && Date.now() < token.expiresAt) return token.value;
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal OAuth failed: HTTP ${res.status}`);
  const { access_token, expires_in } = await res.json();
  token = { value: access_token, expiresAt: Date.now() + (expires_in - 60) * 1000 };
  return token.value;
}

async function paypal(method, path, body) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${await accessToken()}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        'PayPal-Request-Id': randomUUID(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (res.ok) return text ? JSON.parse(text) : {};
    if (res.status === 401 && attempt === 1) {
      token = undefined;
      continue;
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      await sleep(2 ** attempt * 400);
      continue;
    }
    throw new Error(`PayPal ${res.status} on ${method} ${path}: ${text.slice(0, 400)}`);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const money = (value) => ({ currency_code: 'USD', value: value.toFixed(2) });

// Runs `task` over `items` with at most CONCURRENCY calls in flight.
async function inPool(items, task) {
  const queue = [...items];
  let done = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      await task(queue.shift());
      done++;
      if (done % 10 === 0 || done === items.length) process.stdout.write(`  ${done}/${items.length}\r`);
    }
  });
  await Promise.all(workers);
  process.stdout.write('\n');
}

// --- Deterministic randomness ---------------------------------------------------------------

// mulberry32: the same seed always produces the same rescue, so reruns are comparable.
let rngState = 20261104;
function random() {
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (list) => list[Math.floor(random() * list.length)];
const between = (min, max) => min + Math.floor(random() * (max - min + 1));

// --- Calendar -----------------------------------------------------------------------------

const today = new Date();
today.setUTCHours(12, 0, 0, 0);
const iso = (date) => date.toISOString().slice(0, 10);
const daysAgo = (n) => new Date(today.getTime() - n * 86_400_000);
const addDays = (date, n) => new Date(date.getTime() + n * 86_400_000);

// The given day of the month `monthsBack` months before this one.
function monthDay(monthsBack, day) {
  const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - monthsBack, 1, 12));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date;
}

// --- The rescue's world ---------------------------------------------------------------------

const PROGRAMS = [
  { key: 'sponsor', name: 'Sponsor a Pet', description: 'Monthly care for one rescued animal: food, shelter and a vet check-up.' },
  { key: 'medical', name: 'Medical Fund', description: 'Emergency surgery, vaccines and medication for animals in our care.' },
  { key: 'winter', name: 'Winter Shelter Drive', description: 'Heating, bedding and extra kennels for the cold months.' },
  { key: 'spay', name: 'Community Spay & Neuter', description: 'Free and low-cost spay and neuter clinics for local families.' },
  { key: 'partners', name: 'Business Partnership', description: 'Annual partnership pledge from a local business.' },
];

const PLANS = [
  { name: 'Friend - $15 a month', price: 15, unit: 'MONTH' },
  { name: 'Guardian - $35 a month', price: 35, unit: 'MONTH' },
  { name: 'Hero - $75 a month', price: 75, unit: 'MONTH' },
  { name: 'Champion - $300 a year', price: 300, unit: 'YEAR' },
];

const FIRST = ['Maya', 'Daniel', 'Sofia', 'Liam', 'Amira', 'Noah', 'Priya', 'Lucas', 'Hannah', 'Omar', 'Grace', 'Ethan', 'Chloe', 'Yusuf', 'Isabella', 'Mateo', 'Zoe', 'Kenji', 'Leila', 'Samuel', 'Ava', 'Jonas', 'Nadia', 'Elena', 'Theo', 'Mia', 'Ruben', 'Aisha', 'Felix', 'Ines'];
const LAST = ['Chen', 'Okafor', 'Alvarez', "O'Brien", 'Haddad', 'Fischer', 'Raman', 'Moreau', 'Kim', 'Benali', 'Mensah', 'Novak', 'Martin', 'Demir', 'Rossi', 'Silva', 'Thompson', 'Watanabe', 'Karimi', 'Adeyemi', 'Johnson', 'Berg', 'Petrova', 'Garcia', 'Laurent', 'Hoffmann', 'Costa', 'Rahman', 'Weber', 'Duarte'];

function makeDonors(count) {
  const used = new Set();
  const donors = [];
  while (donors.length < count) {
    const given = pick(FIRST);
    const surname = pick(LAST);
    const key = `${given} ${surname}`;
    if (used.has(key)) continue;
    used.add(key);
    const handle = `${given}.${surname}`.toLowerCase().replace(/[^a-z.]/g, '');
    donors.push({ given, surname, email: `${handle}@example.com` });
  }
  return donors;
}

const BUSINESSES = [
  { name: 'Bluebell Bakery', contact: ['Rosa', 'Lindqvist'] },
  { name: 'Cedar & Sage Dental', contact: ['Marcus', 'Bell'] },
  { name: 'Riverside Hardware Co.', contact: ['Tom', 'Okoro'] },
  { name: 'Lumen Yoga Studio', contact: ['Sana', 'Iqbal'] },
  { name: 'Maple Street Books', contact: ['Claire', 'Dubois'] },
  { name: 'Kitecraft Design Studio', contact: ['Arjun', 'Mehta'] },
  { name: 'Fernwood Coffee Roasters', contact: ['Lena', 'Park'] },
].map(({ name, contact: [given, surname] }) => ({
  given,
  surname,
  business: name,
  email: `${given}.${surname}`.toLowerCase().replace(/[^a-z.]/g, '') + '@example.com',
}));

// Every gift is an invoice: `state` says how far it got, `payments` and `refunds` are recorded
// against it with their own dates and methods.
function planGifts() {
  const gifts = [];
  const donors = makeDonors(27);
  const sponsors = donors.slice(0, 7);
  const occasional = donors.slice(7);

  // Monthly sponsors, paid by standing bank transfer. The last three stopped giving: the
  // "who is drifting away" story the dashboard and the agent are built around.
  sponsors.forEach((donor, i) => {
    const amount = pick([15, 15, 35, 35, 75]);
    const startMonth = between(3, 6);
    const lastMonth = i >= 4 ? between(2, 3) : 0;
    const day = between(1, 20);
    for (let m = startMonth; m >= lastMonth; m--) {
      const invoiceDate = monthDay(m, day);
      if (invoiceDate > today) continue;
      gifts.push({
        donor,
        program: 'sponsor',
        amount,
        invoiceDate,
        dueDate: addDays(invoiceDate, 7),
        state: 'paid',
        payments: [{ amount, date: addDays(invoiceDate, between(0, 3)), method: 'BANK_TRANSFER' }],
      });
    }
  });

  // One-off gifts across the year; about a third of these donors gave again.
  occasional.forEach((donor) => {
    const firstMonth = between(1, 11);
    const visits = random() < 0.35 && firstMonth > 2 ? [firstMonth, firstMonth - between(1, 2)] : [firstMonth];
    for (const m of visits) {
      const invoiceDate = monthDay(m, between(1, 28));
      if (invoiceDate > today) continue;
      const amount = pick([20, 25, 50, 50, 75, 100, 100, 150, 250, 500]);
      const winterMonth = [0, 1, 10, 11].includes(invoiceDate.getUTCMonth());
      gifts.push({
        donor,
        program: winterMonth ? pick(['winter', 'winter', 'medical']) : pick(['medical', 'spay', 'medical']),
        amount,
        invoiceDate,
        dueDate: addDays(invoiceDate, 14),
        state: 'paid',
        payments: [{ amount, date: addDays(invoiceDate, between(0, 5)), method: pick(['CHECK', 'CASH', 'CREDIT_CARD', 'OTHER']) }],
      });
    }
  });

  // A check that was deposited twice and refunded.
  const duplicate = gifts.find((gift) => gift.program !== 'sponsor' && gift.amount >= 50);
  if (duplicate) {
    gifts.push({
      ...duplicate,
      state: 'refunded',
      payments: [{ ...duplicate.payments[0], method: 'CHECK' }],
      refunds: [{ amount: duplicate.amount, date: addDays(duplicate.payments[0].date, 4), method: 'CHECK' }],
    });
  }

  // Business partnership pledges: the ones the agent chases.
  const [bluebell, cedar, riverside, lumen, maple, kitecraft, fernwood] = BUSINESSES;
  const pledge = (donor, amount, issuedDaysAgo, termDays, extra) => {
    const invoiceDate = daysAgo(issuedDaysAgo);
    return { donor, program: 'partners', amount, invoiceDate, dueDate: addDays(invoiceDate, termDays), ...extra };
  };
  gifts.push(
    pledge(bluebell, 1200, 150, 30, { state: 'paid', payments: [{ amount: 1200, date: daysAgo(138), method: 'BANK_TRANSFER' }] }),
    pledge(kitecraft, 3000, 240, 30, { state: 'paid', payments: [{ amount: 3000, date: daysAgo(221), method: 'BANK_TRANSFER' }] }),
    pledge(cedar, 2500, 70, 30, { state: 'open' }),
    pledge(riverside, 750, 50, 30, { state: 'open' }),
    pledge(lumen, 1000, 60, 45, { state: 'open', partial: true, payments: [{ amount: 400, date: daysAgo(30), method: 'BANK_TRANSFER' }] }),
    pledge(maple, 500, 10, 30, { state: 'open' }),
    pledge(fernwood, 1500, 2, 30, { state: 'draft', note: 'Winter Gala table sponsorship' }),
    pledge(riverside, 400, 120, 30, { state: 'cancelled', note: 'Spring fair stand, event cancelled' }),
  );

  return gifts.sort((a, b) => a.invoiceDate - b.invoiceDate);
}

// --- Writers ---------------------------------------------------------------------------

async function createPrograms() {
  const ids = {};
  for (const program of PROGRAMS) {
    const product = await paypal('POST', '/v1/catalogs/products', {
      name: program.name,
      description: program.description,
      type: 'SERVICE',
    });
    ids[program.key] = product.id;
  }
  return ids;
}

async function createPlans(sponsorProductId) {
  for (const plan of PLANS) {
    await paypal('POST', '/v1/billing/plans', {
      product_id: sponsorProductId,
      name: plan.name,
      description: `Monthly giving tier for ${ORG}.`,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: { interval_unit: plan.unit, interval_count: 1 },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: money(plan.price) },
        },
      ],
      payment_preferences: { auto_bill_outstanding: true, payment_failure_threshold: 3 },
    });
  }
}

async function recordGift(gift, number) {
  const program = PROGRAMS.find((p) => p.key === gift.program);
  const invoice = await paypal('POST', '/v2/invoicing/invoices', {
    detail: {
      invoice_number: number,
      reference: 'demo-seed',
      currency_code: 'USD',
      invoice_date: iso(gift.invoiceDate),
      payment_term: { term_type: 'DUE_ON_DATE_SPECIFIED', due_date: iso(gift.dueDate) },
      note: gift.note ?? `Thank you for supporting ${ORG}.`,
    },
    invoicer: { business_name: ORG },
    primary_recipients: [
      {
        billing_info: {
          name: { given_name: gift.donor.given, surname: gift.donor.surname },
          email_address: gift.donor.email,
          ...(gift.donor.business && { business_name: gift.donor.business }),
        },
      },
    ],
    items: [{ name: program.name, description: program.description, quantity: '1', unit_amount: money(gift.amount) }],
    configuration: { partial_payment: { allow_partial_payment: Boolean(gift.partial) } },
  });
  const id = invoice.id ?? invoice.href?.split('/').pop();
  if (gift.state === 'draft') return;

  await paypal('POST', `/v2/invoicing/invoices/${id}/send`, { send_to_invoicer: false, send_to_recipient: false });
  if (gift.state === 'cancelled') {
    await paypal('POST', `/v2/invoicing/invoices/${id}/cancel`, { send_to_invoicer: false, send_to_recipient: false });
    return;
  }
  for (const payment of gift.payments ?? []) {
    await paypal('POST', `/v2/invoicing/invoices/${id}/payments`, {
      method: payment.method,
      payment_date: iso(payment.date),
      amount: money(payment.amount),
    });
  }
  for (const refund of gift.refunds ?? []) {
    await paypal('POST', `/v2/invoicing/invoices/${id}/refunds`, {
      method: refund.method,
      refund_date: iso(refund.date),
      amount: money(refund.amount),
    });
  }
}

// This week's online donations to the winter appeal, paid by card. Orders can't be backdated,
// so these are the live end of the timeline.
const CARD_COUNTRIES = [
  ['US', 'Portland', 'OR', '97205'],
  ['US', 'Austin', 'TX', '78701'],
  ['US', 'Chicago', 'IL', '60601'],
  ['US', 'Seattle', 'WA', '98101'],
  ['CA', 'Toronto', 'ON', 'M5V 2T6'],
  ['GB', 'London', null, 'EC1A 1BB'],
  ['FR', 'Lyon', null, '69001'],
  ['MA', 'Casablanca', null, '20000'],
];

async function donateByCard(donor, amount, campaign) {
  const [country, city, state, postal] = pick(CARD_COUNTRIES);
  const order = await paypal('POST', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [
      {
        description: campaign,
        custom_id: donor.email,
        soft_descriptor: 'HARBORLANE',
        amount: money(amount),
      },
    ],
    payment_source: {
      card: {
        // PayPal's published sandbox Visa test number.
        number: '4111111111111111',
        expiry: '2030-12',
        security_code: '123',
        name: `${donor.given} ${donor.surname}`,
        billing_address: {
          address_line_1: '1 Main St',
          admin_area_2: city,
          ...(state && { admin_area_1: state }),
          postal_code: postal,
          country_code: country,
        },
      },
    },
  });
  return order.purchase_units?.[0]?.payments?.captures?.[0];
}

// --- Run ---------------------------------------------------------------------------------

async function alreadySeeded() {
  const page = await paypal('GET', '/v2/invoicing/invoices?page=1&page_size=50&total_required=true');
  return (page.items ?? []).some((item) => item.detail?.invoice_number?.startsWith(`${INVOICE_PREFIX}-`));
}

async function main() {
  if (!force && (await alreadySeeded())) {
    console.log(`The sandbox already holds ${ORG} invoices. Run with --force to add another batch.`);
    return;
  }
  const batch = force ? `${Date.now().toString(36).toUpperCase()}-` : '';

  console.log(`Seeding the PayPal sandbox for ${ORG}`);
  console.log('1/4 Programs and monthly-giving plans');
  const productIds = await createPrograms();
  await createPlans(productIds.sponsor);

  const gifts = planGifts();
  console.log(`2/4 ${gifts.length} gifts and pledges through Invoicing`);
  let sequence = 0;
  await inPool(gifts, (gift) => recordGift(gift, `${INVOICE_PREFIX}-${batch}${String(++sequence).padStart(4, '0')}`));

  console.log('3/4 Online donations to the Winter Shelter Drive (sandbox test card)');
  const donors = makeDonors(12);
  const captures = [];
  for (const donor of donors) {
    const amount = pick([10, 20, 25, 25, 40, 50, 50, 100, 150, 250]);
    const campaign = pick(['Winter Shelter Drive', 'Winter Shelter Drive', 'Medical Fund']);
    try {
      captures.push({ donor, amount, capture: await donateByCard(donor, amount, campaign) });
    } catch (error) {
      console.warn(`  skipped a donation from ${donor.given}: ${error.message.slice(0, 160)}`);
    }
  }

  console.log('4/4 Refund of a duplicate online donation');
  const first = captures[0];
  const duplicate = first && (await donateByCard(first.donor, first.amount, 'Winter Shelter Drive'));
  if (duplicate?.id) {
    await paypal('POST', `/v2/payments/captures/${duplicate.id}/refund`, {
      amount: money(first.amount),
      note_to_payer: 'Refund of a duplicate donation. Thank you for your generosity!',
    });
  }

  const raised = gifts.reduce((sum, gift) => sum + (gift.payments ?? []).reduce((s, p) => s + p.amount, 0), 0);
  console.log(
    `Done: ${gifts.length} invoices, $${raised.toLocaleString('en-US')} recorded, ${captures.length + 1} card donations (1 refunded).`,
  );
  console.log('Card donations take up to 3 hours to appear in PayPal Transaction Search.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
