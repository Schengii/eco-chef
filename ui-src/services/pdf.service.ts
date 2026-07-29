import { Recipe } from '../models/eco-chef.models';

export const PdfService = {
    generateCookbookHtml(recipes: Recipe[], userAvatar = '🧑‍🍳'): string {
        if (!recipes || recipes.length === 0) {
            return '<p>Keine Rezepte zum Drucken vorhanden.</p>';
        }

        const totalCO2 = recipes.reduce((sum, r) => sum + (r.co2SavedKg || 0), 0).toFixed(1);

        const pages = recipes.map((r, idx) => `
            <div class="recipe-page">
                <div class="recipe-header">
                    <h2>${idx + 1}. ${r.title}</h2>
                    <div class="meta-pills">
                        <span class="pill">📊 ${r.difficulty || 'Mittel'}</span>
                        <span class="pill">🕒 ${r.prepTime || '25 Min'}</span>
                        <span class="pill eco">🌱 Eco: ${r.ecoScore || 'A+'}</span>
                        <span class="pill co2">🌳 ${r.co2SavedKg || 0} kg CO₂ gespart</span>
                    </div>
                </div>

                <div class="recipe-grid">
                    <div class="column">
                        <h3>🛒 Zutaten</h3>
                        <ul>
                            ${r.ingredientsList.map(ing => `<li>${ing.item}</li>`).join('')}
                        </ul>

                        <h3>📊 Nährwerte (pro Portion)</h3>
                        <table class="nutrition-table">
                            <tr><td>Kalorien</td><td><strong>${r.nutrition?.calories || '?'}</strong></td></tr>
                            <tr><td>Eiweiß</td><td><strong>${r.nutrition?.protein || '?'}</strong></td></tr>
                            <tr><td>Kohlenhydrate</td><td><strong>${r.nutrition?.carbs || '?'}</strong></td></tr>
                            <tr><td>Fett</td><td><strong>${r.nutrition?.fat || '?'}</strong></td></tr>
                        </table>
                    </div>

                    <div class="column">
                        <h3>👨‍🍳 Zubereitung</h3>
                        <ol>
                            ${r.instructions.map(inst => `<li>${inst}</li>`).join('')}
                        </ol>

                        <div class="tip-box">
                            <strong>💡 Chef-Tipp & Lagerung:</strong><br />
                            ${r.storageTip || r.tip || 'Kühl lagern und frisch genießen.'}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        return `
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <title>EcoChef Kochbuch</title>
                <style>
                    body {
                        font-family: 'Helvetica Neue', Arial, sans-serif;
                        color: #1e293b;
                        margin: 0;
                        padding: 20px;
                        background: #ffffff;
                    }
                    .cover-page {
                        text-align: center;
                        padding: 80px 20px;
                        page-break-after: always;
                        border: 4px double #15803d;
                        border-radius: 24px;
                        margin-bottom: 40px;
                    }
                    .cover-title {
                        font-size: 38px;
                        color: #15803d;
                        margin-bottom: 10px;
                    }
                    .cover-subtitle {
                        font-size: 18px;
                        color: #64748b;
                        margin-bottom: 40px;
                    }
                    .cover-badge {
                        display: inline-block;
                        background: #dcfce7;
                        color: #15803d;
                        padding: 12px 24px;
                        border-radius: 20px;
                        font-weight: bold;
                        font-size: 16px;
                    }
                    .recipe-page {
                        page-break-inside: avoid;
                        page-break-after: always;
                        padding: 20px 0;
                        border-bottom: 2px dashed #cbd5e1;
                    }
                    .recipe-header h2 {
                        font-size: 24px;
                        color: #0f172a;
                        margin: 0 0 10px 0;
                    }
                    .meta-pills {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    .pill {
                        background: #f1f5f9;
                        padding: 6px 12px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: bold;
                    }
                    .pill.eco { background: #dcfce7; color: #15803d; }
                    .pill.co2 { background: #dbeafe; color: #1d4ed8; }
                    .recipe-grid {
                        display: grid;
                        grid-template-columns: 1fr 1.5fr;
                        gap: 20px;
                    }
                    h3 {
                        font-size: 16px;
                        color: #15803d;
                        border-bottom: 2px solid #e2e8f0;
                        padding-bottom: 4px;
                        margin-top: 0;
                    }
                    ul, ol {
                        padding-left: 20px;
                        font-size: 13px;
                        line-height: 1.6;
                    }
                    .nutrition-table {
                        width: 100%;
                        font-size: 12px;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    .nutrition-table td {
                        padding: 6px;
                        border-bottom: 1px solid #f1f5f9;
                    }
                    .tip-box {
                        background: #fef3c7;
                        border-left: 4px solid #f59e0b;
                        padding: 12px;
                        font-size: 12px;
                        border-radius: 8px;
                        margin-top: 20px;
                    }
                    @media print {
                        .recipe-page { page-break-after: always; }
                    }
                </style>
            </head>
            <body>
                <div class="cover-page">
                    <div style="font-size: 72px;">${userAvatar}</div>
                    <h1 class="cover-title">Mein EcoChef Kochbuch</h1>
                    <div class="cover-subtitle">Kreative, klimaschonende Lieblingsrezepte aus der eigenen Küche</div>
                    <div class="cover-badge">🌱 Gesamte CO₂-Ersparnis: ${totalCO2} kg CO₂</div>
                </div>
                ${pages}
            </body>
            </html>
        `;
    },

    printCookbook(recipes: Recipe[], userAvatar = '🧑‍🍳'): void {
        const htmlContent = this.generateCookbookHtml(recipes, userAvatar);
        const printWin = window.open('', '_blank');
        if (printWin) {
            printWin.document.write(htmlContent);
            printWin.document.close();
            printWin.focus();
            setTimeout(() => {
                printWin.print();
            }, 500);
        }
    }
};
