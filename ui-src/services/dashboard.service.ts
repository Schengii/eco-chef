import { DailyStat } from '../models/eco-chef.models';

export const DashboardService = {
    calculateCo2Equivalencies(totalCo2Kg: number) {
        return {
            kmDriven: Math.round(totalCo2Kg * 8),
            treesPlanted: parseFloat((totalCo2Kg / 20).toFixed(1)),
            phoneCharges: Math.round(totalCo2Kg * 120)
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
