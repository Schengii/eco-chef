import { css } from 'lit';

export const ecoChefStyles = css`
  :host {
     display: block;
     padding: 16px;
     font-family: 'Segoe UI', system-ui, sans-serif;
     background-color: #f0f4f8;
     min-height: 100vh;
  }

  .card {
      background-color: white;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      max-width: 500px;
      margin: 0 auto;
  }
    
  .header {
      text-align: center;
      margin-bottom: 20px;
  }
    
  h2 {
      color: #2e7d32;
      margin: 0;
      font-size: 28px;
  }
    
  .subtitle {
      color: #666;
      margin-top: 4px;
      font-size: 14px;
  }
    
  input {
      width: 100%;
      padding: 16px;
      margin-bottom: 20px;
      box-sizing: border-box;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 16px;
      transition: 0.3s;
  }
    
  input:focus {
      outline: none;
      border-color: #4CAF50;
  }
   
  .filter-section {
      margin-bottom: 20px;
  }
    
  .filter-title {
      font-size: 14px;
      font-weight: bold;
      color: #4a5568;
      margin: 0 0 8px 4px;
  }
    
  .chip-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
  }
   
  .chip {
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid #cbd5e1;
      background: white;
      color: #475569;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
  }
    
  .chip.active {
      background: #e6f4ea;
      border-color: #4CAF50;
      color: #2e7d32;
      font-weight: bold;
  }
   
  .stepper-group {
      display: flex;
      align-items: center;
      gap: 15px; 
      margin-bottom: 20px; 
      background: #f8fafc;
      padding: 8px;
      border-radius: 16px;
      width: fit-content;
  }
    
  .step-btn {
      background: white;
      border: 1px solid #cbd5e1;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 22px;
      font-weight: bold;
      color: #2e7d32;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      transition: 0.1s;
  }
    
  .step-btn:active {
      transform: scale(0.9);
      background: #e6f4ea;
  }
    
  .step-value {
      font-size: 16px;
      font-weight: bold;
      color: #1e293b;
      min-width: 90px;
      text-align: center;
  }
    
  .action-area {
      text-align: center;
      min-height: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
  }
    
  .main-btn {
      width: 100%;
      padding: 16px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-weight: bold;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }
    
  .finish-btn {
      margin-top: 30px;
      background: #1e293b;
      box-shadow: 0 4px 12px rgba(30, 41, 59, 0.3);
  }
    
  .loader {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #4CAF50;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
  }
    
  .loader-text {
      margin-top: 10px;
      color: #666;
      font-size: 14px;
  }
   
  @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
  }
    
  .recipe-paper {
      margin-top: 20px;
      padding: 20px;
      background-color: #fff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px rgba(0,0,0,0.02);
  }
   
  .recipe-image {
      width: 100%;
      height: 250px;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      background-color: #f1f5f9;
  }
    
  .recipe-title {
      color: #1a202c;
      margin-top: 0;
      font-size: 22px;
      text-align: center;
      line-height: 1.3;
  }
  
  .recipe-subheading {
      color: #2e7d32;
      font-size: 18px;
      margin: 24px 0 12px 0;
      border-bottom: 2px solid #e6f4ea;
      padding-bottom: 4px;
  }
  
  .ingredients-list {
      padding-left: 20px;
      color: #4a5568;
      line-height: 1.6;
  }
    
  .instructions-box {
      display: flex;
      flex-direction: column;
      gap: 12px;
  }
    
  .step-item {
      display: flex;
      background: #f8fafc;
      padding: 12px;
      border-radius: 12px;
  }
    
  .step-number {
      background: #4CAF50;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 12px;
      flex-shrink: 0;
  }
    
  .step-text {
      color: #334155;
      line-height: 1.5;
      padding-top: 2px;
  }
    
  .tip-box {
      margin-top: 24px;
      padding: 16px;
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      color: #92400e;
      font-size: 14px;
      line-height: 1.5;
  }
    
  .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
  }
    
  @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
  }
    
  .modal-content {
      background: white;
      border-radius: 24px;
      padding: 24px;
      width: 85%;
      max-width: 350px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      text-align: center;
      animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
    
  @keyframes slideUp {
      from { transform: translateY(30px);
        opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
  }
    
  .modal-content h3 {
      margin-top: 0;
      color: #1e293b;
      font-size: 22px;
  }
    
  .modal-content p {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 24px;
  }
    
  .modal-btn {
      width: 100%;
      padding: 14px;
      margin-bottom: 12px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: 0.2s;
  }
    
  .modal-btn.share {
      background: #e0f2fe;
      color: #0284c7;
  }
    
  .modal-btn.save {
      background: #f1f5f9;
      color: #475569;
  }
    
  .modal-btn.new {
      background: #e6f4ea;
      color: #2e7d32;
  }
    
  .modal-btn.exit {
      background: #fee2e2;
      color: #dc2626;
  }
    
  .modal-btn.cancel {
      background: transparent;
      color: #94a3b8;
      margin-bottom: 0;
      text-decoration: underline;
      font-weight: normal;
  }
    
  .modal-btn:active {
      transform: scale(0.96);
  }

`;



