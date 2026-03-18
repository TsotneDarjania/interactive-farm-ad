// 1. ყველა ობიექტის ტიპი (როგორც საყიდელი, ისე მოსაგროვებელი)
export const ObjectType = {
  CHICKEN: "chicken",
  COW: "cow",
  PIG: "pig",
  SHEEP: "sheep",
  FENCE: "fence",
  WHEAT: "wheat", // <--- დავამატეთ ხორბალიც, რომ ყველგან ObjectType.WHEAT გამოვიყენოთ
} as const;

export type ObjectType = (typeof ObjectType)[keyof typeof ObjectType];

// 2. მხოლოდ შოპის მენიუს აითემები (აქ ხორბალი არ წერია, შესაბამისად შოპში არ გამოჩნდება!)
export const UI_ITEMS = [
  { id: ObjectType.CHICKEN, icon: "🐔", price: 50, reward: 25 },
  { id: ObjectType.PIG, icon: "🐷", price: 80, reward: 50 },
  { id: ObjectType.SHEEP, icon: "🐑", price: 150, reward: 80 },
  { id: ObjectType.COW, icon: "🐮", price: 250, reward: 150 },
] as const;

// 3. სამყაროს რესურსები (რასაც ვერ იყიდი, მაგრამ თამაშში არსებობს და ფულს გაძლევს)
export const WORLD_RESOURCES = {
  [ObjectType.WHEAT]: { id: ObjectType.WHEAT, icon: "🌾", reward: 75 },
} as const;