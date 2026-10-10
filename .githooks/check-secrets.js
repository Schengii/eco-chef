#!/usr/bin/env node
/**
 * Pre-Commit Secret Scanner
 * Blocks committing .env files and hardcoded API keys/secrets.
 */

const { execSync } = require('child_process');

const BLOCKED_FILES = [
  /^\.env$/,
  /^\.env\.(?!example$)/, // block .env.local, .env.production, etc. but allow .env.example
  /.*\.pem$/,
  /.*\.key$/,
  /.*_rsa$/,
  /id_rsa/
];

const SECRET_PATTERNS = [
  {
    name: 'Google Gemini / Cloud API Key',
    regex: /AIza[0-9A-Za-z-_]{35}/,
    // Allow placeholders or example texts
    ignorePattern: /your_gemini_api_key_here|AIzaSy[X_]{10,}|example/i
  },
  {
    name: 'OpenAI API Key',
    regex: /sk-[A-Za-z0-9]{32,}/,
    ignorePattern: /your_openai_key|example/i
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /gh[pous]_[A-Za-z0-9_]{36,}/,
    ignorePattern: /example/i
  },
  {
    name: 'Private Key Block',
    regex: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/,
    ignorePattern: null
  },
  {
    name: 'Generic API Key / Secret Assignment',
    regex: /(?:GEMINI_API_KEY|API_KEY|SECRET_KEY|AUTH_TOKEN|PRIVATE_KEY)\s*[:=]\s*['"][A-Za-z0-9-_]{20,}['"]/i,
    ignorePattern: /your_.*_here|<.*>|EXAMPLE/i
  }
];

function run() {
  console.log('🔍 [Pre-Commit] Überprüfe staged Änderungen auf Secrets und .env-Dateien...');

  // 1. Check staged file paths
  let stagedFiles = [];
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' });
    stagedFiles = output.split('\n').map(f => f.trim()).filter(Boolean);
  } catch (err) {
    console.error('⚠️ Konnte staged Git-Dateien nicht ermitteln:', err.message);
    process.exit(1);
  }

  if (stagedFiles.length === 0) {
    process.exit(0);
  }

  let hasErrors = false;

  // Check file names against blocked patterns
  for (const file of stagedFiles) {
    const filename = file.split('/').pop().split('\\').pop();
    for (const pattern of BLOCKED_FILES) {
      if (pattern.test(filename)) {
        console.error(`\n❌ [BLOCKIERT] Versuch, eine geschützte Datei zu committen: "${file}"`);
        console.error('   Bitte entferne die Datei aus dem Staging-Bereich mit:');
        console.error(`   git reset HEAD "${file}"\n`);
        hasErrors = true;
      }
    }
  }

  // 2. Check staged content for sensitive patterns
  let stagedDiff = '';
  try {
    stagedDiff = execSync('git diff --cached -U0', { encoding: 'utf-8' });
  } catch (err) {
    console.error('⚠️ Konnte git diff --cached nicht abrufen:', err.message);
    process.exit(1);
  }

  if (stagedDiff) {
    const lines = stagedDiff.split('\n');
    let currentFile = '';

    for (const line of lines) {
      if (line.startsWith('+++ b/')) {
        currentFile = line.substring(6).trim();
        continue;
      }

      // Only check added lines (starting with '+', but not '+++')
      if (line.startsWith('+') && !line.startsWith('+++')) {
        const addedContent = line.substring(1);

        for (const secret of SECRET_PATTERNS) {
          if (secret.regex.test(addedContent)) {
            if (secret.ignorePattern && secret.ignorePattern.test(addedContent)) {
              continue; // Ignored placeholder
            }

            console.error(`\n🚨 [SICHERHEITSVERLETZUNG] Sensible Daten erkannt in: ${currentFile}`);
            console.error(`   Regel: ${secret.name}`);
            console.error(`   Auszug: ${maskSecret(addedContent.trim())}`);
            console.error('   Bitte entferne den geheimen Schlüssel vor dem Commit!');
            console.error('   Secrets gehören in die lokale .env oder in das Vercel Dashboard.\n');
            hasErrors = true;
          }
        }
      }
    }
  }

  if (hasErrors) {
    console.error('🛑 Commit abgebrochen! Bitte behebe die oben genannten Sicherheitsprobleme.\n');
    process.exit(1);
  }

  console.log('✅ [Pre-Commit] Keine Secrets oder .env-Dateien in staged Änderungen gefunden.\n');
  process.exit(0);
}

function maskSecret(str) {
  if (str.length <= 8) return '****';
  return str.substring(0, 6) + '***[GESCHWÄRZT]***' + str.substring(str.length - 4);
}

run();
