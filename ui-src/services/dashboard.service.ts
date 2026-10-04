import { DailyStat } from '../models/eco-chef.models';

/**
 * Rough conversion factors for the CO₂ equivalencies shown in the dashboard (illustrative values):
 * - Car: ~0.125 kg CO₂ per km (average passenger car, order of magnitude of EEA/UBA figures) -> 8 km per kg
 * - Tree: ~20 kg CO₂ absorbed per year (commonly cited range 10-25 kg)
 * - Smartphone charge: ~8 g CO₂ per full charge -> 120 charges per kg
 * The saved CO₂ per recipe itself is an AI estimate (Gemini), not a measured value.
 */
export const CO2_KM_PER_KG = 8;
export const CO2_KG_ABSORBED_PER_TREE_YEAR = 20;
export const CO2_PHONE_CHARGES_PER_KG = 120;

export const DashboardService = {
    calculateCo2Equivalencies(totalCo2Kg: number) {
        return {
            kmDriven: Math.round(totalCo2Kg * CO2_KM_PER_KG),
            treesPlanted: parseFloat((totalCo2Kg / CO2_KG_ABSORBED_PER_TREE_YEAR).toFixed(1)),
            phoneCharges: Math.round(totalCo2Kg * CO2_PHONE_CHARGES_PER_KG)
        };
    },

    calculateNutrientPercentages(todayStat: DailyStat, calorieGoal: number, proteinGoal: number) {
        return {
            caloriePercentage: Math.min(100, Math.round(((todayStat.calories || 0) / (calorieGoal || 2000)) * 100)),
            proteinPercentage: Math.min(100, Math.round(((todayStat.protein || 0) / (proteinGoal || 80)) * 100))
        };
    },

    aggregateWeeklyTotals(stats: { [date: string]: DailyStat }) {
        const totalCO2Saved = Object.values(stats).reduce((sum, s) => sum + (s.co2Saved || 0), 0);
        const totalCookedCount = Object.values(stats).reduce((sum, s) => sum + (s.count || 0), 0);
        return {
            totalCO2Saved: parseFloat(totalCO2Saved.toFixed(2)),
            totalCookedCount
        };
    }
};
