// Several gifts in a row from one donor read as one line in the feed: "4 gifts, $175". Otherwise a donor who
// gives a few times in a day pushes everyone else off the list.

export type FeedGift = { key: string; donor: string; day: string; amount: number; program: string | null };
export type FeedLine = FeedGift & { count: number };

/** Joins consecutive gifts from the same donor, newest first. A line keeps its newest gift's key and day. */
export function groupRuns(gifts: readonly FeedGift[]): FeedLine[] {
  const lines: FeedLine[] = [];
  for (const gift of gifts) {
    const last = lines.at(-1);
    if (last && last.donor === gift.donor) {
      last.count += 1;
      last.amount = Math.round((last.amount + gift.amount) * 100) / 100;
      if (last.program !== gift.program) last.program = null;
    } else {
      lines.push({ ...gift, count: 1 });
    }
  }
  return lines;
}
