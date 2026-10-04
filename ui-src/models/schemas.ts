/**
 * Runtime validation (zod) for everything that enters the app from outside:
 * AI responses, imported files/backups and cloud-sync payloads.
 * Parsing is deliberately lenient: unknown extra fields are kept, broken values fall back to defaults.
 */
import { z } from 'zod';
import type { Recipe, PantryItemAdvanced, ShoppingItem, DailyStat, Achievement, MealPlan } from './eco-chef.models';

const strLike = z.union([z.string(), z.number().transform(String)]);
const numLike = z
    .union([z.number(), z.string().transform(s => parseFloat(s.replace(',', '.')))])
    .transform(n => (Number.isFinite(n) ? n : 0));

/** Parses every element with `schema`, silently dropping invalid ones. */
function lenientArray<S extends z.ZodType>(schema: S) {
    return z.array(z.unknown()).transform(arr =>
        arr.flatMap(entry => {
            const r = schema.safeParse(entry);
            return r.success ? [r.data as z.output<S>] : [];
        })
    );
}

const IngredientSchema = z.preprocess(
    v => {
        if (typeof v === 'string') return { item: v };
        if (v && typeof v === 'object' && 'item' in v) return v;
        return { item: String(v) };
    },
    z.object({ item: strLike, category: z.string().nullish() }).transform(i => ({
        item: String(i.item),
        category: i.category || 'Sonstiges'
    }))
);

export const RecipeSchema = z.looseObject({
    title: z.string().min(1),
    difficulty: z.string().catch('Mittel'),
    prepTime: z.string().catch('25 Min.'),
    ecoScore: z.string().catch('🍃🍃🍃'),
    ecoScoreDetails: z.string().catch(''),
    co2Footprint: z.string().catch('Mittel'),
    co2SavedKg: numLike.catch(0),
    beverage: z.string().catch('Ein frisches Glas Wasser passt wunderbar.'),
    storageTip: z.string().catch('Am besten sofort genießen!'),
    nutrition: z
        .object({
            calories: strLike.transform(String).catch('? kcal'),
            protein: strLike.transform(String).catch('?g'),
            carbs: strLike.transform(String).catch('?g'),
            fat: strLike.transform(String).catch('?g')
        })
        .catch({ calories: '? kcal', protein: '?g', carbs: '?g', fat: '?g' }),
    ingredientsList: z
        .array(IngredientSchema)
        .catch([{ item: 'Zutaten konnten nicht geladen werden.', category: 'Sonstiges' }]),
    instructions: z.array(strLike.transform(String)).min(1),
    tip: z.string().catch('Lass es dir schmecken!'),
    image: z.string().optional().catch(undefined),
    rating: z.number().optional().catch(undefined),
    savedAt: z.string().optional().catch(undefined)
});

export const RecipeListSchema = lenientArray(RecipeSchema);

const LocationSchema = z.enum(['Kühlschrank', 'Vorratskammer', 'Gefrierfach', 'Sonstiges']);

export const ReceiptItemSchema = z.object({
    name: z.string().min(1),
    quantity: numLike.catch(1),
    unit: z.string().catch('Stk.'),
    expiryDays: numLike.catch(7),
    location: LocationSchema.catch('Kühlschrank')
});
export const ReceiptItemListSchema = lenientArray(ReceiptItemSchema);
export type ReceiptItem = z.output<typeof ReceiptItemSchema>;

export const ScannedProductSchema = z.object({
    name: z.string().min(1),
    quantity: numLike.catch(1),
    unit: z.string().catch('Stk.'),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
    location: LocationSchema.catch('Kühlschrank')
});
export type ScannedProduct = z.output<typeof ScannedProductSchema>;

export const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'] as const;

const PlanDaySchema = z.object({
    title: z.string().min(1),
    prepTime: z.string().catch(''),
    co2SavedKg: numLike.catch(0),
    notes: z.string().catch('')
});

export const WeeklyPlanSchema = z
    .record(z.string(), z.unknown())
    .transform(raw => {
        const plan: MealPlan = {};
        for (const day of WEEKDAYS) {
            const r = PlanDaySchema.safeParse(raw[day]);
            if (r.success) plan[day] = r.data;
        }
        return plan;
    })
    .refine(plan => Object.keys(plan).length > 0, 'Leerer Wochenplan');

const PantryItemSchema = z.looseObject({
    name: z.string().min(1),
    active: z.boolean().catch(true),
    addedDate: z.string().catch(''),
    expiryDate: z.string().optional().catch(undefined),
    quantity: z.number().optional().catch(undefined),
    unit: z.string().optional().catch(undefined),
    location: LocationSchema.optional().catch(undefined)
});

const ShoppingItemSchema = z.looseObject({
    name: z.string().min(1),
    checked: z.boolean().catch(false),
    category: z.string().optional().catch(undefined)
});

const DailyStatSchema = z.object({
    calories: numLike.catch(0),
    protein: numLike.catch(0),
    carbs: numLike.catch(0),
    fat: numLike.catch(0),
    co2Saved: numLike.catch(0),
    count: numLike.catch(0)
});

const AchievementSchema = z.looseObject({
    id: z.string().min(1),
    title: z.string().catch(''),
    description: z.string().catch(''),
    icon: z.string().catch('🏆'),
    unlocked: z.boolean().catch(false),
    progress: numLike.catch(0),
    target: numLike.catch(1)
});

const lenientRecord = <S extends z.ZodType>(schema: S) =>
    z.record(z.string(), z.unknown()).transform(raw => {
        const out: Record<string, z.output<S>> = {};
        for (const [k, v] of Object.entries(raw)) {
            const r = schema.safeParse(v);
            if (r.success) out[k] = r.data as z.output<S>;
        }
        return out;
    });

const StringListSchema = lenientArray(z.string().min(1));

/** Fields shared by the cloud-sync payload and the full backup file. All optional. */
const sharedFields = {
    pantryItemsAdvanced: lenientArray(PantryItemSchema).optional().catch(undefined),
    shoppingList: lenientArray(ShoppingItemSchema).optional().catch(undefined),
    stats: lenientRecord(DailyStatSchema).optional().catch(undefined),
    urgentIngredients: lenientRecord(z.boolean()).optional().catch(undefined),
    ingredientChips: StringListSchema.optional().catch(undefined)
};

export const SyncPayloadSchema = z.object({
    ...sharedFields,
    achievementsList: lenientArray(AchievementSchema).optional().catch(undefined)
});

export const BackupSchema = z.object({
    ...sharedFields,
    savedRecipes: RecipeListSchema.optional().catch(undefined),
    achievements: lenientArray(AchievementSchema).optional().catch(undefined),
    calorieGoal: numLike.optional().catch(undefined),
    proteinGoal: numLike.optional().catch(undefined)
});

// Compile-time guarantee that validated data stays assignable to the app models.
type Assert<T extends true> = T;
export type RecipeFits = Assert<z.output<typeof RecipeSchema> extends Recipe ? true : false>;
export type PantryFits = Assert<z.output<typeof PantryItemSchema> extends PantryItemAdvanced ? true : false>;
export type ShoppingFits = Assert<z.output<typeof ShoppingItemSchema> extends ShoppingItem ? true : false>;
export type StatFits = Assert<z.output<typeof DailyStatSchema> extends DailyStat ? true : false>;
export type AchievementFits = Assert<z.output<typeof AchievementSchema> extends Achievement ? true : false>;

export type ValidRecipe = z.output<typeof RecipeSchema>;
export type SyncPayload = z.output<typeof SyncPayloadSchema>;
export type BackupData = z.output<typeof BackupSchema>;
