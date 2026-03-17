import { css } from 'lit';

export const ecoChefStyles = css`
    :host {
        display: block;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

        /* Standard Light Palette */
        --primary: #10b981;
        --primary-dark: #059669;
        --bg-color: #f8fafc;
        --surface: #ffffff;
        --text-dark: #0f172a;
        --text-muted: #64748b;
        --border: #e2e8f0;
    }

    .app-wrapper {
        min-height: 100vh;
        background-color: var(--bg-color);
        transition: background-color 0.3s ease;
        color: var(--text-dark);
    }

    .app-wrapper.dark-theme {
        --primary: #34d399;
        --primary-dark: #10b981;
        --bg-color: #0f172a;
        --surface: #1e293b;
        --text-dark: #f8fafc;
        --text-muted: #94a3b8;
        --border: #334155;
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
    h2 { color: var(--text-dark); margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
    .subtitle { color: var(--text-muted); margin-top: 8px; font-size: 15px; font-weight: 500; }
    .header-actions { display: flex; justify-content: center; gap: 12px; margin-top: 16px; }

    input {
        width: 100%; padding: 18px 20px; margin-bottom: 32px; box-sizing: border-box;
        border: 2px solid var(--border); border-radius: 16px; font-size: 16px; transition: all 0.3s ease;
        background-color: var(--bg-color); color: var(--text-dark); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
    }
    input:focus { outline: none; border-color: var(--primary); background-color: var(--surface); box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); }
    input::placeholder { color: #94a3b8; }

    .filter-section { display: flex; flex-direction: column; gap: 24px; }
    .filter-title { font-size: 15px; font-weight: 700; color: var(--text-dark); margin: 0 0 12px 4px; text-transform: uppercase; letter-spacing: 0.5px; }

    .chip-group { display: flex; flex-wrap: wrap; gap: 10px; }
    .chip {
        padding: 12px 20px; border-radius: 100px; border: 2px solid var(--border); background: var(--surface);
        color: var(--text-muted); font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        flex-grow: 1; text-align: center;
    }
    .chip.active { background: #ecfdf5; border-color: var(--primary); color: var(--primary-dark); }
    .chip:active { transform: scale(0.96); }

    .stepper-group { display: flex; align-items: center; justify-content: space-between; background: var(--bg-color); padding: 8px; border-radius: 20px; border: 1px solid var(--border); }
    .step-btn {
        background: var(--surface); border: 1px solid var(--border); width: 48px; height: 48px; border-radius: 14px;
        font-size: 24px; color: var(--text-dark); cursor: pointer; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: 0.1s;
    }
    .step-btn:active { transform: scale(0.92); background: var(--border); }
    .step-value { font-size: 18px; font-weight: 700; color: var(--text-dark); text-align: center; }

    .action-area {
        position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 600px;
        padding: 20px 20px 32px 20px; box-sizing: border-box; background: linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0));
        z-index: 100; display: flex; flex-direction: column; align-items: center;
    }
    .main-btn {
        width: 100%; padding: 18px; background: var(--primary); color: white; border: none; border-radius: 16px;
        cursor: pointer; font-weight: 800; font-size: 18px; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); transition: all 0.2s;
    }
    .main-btn:active { transform: translateY(2px); box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2); }
    .finish-btn { margin-top: 32px; background: var(--text-dark); box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2); }

    .loader { border: 4px solid var(--border); border-top: 4px solid var(--primary); border-radius: 50%; width: 48px; height: 48px; animation: spin 1s linear infinite; }
    .loader-text { margin-top: 12px; color: var(--text-dark); font-weight: 600; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .recipe-paper { animation: fadeIn 0.4s ease-out; }
    .recipe-title { color: var(--text-dark); margin-top: 0; font-size: 28px; font-weight: 800; line-height: 1.2; margin-bottom: 32px; }
    .recipe-subheading { color: var(--text-dark); font-size: 20px; font-weight: 700; margin: 32px 0 16px 0; display: flex; align-items: center; gap: 8px; }

    .ingredients-list { padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px; }
    .ingredients-list li { background: var(--bg-color); padding: 16px; border-radius: 12px; color: var(--text-dark); font-weight: 500; border: 1px solid var(--border); display: flex; align-items: center; }
    .ingredients-list li::before { content: '*'; margin-right: 12px; }

    .add-to-list-btn { background: #e0f2fe; color: #0284c7; border: none; border-radius: 8px; padding: 8px 12px; font-size: 14px; font-weight: bold; cursor: pointer; margin-left: auto; transition: 0.2s; }
    .add-to-list-btn:active { transform: scale(0.9); }

    .instructions-box { display: flex; flex-direction: column; gap: 16px; }
    .step-item { display: flex; background: var(--surface); border: 1px solid var(--border); padding: 20px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .step-number { background: #ecfdf5; color: var(--primary-dark); width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; margin-right: 16px; flex-shrink: 0; }
    .step-text { color: var(--text-dark); line-height: 1.6; font-size: 16px; }

    .tip-box { margin-top: 32px; padding: 20px; background-color: #fffbeb; border: 1px solid #fde68a; color: #92400e; border-radius: 16px; font-size: 15px; line-height: 1.6; }
    .extras-box { margin-top: 24px; padding: 20px; background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 16px; color: #0f766e; font-size: 15px; line-height: 1.6; display: flex; flex-direction: column; gap: 12px; }
    .extras-box p { margin: 0; }

    .macros-box { display: flex; gap: 12px; margin-top: 20px; margin-bottom: 20px; background: var(--bg-color); padding: 12px; border-radius: 12px; justify-content: center; flex-wrap: wrap; border: 1px solid var(--border); }
    .macro-item { color: var(--text-muted); font-size: 14px; }
    .macro-item strong { color: var(--text-dark); }

    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease-out; }
    .modal-content { background: var(--surface); border-radius: 32px 32px 0 0; padding: 32px 24px 40px 24px; width: 100%; max-width: 600px; box-shadow: 0 -10px 40px rgba(0,0,0,0.1); animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1); }
    .modal-content h3 { margin-top: 0; color: var(--text-dark); font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .modal-content p { color: var(--text-muted); font-size: 16px; margin-bottom: 32px; }
    .modal-btn { width: 100%; padding: 18px; margin-bottom: 12px; border: none; border-radius: 16px; font-size: 16px; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }

    .recipe-meta { display: flex; justify-content: center; gap: 12px; margin-top: -16px; margin-bottom: 32px; flex-wrap: wrap; }
    .difficulty-badge, .time-badge, .eco-badge { padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 6px; }
    .time-badge { background: #f8fafc; color: #334155; border: 1px solid #cbd5e1; }
    .eco-badge { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
    .difficulty-badge.leicht { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .difficulty-badge.mittel { background: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
    .difficulty-badge.schwer { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .difficulty-badge.unbekannt { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    .saved-btn { padding: 10px 20px; background: #ecfdf5; color: var(--primary-dark); border: 1px solid #a7f3d0; border-radius: 100px; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1); }
    .saved-btn:active { transform: scale(0.95); }

    .shopping-list-container, .saved-recipes-container { animation: fadeIn 0.3s ease-out; }
    .empty-state { text-align: center; color: var(--text-muted); padding: 40px 20px; background: var(--bg-color); border-radius: 16px; border: 2px dashed var(--border); line-height: 1.6; }
    .saved-list { display: flex; flex-direction: column; gap: 16px; }
    .saved-card { display: flex; justify-content: space-between; align-items: center; background: var(--surface); border: 1px solid var(--border); padding: 16px; border-radius: 16px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.02); transition: transform 0.2s, box-shadow 0.2s; }
    .saved-card:active { transform: scale(0.98); background: var(--bg-color); }
    .saved-card h4 { margin: 0 0 8px 0; color: var(--text-dark); font-size: 16px; }
    .saved-meta { display: flex; gap: 12px; font-size: 12px; color: var(--text-muted); font-weight: 600; }
    .delete-btn { background: #fef2f2; border: none; width: 40px; height: 40px; border-radius: 12px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .delete-btn:active { background: #fecaca; transform: scale(0.9); }

    .shopping-item { display: flex; align-items: center; background: var(--surface); padding: 14px 16px; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 10px; }
    .shopping-item.checked span { text-decoration: line-through; color: var(--text-muted); }
    .shopping-checkbox { width: 24px; height: 24px; margin-right: 16px; cursor: pointer; accent-color: var(--primary); }
    .shopping-text { flex-grow: 1; font-size: 16px; font-weight: 500; }
    .add-item-box { display: flex; gap: 10px; margin-bottom: 24px; }

    .icon-btn { background: none; border: none; font-size: 18px; cursor: pointer; margin-left: auto; padding: 8px; border-radius: 50%; transition: background 0.2s; }
    .icon-btn:active { background: var(--border); }

    .edit-mode-box { background: #f8fafc; padding: 16px; border-radius: 16px; border: 2px dashed #cbd5e1; margin-bottom: 24px; animation: fadeIn 0.3s; }
    .edit-hint { font-size: 12px; color: var(--text-muted); margin: -12px 0 8px 0; }
    .edit-area { width: 100%; padding: 16px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); color: var(--text-dark); font-family: inherit; font-size: 15px; line-height: 1.6; box-sizing: border-box; resize: vertical; margin-bottom: 24px; }
    .edit-area:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
    .save-edit-btn { background: var(--text-dark); margin-top: 0; }

    .regenerate-box { margin-top: 40px; padding: 24px; background: #f1f5f9; border-radius: 20px; text-align: center; }
    .regenerate-box h4 { margin: 0 0 16px 0; color: var(--text-dark); }
    .regenerate-input { margin-bottom: 16px; background: var(--surface); }
    .secondary-btn { width: 100%; padding: 16px; background: var(--surface); color: var(--text-dark); border: 2px solid var(--border); border-radius: 14px; font-weight: 700; font-size: 16px; cursor: pointer; transition: 0.2s; }
    .secondary-btn:active { background: var(--border); transform: scale(0.98); }
    .inline-loader { width: 32px; height: 32px; margin: 0 auto; }

    .cooking-mode-overlay { background: rgba(15, 23, 42, 0.95) !important; }
    .cooking-content { width: 90% !important; height: 75vh !important; display: flex; flex-direction: column; justify-content: space-between; padding: 30px 20px !important; background: var(--surface); }
    .cooking-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 15px; }
    .step-counter { font-weight: bold; color: #f59e0b; font-size: 18px; }
    .close-cooking-btn { background: none; border: none; font-size: 16px; color: var(--text-muted); cursor: pointer; }
    .step-display { flex-grow: 1; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 24px; line-height: 1.6; color: var(--text-dark); padding: 20px 0; overflow-y: auto; }
    .cooking-controls { display: flex; justify-content: space-between; align-items: center; gap: 10px; border-top: 2px solid var(--border); padding-top: 20px; }
    .control-btn { background: var(--bg-color); border: none; padding: 12px; border-radius: 12px; font-weight: bold; color: var(--text-dark); cursor: pointer; flex: 1; }
    .control-btn[disabled] { opacity: 0.5; cursor: not-allowed; }
    .voice-btn { background: #4CAF50; flex: 1.5; margin: 0; padding: 12px; font-size: 18px; color: white;}

    /* NEU: CSS für den schlauen Timer */
    .timer-display { display: flex; justify-content: center; align-items: center; gap: 16px; padding: 16px; background: #fffbeb; border-radius: 16px; border: 2px solid #fde68a; margin-bottom: 20px; }
    .start-timer-btn { background: #f59e0b; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); transition: 0.2s; }
    .start-timer-btn:active { transform: scale(0.95); }
    .timer-countdown { font-size: 32px; font-weight: 800; color: #d97706; font-variant-numeric: tabular-nums; }
    .stop-timer-btn { background: #fee2e2; color: #ef4444; border: none; padding: 10px 16px; border-radius: 10px; font-weight: bold; cursor: pointer; }
    .stop-timer-btn:active { transform: scale(0.95); }

    .toggle-container { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; background: var(--bg-color); padding: 12px 16px; border-radius: 16px; border: 1px solid var(--border); }
    .toggle-switch { position: relative; display: inline-block; width: 52px; height: 28px; flex-shrink: 0; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .3s; border-radius: 30px; }
    .slider:before { position: absolute; content: ""; height: 22px; width: 22px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    input:checked + .slider { background-color: #4CAF50; }
    input:checked + .slider:before { transform: translateX(24px); }
    .toggle-label { font-size: 15px; font-weight: 600; transition: color 0.3s; }

    .input-with-camera { display: flex; gap: 10px; align-items: center; }
    .input-with-camera input { flex-grow: 1; margin-bottom: 0; }
    .camera-btn { background: #4CAF50; border: none; border-radius: 12px; width: 56px; height: 56px; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3); transition: 0.2s; color: white;}
    .camera-btn:active { transform: scale(0.9); }

    .image-preview-box { margin-top: 15px; position: relative; background: var(--bg-color); padding: 10px; border-radius: 12px; border: 2px dashed var(--border); text-align: center; }
    .image-preview-box img { max-width: 100%; max-height: 200px; border-radius: 8px; }
    .remove-image-btn { position: absolute; top: -10px; right: -10px; background: #ef4444; color: white; border: none; border-radius: 20px; padding: 6px 12px; font-size: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }

    .modal-btn.share { background: #f0f9ff; color: #0284c7; }
    .modal-btn.save { background: var(--bg-color); color: var(--text-dark); }
    .modal-btn.new { background: #ecfdf5; color: var(--primary-dark); }
    .modal-btn.exit { background: #fef2f2; color: #dc2626; }
    .modal-btn.cancel { background: transparent; color: var(--text-muted); text-decoration: underline; margin-top: 16px; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

    /* DARK MODE OVERRIDES */
    .dark-theme .action-area { background: linear-gradient(to top, rgba(30,41,59,1) 70%, rgba(30,41,59,0)); }
    .dark-theme .chip.active { background: #064e3b; color: #34d399; }
    .dark-theme .step-number { background: #064e3b; color: #34d399; }
    .dark-theme .tip-box { background-color: #451a03; border-color: #78350f; color: #fde68a; }
    .dark-theme .extras-box { background-color: #134e4a; border-color: #115e59; color: #5eead4; }
    .dark-theme .difficulty-badge.leicht { background: #064e3b; color: #6ee7b7; border-color: #047857; }
    .dark-theme .difficulty-badge.mittel { background: #422006; color: #fde047; border-color: #854d0e; }
    .dark-theme .difficulty-badge.schwer { background: #450a0a; color: #fca5a5; border-color: #991b1b; }
    .dark-theme .difficulty-badge.unbekannt { background: #334155; color: #cbd5e1; border-color: #475569; }
    .dark-theme .eco-badge { background: #064e3b; color: #6ee7b7; border-color: #047857; }
    .dark-theme .time-badge { background: #334155; color: #cbd5e1; border-color: #475569; }
    .dark-theme .modal-btn.share { background: #0c4a6e; color: #7dd3fc; }
    .dark-theme .modal-btn.new { background: #064e3b; color: #6ee7b7; }
    .dark-theme .modal-btn.exit { background: #450a0a; color: #fca5a5; }
    .dark-theme .delete-btn { background: #450a0a; }
    .dark-theme .delete-btn:active { background: #7f1d1d; }
    .dark-theme .add-to-list-btn { background: #0c4a6e; color: #38bdf8; }
    .dark-theme .cooking-mode-overlay { background: rgba(2, 6, 23, 0.98) !important; }
    /* Dark Mode Timer Override */
    .dark-theme .timer-display { background: #451a03; border-color: #78350f; }
    .dark-theme .start-timer-btn { background: #d97706; }
    .dark-theme .timer-countdown { color: #fde68a; }
    .dark-theme .stop-timer-btn { background: #7f1d1d; color: #fca5a5; }
`;