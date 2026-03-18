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
  { id: ObjectType.CHICKEN, icon: "🐔", price: 20, reward: 50 },
  { id: ObjectType.PIG, icon: "🐷", price: 100, reward: 100 },
  { id: ObjectType.SHEEP, icon: "🐑", price: 150, reward: 200 },
  { id: ObjectType.COW, icon: "🐮", price: 200, reward: 300 },
] as const;

// 3. სამყაროს რესურსები (რასაც ვერ იყიდი, მაგრამ თამაშში არსებობს და ფულს გაძლევს)
export const WORLD_RESOURCES = {
  [ObjectType.WHEAT]: { id: ObjectType.WHEAT, icon: "🌾", reward: 75 },
} as const;