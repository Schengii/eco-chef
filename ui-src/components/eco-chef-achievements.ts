import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Achievement, DailyStat, getLocalDateString } from '../models/eco-chef.models';

@customElement('eco-chef-achievements')
export class EcoChefAchievements extends LitElement {
    static override styles = css`
        :host {
            display: block;
        }
        .achievements-card {
            background: var(--surface);
            border: 2px solid var(--border);
            border-radius: 24px;
            padding: 24px;
            box-shadow: var(--shadow-md);
        }
        .section-title {
            font-size: 20px;
            font-weight: 850;
            color: var(--text-dark);
            margin: 0 0 16px 0;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 2px solid var(--border);
            padding-bottom: 10px;
        }
        .stats-summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 24px;
        }
        .stat-box {
            background: var(--bg-color);
            border: 2px solid var(--border);
            padding: 16px;
            border-radius: 18px;
            text-align: center;
            box-shadow: var(--shadow-sm);
        }
        .stat-value {
            font-size: 24px;
            font-weight: 900;
            color: var(--primary-dark);
            margin-bottom: 4px;
        }
        .dark-theme .stat-value {
            color: var(--primary);
        }
        .stat-label {
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Charts section styling */
        .charts-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-bottom: 28px;
        }
        .chart-box {
            background: var(--bg-color);
            border: 2px solid var(--border);
            border-radius: 20px;
            padding: 16px;
        }
        .chart-header {
            font-size: 13px;
            font-weight: 850;
            color: var(--text-dark);
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .chart-svg {
            width: 100%;
            height: 140px;
            display: block;
        }
        .bar {
            fill: url(#co2Grad);
            transition: height 0.5s ease, y 0.5s ease;
            cursor: pointer;
        }
        .bar-protein {
            fill: url(#proteinGrad);
            transition: height 0.5s ease, y 0.5s ease;
            cursor: pointer;
        }
        .bar-bg {
            fill: var(--border);
            opacity: 0.3;
        }
        .chart-axis {
            stroke: var(--text-muted);
            stroke-width: 1;
            opacity: 0.3;
        }
        .chart-text {
            font-size: 9px;
            font-weight: bold;
            fill: var(--text-muted);
            text-anchor: middle;
        }
        .chart-value-text {
            font-size: 8px;
            font-weight: 900;
            fill: var(--text-dark);
            text-anchor: middle;
        }
        
        .badge-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .badge-row {
            display: flex;
            align-items: center;
            gap: 16px;
            background: var(--bg-color);
            border: 2px solid var(--border);
            padding: 16px;
            border-radius: 20px;
            transition: all 0.3s ease;
        }
        .badge-row:hover {
            transform: translateX(4px);
            border-color: var(--primary);
        }
        .badge-icon {
            font-size: 36px;
            width: 60px;
            height: 60px;
            border-radius: 18px;
            background: var(--surface);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid var(--border);
            box-shadow: var(--shadow-sm);
            filter: grayscale(1);
            opacity: 0.5;
            transition: all 0.3s ease;
        }
        .badge-row.unlocked .badge-icon {
            filter: grayscale(0);
            opacity: 1;
            border-color: var(--primary);
            background: var(--primary-light);
            box-shadow: 0 0 10px var(--primary);
        }
        .badge-info {
            flex-grow: 1;
        }
        .badge-title {
            font-size: 15px;
            font-weight: 850;
            color: var(--text-dark);
            margin: 0 0 4px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .badge-desc {
            font-size: 12px;
            color: var(--text-muted);
            margin: 0 0 8px 0;
            font-weight: 500;
            line-height: 1.4;
        }
        .progress-bar-container {
            width: 100%;
            height: 8px;
            background: var(--border);
            border-radius: 4px;
            overflow: hidden;
            position: relative;
        }
        .progress-bar {
            height: 100%;
            background: var(--primary-gradient);
            border-radius: 4px;
            transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .progress-text {
            font-size: 11px;
            color: var(--text-muted);
            font-weight: 750;
            margin-top: 4px;
            text-align: right;
        }
    `;

    @property({ type: Array }) achievements: Achievement[] = [];
    @property({ type: Object }) stats: { [date: string]: DailyStat } = {};

    @state() private hoveredIndex: number | null = null;
    @state() private hoveredChart: string | null = null;
    @state() private showCertificate = false;

    private getCumulativeStats() {
        let totalCO2 = 0;
        let cookedCount = 0;
        
        for (const date in this.stats) {
            totalCO2 += this.stats[date].co2Saved || 0;
            cookedCount += this.stats[date].count || 0;
        }

        return {
            totalCO2: parseFloat(totalCO2.toFixed(1)),
            cookedCount
        };
    }

    private getLast7DaysData() {
        const data = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = getLocalDateString(d);
            const dayLabel = d.toLocaleDateString('de-DE', { weekday: 'short' });
            const stat = this.stats[dateStr] || { calories: 0, protein: 0, carbs: 0, fat: 0, co2Saved: 0, count: 0 };
            data.push({
                dayLabel,
                co2Saved: stat.co2Saved || 0,
                protein: stat.protein || 0
            });
        }
        return data;
    }

    override render() {
        const cum = this.getCumulativeStats();
        const last7Days = this.getLast7DaysData();

        // Calculate max values for scaling SVG bars
        const maxCO2 = Math.max(1.0, ...last7Days.map(d => d.co2Saved));
        const maxProtein = Math.max(20.0, ...last7Days.map(d => d.protein));

        return html`
            <div class="achievements-card">
                <h3 class="section-title">🏆 Erfolge & Stats</h3>

                <div class="stats-summary">
                    <div class="stat-box">
                        <div class="stat-value">🌳 ${cum.totalCO2} kg</div>
                        <div class="stat-label">CO2 Eingespart</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">🍳 ${cum.cookedCount}</div>
                        <div class="stat-label">Gerichte Gekocht</div>
                    </div>
                </div>

                <button class="main-btn" @click="${() => this.showCertificate = true}" style="width: 100%; margin-bottom: 24px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; font-weight: 850; border: none;" aria-label="CO2 Umwelt-Zertifikat anzeigen">
                    📜 Mein CO₂-Umweltzertifikat anzeigen
                </button>

                <!-- Zertifikat Modal -->
                ${this.showCertificate ? html`
                    <div style="position: fixed; inset: 0; background: rgba(15,23,42,0.7); z-index: 2300; display: flex; align-items: center; justify-content: center; padding: 20px;">
                        <div style="background: var(--surface); border: 4px double #15803d; border-radius: 24px; padding: 28px; max-width: 440px; text-align: center; box-shadow: var(--shadow-xl);">
                            <div style="font-size: 54px; margin-bottom: 8px;">🏅</div>
                            <h3 style="margin: 0 0 6px 0; font-size: 22px; color: var(--primary-dark);">Öko-Nachhaltigkeitszertifikat</h3>
                            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">Offiziell ausgestellt von EcoChef</p>

                            <div style="background: var(--bg-color); border: 2px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 20px;">
                                <div style="font-size: 14px; font-weight: 800; color: var(--text-dark); margin-bottom: 6px;">
                                    Status: <span style="color: #15803d;">🌱 Klima-Retter Gold</span>
                                </div>
                                <div style="font-size: 24px; font-weight: 900; color: #15803d; margin-bottom: 4px;">
                                    ${cum.totalCO2} kg CO₂
                                </div>
                                <div style="font-size: 12px; color: var(--text-muted);">
                                    Erfolgreich durch Resteverwertung und pflanzenbasierte Gerichte eingespart!
                                </div>
                            </div>

                            <button class="main-btn" @click="${() => this.showCertificate = false}" style="width: 100%;">
                                Schließen
                            </button>
                        </div>
                    </div>
                ` : ''}

                <!-- Visuelle Charts -->
                <div class="charts-container">
                    <!-- CO2 Ersparnis Chart -->
                    <div class="chart-box">
                        <div class="chart-header">
                            <span>🌱 CO2-Ersparnis (letzte 7 Tage)</span>
                            <span style="font-weight: 900; color: var(--primary-dark);">Max: ${maxCO2.toFixed(1)} kg</span>
                        </div>
                        <svg class="chart-svg" viewBox="0 0 320 140">
                            <defs>
                                <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#10b981" />
                                    <stop offset="100%" stop-color="#047857" />
                                </linearGradient>
                            </defs>
                            
                            <!-- X Axis -->
                            <line x1="10" y1="115" x2="310" y2="115" class="chart-axis" />
                            
                            <!-- Bars -->
                            ${last7Days.map((d, index) => {
                                const x = 20 + index * 42;
                                const barHeight = (d.co2Saved / maxCO2) * 80;
                                const y = 115 - barHeight;
                                return html`
                                    <!-- background column track -->
                                    <rect x="${x}" y="35" width="22" height="80" rx="4" class="bar-bg" />
                                    <!-- actual data bar -->
                                    ${barHeight > 0 ? html`
                                        <rect x="${x}" y="${y}" width="22" height="${barHeight}" rx="4" class="bar" 
                                            @mouseenter="${() => { this.hoveredIndex = index; this.hoveredChart = 'co2'; }}"
                                            @mouseleave="${() => { this.hoveredIndex = null; this.hoveredChart = null; }}"
                                            @touchstart="${() => { this.hoveredIndex = index; this.hoveredChart = 'co2'; }}"
                                        >
                                            <title>${d.dayLabel}: ${d.co2Saved.toFixed(1)} kg</title>
                                        </rect>
                                        <text x="${x + 11}" y="${y - 4}" class="chart-value-text">${d.co2Saved.toFixed(1)}</text>
                                    ` : ''}
                                    <!-- Day label -->
                                    <text x="${x + 11}" y="130" class="chart-text">${d.dayLabel}</text>
                                `;
                            })}

                            <!-- Floating Tooltip -->
                            ${this.hoveredChart === 'co2' && this.hoveredIndex !== null ? html`
                                <g>
                                    <rect x="${Math.max(5, Math.min(255, 20 + this.hoveredIndex * 42 - 19))}" y="10" width="60" height="20" rx="6" fill="#1e293b" />
                                    <text x="${Math.max(5, Math.min(255, 20 + this.hoveredIndex * 42 - 19)) + 30}" y="23" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle">
                                        ${last7Days[this.hoveredIndex].co2Saved.toFixed(1)} kg
                                    </text>
                                </g>
                            ` : ''}
                        </svg>
                    </div>

                    <!-- Protein Chart -->
                    <div class="chart-box">
                        <div class="chart-header">
                            <span>💪 Proteinzufuhr (letzte 7 Tage)</span>
                            <span style="font-weight: 900; color: #3b82f6;">Max: ${maxProtein.toFixed(0)}g</span>
                        </div>
                        <svg class="chart-svg" viewBox="0 0 320 140">
                            <defs>
                                <linearGradient id="proteinGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#60a5fa" />
                                    <stop offset="100%" stop-color="#2563eb" />
                                </linearGradient>
                            </defs>
                            
                            <!-- X Axis -->
                            <line x1="10" y1="115" x2="310" y2="115" class="chart-axis" />
                            
                            <!-- Bars -->
                            ${last7Days.map((d, index) => {
                                const x = 20 + index * 42;
                                const barHeight = (d.protein / maxProtein) * 80;
                                const y = 115 - barHeight;
                                return html`
                                    <!-- background column track -->
                                    <rect x="${x}" y="35" width="22" height="80" rx="4" class="bar-bg" />
                                    <!-- actual data bar -->
                                    ${barHeight > 0 ? html`
                                        <rect x="${x}" y="${y}" width="22" height="${barHeight}" rx="4" class="bar-protein" 
                                            @mouseenter="${() => { this.hoveredIndex = index; this.hoveredChart = 'protein'; }}"
                                            @mouseleave="${() => { this.hoveredIndex = null; this.hoveredChart = null; }}"
                                            @touchstart="${() => { this.hoveredIndex = index; this.hoveredChart = 'protein'; }}"
                                        >
                                            <title>${d.dayLabel}: ${d.protein.toFixed(0)}g</title>
                                        </rect>
                                        <text x="${x + 11}" y="${y - 4}" class="chart-value-text">${d.protein.toFixed(0)}g</text>
                                    ` : ''}
                                    <!-- Day label -->
                                    <text x="${x + 11}" y="130" class="chart-text">${d.dayLabel}</text>
                                `;
                            })}

                            <!-- Floating Tooltip -->
                            ${this.hoveredChart === 'protein' && this.hoveredIndex !== null ? html`
                                <g>
                                    <rect x="${Math.max(5, Math.min(255, 20 + this.hoveredIndex * 42 - 19))}" y="10" width="60" height="20" rx="6" fill="#1e293b" />
                                    <text x="${Math.max(5, Math.min(255, 20 + this.hoveredIndex * 42 - 19)) + 30}" y="23" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle">
                                        ${last7Days[this.hoveredIndex].protein.toFixed(0)}g
                                    </text>
                                </g>
                            ` : ''}
                        </svg>
                    </div>
                </div>

                <div class="badge-list">
                    ${this.achievements.map(badge => {
                        const percent = Math.min(100, Math.round((badge.progress / badge.target) * 100));
                        return html`
                            <div class="badge-row ${badge.unlocked ? 'unlocked' : ''}">
                                <div class="badge-icon">${badge.icon}</div>
                                <div class="badge-info">
                                    <h4 class="badge-title">
                                        ${badge.title} 
                                        ${badge.unlocked ? html`<span style="color: var(--primary)">✓ Freigeschaltet</span>` : ''}
                                    </h4>
                                    <p class="badge-desc">${badge.description}</p>
                                    <div class="progress-bar-container">
                                        <div class="progress-bar" style="width: ${percent}%"></div>
                                    </div>
                                    <div class="progress-text">${badge.progress} / ${badge.target}</div>
                                </div>
                            </div>
                        `;
                    })}
                </div>
            </div>
        `;
    }
}
