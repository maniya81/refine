import dayjs from "dayjs";

import type { LeadPotentialResponse } from "@/services/lead.service";

interface MappedDealData {
  timeUnix: number;
  timeText: string;
  value: number;
  state: string;
}

/**
 * Map lead potential data from the API to chart format
 * Converts API response: { won: [{month, potential}], lost: [{month, potential}] }
 * To chart format: [{ timeUnix, timeText, value, state }]
 */
export const mapDealsData = (
  potentialData?: LeadPotentialResponse,
): MappedDealData[] => {
  if (!potentialData) return [];

  const wonDeals = (potentialData.won || []).map((item) => {
    const date = dayjs(item.month);
    return {
      timeUnix: date.unix(),
      timeText: date.format("MMM YYYY"),
      value: item.potential,
      state: "Won",
    };
  });

  const lostDeals = (potentialData.lost || []).map((item) => {
    const date = dayjs(item.month);
    return {
      timeUnix: date.unix(),
      timeText: date.format("MMM YYYY"),
      value: item.potential,
      state: "Lost",
    };
  });

  return [...wonDeals, ...lostDeals].sort((a, b) => a.timeUnix - b.timeUnix);
};
