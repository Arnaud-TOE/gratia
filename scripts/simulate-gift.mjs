// Records one gift in the PayPal sandbox the way the donation page does (a paid receipt in
// Invoicing), without going through checkout. For watching an open dashboard pick a gift up live.
//
// Usage: npm run simulate-gift -- 50 "Winter Shelter Drive" "Alex Rivera"
//
// Sandbox only: the base URL is fixed, and the donor is fictional.

import { randomUUID } from 'node:crypto';

const BASE_URL = 'https://api-m.sandbox.paypal.com';
const ORG = 'Harbor Lane Animal Rescue';

const [amount = '50', campaign = 'Winter Shelter Drive', donor = 'Alex Rivera'] = process.argv.slice(2);
const { PAYPAL_CLIENT_ID: clientId, PAYPAL_SECRET: secret } = process.env;
if (!clientId || !secret) {
  console.error('PAYPAL_CLIENT_ID and PAYPAL_SECRET must be set (run through `npm run simulate-gift`, which loads .env.local).');
  process.exit(1);
}

const auth = await fetch(`${BASE_URL}/v1/oauth2/token`, {
  method: 'POST',
  headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}` },
  body: new URLSearchParams({ grant_type: 'client_credentials' }),
});
if (!auth.ok) throw new Error(`PayPal refused the credentials: HTTP ${auth.status}`);
const { access_token: token } = await auth.json();

async function paypal(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

const today = new Date().toISOString().slice(0, 10);
const [given, ...rest] = donor.split(' ');
const value = Number(amount).toFixed(2);
const number = `HLAR-SIM-${randomUUID().slice(0, 8).toUpperCase()}`;

const invoice = await paypal('/v2/invoicing/invoices', {
  detail: {
    invoice_number: number,
    reference: 'simulated-gift',
    currency_code: 'USD',
    invoice_date: today,
    payment_term: { term_type: 'DUE_ON_RECEIPT' },
    note: `Thank you for supporting ${ORG}.`,
  },
  invoicer: { business_name: ORG },
  primary_recipients: [
    { billing_info: { name: { given_name: given, surname: rest.join(' ') }, email_address: `${donor.toLowerCase().replaceAll(' ', '.')}@example.com` } },
  ],
  items: [{ name: campaign, description: 'Online donation', quantity: '1', unit_amount: { currency_code: 'USD', value } }],
});
const id = invoice.id ?? invoice.href?.split('/').pop();
await paypal(`/v2/invoicing/invoices/${id}/send`, { send_to_invoicer: false, send_to_recipient: false });
await paypal(`/v2/invoicing/invoices/${id}/payments`, {
  method: 'PAYPAL',
  payment_date: today,
  amount: { currency_code: 'USD', value },
  note: 'Simulated gift',
});
console.log(`${number}: $${value} from ${donor} to ${campaign}`);
