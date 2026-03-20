export type MetalId = "gold" | "silver" | "platinum" | "palladium";

export interface MetalPrice {
  id: MetalId;
  name: string;
  symbol: string;
  price: number;
  prevOpen: number;
  prevClose: number;
  high24h: number;
  low24h: number;
  change: number;
  changePercent: number;
  unit: string;
  purity: string;
  timestamp: Date;
}

const BASE_PRICES: Record<MetalId, number> = {
  gold: 6432.5,
  silver: 78.3,
  platinum: 2891.0,
  palladium: 3450.75,
};

function randomVariation(base: number, pct = 0.015): number {
  const delta = base * pct * (Math.random() * 2 - 1);
  return parseFloat((base + delta).toFixed(2));
}

function simulateMetalData(id: MetalId): MetalPrice {
  const meta: Record<
    MetalId,
    { name: string; symbol: string; purity: string; unit: string }
  > = {
    gold: { name: "Gold", symbol: "XAU", purity: "24K", unit: "per gram" },
    silver: {
      name: "Silver",
      symbol: "XAG",
      purity: "999",
      unit: "per gram",
    },
    platinum: {
      name: "Platinum",
      symbol: "XPT",
      purity: "950",
      unit: "per gram",
    },
    palladium: {
      name: "Palladium",
      symbol: "XPD",
      purity: "999.5",
      unit: "per gram",
    },
  };

  const base = BASE_PRICES[id];
  const price = randomVariation(base, 0.01);
  const prevClose = randomVariation(base, 0.02);
  const prevOpen = randomVariation(prevClose, 0.01);
  const high24h = Math.max(price, prevClose) + randomVariation(base * 0.005);
  const low24h = Math.min(price, prevClose) - randomVariation(base * 0.003);
  const change = parseFloat((price - prevClose).toFixed(2));
  const changePercent = parseFloat(((change / prevClose) * 100).toFixed(2));

  return {
    id,
    ...meta[id],
    price,
    prevOpen,
    prevClose,
    high24h: parseFloat(high24h.toFixed(2)),
    low24h: parseFloat(low24h.toFixed(2)),
    change,
    changePercent,
    timestamp: new Date(),
  };
}

const DELAYS: Record<MetalId, number> = {
  gold: 400,
  silver: 700,
  platinum: 1100,
  palladium: 1500,
};

export async function fetchMetalPrice(id: MetalId): Promise<MetalPrice> {
  await new Promise((resolve) => setTimeout(resolve, DELAYS[id]));
  if (Math.random() < 0.05) {
    throw new Error("Network error. Please try again.");
  }
  return simulateMetalData(id);
}

export const METALS: MetalId[] = ["gold", "silver", "platinum", "palladium"];
