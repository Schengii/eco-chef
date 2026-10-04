/** Gemini `responseSchema` definitions (OpenAPI subset). Types are plain strings, so no SDK import is needed. */
type Schema = Record<string, unknown>;
const str: Schema = { type: 'STRING' };
const num: Schema = { type: 'NUMBER' };
const arr = (items: Schema): Schema => ({ type: 'ARRAY', items });
const obj = (properties: Record<string, Schema>, required: string[]): Schema => ({ type: 'OBJECT', properties, required });

const LOCATION: Schema = { type: 'STRING', enum: ['Kühlschrank', 'Vorratskammer', 'Gefrierfach', 'Sonstiges'] };

export const RECIPE_RESPONSE_SCHEMA: Schema = obj(
    {
        title: str, difficulty: str, prepTime: str, ecoScore: str, ecoScoreDetails: str,
        co2Footprint: str, co2SavedKg: num, beverage: str, storageTip: str,
        nutrition: obj({ calories: str, protein: str, carbs: str, fat: str }, ['calories', 'protein', 'carbs', 'fat']),
        ingredientsList: arr(obj({ item: str, category: str }, ['item', 'category'])),
        instructions: arr(str),
        tip: str
    },
    ['title', 'difficulty', 'prepTime', 'ecoScore', 'co2SavedKg', 'nutrition', 'ingredientsList', 'instructions']
);

export const RECEIPT_RESPONSE_SCHEMA: Schema = arr(
    obj({ name: str, quantity: num, unit: str, expiryDays: num, location: LOCATION }, ['name', 'quantity', 'unit', 'expiryDays', 'location'])
);

export const PRODUCT_RESPONSE_SCHEMA: Schema = obj(
    { name: str, quantity: num, unit: str, expiryDate: str, location: LOCATION },
    ['name', 'quantity', 'unit', 'expiryDate', 'location']
);

const planDay = obj({ title: str, prepTime: str, co2SavedKg: num, notes: str }, ['title', 'prepTime', 'co2SavedKg', 'notes']);
const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
export const WEEKLY_PLAN_RESPONSE_SCHEMA: Schema = obj(Object.fromEntries(days.map(d => [d, planDay])), days);
