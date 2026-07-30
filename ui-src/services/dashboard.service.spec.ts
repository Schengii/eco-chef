import { DashboardService } from './dashboard.service';
import { DailyStat } from '../models/eco-chef.models';

describe('DashboardService Tests', () => {
    test('calculateCo2Equivalencies converts kg CO2 correctly', () => {
        const eq = DashboardService.calculateCo2Equivalencies(10);
        expect(eq.kmDriven).toBe(80);
        expect(eq.treesPlanted).toBe(0.5);
        expect(eq.phoneCharges).toBe(1200);
    });

    test('calculateNutrientPercentages computes correct percentages capped at 100', () => {
        const stat: DailyStat = { calories: 1500, protein: 40, carbs: 180, fat: 50, co2Saved: 1.5, count: 1 };
        const p1 = DashboardService.calculateNutrientPercentages(stat, 2000, 80);
        expect(p1.caloriePercentage).toBe(75);
        expect(p1.proteinPercentage).toBe(50);

        const overStat: DailyStat = { calories: 3000, protein: 120, carbs: 300, fat: 90, co2Saved: 3.0, count: 2 };
        const p2 = DashboardService.calculateNutrientPercentages(overStat, 2000, 80);
        expect(p2.caloriePercentage).toBe(100);
        expect(p2.proteinPercentage).toBe(100);
    });

    test('aggregateWeeklyTotals sums stats accurately', () => {
        const stats = {
            '2026-07-29': { calories: 600, protein: 30, carbs: 60, fat: 20, co2Saved: 1.2, count: 1 },
            '2026-07-30': { calories: 800, protein: 45, carbs: 90, fat: 25, co2Saved: 2.3, count: 2 }
        };
        const agg = DashboardService.aggregateWeeklyTotals(stats);
        expect(agg.totalCO2Saved).toBe(3.5);
        expect(agg.totalCookedCount).toBe(3);
    });
});
