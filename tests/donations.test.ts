import { describe, expect, it } from 'vitest';
import { parseDonation } from '@/lib/donations';

describe('parseDonation', () => {
  it('accepts a known campaign and rounds the amount to cents', () => {
    expect(parseDonation({ amount: 25.005, campaign: 'Medical Fund' })).toEqual({ amount: 25.01, campaign: 'Medical Fund' });
  });

  it.each([
    [{ amount: '25', campaign: 'Medical Fund' }, 'Amount must be a number.'],
    [{ amount: Number.NaN, campaign: 'Medical Fund' }, 'Amount must be a number.'],
    [{ amount: 0.5, campaign: 'Medical Fund' }, 'Donations must be between $1 and $10,000.'],
    [{ amount: 10_000.01, campaign: 'Medical Fund' }, 'Donations must be between $1 and $10,000.'],
    [{ amount: 25, campaign: 'Something else' }, 'Unknown campaign.'],
    [null, 'Amount must be a number.'],
  ])('rejects %j', (input, error) => {
    expect(parseDonation(input)).toEqual({ error });
  });
});
