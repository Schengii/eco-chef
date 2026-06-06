import { css } from 'lit';

export const ecoChefStyles = css`
    :host {
        display: block;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

        /* Standard Light Palette (Kontrast-optimiert für WCAG AAA / AA) */
        --primary: #035a41; /* Darker green for superior contrast */
        --primary-dark: #024330;
        --bg-color: #f1f5f9;
        --surface: #ffffff;
        --text-dark: #0f172a;
        --text-muted: #334155; /* Darker gray for high contrast */
        --border: #cbd5e1; /* Clearer borders */
        --font-scale: 1.0;
    }

    .app-wrapper {
        min-height: 100vh;
        background-color: var(--bg-color);
        transition: background-color 0.3s ease;
        color: var(--text-dark);
        font-size: calc(16px * var(--font-scale, 1.0));
    }

    .app-wrapper.dark-theme {
        --primary: #34d399;
        --primary-dark: #10b981;
        --bg-color: #0f172a;
        --surface: #1e293b;
        --text-dark: #f8fafc;
        --text-muted: #cbd5e1;
        --border: #475569;
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
        padding: 24px 20px 120px 20px;
        box-sizing: border-box;
        position: relative;
        box-shadow: 0 0 40px rgba(0,0,0,0.05);
        transition: background-color 0.3s ease;
    }

    .theme-toggle-btn {
        position: absolute;
        top: 24px;
        right: 20px;
        background: var(--surface);
        border: 2px solid var(--border);
        color: var(--text-dark);
        border-radius: 50%;
        width: 44px;
        height: 44px;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.2s;
        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }
    .theme-toggle-btn:active { transform: scale(0.9); }

    .header { text-align: center; margin-bottom: 32px; padding-top: 12px; }
    h2 { color: var(--text-dark); margin: 0; font-size: calc(32px * var(--font-scale, 1.0)); font-weight: 800; letter-spacing: -0.5px; }
    .subtitle { color: var(--text-muted); margin-top: 8px; font-size: calc(15px * var(--font-scale, 1.0)); font-weight: 600; }
    .header-actions { display: flex; justify-content: center; gap: 12px; margin-top: 16px; flex-wrap: wrap; }

    input {
        width: 100%; padding: 18px 20px; margin-bottom: 32px; box-sizing: border-box;
        border: 2px solid var(--border); border-radius: 16px; font-size: calc(16px * var(--font-scale, 1.0)); transition: all 0.3s ease;
        background-color: var(--bg-color); color: var(--text-dark); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
    }
    input:focus { outline: none; border-color: var(--primary); background-color: var(--surface); box-shadow: 0 0 0 4px rgba(3, 90, 65, 0.15); }
    input::placeholder { color: var(--text-muted); opacity: 0.7; }

    .filter-section { display: flex; flex-direction: column; gap: 24px; }
    .filter-title { font-size: calc(15px * var(--font-scale, 1.0)); font-weight: 700; color: var(--text-dark); margin: 0 0 12px 4px; text-transform: uppercase; letter-spacing: 0.5px; }

    .chip-group { display: flex; flex-wrap: wrap; gap: 10px; }
    .chip {
        padding: 12px 20px; border-radius: 100px; border: 2px solid var(--border); background: var(--surface);
        color: var(--text-dark); font-size: calc(15px * var(--font-scale, 1.0)); font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        flex-grow: 1; text-align: center;
    }
    .chip.active { background: #d1fae5; border-color: var(--primary); color: var(--primary-dark); }
    .dark-theme .chip.active { background: #064e3b; border-color: var(--primary); color: var(--primary-dark); }
    .chip:active { transform: scale(0.96); }

    .stepper-group { display: flex; align-items: center; justify-content: space-between; background: var(--bg-color); padding: 8px; border-radius: 20px; border: 1px solid var(--border); }
    .step-btn {
        background: var(--surface); border: 2px solid var(--border); width: 48px; height: 48px; border-radius: 14px;
        font-size: 24px; color: var(--text-dark); cursor: pointer; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: 0.1s;
    }
    .step-btn:active { transform: scale(0.92); background: var(--border); }
    .step-value { font-size: calc(18px * var(--font-scale, 1.0)); font-weight: 700; color: var(--text-dark); text-align: center; }

    .action-area {
        position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 600px;
        padding: 20px 20px 32px 20px; box-sizing: border-box; background: linear-gradient(to top, var(--surface) 70%, rgba(255,255,255,0));
        z-index: 100; display: flex; flex-direction: column; align-items: center;
    }
    .lrs-theme .action-area {
        background: linear-gradient(to top, #faf6eb 70%, rgba(250,246,235,0));
    }
    .dark-theme .action-area {
        background: linear-gradient(to top, var(--surface) 70%, rgba(30,41,59,0));
    }
    .main-btn {
        width: 100%; padding: 18px; background: var(--primary); color: white; border: none; border-radius: 16px;
        cursor: pointer; font-weight: 800; font-size: calc(18px * var(--font-scale, 1.0)); box-shadow: 0 8px 20px rgba(3, 90, 65, 0.3); transition: all 0.2s;
    }
    .main-btn:active { transform: translateY(2px); box-shadow: 0 4px 10px rgba(3, 90, 65, 0.2); }
    .finish-btn { margin-top: 32px; background: var(--text-dark); color: var(--surface); box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2); }

    .loader { border: 4px solid var(--border); border-top: 4px solid var(--primary); border-radius: 50%; width: 48px; height: 48px; animation: spin 1s linear infinite; }
    .loader-text { margin-top: 12px; color: var(--text-dark); font-weight: 600; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .recipe-paper { animation: fadeIn 0.4s ease-out; }
    .recipe-title { color: var(--text-dark); margin-top: 0; font-size: calc(28px * var(--font-scale, 1.0)); font-weight: 800; line-height: 1.2; margin-bottom: 32px; }
    .recipe-subheading { color: var(--text-dark); font-size: calc(20px * var(--font-scale, 1.0)); font-weight: 700; margin: 32px 0 16px 0; display: flex; align-items: center; gap: 8px; }

    .ingredients-list { padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px; }
    .ingredients-list li { background: var(--bg-color); padding: 16px; border-radius: 12px; color: var(--text-dark); font-weight: 600; border: 1.5px solid var(--border); display: flex; align-items: center; }
    .ingredients-list li::before { content: '•'; margin-right: 12px; font-weight: bold; }

    .add-to-list-btn { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 12px; font-size: 14px; font-weight: bold; cursor: pointer; margin-left: auto; transition: 0.2s; }
    .add-to-list-btn:active { transform: scale(0.9); }
    .dark-theme .add-to-list-btn { background: #1e3a8a; color: #93c5fd; border-color: #2563eb; }

    .instructions-box { display: flex; flex-direction: column; gap: 16px; }
    .step-item { display: flex; background: var(--surface); border: 2px solid var(--border); padding: 20px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .step-number { background: #d1fae5; color: var(--primary-dark); width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; margin-right: 16px; flex-shrink: 0; border: 1px solid var(--primary); }
    .step-text { color: var(--text-dark); line-height: 1.6; font-size: calc(16px * var(--font-scale, 1.0)); }

    .tip-box { margin-top: 32px; padding: 20px; background-color: #fef3c7; border: 2px solid #fcd34d; color: #78350f; border-radius: 16px; font-size: calc(15px * var(--font-scale, 1.0)); line-height: 1.6; }
    .extras-box { margin-top: 24px; padding: 20px; background-color: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 16px; color: #065f46; font-size: calc(15px * var(--font-scale, 1.0)); line-height: 1.6; display: flex; flex-direction: column; gap: 12px; }
    .extras-box p { margin: 0; }

    .macros-box { display: flex; gap: 12px; margin-top: 20px; margin-bottom: 20px; background: var(--bg-color); padding: 12px; border-radius: 12px; justify-content: center; flex-wrap: wrap; border: 2px solid var(--border); }
    .macro-item { color: var(--text-dark); font-size: calc(14px * var(--font-scale, 1.0)); font-weight: 500; }
    .macro-item strong { color: var(--text-dark); font-weight: 700; }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease-out; }
    .modal-content { background: var(--surface); border-radius: 32px 32px 0 0; padding: 32px 24px 40px 24px; width: 100%; max-width: 600px; box-shadow: 0 -10px 40px rgba(0,0,0,0.1); animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1); border-top: 3px solid var(--primary); }
    .modal-content h3 { margin-top: 0; color: var(--text-dark); font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .modal-content p { color: var(--text-dark); font-size: 16px; margin-bottom: 32px; font-weight: 500; }
    .modal-btn { width: 100%; padding: 18px; margin-bottom: 12px; border: 2px solid var(--border); border-radius: 16px; font-size: 16px; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }

    .recipe-meta { display: flex; justify-content: center; gap: 12px; margin-top: -16px; margin-bottom: 32px; flex-wrap: wrap; }
    .difficulty-badge, .time-badge, .eco-badge { padding: 8px 16px; border-radius: 20px; font-size: calc(14px * var(--font-scale, 1.0)); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 6px; }
    .time-badge { background: var(--surface); color: var(--text-dark); border: 2px solid var(--border); }
    .eco-badge { background: #ecfdf5; color: #15803d; border: 2px solid #a7f3d0; }
    .difficulty-badge.leicht { background: #d1fae5; color: #065f46; border: 2px solid #a7f3d0; }
    .difficulty-badge.mittel { background: #fef9c3; color: #713f12; border: 2px solid #fef08a; }
    .difficulty-badge.schwer { background: #fee2e2; color: #991b1b; border: 2px solid #fecaca; }
    .difficulty-badge.unbekannt { background: var(--bg-color); color: var(--text-dark); border: 2px solid var(--border); }

    .saved-btn { padding: 10px 20px; background: #d1fae5; color: var(--primary-dark); border: 2px solid var(--primary); border-radius: 100px; font-weight: 800; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1); }
    .saved-btn:active { transform: scale(0.95); }
    .dark-theme .saved-btn { background: #064e3b; color: #34d399; border-color: #34d399; }

    .shopping-list-container, .saved-recipes-container { animation: fadeIn 0.3s ease-out; }
    .empty-state { text-align: center; color: var(--text-dark); font-weight: 600; padding: 40px 20px; background: var(--bg-color); border-radius: 16px; border: 2px dashed var(--border); line-height: 1.6; }
    .saved-list { display: flex; flex-direction: column; gap: 16px; }
    .saved-card { display: flex; justify-content: space-between; align-items: center; background: var(--surface); border: 2px solid var(--border); padding: 16px; border-radius: 16px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.02); transition: transform 0.2s, box-shadow 0.2s; }
    .saved-card:active { transform: scale(0.98); background: var(--bg-color); }
    .saved-card h4 { margin: 0 0 8px 0; color: var(--text-dark); font-size: calc(16px * var(--font-scale, 1.0)); font-weight: 800; }
    .saved-meta { display: flex; gap: 12px; font-size: calc(12px * var(--font-scale, 1.0)); color: var(--text-muted); font-weight: 700; }
    .delete-btn { background: #fee2e2; border: 2px solid #fecaca; width: 44px; height: 44px; border-radius: 12px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .delete-btn:active { background: #fca5a5; transform: scale(0.9); }

    .shopping-item { display: flex; align-items: center; background: var(--surface); padding: 14px 16px; border-radius: 12px; border: 2px solid var(--border); margin-bottom: 10px; }
    .shopping-item.checked { background: var(--bg-color); }
    .shopping-item.checked span { text-decoration: line-through; color: var(--text-muted); }
    .shopping-checkbox { width: 26px; height: 26px; margin-right: 16px; cursor: pointer; accent-color: var(--primary); border: 2px solid var(--border); }
    .shopping-text { flex-grow: 1; font-size: calc(16px * var(--font-scale, 1.0)); font-weight: 600; color: var(--text-dark); }
    .add-item-box { display: flex; gap: 10px; margin-bottom: 24px; }

    .icon-btn { background: none; border: 2px solid var(--border); font-size: 18px; cursor: pointer; margin-left: auto; padding: 8px; border-radius: 50%; transition: background 0.2s; display: flex; align-items: center; justify-content: center; }
    .icon-btn:active { background: var(--border); }

    .edit-mode-box { background: var(--bg-color); padding: 16px; border-radius: 16px; border: 2px dashed var(--border); margin-bottom: 24px; animation: fadeIn 0.3s; }
    .edit-hint { font-size: 12px; color: var(--text-muted); margin: -12px 0 8px 0; }
    .edit-area { width: 100%; padding: 16px; border: 2px solid var(--border); border-radius: 12px; background: var(--surface); color: var(--text-dark); font-family: inherit; font-size: calc(15px * var(--font-scale, 1.0)); line-height: 1.6; box-sizing: border-box; resize: vertical; margin-bottom: 24px; }
    .edit-area:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(3, 90, 65, 0.15); }
    .save-edit-btn { background: var(--text-dark); color: var(--surface); margin-top: 0; }

    .regenerate-box { margin-top: 40px; padding: 24px; background: var(--bg-color); border-radius: 20px; text-align: center; border: 2px solid var(--border); }
    .regenerate-box h4 { margin: 0 0 16px 0; color: var(--text-dark); font-weight: 800; }
    .regenerate-input { margin-bottom: 16px; background: var(--surface); }
    .secondary-btn { width: 100%; padding: 16px; background: var(--surface); color: var(--text-dark); border: 2px solid var(--border); border-radius: 14px; font-weight: 700; font-size: 16px; cursor: pointer; transition: 0.2s; }
    .secondary-btn:active { background: var(--border); transform: scale(0.98); }
    .inline-loader { width: 32px; height: 32px; margin: 0 auto; }

    .cooking-mode-overlay { background: rgba(15, 23, 42, 0.95) !important; }
    .cooking-content { width: 90% !important; height: 75vh !important; display: flex; flex-direction: column; justify-content: space-between; padding: 30px 20px !important; background: var(--surface); border-top: 4px solid #f59e0b !important; }
    .cooking-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 15px; }
    .step-counter { font-weight: 800; color: #d97706; font-size: 18px; }
    .close-cooking-btn { background: none; border: 2px solid var(--border); padding: 6px 12px; border-radius: 8px; font-size: 14px; color: var(--text-dark); cursor: pointer; font-weight: bold; }
    .step-display { flex-grow: 1; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 24px; line-height: 1.6; color: var(--text-dark); padding: 20px 0; overflow-y: auto; font-weight: 700; }
    .cooking-controls { display: flex; justify-content: space-between; align-items: center; gap: 10px; border-top: 2px solid var(--border); padding-top: 20px; }
    .control-btn { background: var(--bg-color); border: 2px solid var(--border); padding: 12px; border-radius: 12px; font-weight: bold; color: var(--text-dark); cursor: pointer; flex: 1; }
    .control-btn[disabled] { opacity: 0.5; cursor: not-allowed; }
    .voice-btn { background: #15803d; border: none; flex: 1.5; margin: 0; padding: 12px; font-size: 18px; color: white; font-weight: 800; box-shadow: 0 4px 10px rgba(21, 128, 61, 0.3); }
    .voice-btn:active { transform: scale(0.95); }

    .timer-display { display: flex; justify-content: center; align-items: center; gap: 16px; padding: 16px; background: #fef3c7; border-radius: 16px; border: 2px solid #fcd34d; margin-bottom: 20px; }
    .start-timer-btn { background: #d97706; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3); transition: 0.2s; }
    .start-timer-btn:active { transform: scale(0.95); }
    .timer-countdown { font-size: 32px; font-weight: 800; color: #b45309; font-variant-numeric: tabular-nums; }
    .stop-timer-btn { background: #fee2e2; border: 2px solid #fecaca; color: #ef4444; padding: 10px 16px; border-radius: 10px; font-weight: bold; cursor: pointer; }
    .stop-timer-btn:active { transform: scale(0.95); }

    .toggle-container { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; background: var(--bg-color); padding: 12px 16px; border-radius: 16px; border: 2px solid var(--border); }
    .toggle-switch { position: relative; display: inline-block; width: 52px; height: 28px; flex-shrink: 0; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .3s; border-radius: 30px; border: 1px solid var(--border); }
    .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    input:checked + .slider { background-color: #15803d; }
    input:checked + .slider:before { transform: translateX(24px); }
    .toggle-label { font-size: 15px; font-weight: 700; transition: color 0.3s; color: var(--text-dark); }

    .input-with-camera { display: flex; gap: 10px; align-items: center; }
    .input-with-camera input { flex-grow: 1; margin-bottom: 0; }
    .camera-btn { background: #15803d; border: none; border-radius: 12px; width: 56px; height: 56px; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(21, 128, 61, 0.3); transition: 0.2s; color: white;}
    .camera-btn:active { transform: scale(0.9); }

    .image-preview-box { margin-top: 15px; position: relative; background: var(--bg-color); padding: 10px; border-radius: 12px; border: 2px dashed var(--border); text-align: center; }
    .image-preview-box img { max-width: 100%; max-height: 200px; border-radius: 8px; }
    .remove-image-btn { position: absolute; top: -10px; right: -10px; background: #dc2626; color: white; border: 2px solid #fecaca; border-radius: 20px; padding: 6px 12px; font-size: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }

    .modal-btn.share { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
    .modal-btn.save { background: var(--bg-color); border-color: var(--border); color: var(--text-dark); }
    .modal-btn.new { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
    .modal-btn.exit { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
    .modal-btn.cancel { background: transparent; border: none; color: var(--text-muted); text-decoration: underline; margin-top: 16px; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

    /* Dark Mode Overrides */
    .dark-theme .cooking-mode-overlay { background: rgba(15, 23, 42, 0.98) !important; }
    .dark-theme .timer-display { background: #451a03; border-color: #78350f; }
    .dark-theme .start-timer-btn { background: #d97706; }
    .dark-theme .timer-countdown { color: #fde68a; }
    .dark-theme .stop-timer-btn { background: #7f1d1d; color: #fca5a5; border-color: #b91c1c; }
    .dark-theme .regenerate-box { background: #1e293b; }
    .dark-theme .edit-mode-box { background: #1e293b; border-color: #334155; }
    .dark-theme .tip-box { background: #451a03; border-color: #78350f; color: #fde68a; }
    .dark-theme .extras-box { background: #064e3b; border-color: #047857; color: #34d399; }
    .dark-theme .chip.active { background: #064e3b; border-color: #34d399; color: #34d399; }
    .dark-theme .step-number { background: #064e3b; color: #34d399; border-color: #047857; }
    .dark-theme .recipe-rating-box { background: #1e293b; }

    /* --- ERWEITERTE BARRIEREFREIHEIT, LRS & FUNKTIONEN --- */
    
    /* WCAG: Universeller Fokusring für Tastaturbedienung (Deutlich sichtbarer Fokus) */
    button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible, .chip:focus-visible, .pantry-item:focus-visible, .allergen-item:focus-visible {
        outline: 3px solid #2563eb !important;
        outline-offset: 2px !important;
    }

    /* Screen Reader Only Klasse */
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
        height: 32px;
        background-color: rgba(254, 240, 138, 0.4);
        border-top: 3px solid rgba(234, 179, 8, 0.8);
        border-bottom: 3px solid rgba(234, 179, 8, 0.8);
        pointer-events: none;
        z-index: 10;
        transition: top 0.1s ease-out;
    }
    .dark-theme .reading-ruler {
        background-color: rgba(251, 191, 36, 0.2);
        border-top-color: rgba(251, 191, 36, 0.6);
        border-bottom-color: rgba(251, 191, 36, 0.6);
    }
    
    .reading-ruler-handle {
        position: absolute;
        right: 12px;
        top: -12px;
        background: #d97706;
        border: 1.5px solid white;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        cursor: ns-resize;
        pointer-events: auto;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }

    /* Sprachsteuerung Statusbar */
    .voice-status-bar {
        background: #ecfdf5;
        border: 2px solid #34d399;
        border-radius: 12px;
        padding: 12px 16px;
        margin: 12px 0;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #065f46;
        font-weight: 700;
        animation: fadeIn 0.3s ease;
    }
    .dark-theme .voice-status-bar {
        background: #064e3b;
        border-color: #059669;
        color: #34d399;
    }
    .voice-status-bar .mic-pulse {
        width: 12px;
        height: 12px;
        background: #ef4444;
        border-radius: 50%;
        animation: pulse 1s infinite alternate;
    }
    @keyframes pulse {
        from { transform: scale(0.8); opacity: 0.5; }
        to { transform: scale(1.2); opacity: 1; }
    }

    /* Vorratskammer & Settings Styling */
    .pantry-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 10px;
        margin-bottom: 20px;
    }
    .pantry-item {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--bg-color);
        padding: 10px 12px;
        border-radius: 12px;
        border: 2px solid var(--border);
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        user-select: none;
        color: var(--text-dark);
    }
    .pantry-item.active {
        background: #d1fae5;
        border-color: var(--primary);
        color: var(--primary-dark);
    }
    .dark-theme .pantry-item.active {
        background: #064e3b;
        color: #34d399;
    }

    .settings-section {
        background: var(--surface);
        border: 2px solid var(--border);
        border-radius: 20px;
        padding: 20px;
        margin-bottom: 24px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.02);
    }
    .settings-title {
        font-size: 16px;
        font-weight: 800;
        margin: 0 0 16px 0;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-dark);
        border-bottom: 2px solid var(--border);
        padding-bottom: 8px;
    }
    
    .font-size-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
    }

    /* Privacy / Cookie Consent Banner: WCAG contrast compliant buttons */
    .gdpr-banner {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 600px;
        background: var(--surface);
        box-shadow: 0 -10px 30px rgba(0,0,0,0.2);
        border-radius: 24px 24px 0 0;
        padding: 24px 20px 32px 20px;
        box-sizing: border-box;
        z-index: 2000;
        border: 2px solid var(--border);
        border-top: 4px solid var(--primary);
        animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1);
    }
    .gdpr-text {
        font-size: 14px;
        line-height: 1.6;
        color: var(--text-dark);
        margin-bottom: 20px;
        font-weight: 500;
    }
    .gdpr-buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .gdpr-buttons .main-btn {
        background: #15803d;
        color: white;
        font-weight: 800;
        border: 2px solid #166534;
    }
    .gdpr-buttons .secondary-btn {
        border-color: var(--text-dark);
        color: var(--text-dark);
        font-weight: 700;
    }

    /* Startseite / Welcome Screen Styles */
    .welcome-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 32px 24px;
        box-sizing: border-box;
        text-align: center;
        background: linear-gradient(135deg, var(--bg-color) 0%, rgba(4, 120, 87, 0.05) 100%);
        animation: fadeIn 0.5s ease-out;
    }
    .dark-theme .welcome-container {
        background: linear-gradient(135deg, var(--bg-color) 0%, rgba(52, 211, 153, 0.05) 100%);
    }

    .welcome-logo-area {
        margin-bottom: 32px;
        position: relative;
    }
    .welcome-logo {
        font-size: 72px;
        filter: drop-shadow(0 10px 15px rgba(4, 120, 87, 0.15));
        animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }

    .welcome-title {
        font-size: calc(36px * var(--font-scale, 1.0));
        font-weight: 900;
        margin: 0 0 12px 0;
        letter-spacing: -1px;
        background: linear-gradient(45deg, var(--primary-dark), var(--primary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .dark-theme .welcome-title {
        background: linear-gradient(45deg, var(--primary), #34d399);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .welcome-desc {
        font-size: calc(16px * var(--font-scale, 1.0));
        line-height: 1.6;
        color: var(--text-muted);
        margin: 0 0 40px 0;
        max-width: 440px;
        font-weight: 500;
    }

    .welcome-quick-settings {
        width: 100%;
        max-width: 440px;
        margin-bottom: 40px;
        padding: 24px;
        background: var(--surface);
        border: 2px solid var(--border);
        border-radius: 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.02);
    }
    
    .welcome-quick-settings h4 {
        margin: 0 0 16px 0;
        font-size: 15px;
        font-weight: 800;
        color: var(--text-dark);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .welcome-enter-btn {
        width: 100%;
        max-width: 440px;
        padding: 20px;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 20px;
        font-size: calc(20px * var(--font-scale, 1.0));
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 10px 25px rgba(3, 90, 65, 0.3);
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
    }
    .welcome-enter-btn:active {
        transform: scale(0.97) translateY(2px);
        box-shadow: 0 5px 10px rgba(3, 90, 65, 0.2);
    }

    /* Rezept-Bild Styles */
    .recipe-image-box {
        width: 100%;
        height: 250px;
        border-radius: 20px;
        overflow: hidden;
        margin-bottom: 24px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        border: 2px solid var(--border);
        background-color: var(--bg-color);
        position: relative;
    }
    .recipe-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
    }
    .recipe-image-box:hover .recipe-image {
        transform: scale(1.03);
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
        font-weight: bold;
    }
    .recipe-image-placeholder .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--border);
        border-top: 3px solid var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    /* Resteverwerter Chips */
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
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 700;
        color: var(--text-dark);
        animation: fadeIn 0.2s ease;
    }
    .ingredient-chip.urgent {
        background: #fee2e2;
        border-color: #ef4444;
        color: #991b1b;
    }
    .dark-theme .ingredient-chip.urgent {
        background: #450a0a;
        border-color: #ef4444;
        color: #fca5a5;
    }
    .urgent-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        font-size: 14px;
        display: flex;
        align-items: center;
    }
    .remove-chip-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0 0 0 4px;
        font-size: 12px;
        color: var(--text-dark);
        font-weight: bold;
    }
    
    /* Einkaufslisten-Kategorien */
    .shopping-category-header {
        font-size: 14px;
        font-weight: 800;
        color: var(--primary-dark);
        margin: 24px 0 12px 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid var(--border);
        padding-bottom: 4px;
    }
    .dark-theme .shopping-category-header {
        color: var(--primary);
    }

    /* Allergene Grid */
    .allergens-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 10px;
        margin-bottom: 20px;
    }
    .allergen-item {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--bg-color);
        padding: 10px 12px;
        border-radius: 12px;
        border: 2px solid var(--border);
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        user-select: none;
        justify-content: center;
        text-align: center;
        color: var(--text-dark);
    }
    .allergen-item.active {
        background: #fee2e2;
        border-color: #ef4444;
        color: #991b1b;
    }
    .dark-theme .allergen-item.active {
        background: #450a0a;
        border-color: #ef4444;
        color: #fca5a5;
    }

    /* Statistik Dashboard */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 20px;
    }
    .stat-card {
        background: var(--bg-color);
        border: 2px solid var(--border);
        border-radius: 16px;
        padding: 16px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.01);
    }
    .stat-card.full-width {
        grid-column: span 2;
        background: #ecfdf5;
        border-color: #34d399;
        color: #065f46;
    }
    .dark-theme .stat-card.full-width {
        background: #064e3b;
        border-color: #047857;
        color: #34d399;
    }
    .stat-value {
        font-size: 22px;
        font-weight: 800;
        color: var(--text-dark);
        margin-bottom: 4px;
    }
    .stat-card.full-width .stat-value {
        color: inherit;
    }
    .stat-label {
        font-size: 12px;
        color: var(--text-dark);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .stat-card.full-width .stat-label {
        color: inherit;
    }
    .stat-bar-container {
        width: 100%;
        height: 8px;
        background: var(--border);
        border-radius: 4px;
        margin-top: 8px;
        overflow: hidden;
    }
    .stat-bar-fill {
        height: 100%;
        background: var(--primary);
        border-radius: 4px;
        transition: width 0.3s ease;
    }
    .stat-bar-fill.calories { background: #d97706; }
    .stat-bar-fill.protein { background: #15803d; }
    .stat-bar-fill.co2 { background: #2563eb; }

    /* Suchfeld */
    .search-box {
        margin-bottom: 8px;
    }
    .search-box input {
        border-radius: 20px;
        padding-left: 20px;
    }

    /* Sternebewertung */
    .rating-stars {
        display: flex;
        gap: 4px;
        margin-top: 6px;
    }
    .star-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 20px; /* Slightly larger targets for accessibility */
        padding: 4px;
        color: var(--text-muted);
        transition: transform 0.15s ease, color 0.2s;
        line-height: 1;
    }
    .star-btn:hover {
        transform: scale(1.2);
    }
    .star-btn:active {
        transform: scale(0.9);
    }
    .star-btn.filled {
        color: #d97706;
    }

    /* Große Sterne für Rezeptansicht */
    .rating-stars.large {
        gap: 8px;
        justify-content: center;
    }
    .star-btn.large {
        font-size: 32px;
        padding: 6px;
    }

    /* Bewertungsbox im Rezept */
    .recipe-rating-box {
        text-align: center;
        padding: 20px;
        background: var(--bg-color);
        border: 2px solid var(--border);
        border-radius: 16px;
        margin-top: 24px;
        margin-bottom: 8px;
    }
    .dark-theme .recipe-rating-box {
        background: #1e293b;
    }

    /* Saved card improvements */
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
        font-weight: 700;
        color: var(--text-dark);
    }
    .goal-input-container input {
        margin-bottom: 0;
        padding: 12px 14px;
        border-radius: 12px;
        font-weight: bold;
        border: 2px solid var(--border);
    }

    /* Premium Circular Progress Rings */
    .circular-progress-container {
        position: relative;
        width: 120px;
        height: 120px;
        margin: 16px auto;
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
        transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .circular-progress circle.fg.calories {
        stroke: #d97706;
    }
    .circular-progress circle.fg.protein {
        stroke: #15803d;
    }
    .dark-theme .circular-progress circle.fg.protein {
        stroke: #34d399;
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
        font-weight: 800;
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
        font-weight: 600;
        margin-top: 8px;
        text-align: center;
    }
`;
