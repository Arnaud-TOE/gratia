// The demo nonprofit and the product, shared by the donor pages, the server and the agent. Safe to
// import from client components: it pulls in nothing server-side.

export const ORGANIZATION = 'Harbor Lane Animal Rescue';
export const PRODUCT = 'Gratia';

// What the rescue aims to raise for each campaign over the year, shown against what came in.
export const CAMPAIGN_GOALS: Readonly<Record<string, number>> = {
  'Business Partnership': 12_000,
  'Medical Fund': 3_000,
  'Sponsor a Pet': 3_000,
  'Winter Shelter Drive': 1_500,
  'Community Spay & Neuter': 1_000,
};

export const goalFor = (campaign: string): number | null => CAMPAIGN_GOALS[campaign] ?? null;
