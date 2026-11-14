export const clockFixture = {
  sol: 3,
  totalSols: 8,
  marsTime: "14:20",
  cycle: "afternoon" as const,
};

export const resourcesFixture = [
  { key: "shielding" as const, value: 72 },
  { key: "food" as const, value: 55 },
  { key: "lifeSupport" as const, value: 88 },
  { key: "power" as const, value: 40 },
];