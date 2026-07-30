import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ecoChefStyles } from '../styles/eco-chef.styles';
import { DailyStat, getLocalDateString } from '../models/eco-chef.models';

@customElement('eco-chef-dashboard')
export class EcoChefDashboard extends LitElement {
    static override styles = [
        ecoChefStyles,
        css`
            :host {
                display: block;
            }
            .dashboard-container {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .grid-2 {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 16px;
            }
            .stat-card {
                background: var(--surface);
                border: 2px solid var(--border);
                border-radius: 20px;
                padding: 20px;
                box-shadow: var(--shadow-sm);
            }
            .stat-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            .stat-title {
                font-size: 16px;
                font-weight: 700;
                color: var(--text);
            }
            .progress-bar-bg {
                background: var(--surface-hover, #f1f5f9);
                border-radius: 12px;
                height: 14px;
                width: 100%;
                overflow: hidden;
                margin-top: 8px;
            }
            .progress-bar-fill {
                height: 100%;
                border-radius: 12px;
                transition: width 0.4s ease;
            }
            .fill-cal { background: linear-gradient(90deg, #f59e0b, #d97706); }
            .fill-prot { background: linear-gradient(90deg, #10b981, #059669); }
            .fill-carb { background: linear-gradient(90deg, #3b82f6, #2563eb); }
            .fill-fat { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }

            .impact-badge-group {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                gap: 12px;
                margin-top: 16px;
            }
            .impact-badge {
                background: var(--surface-hover, #f8fafc);
                border: 1px solid var(--border);
                border-radius: 16px;
                padding: 14px;
                text-align: center;
            }
            .impact-icon {
                font-size: 28px;
                margin-bottom: 4px;
            }
            .impact-value {
                font-size: 18px;
                font-weight: 800;
                color: #15803d;
            }
            .impact-label {
                font-size: 12px;
                color: var(--text-muted, #64748b);
            }
            .chart-bar-container {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                height: 150px;
                padding-top: 20px;
                border-bottom: 2px solid var(--border);
            }
            .chart-col {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                flex: 1;
            }
            .chart-bar {
                width: 60%;
                max-width: 28px;
                background: linear-gradient(180deg, #22c55e, #15803d);
                border-radius: 8px 8px 0 0;
                transition: height 0.4s ease;
                min-height: 4px;
            }
            .chart-label {
                font-size: 11px;
                color: var(--text-muted);
            }
        `
    ];

    @property({ type: Object }) stats: { [date: string]: DailyStat } = {};
    @property({ type: Number }) calorieGoal = 2000;
    @property({ type: Number }) proteinGoal = 80;

    override render() {
        const todayStr = getLocalDateString();
        const todayStat: DailyStat = this.stats[todayStr] || {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            co2Saved: 0,
            count: 0
        };

        const totalCO2Saved = Object.values(this.stats).reduce((sum, s) => sum + (s.co2Saved || 0), 0);
        const totalCooked = Object.values(this.stats).reduce((sum, s) => sum + (s.count || 0), 0);

        // Equivalencies
        const kmDriven = Math.round(totalCO2Saved * 8);
        const treesPlanted = (totalCO2Saved / 20).toFixed(1);
        const phoneCharges = Math.round(totalCO2Saved * 120);

        const calPct = Math.min(100, Math.round((todayStat.calories / (this.calorieGoal || 2000)) * 100));
        const protPct = Math.min(100, Math.round((todayStat.protein / (this.proteinGoal || 80)) * 100));

        // 7 Day History
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return getLocalDateString(d);
        });

        const maxCO2In7Days = Math.max(1, ...last7Days.map(dayKey => this.stats[dayKey]?.co2Saved || 0));

        return html`
            <div class="dashboard-container">
                <h3 class="recipe-subheading">📊 Nährwert- & Klimaschutz-Analytics</h3>

                <div class="grid-2">
                    <div class="stat-card">
                        <div class="stat-header">
                            <span class="stat-title">🔥 Kalorien Heute</span>
                            <span style="font-weight: 700; color: #d97706;">${todayStat.calories} / ${this.calorieGoal} kcal</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill fill-cal" style="width: ${calPct}%;"></div>
                        </div>

                        <div class="stat-header" style="margin-top: 16px;">
                            <span class="stat-title">🥩 Protein Heute</span>
                            <span style="font-weight: 700; color: #059669;">${todayStat.protein}g / ${this.proteinGoal}g</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill fill-prot" style="width: ${protPct}%;"></div>
                        </div>

                        <div style="display: flex; gap: 16px; margin-top: 16px; font-size: 13px;">
                            <div>🌾 Kohlenhydrate: <strong>${todayStat.carbs}g</strong></div>
                            <div>🥑 Fett: <strong>${todayStat.fat}g</strong></div>
                        </div>
                    </div>

                    <div class="stat-card" style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-color: #86efac;">
                        <div class="stat-header">
                            <span class="stat-title" style="color: #15803d;">🌳 CO₂-Einsparung Gesamt</span>
                            <span style="font-size: 22px; font-weight: 800; color: #15803d;">${totalCO2Saved.toFixed(1)} kg</span>
                        </div>
                        <p style="font-size: 13px; color: #166534; margin-bottom: 12px;">
                            Gekochte Gerichte: <strong>${totalCooked}</strong>
                        </p>

                        <div class="impact-badge-group">
                            <div class="impact-badge">
                                <div class="impact-icon">🚗</div>
                                <div class="impact-value">${kmDriven} km</div>
                                <div class="impact-label">Autofahrt gespart</div>
                            </div>
                            <div class="impact-badge">
                                <div class="impact-icon">🌳</div>
                                <div class="impact-value">${treesPlanted}</div>
                                <div class="impact-label">Bäume/Jahr-Wert</div>
                            </div>
                            <div class="impact-badge">
                                <div class="impact-icon">📱</div>
                                <div class="impact-value">${phoneCharges}</div>
                                <div class="impact-label">Handy-Ladungen</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <span class="stat-title">📅 CO₂-Einsparung der letzten 7 Tage (kg)</span>
                    </div>

                    <div class="chart-bar-container">
                        ${last7Days.map(dayKey => {
                            const val = this.stats[dayKey]?.co2Saved || 0;
                            const barHeight = Math.max(8, Math.round((val / maxCO2In7Days) * 100));
                            const dayName = new Date(dayKey).toLocaleDateString('de-DE', { weekday: 'short' });
                            return html`
                                <div class="chart-col">
                                    <span style="font-size: 10px; font-weight: 700; color: #15803d;">${val > 0 ? val.toFixed(1) : ''}</span>
                                    <div class="chart-bar" style="height: ${barHeight}%;"></div>
                                    <span class="chart-label">${dayName}</span>
                                </div>
                            `;
                        })}
                    </div>
                </div>
            </div>
        `;
    }
}
