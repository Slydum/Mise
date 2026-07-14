import type { Recipe, UseSoonItem, UserProfile } from "@/lib/types";

/**
 * Mock content for Mise. This file is only imported by the data provider
 * (`lib/data/index.ts`) — UI components never touch it directly, so it can be
 * deleted wholesale once Supabase is wired up.
 *
 * Tag conventions (kept accurate deliberately, since Recipes/RecipeCard
 * surface these directly to the user):
 * - `dietaryStyles` drives compatibility filtering (see lib/diet.ts) and is
 *   the source of truth for what a recipe actually contains.
 * - `tags` is the display/filter layer. Each recipe's identity tag
 *   (vegan/vegetarian/pescatarian) is listed first so RecipeCard's
 *   single-badge overlay always shows the most decision-relevant chip.
 *   "dairy-free" and "contains-eggs" are only applied when the ingredient
 *   list genuinely supports it — plant milks (almond, coconut) don't count
 *   as dairy even though they're bucketed under the "dairy" grocery
 *   category for shopping-aisle purposes.
 */

export const mockRecipes: Recipe[] = [
  {
    id: "overnight-oats",
    title: "Berry Overnight Oats",
    description:
      "Creamy oats soaked overnight with almond milk, chia, and a handful of berries. Zero morning effort.",
    emoji: "🫐",
    mealTypes: ["breakfast"],
    tags: ["vegan", "vegetarian", "quick", "dairy-free"],
    dietaryStyles: ["vegan", "vegetarian", "pescatarian", "omnivore"],
    prepMinutes: 5,
    cookMinutes: 0,
    servings: 1,
    nutrition: { calories: 420, protein: 14, carbs: 62, fat: 13 },
    ingredients: [
      { id: "oats", name: "Rolled oats", amount: 80, unit: "g", category: "grains" },
      { id: "almond-milk", name: "Almond milk", amount: 200, unit: "ml", category: "dairy" },
      { id: "chia", name: "Chia seeds", amount: 1, unit: "tbsp", category: "pantry" },
      { id: "berries", name: "Mixed berries", amount: 100, unit: "g", category: "produce" },
      { id: "maple", name: "Maple syrup", amount: 1, unit: "tsp", category: "pantry" },
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
    tags: ["vegetarian", "high-protein", "quick", "dairy-free", "contains-eggs"],
    dietaryStyles: ["vegetarian", "pescatarian", "omnivore"],
    prepMinutes: 5,
    cookMinutes: 8,
    servings: 1,
    nutrition: { calories: 480, protein: 21, carbs: 38, fat: 27 },
    ingredients: [
      { id: "sourdough", name: "Sourdough bread", amount: 2, unit: "slice", category: "grains" },
      { id: "avocado", name: "Avocado", amount: 1, unit: "", category: "produce" },
      { id: "eggs", name: "Eggs", amount: 2, unit: "", category: "dairy" },
      { id: "lemon", name: "Lemon", amount: 0.5, unit: "", category: "produce" },
      { id: "chili-flakes", name: "Chili flakes", amount: 1, unit: "pinch", category: "pantry" },
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
    tags: ["vegetarian", "high-protein", "quick", "gluten-free"],
    dietaryStyles: ["vegetarian", "pescatarian", "omnivore"],
    prepMinutes: 5,
    cookMinutes: 0,
    servings: 1,
    nutrition: { calories: 340, protein: 22, carbs: 45, fat: 9 },
    ingredients: [
      { id: "yogurt", name: "Greek yogurt", amount: 250, unit: "g", category: "dairy" },
      { id: "granola", name: "Granola", amount: 40, unit: "g", category: "grains" },
      { id: "banana", name: "Banana", amount: 1, unit: "", category: "produce" },
      { id: "honey", name: "Honey", amount: 1, unit: "tbsp", category: "pantry" },
    ],
    steps: [
      { id: "s1", instruction: "Spoon the yogurt into a bowl and drizzle with honey." },
      { id: "s2", instruction: "Top with granola and sliced banana. Done." },
    ],
  },
  {
    id: "shakshuka",
    title: "Shakshuka",
    description:
      "Eggs gently poached in a smoky, spiced tomato and pepper sauce, finished with crumbled feta.",
    emoji: "🍳",
    mealTypes: ["breakfast"],
    tags: ["vegetarian", "high-protein", "comfort", "contains-eggs"],
    dietaryStyles: ["vegetarian", "pescatarian", "omnivore"],
    prepMinutes: 10,
    cookMinutes: 20,
    servings: 2,
    nutrition: { calories: 360, protein: 18, carbs: 24, fat: 22 },
    ingredients: [
      { id: "eggs-2", name: "Eggs", amount: 4, unit: "", category: "dairy" },
      { id: "tomatoes-2", name: "Chopped tomatoes (can)", amount: 1, unit: "", category: "pantry" },
      { id: "bell-pepper-3", name: "Bell pepper", amount: 1, unit: "", category: "produce" },
      { id: "onion-2", name: "Onion", amount: 1, unit: "", category: "produce" },
      { id: "garlic-2", name: "Garlic", amount: 2, unit: "clove", category: "produce" },
      { id: "cumin", name: "Ground cumin", amount: 1, unit: "tsp", category: "pantry" },
      { id: "paprika", name: "Smoked paprika", amount: 1, unit: "tsp", category: "pantry" },
      { id: "feta-3", name: "Feta", amount: 50, unit: "g", category: "dairy" },
    ],
    steps: [
      { id: "s1", instruction: "Soften the diced onion and pepper in a pan with olive oil." },
      { id: "s2", instruction: "Stir in the garlic, cumin, and paprika and cook until fragrant." },
      { id: "s3", instruction: "Add the tomatoes and simmer until thickened.", durationMinutes: 10 },
      { id: "s4", instruction: "Make wells in the sauce, crack in the eggs, cover, and cook until the whites set.", durationMinutes: 8 },
      { id: "s5", instruction: "Crumble feta over the top and serve with warm bread." },
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
    dietaryStyles: ["omnivore"],
    prepMinutes: 15,
    cookMinutes: 20,
    servings: 2,
    nutrition: { calories: 560, protein: 42, carbs: 48, fat: 21 },
    ingredients: [
      { id: "chicken-thighs", name: "Chicken thighs", amount: 400, unit: "g", category: "protein" },
      { id: "quinoa", name: "Quinoa", amount: 150, unit: "g", category: "grains" },
      { id: "cucumber", name: "Cucumber", amount: 1, unit: "", category: "produce" },
      { id: "feta", name: "Feta", amount: 80, unit: "g", category: "dairy" },
      { id: "lemon-2", name: "Lemons", amount: 2, unit: "", category: "produce" },
      { id: "yogurt-2", name: "Greek yogurt", amount: 100, unit: "g", category: "dairy" },
      { id: "garlic", name: "Garlic", amount: 2, unit: "clove", category: "produce" },
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
    tags: ["vegan", "vegetarian", "quick", "gluten-free", "dairy-free"],
    dietaryStyles: ["vegan", "vegetarian", "pescatarian", "omnivore"],
    prepMinutes: 15,
    cookMinutes: 0,
    servings: 2,
    nutrition: { calories: 380, protein: 13, carbs: 42, fat: 19 },
    ingredients: [
      { id: "cabbage", name: "Red cabbage", amount: 0.25, unit: "head", category: "produce" },
      { id: "carrot", name: "Carrots", amount: 2, unit: "", category: "produce" },
      { id: "pepper", name: "Bell pepper", amount: 1, unit: "", category: "produce" },
      { id: "chickpeas", name: "Chickpeas (can)", amount: 1, unit: "", category: "pantry" },
      { id: "tahini", name: "Tahini", amount: 2, unit: "tbsp", category: "pantry" },
      { id: "lime", name: "Limes", amount: 2, unit: "", category: "produce" },
    ],
    steps: [
      { id: "s1", instruction: "Finely shred the cabbage and julienne the carrots and pepper." },
      { id: "s2", instruction: "Whisk tahini, lime juice, a splash of water, and salt into a pourable dressing." },
      { id: "s3", instruction: "Toss the vegetables and drained chickpeas with the dressing and let sit 5 minutes before serving." },
    ],
  },
  {
    id: "smoked-salmon-salad",
    title: "Smoked Salmon & Dill Salad",
    description:
      "Silky smoked salmon over crisp greens with capers, cucumber, and a bright lemon dressing.",
    emoji: "🐠",
    mealTypes: ["lunch"],
    tags: ["pescatarian", "high-protein", "quick", "gluten-free", "dairy-free"],
    dietaryStyles: ["pescatarian", "omnivore"],
    prepMinutes: 10,
    cookMinutes: 0,
    servings: 2,
    nutrition: { calories: 340, protein: 28, carbs: 12, fat: 21 },
    ingredients: [
      { id: "smoked-salmon", name: "Smoked salmon", amount: 200, unit: "g", category: "protein" },
      { id: "mixed-greens", name: "Mixed salad greens", amount: 150, unit: "g", category: "produce" },
      { id: "cucumber-4", name: "Cucumber", amount: 1, unit: "", category: "produce" },
      { id: "capers", name: "Capers", amount: 2, unit: "tbsp", category: "pantry" },
      { id: "red-onion-2", name: "Red onion", amount: 0.25, unit: "", category: "produce" },
      { id: "dill", name: "Fresh dill", amount: 1, unit: "small bunch", category: "produce" },
      { id: "lemon-4", name: "Lemon", amount: 1, unit: "", category: "produce" },
      { id: "olive-oil-3", name: "Olive oil", amount: 2, unit: "tbsp", category: "pantry" },
    ],
    steps: [
      { id: "s1", instruction: "Wash and dry the salad greens, then divide between two plates." },
      { id: "s2", instruction: "Thinly slice the cucumber and red onion." },
      { id: "s3", instruction: "Whisk olive oil, lemon juice, and a pinch of salt into a light dressing." },
      { id: "s4", instruction: "Arrange the smoked salmon, cucumber, and red onion over the greens." },
      { id: "s5", instruction: "Scatter with capers and dill, then drizzle with the dressing." },
    ],
  },
  {
    id: "curried-lentil-soup",
    title: "Curried Lentil Soup",
    description:
      "A creamy, warming coconut-curry lentil soup that comes together in one pot.",
    emoji: "🍲",
    mealTypes: ["lunch"],
    tags: ["vegan", "vegetarian", "gluten-free", "comfort", "dairy-free"],
    dietaryStyles: ["vegan", "vegetarian", "pescatarian", "omnivore"],
    prepMinutes: 10,
    cookMinutes: 25,
    servings: 4,
    nutrition: { calories: 320, protein: 16, carbs: 46, fat: 8 },
    ingredients: [
      { id: "lentils", name: "Red lentils", amount: 250, unit: "g", category: "pantry" },
      { id: "onion-3", name: "Onion", amount: 1, unit: "", category: "produce" },
      { id: "carrot-3", name: "Carrots", amount: 2, unit: "", category: "produce" },
      { id: "garlic-3", name: "Garlic", amount: 2, unit: "clove", category: "produce" },
      { id: "curry-powder", name: "Curry powder", amount: 2, unit: "tbsp", category: "pantry" },
      { id: "coconut-milk", name: "Coconut milk", amount: 400, unit: "ml", category: "pantry" },
      { id: "vegetable-stock", name: "Vegetable stock", amount: 1, unit: "L", category: "pantry" },
    ],
    steps: [
      { id: "s1", instruction: "Soften the diced onion and carrot in a large pot." },
      { id: "s2", instruction: "Stir in the garlic and curry powder and cook until fragrant." },
      { id: "s3", instruction: "Add the lentils, stock, and coconut milk, then bring to a simmer.", durationMinutes: 20 },
      { id: "s4", instruction: "Simmer until the lentils are soft, then blend partially for a creamy texture." },
      { id: "s5", instruction: "Season to taste and serve with a swirl of coconut milk." },
    ],
  },
  {
    id: "salmon-teriyaki",
    title: "Teriyaki Salmon & Rice",
    description:
      "Glazed salmon fillets with sticky rice and charred broccoli. Weeknight favorite.",
    emoji: "🍣",
    mealTypes: ["dinner"],
    tags: ["pescatarian", "high-protein", "dairy-free"],
    dietaryStyles: ["pescatarian", "omnivore"],
    prepMinutes: 10,
    cookMinutes: 20,
    servings: 2,
    nutrition: { calories: 620, protein: 38, carbs: 58, fat: 24 },
    ingredients: [
      { id: "salmon", name: "Salmon fillets", amount: 2, unit: "", category: "protein" },
      { id: "rice", name: "Sushi rice", amount: 150, unit: "g", category: "grains" },
      { id: "broccoli", name: "Broccoli", amount: 1, unit: "head", category: "produce" },
      { id: "soy", name: "Soy sauce", amount: 3, unit: "tbsp", category: "pantry" },
      { id: "mirin", name: "Mirin", amount: 2, unit: "tbsp", category: "pantry" },
      { id: "ginger", name: "Fresh ginger", amount: 1, unit: "thumb", category: "produce" },
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
    tags: ["vegan", "vegetarian", "quick", "high-protein", "dairy-free"],
    dietaryStyles: ["vegan", "vegetarian", "pescatarian", "omnivore"],
    prepMinutes: 10,
    cookMinutes: 10,
    servings: 2,
    nutrition: { calories: 490, protein: 24, carbs: 56, fat: 18 },
    ingredients: [
      { id: "tofu", name: "Firm tofu", amount: 300, unit: "g", category: "protein" },
      { id: "noodles", name: "Egg noodles", amount: 2, unit: "nest", category: "grains" },
      { id: "snap-peas", name: "Snap peas", amount: 150, unit: "g", category: "produce" },
      { id: "pepper-2", name: "Bell pepper", amount: 1, unit: "", category: "produce" },
      { id: "ginger-2", name: "Fresh ginger", amount: 1, unit: "thumb", category: "produce" },
      { id: "soy-2", name: "Soy sauce", amount: 3, unit: "tbsp", category: "pantry" },
      { id: "sesame", name: "Sesame oil", amount: 1, unit: "tbsp", category: "pantry" },
    ],
    steps: [
      { id: "s1", instruction: "Press and cube the tofu, then fry in a hot wok until golden on all sides.", durationMinutes: 6 },
      { id: "s2", instruction: "Cook the noodles and drain.", durationMinutes: 4 },
      { id: "s3", instruction: "Stir-fry the vegetables with grated ginger, keeping them crisp.", durationMinutes: 3 },
      { id: "s4", instruction: "Return the tofu, add soy sauce and sesame oil, toss with the noodles, and serve hot." },
    ],
  },
  {
    id: "mediterranean-tuna-bowl",
    title: "Mediterranean Tuna Bowl",
    description:
      "Flaked tuna over lemony quinoa with cherry tomatoes, olives, and feta — bright, fast, and filling.",
    emoji: "🐟",
    mealTypes: ["dinner"],
    tags: ["pescatarian", "high-protein", "quick", "gluten-free"],
    dietaryStyles: ["pescatarian", "omnivore"],
    prepMinutes: 15,
    cookMinutes: 5,
    servings: 2,
    nutrition: { calories: 480, protein: 34, carbs: 40, fat: 20 },
    ingredients: [
      { id: "tuna", name: "Canned tuna", amount: 2, unit: "can", category: "protein" },
      { id: "quinoa-2", name: "Quinoa", amount: 150, unit: "g", category: "grains" },
      { id: "cherry-tomatoes", name: "Cherry tomatoes", amount: 200, unit: "g", category: "produce" },
      { id: "cucumber-3", name: "Cucumber", amount: 1, unit: "", category: "produce" },
      { id: "red-onion", name: "Red onion", amount: 0.5, unit: "", category: "produce" },
      { id: "olives", name: "Kalamata olives", amount: 60, unit: "g", category: "pantry" },
      { id: "feta-2", name: "Feta", amount: 80, unit: "g", category: "dairy" },
      { id: "lemon-3", name: "Lemon", amount: 1, unit: "", category: "produce" },
      { id: "olive-oil", name: "Olive oil", amount: 2, unit: "tbsp", category: "pantry" },
    ],
    steps: [
      { id: "s1", instruction: "Cook the quinoa in salted water until tender, then let it cool slightly.", durationMinutes: 10 },
      { id: "s2", instruction: "Halve the cherry tomatoes and thinly slice the cucumber and red onion." },
      { id: "s3", instruction: "Drain the tuna and flake it with a fork." },
      { id: "s4", instruction: "Divide the quinoa between bowls and top with tuna, vegetables, olives, and feta." },
      { id: "s5", instruction: "Drizzle with olive oil and a squeeze of lemon, then season with salt and pepper." },
    ],
  },
  {
    id: "hummus-plate",
    title: "Hummus & Veggie Plate",
    description:
      "Creamy hummus with crunchy vegetables and warm pita — the ideal afternoon snack.",
    emoji: "🥕",
    mealTypes: ["snack"],
    tags: ["vegan", "vegetarian", "quick", "dairy-free"],
    dietaryStyles: ["vegan", "vegetarian", "pescatarian", "omnivore"],
    prepMinutes: 5,
    cookMinutes: 0,
    servings: 1,
    nutrition: { calories: 260, protein: 9, carbs: 32, fat: 11 },
    ingredients: [
      { id: "hummus", name: "Hummus", amount: 100, unit: "g", category: "pantry" },
      { id: "carrot-2", name: "Carrots", amount: 2, unit: "", category: "produce" },
      { id: "cucumber-2", name: "Cucumber", amount: 0.5, unit: "", category: "produce" },
      { id: "pita", name: "Pita bread", amount: 1, unit: "", category: "grains" },
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
    tags: ["vegan", "vegetarian", "quick", "gluten-free", "dairy-free"],
    dietaryStyles: ["vegan", "vegetarian", "pescatarian", "omnivore"],
    prepMinutes: 3,
    cookMinutes: 0,
    servings: 1,
    nutrition: { calories: 220, protein: 6, carbs: 28, fat: 11 },
    ingredients: [
      { id: "apple", name: "Apples", amount: 1, unit: "", category: "produce" },
      { id: "almond-butter", name: "Almond butter", amount: 2, unit: "tbsp", category: "pantry" },
      { id: "cinnamon", name: "Cinnamon", amount: 1, unit: "pinch", category: "pantry" },
    ],
    steps: [
      { id: "s1", instruction: "Slice the apple, spread with almond butter, and dust with cinnamon." },
    ],
  },
  {
    id: "roasted-chickpeas",
    title: "Spiced Roasted Chickpeas",
    description: "Crunchy, smoky roasted chickpeas — a snack that actually keeps you full.",
    emoji: "🫘",
    mealTypes: ["snack"],
    tags: ["vegan", "vegetarian", "gluten-free", "dairy-free"],
    dietaryStyles: ["vegan", "vegetarian", "pescatarian", "omnivore"],
    prepMinutes: 5,
    cookMinutes: 25,
    servings: 2,
    nutrition: { calories: 180, protein: 8, carbs: 22, fat: 7 },
    ingredients: [
      { id: "chickpeas-2", name: "Chickpeas (can)", amount: 1, unit: "", category: "pantry" },
      { id: "olive-oil-2", name: "Olive oil", amount: 1, unit: "tbsp", category: "pantry" },
      { id: "smoked-paprika-2", name: "Smoked paprika", amount: 1, unit: "tsp", category: "pantry" },
      { id: "cumin-2", name: "Ground cumin", amount: 0.5, unit: "tsp", category: "pantry" },
    ],
    steps: [
      { id: "s1", instruction: "Drain, rinse, and pat the chickpeas completely dry." },
      { id: "s2", instruction: "Toss with olive oil, paprika, cumin, and a pinch of salt." },
      { id: "s3", instruction: "Roast at 200°C until golden and crisp, shaking the pan halfway.", durationMinutes: 22 },
    ],
  },
];

/**
 * Weekly rotation used to build the mock plan. Index = day of week (0 = Sunday).
 * Each slot uses four distinct recipes, and no day repeats a recipe across
 * two meal slots (e.g. lunch never matches that day's breakfast).
 */
export const weeklyRotation: Record<string, [string, string, string, string]> = {
  breakfast: [
    "greek-yogurt-bowl",
    "overnight-oats",
    "avocado-toast",
    "shakshuka",
  ] as [string, string, string, string],
  lunch: [
    "rainbow-salad",
    "chicken-grain-bowl",
    "smoked-salmon-salad",
    "curried-lentil-soup",
  ] as [string, string, string, string],
  dinner: [
    "salmon-teriyaki",
    "veggie-stir-fry",
    "mediterranean-tuna-bowl",
    "chicken-grain-bowl",
  ] as [string, string, string, string],
  snack: [
    "apple-almond",
    "hummus-plate",
    "greek-yogurt-bowl",
    "roasted-chickpeas",
  ] as [string, string, string, string],
};

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
  dietaryStyle: "pescatarian",
};
