export const ObjectType = {
  CHICKEN: "chicken",
  COW: "cow",
  PIG: "pig",
  SHEEP: "sheep",
  FENCE: "fence",
} as const;

export type ObjectType = (typeof ObjectType)[keyof typeof ObjectType];

export const UI_ITEMS = [
  { id: ObjectType.FENCE, icon: "🚧", price: 25, reward: 0 }, // <--- ღობე ყველაზე იაფია
  { id: ObjectType.CHICKEN, icon: "🐔", price: 50, reward: 25 },
  { id: ObjectType.PIG, icon: "🐷", price: 80, reward: 50 },
  { id: ObjectType.SHEEP, icon: "🐑", price: 150, reward: 80 },
  { id: ObjectType.COW, icon: "🐮", price: 250, reward: 150 },
] as const;