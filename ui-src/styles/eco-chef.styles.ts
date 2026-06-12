import { css } from 'lit';

export const ecoChefStyles = css`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

    :host {
        display: block;
        font-family: 'Outfit', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

        /* Standard Light Palette (Kontrast-optimiert & Harmonisch) */
        --primary: hsl(161, 94%, 30%); /* Rich Emerald green for high contrast */
        --primary-light: hsl(161, 94%, 94%);
        --primary-dark: hsl(161, 94%, 20%);
        --primary-gradient: linear-gradient(135deg, hsl(161, 94%, 33%) 0%, hsl(161, 94%, 22%) 100%);
        
        --bg-color: hsl(210, 40%, 96.1%); /* Slate-50 background */
        --surface: hsl(0, 0%, 100%);
        --surface-glass: rgba(255, 255, 255, 0.85);
        --text-dark: hsl(222, 47%, 11%); /* Slate-900 */
        --text-muted: hsl(215.4, 16.3%, 46.9%); /* Slate-500 */
        --border: hsl(214.3, 31.8%, 91.4%); /* Slate-200 */
        --font-scale: 1.0;
        
        --accent: hsl(38, 92%, 50%); /* Warm amber for alerts & cooking */
        --accent-light: hsl(38, 92%, 95%);
        --accent-dark: hsl(38, 92%, 40%);

        --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
        --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .app-wrapper {
        min-height: 100vh;
        background-color: var(--bg-color);
        transition: background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        color: var(--text-dark);
        font-size: calc(16px * var(--font-scale, 1.0));
    }

    .app-wrapper.dark-theme {
        --primary: hsl(161, 94%, 40%); /* Glowing Emerald */
        --primary-light: hsl(161, 94%, 12%);
        --primary-dark: hsl(161, 94%, 50%);
        --primary-gradient: linear-gradient(135deg, hsl(161, 94%, 43%) 0%, hsl(161, 94%, 32%) 100%);
        
        --bg-color: hsl(222, 47%, 7%); /* Slate-950 deep dark background */
        --surface: hsl(222, 47%, 12%); /* Slate-900 */
        --surface-glass: rgba(15, 23, 42, 0.85);
        --text-dark: hsl(210, 40%, 98%); /* Slate-50 */
        --text-muted: hsl(215, 20.2%, 65.1%); /* Slate-400 */
        --border: hsl(217, 32.6%, 17.5%); /* Slate-800 */

        --accent-light: hsl(38, 92%, 12%);
        --accent-dark: hsl(38, 92%, 60%);

        --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
        --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
    }

    /* WCAG: LRS-Modus (Optimiertes Warm-Cream-Design für Legasthenie) */
    .app-wrapper.lrs-theme {
        font-family: 'OpenDyslexic', 'Comic Sans MS', 'Verdana', sans-serif !important;
        --line-height: 1.8 !important;
        --letter-spacing: 0.12em !important;
        --word-spacing: 0.16em !important;
        --bg-color: #f7f3e8 !important;
        --surface: #faf6eb !important;
        --border: #dcd7c9 !important;
        --text-dark: #262421 !important;
        --text-muted: #4e4a42 !important;
    }

    .card {
        background-color: var(--surface);
        max-width: 600px;
        margin: 0 auto;
        min-height: 100vh;
        padding: 24px 20px 140px 20px;
        box-sizing: border-box;
        position: relative;
        box-shadow: var(--shadow-xl);
        transition: background-color 0.4s ease, box-shadow 0.4s ease;
    }

    .theme-toggle-btn {
        position: absolute;
        top: 24px;
        right: 20px;
        background: var(--surface);
        border: 2px solid var(--border);
        color: var(--text-dark);
        border-radius: 16px;
        width: 44px;
        height: 44px;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: var(--shadow-sm);
    }
    .theme-toggle-btn:hover {
        background: var(--border);
        transform: translateY(-2px);
    }
    .theme-toggle-btn:active {
        transform: scale(0.9);
    }

    .header { text-align: center; margin-bottom: 32px; padding-top: 12px; }
    h2 { 
        color: var(--text-dark); 
        margin: 0; 
        font-size: calc(34px * var(--font-scale, 1.0)); 
        font-weight: 900; 
        letter-spacing: -1px;
        background: linear-gradient(135deg, var(--text-dark), var(--primary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .subtitle { color: var(--text-muted); margin-top: 8px; font-size: calc(15px * var(--font-scale, 1.0)); font-weight: 600; letter-spacing: -0.2px; }
    .header-actions { display: flex; justify-content: center; gap: 8px; margin-top: 20px; flex-wrap: wrap; }

    input {
        width: 100%; padding: 16px 20px; margin-bottom: 32px; box-sizing: border-box;
        border: 2px solid var(--border); border-radius: 18px; font-size: calc(16px * var(--font-scale, 1.0)); 
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background-color: var(--bg-color); color: var(--text-dark); 
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        font-family: inherit;
    }
    input:focus { 
        outline: none; 
        border-color: var(--primary); 
        background-color: var(--surface); 
        box-shadow: 0 0 0 4px var(--primary-light), var(--shadow-md); 
    }
    input::placeholder { color: var(--text-muted); opacity: 0.6; }

    .filter-section { display: flex; flex-direction: column; gap: 24px; }
    .filter-title { font-size: calc(14px * var(--font-scale, 1.0)); font-weight: 800; color: var(--text-dark); margin: 0 0 10px 4px; text-transform: uppercase; letter-spacing: 0.8px; opacity: 0.95; }

    .chip-group { display: flex; flex-wrap: wrap; gap: 10px; }
    .chip {
        padding: 12px 20px; border-radius: 100px; border: 2px solid var(--border); background: var(--surface);
        color: var(--text-dark); font-size: calc(15px * var(--font-scale, 1.0)); font-weight: 700; cursor: pointer; 
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        flex-grow: 1; text-align: center;
        box-shadow: var(--shadow-sm);
        font-family: inherit;
    }
    .chip:hover {
        border-color: var(--primary);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
    }
    .chip.active { background: var(--primary-light); border-color: var(--primary); color: var(--primary-dark); }
    .chip:active { transform: scale(0.96); }

    .stepper-group { 
        display: flex; 
        align-items: center; 
        justify-content: space-between; 
        background: var(--bg-color); 
        padding: 8px; 
        border-radius: 24px; 
        border: 2px solid var(--border); 
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
    }
    .step-btn {
        background: var(--surface); border: 2px solid var(--border); width: 48px; height: 48px; border-radius: 16px;
        font-size: 22px; color: var(--text-dark); cursor: pointer; display: flex; align-items: center; justify-content: center;
        box-shadow: var(--shadow-sm); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .step-btn:hover {
        background: var(--border);
        border-color: var(--text-muted);
    }
    .step-btn:active { transform: scale(0.9); }
    .step-value { font-size: calc(17px * var(--font-scale, 1.0)); font-weight: 800; color: var(--text-dark); text-align: center; }

    .action-area {
        position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 600px;
        padding: 24px 20px 36px 20px; box-sizing: border-box; 
        background: linear-gradient(to top, var(--surface) 80%, rgba(255,255,255,0));
        z-index: 100; display: flex; flex-direction: column; align-items: center;
        backdrop-filter: blur(8px);
    }
    .lrs-theme .action-area {
        background: linear-gradient(to top, #faf6eb 80%, rgba(250,246,235,0));
    }
    .dark-theme .action-area {
        background: linear-gradient(to top, var(--surface) 80%, rgba(15,23,42,0));
    }
    .main-btn {
        width: 100%; padding: 18px; background: var(--primary-gradient); color: white; border: none; border-radius: 20px;
        cursor: pointer; font-weight: 800; font-size: calc(18px * var(--font-scale, 1.0)); 
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.25); 
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: inherit;
        letter-spacing: 0.5px;
    }
    .main-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 30px rgba(16, 185, 129, 0.35);
    }
    .main-btn:active { transform: translateY(1px) scale(0.98); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
    .finish-btn { margin-top: 32px; background: var(--text-dark); color: var(--surface); box-shadow: var(--shadow-lg); }

    .loader { 
        border: 4px solid var(--border); 
        border-top: 4px solid var(--primary); 
        border-radius: 50%; 
        width: 48px; 
        height: 48px; 
        animation: spin 0.8s linear infinite; 
    }
    .loader-text { margin-top: 14px; color: var(--text-dark); font-weight: 700; letter-spacing: -0.2px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .recipe-paper { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    .recipe-title { color: var(--text-dark); margin-top: 0; font-size: calc(28px * var(--font-scale, 1.0)); font-weight: 850; line-height: 1.25; margin-bottom: 24px; letter-spacing: -0.8px; }
    .recipe-subheading { color: var(--text-dark); font-size: calc(20px * var(--font-scale, 1.0)); font-weight: 800; margin: 36px 0 18px 0; display: flex; align-items: center; gap: 10px; letter-spacing: -0.4px; }

    .ingredients-list { padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .ingredients-list li { 
        background: var(--bg-color); 
        padding: 16px; 
        border-radius: 16px; 
        color: var(--text-dark); 
        font-weight: 700; 
        border: 2px solid var(--border); 
        display: flex; 
        align-items: center;
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .ingredients-list li:hover {
        transform: translateX(4px);
        border-color: var(--primary);
    }
    .ingredients-list li::before { content: '•'; margin-right: 12px; font-weight: bold; color: var(--primary); font-size: 18px; }

    .add-to-list-btn { 
        background: var(--primary-light); color: var(--primary-dark); border: 2px solid var(--primary); border-radius: 12px; 
        padding: 8px 14px; font-size: 13px; font-weight: 800; cursor: pointer; margin-left: auto; 
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: inherit;
    }
    .add-to-list-btn:hover {
        background: var(--primary);
        color: white;
    }
    .add-to-list-btn:active { transform: scale(0.9); }

    .instructions-box { display: flex; flex-direction: column; gap: 16px; }
    .step-item { 
        display: flex; 
        background: var(--surface); 
        border: 2px solid var(--border); 
        padding: 20px; 
        border-radius: 20px; 
        box-shadow: var(--shadow-sm);
        transition: border-color 0.3s ease, transform 0.3s ease;
    }
    .step-item:hover {
        border-color: var(--primary);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }
    .step-number { 
        background: var(--primary-light); 
        color: var(--primary-dark); 
        width: 34px; 
        height: 34px; 
        border-radius: 12px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-weight: 800; 
        font-size: 15px; 
        margin-right: 16px; 
        flex-shrink: 0; 
        border: 2px solid var(--primary); 
    }
    .step-text { color: var(--text-dark); line-height: 1.65; font-size: calc(16px * var(--font-scale, 1.0)); font-weight: 500; }

    .tip-box { 
        margin-top: 32px; padding: 20px; 
        background-color: var(--accent-light); 
        border: 2px solid var(--accent); 
        color: var(--accent-dark); 
        border-radius: 20px; font-size: calc(15px * var(--font-scale, 1.0)); line-height: 1.65; 
        font-weight: 600;
        box-shadow: var(--shadow-sm);
    }
    .extras-box { 
        margin-top: 24px; padding: 20px; 
        background-color: var(--primary-light); 
        border: 2px solid var(--primary); 
        border-radius: 20px; 
        color: var(--primary-dark); 
        font-size: calc(15px * var(--font-scale, 1.0)); line-height: 1.65; 
        display: flex; flex-direction: column; gap: 12px;
        font-weight: 600;
        box-shadow: var(--shadow-sm);
    }
    .extras-box p { margin: 0; }

    .macros-box { 
        display: flex; gap: 8px; margin-top: 24px; margin-bottom: 24px; 
        background: var(--bg-color); padding: 12px; border-radius: 16px; 
        justify-content: space-around; flex-wrap: wrap; border: 2px solid var(--border); 
    }
    .macro-item { color: var(--text-dark); font-size: calc(14px * var(--font-scale, 1.0)); font-weight: 600; }
    .macro-item strong { color: var(--primary-dark); font-weight: 800; }
    .dark-theme .macro-item strong { color: var(--primary); }

    .modal-overlay { 
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(12px); 
        display: flex; align-items: flex-end; justify-content: center; z-index: 1000; 
        animation: fadeIn 0.3s ease-out; 
    }
    .modal-content { 
        background: var(--surface); border-radius: 32px 32px 0 0; padding: 32px 24px 40px 24px; 
        width: 100%; max-width: 600px; box-shadow: var(--shadow-xl); 
        animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
        border-top: 4px solid var(--primary); 
    }
    .modal-content h3 { margin-top: 0; color: var(--text-dark); font-size: 24px; font-weight: 900; margin-bottom: 8px; letter-spacing: -0.5px; }
    .modal-content p { color: var(--text-muted); font-size: 15px; margin-bottom: 32px; font-weight: 600; }
    .modal-btn { 
        width: 100%; padding: 18px; margin-bottom: 12px; border: 2px solid var(--border); border-radius: 18px; 
        font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
        display: flex; align-items: center; justify-content: center; gap: 8px;
        font-family: inherit;
    }
    .modal-btn:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
        border-color: var(--primary);
    }
    .modal-btn:active { transform: scale(0.97); }

    .recipe-meta { display: flex; justify-content: center; gap: 8px; margin-top: -16px; margin-bottom: 32px; flex-wrap: wrap; }
    .difficulty-badge, .time-badge, .eco-badge { 
        padding: 8px 16px; border-radius: 100px; 
        font-size: calc(13px * var(--font-scale, 1.0)); font-weight: 800; 
        text-transform: uppercase; letter-spacing: 0.8px; box-shadow: var(--shadow-sm); 
        display: flex; align-items: center; gap: 6px; 
    }
    .time-badge { background: var(--surface); color: var(--text-dark); border: 2px solid var(--border); }
    .eco-badge { background: hsl(142.1, 76.2%, 96.3%); color: hsl(142.1, 76.2%, 26.3%); border: 2px solid hsl(142.1, 76.2%, 86.3%); }
    .dark-theme .eco-badge { background: hsl(142.1, 76.2%, 10%); color: hsl(142.1, 76.2%, 46.3%); border-color: hsl(142.1, 76.2%, 20%); }
    
    .difficulty-badge.leicht { background: hsl(142.1, 76.2%, 96.3%); color: hsl(142.1, 76.2%, 26.3%); border: 2px solid hsl(142.1, 76.2%, 86.3%); }
    .difficulty-badge.mittel { background: hsl(47.9, 95.8%, 95.3%); color: hsl(47.9, 95.8%, 25.3%); border: 2px solid hsl(47.9, 95.8%, 85.3%); }
    .difficulty-badge.schwer { background: hsl(0, 84.3%, 97.3%); color: hsl(0, 84.3%, 37.3%); border: 2px solid hsl(0, 84.3%, 87.3%); }
    
    .dark-theme .difficulty-badge.leicht { background: hsl(142.1, 76.2%, 10%); color: hsl(142.1, 76.2%, 46.3%); border-color: hsl(142.1, 76.2%, 20%); }
    .dark-theme .difficulty-badge.mittel { background: hsl(47.9, 95.8%, 10%); color: hsl(47.9, 95.8%, 45.3%); border-color: hsl(47.9, 95.8%, 20%); }
    .dark-theme .difficulty-badge.schwer { background: hsl(0, 84.3%, 10%); color: hsl(0, 84.3%, 57.3%); border-color: hsl(0, 84.3%, 20%); }
    
    .difficulty-badge.unbekannt { background: var(--bg-color); color: var(--text-dark); border: 2px solid var(--border); }

    .saved-btn { 
        padding: 10px 20px; background: var(--primary-light); color: var(--primary-dark); border: 2px solid var(--primary); 
        border-radius: 100px; font-weight: 800; font-size: 13px; cursor: pointer; 
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
        box-shadow: var(--shadow-sm);
        font-family: inherit;
    }
    .saved-btn:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
        background: var(--primary);
        color: white;
    }
    .saved-btn:active { transform: scale(0.95); }

    .shopping-list-container, .saved-recipes-container { animation: fadeIn 0.3s ease-out; }
    .empty-state { 
        text-align: center; color: var(--text-muted); font-weight: 700; padding: 48px 24px; 
        background: var(--bg-color); border-radius: 20px; border: 2px dashed var(--border); 
        line-height: 1.6; font-size: 15px;
    }
    .saved-list { display: flex; flex-direction: column; gap: 16px; }
    .saved-card { 
        display: flex; justify-content: space-between; align-items: center; background: var(--surface); 
        border: 2px solid var(--border); padding: 18px; border-radius: 20px; cursor: pointer; 
        box-shadow: var(--shadow-sm); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
    }
    .saved-card:hover {
        transform: translateY(-2px);
        border-color: var(--primary);
        box-shadow: var(--shadow-md);
    }
    .saved-card:active { transform: scale(0.98); background: var(--bg-color); }
    .saved-card h4 { margin: 0 0 8px 0; color: var(--text-dark); font-size: calc(16px * var(--font-scale, 1.0)); font-weight: 850; letter-spacing: -0.3px; }
    .saved-meta { display: flex; gap: 12px; font-size: calc(12px * var(--font-scale, 1.0)); color: var(--text-muted); font-weight: 700; }
    
    .delete-btn { 
        background: hsl(0, 84.3%, 97.3%); border: 2px solid hsl(0, 84.3%, 87.3%); 
        width: 44px; height: 44px; border-radius: 14px; font-size: 18px; cursor: pointer; 
        display: flex; align-items: center; justify-content: center; 
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
    }
    .delete-btn:hover {
        background: hsl(0, 84.3%, 90%);
        border-color: hsl(0, 84.3%, 50%);
        transform: scale(1.05);
    }
    .delete-btn:active { background: hsl(0, 84.3%, 80%); transform: scale(0.9); }
    .dark-theme .delete-btn {
        background: hsl(0, 84.3%, 10%);
        border-color: hsl(0, 84.3%, 30%);
        color: hsl(0, 84.3%, 70%);
    }

    .shopping-item { 
        display: flex; align-items: center; background: var(--surface); padding: 16px; 
        border-radius: 16px; border: 2px solid var(--border); margin-bottom: 12px; 
        box-shadow: var(--shadow-sm); transition: all 0.2s ease;
    }
    .shopping-item.checked { background: var(--bg-color); opacity: 0.8; }
    .shopping-item.checked span { text-decoration: line-through; color: var(--text-muted); }
    .shopping-checkbox { width: 24px; height: 24px; margin-right: 16px; cursor: pointer; accent-color: var(--primary); border: 2px solid var(--border); }
    .shopping-text { flex-grow: 1; font-size: calc(16px * var(--font-scale, 1.0)); font-weight: 700; color: var(--text-dark); }
    .add-item-box { display: flex; gap: 10px; margin-bottom: 24px; }

    .icon-btn { 
        background: none; border: 2px solid var(--border); font-size: 18px; cursor: pointer; 
        margin-left: auto; padding: 8px; border-radius: 50%; 
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; justify-content: center; 
    }
    .icon-btn:hover {
        background: var(--border);
        transform: scale(1.05);
    }
    .icon-btn:active { transform: scale(0.9); }

    .edit-mode-box { background: var(--bg-color); padding: 18px; border-radius: 20px; border: 2px dashed var(--border); margin-bottom: 24px; animation: fadeIn 0.3s; }
    .edit-hint { font-size: 12px; color: var(--text-muted); margin: -12px 0 8px 0; font-weight: 600; }
    .edit-area { 
        width: 100%; padding: 16px; border: 2px solid var(--border); border-radius: 16px; 
        background: var(--surface); color: var(--text-dark); font-family: inherit; 
        font-size: calc(15px * var(--font-scale, 1.0)); line-height: 1.6; box-sizing: border-box; 
        resize: vertical; margin-bottom: 24px; 
    }
    .edit-area:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-light); }
    .save-edit-btn { background: var(--text-dark); color: var(--surface); margin-top: 0; }

    .regenerate-box { margin-top: 40px; padding: 24px; background: var(--bg-color); border-radius: 24px; text-align: center; border: 2px solid var(--border); }
    .regenerate-box h4 { margin: 0 0 16px 0; color: var(--text-dark); font-weight: 850; letter-spacing: -0.3px; }
    .regenerate-input { margin-bottom: 16px; background: var(--surface); }
    .secondary-btn { 
        width: 100%; padding: 16px; background: var(--surface); color: var(--text-dark); border: 2px solid var(--border); 
        border-radius: 16px; font-weight: 800; font-size: 16px; cursor: pointer; 
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
        font-family: inherit;
        box-shadow: var(--shadow-sm);
    }
    .secondary-btn:hover {
        background: var(--bg-color);
        border-color: var(--text-muted);
    }
    .secondary-btn:active { background: var(--border); transform: scale(0.98); }
    .inline-loader { width: 32px; height: 32px; margin: 0 auto; }

    .cooking-mode-overlay { background: rgba(15, 23, 42, 0.96) !important; }
    .cooking-content { 
        width: 92% !important; height: 80vh !important; display: flex; 
        flex-direction: column; justify-content: space-between; padding: 30px 24px !important; 
        background: var(--surface); border-top: 6px solid var(--accent) !important; 
        border-radius: 24px 24px 0 0 !important;
        box-shadow: var(--shadow-xl);
    }
    .cooking-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 15px; }
    .step-counter { font-weight: 900; color: var(--accent-dark); font-size: 19px; letter-spacing: -0.3px; }
    .close-cooking-btn { 
        background: none; border: 2px solid var(--border); padding: 8px 16px; border-radius: 12px; 
        font-size: 13px; color: var(--text-dark); cursor: pointer; font-weight: 800;
        font-family: inherit; transition: background 0.2s;
    }
    .close-cooking-btn:hover { background: var(--bg-color); }
    
    .step-display { 
        flex-grow: 1; display: flex; align-items: center; justify-content: center; text-align: center; 
        font-size: calc(24px * var(--font-scale, 1.0)); line-height: 1.65; color: var(--text-dark); 
        padding: 20px 0; overflow-y: auto; font-weight: 800; letter-spacing: -0.5px;
    }
    .cooking-controls { display: flex; justify-content: space-between; align-items: center; gap: 10px; border-top: 2px solid var(--border); padding-top: 20px; }
    .control-btn { 
        background: var(--bg-color); border: 2px solid var(--border); padding: 14px; border-radius: 16px; 
        font-weight: 800; color: var(--text-dark); cursor: pointer; flex: 1; font-family: inherit;
        transition: all 0.2s;
    }
    .control-btn:hover:not([disabled]) {
        background: var(--border);
    }
    .control-btn[disabled] { opacity: 0.4; cursor: not-allowed; }
    
    .voice-btn { 
        background: var(--primary-gradient); border: none; flex: 1.5; margin: 0; padding: 14px; 
        font-size: 18px; color: white; font-weight: 900; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); 
        border-radius: 16px; cursor: pointer; transition: all 0.2s;
        font-family: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    .voice-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    }
    .voice-btn:active { transform: scale(0.95); }

    .timer-display { 
        display: flex; justify-content: center; align-items: center; gap: 16px; padding: 16px; 
        background: var(--accent-light); border-radius: 20px; border: 2px solid var(--accent); margin-bottom: 24px; 
    }
    .start-timer-btn { 
        background: var(--accent); color: white; border: none; padding: 12px 24px; border-radius: 14px; 
        font-size: 17px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25); 
        transition: all 0.2s; font-family: inherit;
    }
    .start-timer-btn:hover {
        background: var(--accent-dark);
        transform: translateY(-1px);
    }
    .start-timer-btn:active { transform: scale(0.95); }
    .timer-countdown { font-size: 32px; font-weight: 900; color: var(--accent-dark); font-variant-numeric: tabular-nums; letter-spacing: -0.5px; }
    .stop-timer-btn { 
        background: hsl(0, 84.3%, 97.3%); border: 2px solid hsl(0, 84.3%, 87.3%); color: hsl(0, 84.3%, 37.3%); 
        padding: 10px 18px; border-radius: 12px; font-weight: 800; cursor: pointer; font-family: inherit;
    }
    .stop-timer-btn:hover { background: hsl(0, 84.3%, 90%); }
    .stop-timer-btn:active { transform: scale(0.95); }

    .toggle-container { 
        display: flex; align-items: center; gap: 12px; margin-bottom: 20px; 
        background: var(--bg-color); padding: 14px 18px; border-radius: 20px; border: 2px solid var(--border); 
        transition: background-color 0.3s ease;
    }
    .toggle-switch { position: relative; display: inline-block; width: 52px; height: 28px; flex-shrink: 0; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .3s; border-radius: 30px; border: 1px solid var(--border); }
    .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
    input:checked + .slider { background-color: hsl(161, 94%, 30%); }
    .dark-theme input:checked + .slider { background-color: hsl(161, 94%, 40%); }
    input:checked + .slider:before { transform: translateX(24px); }
    .toggle-label { font-size: 15px; font-weight: 800; transition: color 0.3s; color: var(--text-dark); letter-spacing: -0.2px; }

    .input-with-camera { display: flex; gap: 10px; align-items: center; }
    .input-with-camera input { flex-grow: 1; margin-bottom: 0; }
    .camera-btn { 
        background: var(--primary-gradient); border: none; border-radius: 16px; width: 56px; height: 56px; 
        font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; 
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); color: white;
    }
    .camera-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
    }
    .camera-btn:active { transform: scale(0.9); }

    .image-preview-box { margin-top: 15px; position: relative; background: var(--bg-color); padding: 12px; border-radius: 18px; border: 2px dashed var(--border); text-align: center; }
    .image-preview-box img { max-width: 100%; max-height: 200px; border-radius: 12px; box-shadow: var(--shadow-md); }
    .remove-image-btn { 
        position: absolute; top: -10px; right: -10px; background: #dc2626; color: white; border: 2px solid #fecaca; 
        border-radius: 20px; padding: 6px 12px; font-size: 12px; font-weight: 800; cursor: pointer; 
        box-shadow: var(--shadow-md); transition: background 0.2s;
    }
    .remove-image-btn:hover { background: #b91c1c; }

    .modal-btn.share { background: hsl(210, 100%, 96.1%); border-color: hsl(210, 100%, 85%); color: hsl(210, 100%, 35%); }
    .modal-btn.save { background: var(--bg-color); border-color: var(--border); color: var(--text-dark); }
    .modal-btn.new { background: var(--primary-light); border-color: var(--primary); color: var(--primary-dark); }
    .modal-btn.exit { background: hsl(0, 84.3%, 97.3%); border-color: hsl(0, 84.3%, 87.3%); color: hsl(0, 84.3%, 37.3%); }
    .modal-btn.cancel { background: transparent; border: none; color: var(--text-muted); text-decoration: underline; margin-top: 16px; font-weight: 700; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

    /* Dark Mode Overrides for Alerts */
    .dark-theme .cooking-mode-overlay { background: rgba(15, 23, 42, 0.98) !important; }
    .dark-theme .timer-display { background: var(--accent-light); border-color: var(--accent); }
    .dark-theme .timer-countdown { color: hsl(38, 92%, 80%); }
    .dark-theme .stop-timer-btn { background: hsl(0, 84.3%, 10%); color: hsl(0, 84.3%, 70%); border-color: hsl(0, 84.3%, 20%); }
    .dark-theme .stop-timer-btn:hover { background: hsl(0, 84.3%, 15%); }
    .dark-theme .regenerate-box { background: var(--surface); }
    .dark-theme .edit-mode-box { background: var(--surface); border-color: var(--border); }
    .dark-theme .tip-box { background: var(--accent-light); border-color: var(--accent); color: hsl(38, 92%, 80%); }
    .dark-theme .extras-box { background: var(--primary-light); border-color: var(--primary); color: var(--primary-dark); }
    
    /* Erweitertes Barrierefreiheits-Styling */
    
    /* Fokusring */
    button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible, .chip:focus-visible, .pantry-item:focus-visible, .allergen-item:focus-visible {
        outline: 3px solid var(--primary) !important;
        outline-offset: 3px !important;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    .app-wrapper.lrs-theme .step-text,
    .app-wrapper.lrs-theme .recipe-title,
    .app-wrapper.lrs-theme p,
    .app-wrapper.lrs-theme li,
    .app-wrapper.lrs-theme span,
    .app-wrapper.lrs-theme button,
    .app-wrapper.lrs-theme input,
    .app-wrapper.lrs-theme textarea {
        line-height: var(--line-height) !important;
        letter-spacing: var(--letter-spacing) !important;
        word-spacing: var(--word-spacing) !important;
    }

    /* Leselineal (Reading Ruler) */
    .reading-ruler {
        position: absolute;
        left: 0;
        right: 0;
        height: 36px;
        background-color: rgba(251, 191, 36, 0.25);
        border-top: 3px solid var(--accent);
        border-bottom: 3px solid var(--accent);
        pointer-events: none;
        z-index: 10;
        transition: top 0.1s ease-out;
    }
    .dark-theme .reading-ruler {
        background-color: rgba(251, 191, 36, 0.15);
        border-top-color: var(--accent);
        border-bottom-color: var(--accent);
    }
    
    .reading-ruler-handle {
        position: absolute;
        right: 12px;
        top: -10px;
        background: var(--accent);
        border: 2px solid white;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: ns-resize;
        pointer-events: auto;
        box-shadow: var(--shadow-md);
        font-weight: bold;
    }

    /* Sprachsteuerung Statusbar */
    .voice-status-bar {
        background: var(--primary-light);
        border: 2px solid var(--primary);
        border-radius: 16px;
        padding: 12px 18px;
        margin: 16px 0;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: var(--primary-dark);
        font-weight: 800;
        animation: fadeIn 0.3s ease;
        box-shadow: var(--shadow-sm);
    }
    .voice-status-bar .mic-pulse {
        width: 14px;
        height: 14px;
        background: #ef4444;
        border-radius: 50%;
        animation: pulse 1s infinite alternate;
        box-shadow: 0 0 8px #ef4444;
    }
    @keyframes pulse {
        from { transform: scale(0.85); opacity: 0.6; }
        to { transform: scale(1.2); opacity: 1; box-shadow: 0 0 12px #ef4444; }
    }

    /* Vorratskammer & Settings Styling */
    .pantry-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
        gap: 10px;
        margin-bottom: 24px;
    }
    .pantry-item {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--bg-color);
        padding: 12px 14px;
        border-radius: 16px;
        border: 2px solid var(--border);
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        user-select: none;
        color: var(--text-dark);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .pantry-item:hover {
        border-color: var(--primary);
        background: var(--surface);
    }
    .pantry-item.active {
        background: var(--primary-light);
        border-color: var(--primary);
        color: var(--primary-dark);
        box-shadow: var(--shadow-sm);
    }

    .settings-section {
        background: var(--surface);
        border: 2px solid var(--border);
        border-radius: 24px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: var(--shadow-md);
    }
    .settings-title {
        font-size: 16px;
        font-weight: 850;
        margin: 0 0 18px 0;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-dark);
        border-bottom: 2px solid var(--border);
        padding-bottom: 10px;
        letter-spacing: -0.3px;
    }
    
    .font-size-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
    }

    /* GDPR Banner */
    .gdpr-banner {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 600px;
        background: var(--surface);
        box-shadow: 0 -15px 40px rgba(0,0,0,0.15);
        border-radius: 28px 28px 0 0;
        padding: 28px 24px 36px 24px;
        box-sizing: border-box;
        z-index: 2000;
        border: 2px solid var(--border);
        border-top: 5px solid var(--primary);
        animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .gdpr-text {
        font-size: 14px;
        line-height: 1.65;
        color: var(--text-dark);
        margin-bottom: 24px;
        font-weight: 600;
    }
    .gdpr-buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .gdpr-buttons .main-btn {
        background: var(--primary-gradient);
        color: white;
        font-weight: 800;
    }
    .gdpr-buttons .secondary-btn {
        border-color: var(--text-dark);
        color: var(--text-dark);
        font-weight: 800;
    }

    /* Welcome Screen */
    .welcome-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 40px 24px;
        box-sizing: border-box;
        text-align: center;
        background: radial-gradient(circle at top, var(--primary-light) 0%, var(--bg-color) 100%);
        animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .dark-theme .welcome-container {
        background: radial-gradient(circle at top, var(--primary-light) 0%, var(--bg-color) 100%);
    }

    .welcome-logo-area {
        margin-bottom: 36px;
        position: relative;
    }
    .welcome-logo {
        font-size: 84px;
        display: inline-block;
        filter: drop-shadow(0 15px 20px rgba(16, 185, 129, 0.25));
        animation: float 4s ease-in-out infinite;
    }
    @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-12px) rotate(3deg); }
    }

    .welcome-title {
        font-size: calc(40px * var(--font-scale, 1.0));
        font-weight: 900;
        margin: 0 0 12px 0;
        letter-spacing: -1.2px;
        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .dark-theme .welcome-title {
        background: linear-gradient(135deg, var(--primary), #34d399);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .welcome-desc {
        font-size: calc(16px * var(--font-scale, 1.0));
        line-height: 1.65;
        color: var(--text-muted);
        margin: 0 0 44px 0;
        max-width: 440px;
        font-weight: 600;
    }

    .welcome-quick-settings {
        width: 100%;
        max-width: 440px;
        margin-bottom: 44px;
        padding: 24px;
        background: var(--surface-glass);
        border: 2px solid var(--border);
        border-radius: 24px;
        box-shadow: var(--shadow-lg);
        backdrop-filter: blur(8px);
    }
    .welcome-quick-settings h4 {
        margin: 0 0 18px 0;
        font-size: 14px;
        font-weight: 800;
        color: var(--text-dark);
        text-transform: uppercase;
        letter-spacing: 0.8px;
    }

    .welcome-enter-btn {
        width: 100%;
        max-width: 440px;
        padding: 20px;
        background: var(--primary-gradient);
        color: white;
        border: none;
        border-radius: 20px;
        font-size: calc(20px * var(--font-scale, 1.0));
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-family: inherit;
        letter-spacing: 0.5px;
    }
    .welcome-enter-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 15px 35px rgba(16, 185, 129, 0.4);
    }
    .welcome-enter-btn:active {
        transform: scale(0.97) translateY(1px);
        box-shadow: 0 5px 15px rgba(16, 185, 129, 0.2);
    }

    .recipe-image-box {
        width: 100%;
        height: 250px;
        border-radius: 24px;
        overflow: hidden;
        margin-bottom: 28px;
        box-shadow: var(--shadow-lg);
        border: 2px solid var(--border);
        background-color: var(--bg-color);
        position: relative;
    }
    .recipe-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .recipe-image-box:hover .recipe-image {
        transform: scale(1.04);
    }
    .recipe-image-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        gap: 8px;
        font-weight: 700;
    }
    .recipe-image-placeholder .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--border);
        border-top: 3px solid var(--primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    .ingredient-chips-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
        margin-bottom: 24px;
    }
    .ingredient-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--surface);
        border: 2px solid var(--border);
        padding: 8px 14px;
        border-radius: 14px;
        font-size: 14px;
        font-weight: 700;
        color: var(--text-dark);
        animation: fadeIn 0.25s ease;
        box-shadow: var(--shadow-sm);
        transition: border-color 0.2s;
    }
    .ingredient-chip:hover { border-color: var(--primary); }
    .ingredient-chip.urgent {
        background: hsl(0, 84.3%, 97.3%);
        border-color: hsl(0, 84.3%, 50%);
        color: hsl(0, 84.3%, 25%);
    }
    .dark-theme .ingredient-chip.urgent {
        background: hsl(0, 84.3%, 10%);
        border-color: hsl(0, 84.3%, 50%);
        color: hsl(0, 84.3%, 80%);
    }
    .urgent-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        font-size: 14px;
        display: flex;
        align-items: center;
        transition: transform 0.2s;
    }
    .urgent-btn:hover { transform: scale(1.2); }
    .remove-chip-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0 0 0 4px;
        font-size: 12px;
        color: var(--text-muted);
        font-weight: bold;
        transition: color 0.2s;
    }
    .remove-chip-btn:hover { color: #dc2626; }
    
    .shopping-category-header {
        font-size: 13px;
        font-weight: 850;
        color: var(--primary);
        margin: 28px 0 12px 4px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        border-bottom: 2px solid var(--border);
        padding-bottom: 6px;
    }

    .allergens-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 10px;
        margin-bottom: 24px;
    }
    .allergen-item {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--bg-color);
        padding: 12px 14px;
        border-radius: 16px;
        border: 2px solid var(--border);
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        user-select: none;
        justify-content: center;
        text-align: center;
        color: var(--text-dark);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .allergen-item:hover {
        border-color: #dc2626;
        background: var(--surface);
    }
    .allergen-item.active {
        background: hsl(0, 84.3%, 97.3%);
        border-color: hsl(0, 84.3%, 50%);
        color: hsl(0, 84.3%, 25%);
        box-shadow: var(--shadow-sm);
    }
    .dark-theme .allergen-item.active {
        background: hsl(0, 84.3%, 10%);
        color: hsl(0, 84.3%, 80%);
    }

    /* Statistik Dashboard */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 24px;
    }
    .stat-card {
        background: var(--bg-color);
        border: 2px solid var(--border);
        border-radius: 20px;
        padding: 18px;
        text-align: center;
        box-shadow: var(--shadow-sm);
    }
    .stat-card.full-width {
        grid-column: span 2;
        background: var(--primary-light);
        border-color: var(--primary);
        color: var(--primary-dark);
    }
    .stat-value {
        font-size: 24px;
        font-weight: 900;
        color: var(--text-dark);
        margin-bottom: 4px;
        letter-spacing: -0.5px;
    }
    .stat-card.full-width .stat-value {
        color: inherit;
    }
    .stat-label {
        font-size: 11px;
        color: var(--text-muted);
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.8px;
    }
    .stat-card.full-width .stat-label {
        color: inherit;
        opacity: 0.9;
    }
    .stat-bar-container {
        width: 100%;
        height: 8px;
        background: var(--border);
        border-radius: 4px;
        margin-top: 10px;
        overflow: hidden;
    }
    .stat-bar-fill {
        height: 100%;
        background: var(--primary);
        border-radius: 4px;
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .stat-bar-fill.calories { background: var(--accent); }
    .stat-bar-fill.protein { background: var(--primary); }
    .stat-bar-fill.co2 { background: hsl(210, 100%, 50%); }

    .search-box {
        margin-bottom: 12px;
    }
    .search-box input {
        border-radius: 20px;
    }

    /* Sternebewertung */
    .rating-stars {
        display: flex;
        gap: 6px;
        margin-top: 8px;
    }
    .star-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 22px;
        padding: 4px;
        color: var(--text-muted);
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.2s;
        line-height: 1;
    }
    .star-btn:hover {
        transform: scale(1.25);
    }
    .star-btn:active {
        transform: scale(0.9);
    }
    .star-btn.filled {
        color: var(--accent);
    }

    .rating-stars.large {
        gap: 10px;
        justify-content: center;
    }
    .star-btn.large {
        font-size: 34px;
        padding: 6px;
    }

    .recipe-rating-box {
        text-align: center;
        padding: 24px;
        background: var(--bg-color);
        border: 2px solid var(--border);
        border-radius: 20px;
        margin-top: 32px;
        margin-bottom: 12px;
        box-shadow: var(--shadow-sm);
    }

    .saved-card-content {
        flex: 1;
        min-width: 0;
    }

    /* Goals Inputs */
    .goals-input-group {
        display: flex;
        gap: 12px;
        margin-top: 16px;
    }
    .goal-input-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
        text-align: left;
    }
    .goal-input-container label {
        font-size: 13px;
        font-weight: 800;
        color: var(--text-dark);
    }
    .goal-input-container input {
        margin-bottom: 0;
        padding: 12px 16px;
        border-radius: 14px;
        font-weight: 800;
        border: 2px solid var(--border);
        font-family: inherit;
    }

    /* Circular Progress Rings */
    .circular-progress-container {
        position: relative;
        width: 100%;
        max-width: 120px;
        aspect-ratio: 1;
        margin: 20px auto;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .circular-progress {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
    }
    .circular-progress circle {
        fill: none;
        stroke-width: 8;
        stroke-linecap: round;
    }
    .circular-progress circle.bg {
        stroke: var(--border);
    }
    .circular-progress circle.fg {
        stroke-dasharray: 251.2;
        transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .circular-progress circle.fg.calories {
        stroke: var(--accent);
    }
    .circular-progress circle.fg.protein {
        stroke: var(--primary);
    }
    .circular-progress-text {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        pointer-events: none;
    }
    .circular-progress-text .value {
        font-size: 16px;
        font-weight: 900;
        color: var(--text-dark);
        line-height: 1.1;
    }
    .circular-progress-text .target {
        font-size: 10px;
        color: var(--text-muted);
        font-weight: 700;
        margin-top: 2px;
    }
    .stat-subtext {
        font-size: 11px;
        color: var(--text-muted);
        font-weight: 700;
        margin-top: 10px;
        text-align: center;
    }

    @media (max-width: 480px) {
        .settings-section {
            padding: 16px;
        }
        .goals-input-group {
            flex-direction: column;
            gap: 12px;
        }
        .stat-card {
            padding: 12px 6px;
        }
        .stat-value {
            font-size: 20px;
        }
        .stat-label {
            font-size: 10px;
        }
        .circular-progress-container {
            margin: 12px auto;
        }
        .circular-progress-text .value {
            font-size: 14px;
        }
        .circular-progress-text .target {
            font-size: 9px;
        }
        .stat-subtext {
            font-size: 10px;
            margin-top: 6px;
        }
    }
`;
