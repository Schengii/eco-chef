import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Achievement, DailyStat } from '../models/eco-chef.models';

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
            font-weight: 700;
            margin-top: 4px;
            text-align: right;
        }
    `;

    @property({ type: Array }) achievements: Achievement[] = [];
    @property({ type: Object }) stats: { [date: string]: DailyStat } = {};

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

    override render() {
        const cum = this.getCumulativeStats();

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
