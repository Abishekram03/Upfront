const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('====================================================');
console.log(' FORENSIC SYNTAX INTEGRITY AUDIT (Node ' + process.version + ')');
console.log('====================================================\n');

let allPassed = true;

// 1. Audit apps/api/tracker/userly.js
const trackerPath = path.join(__dirname, '../apps/api/tracker/userly.js');
try {
  const trackerCode = fs.readFileSync(trackerPath, 'utf8');
  new vm.Script(trackerCode);
  console.log('[PASS] apps/api/tracker/userly.js: 100% syntactically valid (' + trackerCode.length + ' bytes)');
} catch (e) {
  console.error('[FAIL] apps/api/tracker/userly.js syntax error:', e.message);
  allPassed = false;
}

// 2. Audit apps/web/app/userly.js/route.ts
const routePath = path.join(__dirname, '../apps/web/app/userly.js/route.ts');
try {
  const rawContent = fs.readFileSync(routePath, 'utf8').replace(/\r\n/g, '\n');
  const marker = 'const TRACKER_SCRIPT = `';
  const start = rawContent.indexOf(marker);
  if (start === -1) throw new Error('TRACKER_SCRIPT marker not found');
  const bodyStart = start + marker.length;
  const endMarker = '`\n\nexport async function GET';
  const end = rawContent.indexOf(endMarker, bodyStart);
  if (end === -1) throw new Error('Closing template marker not found');
  
  const rawTemplate = rawContent.slice(bodyStart, end);
  const evaluated = (new Function(`return \`${rawTemplate}\`;`))();
  new vm.Script(evaluated);
  console.log('[PASS] apps/web/app/userly.js/route.ts (evaluated runtime): 100% syntactically valid (' + evaluated.length + ' bytes)');
} catch (e) {
  console.error('[FAIL] apps/web/app/userly.js/route.ts syntax error:', e.message);
  allPassed = false;
}

// 3. Audit apps/web/app/consentos.js/route.ts
const consentosPath = path.join(__dirname, '../apps/web/app/consentos.js/route.ts');
try {
  const rawContent = fs.readFileSync(consentosPath, 'utf8').replace(/\r\n/g, '\n');
  const marker = 'const script = `';
  const start = rawContent.indexOf(marker);
  if (start !== -1) {
    const bodyStart = start + marker.length;
    const endMarker = '`\n\n    if (!isTest)';
    const end = rawContent.indexOf(endMarker, bodyStart);
    if (end === -1) throw new Error('Closing template marker for consentos.js not found');
    const rawTemplate = rawContent.slice(bodyStart, end);
    const domain = "example.com";
    const config = {};
    const isTest = false;
    const initialConfig = {};
    const siteCookies = [];
    const proc = { env: { NEXT_PUBLIC_APP_URL: "https://usrly-five.vercel.app" } };
    const evaluated = (new Function('domain', 'isTest', 'config', 'initialConfig', 'siteCookies', 'process', `return \`${rawTemplate}\`;`))(domain, isTest, config, initialConfig, siteCookies, proc);
    new vm.Script(evaluated);
    console.log('[PASS] apps/web/app/consentos.js/route.ts (evaluated runtime): 100% syntactically valid (' + evaluated.length + ' bytes)');
  }
} catch (e) {
  console.error('[FAIL] apps/web/app/consentos.js/route.ts syntax error:', e.message);
  allPassed = false;
}

console.log('\n====================================================');
if (allPassed) {
  console.log(' ALL RUNTIME JAVASCRIPT SOURCES SYNTACTICALLY SOUND (100%)');
  console.log('====================================================');
  process.exit(0);
} else {
  console.log(' SYNTAX ERRORS DETECTED');
  console.log('====================================================');
  process.exit(1);
}
