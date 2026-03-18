// ძველი enum-ის ნაცვლად ვიყენებთ const ობიექტს
export const TutorialState = {
  INIT: "INIT",
  WAITING_FOR_MOVE: "WAITING_FOR_MOVE",
  HARVESTING: "HARVESTING",
  BUYING_FENCE: "BUYING_FENCE",
  COMPLETED: "COMPLETED",
} as const;

// ვქმნით ტიპს, რომელსაც ავტომატურად იგივე მნიშვნელობები ექნება
export type TutorialState = (typeof TutorialState)[keyof typeof TutorialState];

export const TUTORIAL_STEP = {
  HARVEST_WHEAT: "harvest_wheat",
  BUY_FENCE: "buy_fence",
  BUY_CHICKEN: "buy_chicken",
} as const;

export type TutorialStep = (typeof TUTORIAL_STEP)[keyof typeof TUTORIAL_STEP];
