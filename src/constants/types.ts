export const ObjectType = {
  CHICKEN: "chicken",
  COW: "cow",
  PIG: "pig",
  SHEEP: "sheep",
  FENCE: "fence",
  WHEAT: "wheat",
} as const;

export type ObjectType = (typeof ObjectType)[keyof typeof ObjectType];

export const UI_ITEMS = [
  { id: ObjectType.CHICKEN, icon: "🐔", price: 20, reward: 50 },
  { id: ObjectType.PIG, icon: "🐷", price: 100, reward: 100 },
  { id: ObjectType.SHEEP, icon: "🐑", price: 150, reward: 200 },
  { id: ObjectType.COW, icon: "🐮", price: 200, reward: 300 },
] as const;

export const WORLD_RESOURCES = {
  [ObjectType.WHEAT]: { id: ObjectType.WHEAT, icon: "🌾", reward: 75 },
} as const;
