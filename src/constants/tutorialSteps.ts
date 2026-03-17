export const TUTORIAL_STEP = {
  HARVEST_WHEAT: "harvest_wheat",
  BUY_FENCE: "buy_fence",
  BUY_CHICKEN: "buy_chicken",
} as const;

export type TutorialStep = typeof TUTORIAL_STEP[keyof typeof TUTORIAL_STEP];