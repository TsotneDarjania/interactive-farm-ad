export const ObjectType = {
  CHICKEN: "chicken",
  COW: "cow",
  PIG: "pig",
  SHEEP: "sheep",
  FENCE: "fence",
} as const;

export type ObjectType = (typeof ObjectType)[keyof typeof ObjectType];

export const UI_ITEMS = [
  { id: ObjectType.CHICKEN, icon: "🐔", price: 25, reward: 25 },
  { id: ObjectType.PIG, icon: "🐷", price: 50, reward: 50 },
  { id: ObjectType.SHEEP, icon: "🐑", price: 80, reward: 80 },
  { id: ObjectType.COW, icon: "🐮", price: 150, reward: 150 },
  { id: ObjectType.FENCE, icon: "🚧", price: 200, reward: 0 },
] as const;
