import type { GroceryItem, Recipe, UseSoonItem, UserProfile } from "@/lib/types";

/**
 * Mock content for Mise. This file is only imported by the data provider
 * (`lib/data/index.ts`) — UI components never touch it directly, so it can be
 * deleted wholesale once Supabase is wired up.
 */

export const mockRecipes: Recipe[] = [
  {
    id: "overnight-oats",
    title: "Berry Overnight Oats",
    description:
      "Creamy oats soaked overnight with almond milk, chia, and a handful of berries. Zero morning effort.",
    emoji: "🫐",
    mealTypes: ["breakfast"],
    tags: ["vegetarian", "quick"],
    prepMinutes: 5,
    cookMinutes: 0,
    servings: 1,
    nutrition: { calories: 420, protein: 14, carbs: 62, fat: 13 },
    ingredients: [
      { id: "oats", name: "Rolled oats", quantity: "80 g", category: "grains" },
      { id: "almond-milk", name: "Almond milk", quantity: "200 ml", category: "dairy" },
      { id: "chia", name: "Chia seeds", quantity: "1 tbsp", category: "pantry" },
      { id: "berries", name: "Mixed berries", quantity: "100 g", category: "produce" },
      { id: "maple", name: "Maple syrup", quantity: "1 tsp", category: "pantry" },
    ],
    steps: [
      { id: "s1", instruction: "Add the oats, chia seeds, and almond milk to a jar and stir well." },
      { id: "s2", instruction: "Stir in the maple syrup, cover, and refrigerate overnight." },
      { id: "s3", instruction: "In the morning, top with berries and a splash more milk if you like it looser." },
    ],
  },
  {
    id: "avocado-toast",
    title: "Avocado Toast & Eggs",
    description:
      "Sourdough piled with smashed avocado, jammy eggs, chili flakes, and lemon.",
    emoji: "🥑",
    mealTypes: ["breakfast", "lunch"],
    tags: ["vegetarian", "quick", "high-protein"],
    prepMinutes: 5,
    cookMinutes: 8,
    servings: 1,
    nutrition: { calories: 480, protein: 21, carbs: 38, fat: 27 },
    ingredients: [
      { id: "sourdough", name: "Sourdough bread", quantity: "2 slices", category: "grains" },
      { id: "avocado", name: "Avocado", quantity: "1", category: "produce" },
      { id: "eggs", name: "Eggs", quantity: "2", category: "dairy" },
      { id: "lemon", name: "Lemon", quantity: "½", category: "produce" },
      { id: "chili-flakes", name: "Chili flakes", quantity: "1 pinch", category: "pantry" },
    ],
    steps: [
      { id: "s1", instruction: "Bring a small pot of water to a boil and lower in the eggs.", durationMinutes: 7 },
      { id: "s2", instruction: "While the eggs cook, toast the sourdough until golden." },
      { id: "s3", instruction: "Smash the avocado with lemon juice and a pinch of salt, then spread it on the toast." },
      { id: "s4", instruction: "Peel and halve the eggs, place on top, and finish with chili flakes." },
    ],
  },
  {
    id: "greek-yogurt-bowl",
    title: "Greek Yogurt Power Bowl",
    description:
      "Thick yogurt with honey, toasted granola, and banana — a five-minute protein hit.",
    emoji: "🍯",
    mealTypes: ["breakfast", "snack"],
    tags: ["vegetarian", "quick", "high-protein", "gluten-free"],
    prepMinutes: 5,
    cookMinutes: 0,
    servings: 1,
    nutrition: { calories: 340, protein: 22, carbs: 45, fat: 9 },
    ingredients: [
      { id: "yogurt", name: "Greek yogurt", quantity: "250 g", category: "dairy" },
      { id: "granola", name: "Granola", quantity: "40 g", category: "grains" },
      { id: "banana", name: "Banana", quantity: "1", category: "produce" },
      { id: "honey", name: "Honey", quantity: "1 tbsp", category: "pantry" },
    ],
    steps: [
      { id: "s1", instruction: "Spoon the yogurt into a bowl and drizzle with honey." },
      { id: "s2", instruction: "Top with granola and sliced banana. Done." },
    ],
  },
  {
    id: "chicken-grain-bowl",
    title: "Lemon Chicken Grain Bowl",
    description:
      "Charred lemon chicken over herby quinoa with cucumber, feta, and a garlicky yogurt drizzle.",
    emoji: "🍗",
    mealTypes: ["lunch", "dinner"],
    tags: ["high-protein", "gluten-free"],
    prepMinutes: 15,
    cookMinutes: 20,
    servings: 2,
    nutrition: { calories: 560, protein: 42, carbs: 48, fat: 21 },
    ingredients: [
      { id: "chicken-thighs", name: "Chicken thighs", quantity: "400 g", category: "protein" },
      { id: "quinoa", name: "Quinoa", quantity: "150 g", category: "grains" },
      { id: "cucumber", name: "Cucumber", quantity: "1", category: "produce" },
      { id: "feta", name: "Feta", quantity: "80 g", category: "dairy" },
      { id: "lemon-2", name: "Lemons", quantity: "2", category: "produce" },
      { id: "yogurt-2", name: "Greek yogurt", quantity: "100 g", category: "dairy" },
      { id: "garlic", name: "Garlic", quantity: "2 cloves", category: "produce" },
    ],
    steps: [
      { id: "s1", instruction: "Rinse the quinoa and simmer in salted water until tender.", durationMinutes: 15 },
      { id: "s2", instruction: "Season the chicken with salt, pepper, and the zest of one lemon." },
      { id: "s3", instruction: "Sear the chicken in a hot pan until deeply golden and cooked through.", durationMinutes: 12 },
      { id: "s4", instruction: "Stir grated garlic and lemon juice into the yogurt for the drizzle." },
      { id: "s5", instruction: "Fluff the quinoa, top with sliced chicken, cucumber, and feta, then drizzle with the yogurt sauce." },
    ],
  },
  {
    id: "rainbow-salad",
    title: "Crunchy Rainbow Salad",
    description:
      "Shredded cabbage, carrot, peppers, and chickpeas tossed in a tahini-lime dressing.",
    emoji: "🥗",
    mealTypes: ["lunch"],
    tags: ["vegan", "vegetarian", "quick", "gluten-free"],
    prepMinutes: 15,
    cookMinutes: 0,
    servings: 2,
    nutrition: { calories: 380, protein: 13, carbs: 42, fat: 19 },
    ingredients: [
      { id: "cabbage", name: "Red cabbage", quantity: "¼ head", category: "produce" },
      { id: "carrot", name: "Carrots", quantity: "2", category: "produce" },
      { id: "pepper", name: "Bell pepper", quantity: "1", category: "produce" },
      { id: "chickpeas", name: "Chickpeas (can)", quantity: "1", category: "pantry" },
      { id: "tahini", name: "Tahini", quantity: "2 tbsp", category: "pantry" },
      { id: "lime", name: "Limes", quantity: "2", category: "produce" },
    ],
    steps: [
      { id: "s1", instruction: "Finely shred the cabbage and julienne the carrots and pepper." },
      { id: "s2", instruction: "Whisk tahini, lime juice, a splash of water, and salt into a pourable dressing." },
      { id: "s3", instruction: "Toss the vegetables and drained chickpeas with the dressing and let sit 5 minutes before serving." },
    ],
  },
  {
    id: "salmon-teriyaki",
    title: "Teriyaki Salmon & Rice",
    description:
      "Glazed salmon fillets with sticky rice and charred broccoli. Weeknight favorite.",
    emoji: "🍣",
    mealTypes: ["dinner"],
    tags: ["high-protein"],
    prepMinutes: 10,
    cookMinutes: 20,
    servings: 2,
    nutrition: { calories: 620, protein: 38, carbs: 58, fat: 24 },
    ingredients: [
      { id: "salmon", name: "Salmon fillets", quantity: "2", category: "protein" },
      { id: "rice", name: "Sushi rice", quantity: "150 g", category: "grains" },
      { id: "broccoli", name: "Broccoli", quantity: "1 head", category: "produce" },
      { id: "soy", name: "Soy sauce", quantity: "3 tbsp", category: "pantry" },
      { id: "mirin", name: "Mirin", quantity: "2 tbsp", category: "pantry" },
      { id: "ginger", name: "Fresh ginger", quantity: "1 thumb", category: "produce" },
    ],
    steps: [
      { id: "s1", instruction: "Rinse the rice and cook it according to the package.", durationMinutes: 15 },
      { id: "s2", instruction: "Simmer soy sauce, mirin, grated ginger, and a spoon of sugar until syrupy.", durationMinutes: 4 },
      { id: "s3", instruction: "Pan-sear the salmon skin-side down, then flip and brush generously with the glaze.", durationMinutes: 8 },
      { id: "s4", instruction: "Char the broccoli in the same pan with a splash of water to steam it through." },
      { id: "s5", instruction: "Serve the salmon over rice, spoon over the remaining glaze, and add the broccoli." },
    ],
  },
  {
    id: "veggie-stir-fry",
    title: "Ginger Veggie Stir-Fry",
    description:
      "Crisp vegetables and tofu flash-fried in a ginger-garlic sauce over noodles.",
    emoji: "🥦",
    mealTypes: ["dinner"],
    tags: ["vegan", "vegetarian", "quick"],
    prepMinutes: 10,
    cookMinutes: 10,
    servings: 2,
    nutrition: { calories: 490, protein: 24, carbs: 56, fat: 18 },
    ingredients: [
      { id: "tofu", name: "Firm tofu", quantity: "300 g", category: "protein" },
      { id: "noodles", name: "Egg noodles", quantity: "2 nests", category: "grains" },
      { id: "snap-peas", name: "Snap peas", quantity: "150 g", category: "produce" },
      { id: "pepper-2", name: "Bell pepper", quantity: "1", category: "produce" },
      { id: "ginger-2", name: "Fresh ginger", quantity: "1 thumb", category: "produce" },
      { id: "soy-2", name: "Soy sauce", quantity: "3 tbsp", category: "pantry" },
      { id: "sesame", name: "Sesame oil", quantity: "1 tbsp", category: "pantry" },
    ],
    steps: [
      { id: "s1", instruction: "Press and cube the tofu, then fry in a hot wok until golden on all sides.", durationMinutes: 6 },
      { id: "s2", instruction: "Cook the noodles and drain.", durationMinutes: 4 },
      { id: "s3", instruction: "Stir-fry the vegetables with grated ginger, keeping them crisp.", durationMinutes: 3 },
      { id: "s4", instruction: "Return the tofu, add soy sauce and sesame oil, toss with the noodles, and serve hot." },
    ],
  },
  {
    id: "chili-con-carne",
    title: "Slow Chili con Carne",
    description:
      "Deep, smoky beef chili with beans — better the next day, perfect for meal prep.",
    emoji: "🌶️",
    mealTypes: ["dinner"],
    tags: ["high-protein", "comfort", "gluten-free"],
    prepMinutes: 15,
    cookMinutes: 60,
    servings: 4,
    nutrition: { calories: 540, protein: 36, carbs: 44, fat: 22 },
    ingredients: [
      { id: "beef", name: "Ground beef", quantity: "500 g", category: "protein" },
      { id: "onion", name: "Onions", quantity: "2", category: "produce" },
      { id: "kidney-beans", name: "Kidney beans (can)", quantity: "2", category: "pantry" },
      { id: "tomatoes", name: "Chopped tomatoes (can)", quantity: "2", category: "pantry" },
      { id: "chipotle", name: "Chipotle paste", quantity: "1 tbsp", category: "pantry" },
      { id: "rice-2", name: "Long-grain rice", quantity: "300 g", category: "grains" },
    ],
    steps: [
      { id: "s1", instruction: "Brown the beef hard in a big pot — don't rush this, it's the flavor base.", durationMinutes: 8 },
      { id: "s2", instruction: "Add diced onions and cook until soft and sweet.", durationMinutes: 6 },
      { id: "s3", instruction: "Stir in chipotle paste, tomatoes, and a cup of water. Season well." },
      { id: "s4", instruction: "Simmer low and slow, partially covered, stirring now and then.", durationMinutes: 45 },
      { id: "s5", instruction: "Add the beans for the last 10 minutes and serve over rice." },
    ],
  },
  {
    id: "hummus-plate",
    title: "Hummus & Veggie Plate",
    description:
      "Creamy hummus with crunchy vegetables and warm pita — the ideal afternoon snack.",
    emoji: "🥕",
    mealTypes: ["snack"],
    tags: ["vegan", "vegetarian", "quick"],
    prepMinutes: 5,
    cookMinutes: 0,
    servings: 1,
    nutrition: { calories: 260, protein: 9, carbs: 32, fat: 11 },
    ingredients: [
      { id: "hummus", name: "Hummus", quantity: "100 g", category: "pantry" },
      { id: "carrot-2", name: "Carrots", quantity: "2", category: "produce" },
      { id: "cucumber-2", name: "Cucumber", quantity: "½", category: "produce" },
      { id: "pita", name: "Pita bread", quantity: "1", category: "grains" },
    ],
    steps: [
      { id: "s1", instruction: "Warm the pita and cut it into wedges." },
      { id: "s2", instruction: "Cut the vegetables into sticks and arrange everything around the hummus." },
    ],
  },
  {
    id: "apple-almond",
    title: "Apple & Almond Butter",
    description: "Crisp apple slices with a generous swipe of almond butter and cinnamon.",
    emoji: "🍎",
    mealTypes: ["snack"],
    tags: ["vegan", "vegetarian", "quick", "gluten-free"],
    prepMinutes: 3,
    cookMinutes: 0,
    servings: 1,
    nutrition: { calories: 220, protein: 6, carbs: 28, fat: 11 },
    ingredients: [
      { id: "apple", name: "Apples", quantity: "1", category: "produce" },
      { id: "almond-butter", name: "Almond butter", quantity: "2 tbsp", category: "pantry" },
      { id: "cinnamon", name: "Cinnamon", quantity: "1 pinch", category: "pantry" },
    ],
    steps: [
      { id: "s1", instruction: "Slice the apple, spread with almond butter, and dust with cinnamon." },
    ],
  },
];

/**
 * Weekly rotation used to build the mock plan. Index = day of week (0 = Sunday).
 */
export const weeklyRotation: Record<string, [string, string, string, string]> = {
  breakfast: [
    "greek-yogurt-bowl",
    "overnight-oats",
    "avocado-toast",
    "overnight-oats",
  ] as [string, string, string, string],
  lunch: [
    "rainbow-salad",
    "chicken-grain-bowl",
    "avocado-toast",
    "rainbow-salad",
  ] as [string, string, string, string],
  dinner: [
    "salmon-teriyaki",
    "veggie-stir-fry",
    "chili-con-carne",
    "chicken-grain-bowl",
  ] as [string, string, string, string],
  snack: [
    "apple-almond",
    "hummus-plate",
    "greek-yogurt-bowl",
    "apple-almond",
  ] as [string, string, string, string],
};

export const mockGroceryItems: GroceryItem[] = [
  { id: "g-berries", name: "Mixed berries", quantity: "300 g", category: "produce" },
  { id: "g-avocado", name: "Avocados", quantity: "3", category: "produce" },
  { id: "g-banana", name: "Bananas", quantity: "1 bunch", category: "produce" },
  { id: "g-lemon", name: "Lemons", quantity: "4", category: "produce" },
  { id: "g-cucumber", name: "Cucumbers", quantity: "2", category: "produce" },
  { id: "g-broccoli", name: "Broccoli", quantity: "1 head", category: "produce" },
  { id: "g-snap-peas", name: "Snap peas", quantity: "150 g", category: "produce" },
  { id: "g-pepper", name: "Bell peppers", quantity: "3", category: "produce" },
  { id: "g-carrot", name: "Carrots", quantity: "1 bag", category: "produce" },
  { id: "g-ginger", name: "Fresh ginger", quantity: "1 piece", category: "produce" },
  { id: "g-chicken", name: "Chicken thighs", quantity: "400 g", category: "protein" },
  { id: "g-salmon", name: "Salmon fillets", quantity: "2", category: "protein" },
  { id: "g-beef", name: "Ground beef", quantity: "500 g", category: "protein" },
  { id: "g-tofu", name: "Firm tofu", quantity: "300 g", category: "protein" },
  { id: "g-yogurt", name: "Greek yogurt", quantity: "1 kg", category: "dairy" },
  { id: "g-eggs", name: "Eggs", quantity: "1 dozen", category: "dairy" },
  { id: "g-feta", name: "Feta", quantity: "200 g", category: "dairy" },
  { id: "g-almond-milk", name: "Almond milk", quantity: "1 L", category: "dairy" },
  { id: "g-sourdough", name: "Sourdough loaf", quantity: "1", category: "grains" },
  { id: "g-oats", name: "Rolled oats", quantity: "500 g", category: "grains" },
  { id: "g-quinoa", name: "Quinoa", quantity: "500 g", category: "grains" },
  { id: "g-rice", name: "Sushi rice", quantity: "500 g", category: "grains" },
  { id: "g-noodles", name: "Egg noodles", quantity: "1 pack", category: "grains" },
  { id: "g-chickpeas", name: "Chickpeas (cans)", quantity: "2", category: "pantry" },
  { id: "g-kidney-beans", name: "Kidney beans (cans)", quantity: "2", category: "pantry" },
  { id: "g-tomatoes", name: "Chopped tomatoes (cans)", quantity: "2", category: "pantry" },
  { id: "g-tahini", name: "Tahini", quantity: "1 jar", category: "pantry" },
  { id: "g-soy", name: "Soy sauce", quantity: "1 bottle", category: "pantry" },
  { id: "g-almond-butter", name: "Almond butter", quantity: "1 jar", category: "pantry" },
  { id: "g-honey", name: "Honey", quantity: "1 jar", category: "pantry" },
  { id: "g-peas", name: "Frozen peas", quantity: "1 bag", category: "frozen" },
  { id: "g-foil", name: "Aluminium foil", quantity: "1 roll", category: "other" },
];

/** Curated stand-in for "what's about to expire" until real pantry tracking exists. */
export const mockUseSoon: UseSoonItem[] = [
  { id: "u-yogurt", name: "Greek yogurt", emoji: "🥛", daysLeft: 1 },
  { id: "u-cucumber", name: "Cucumbers", emoji: "🥒", daysLeft: 2 },
  { id: "u-salmon", name: "Salmon fillets", emoji: "🐟", daysLeft: 1 },
  { id: "u-berries", name: "Mixed berries", emoji: "🫐", daysLeft: 3 },
];

export const mockProfile: UserProfile = {
  name: "Alex",
  goals: { calories: 2200, protein: 120, carbs: 250, fat: 75 },
  waterGoalMl: 2000,
};
