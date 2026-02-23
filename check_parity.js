const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'frontend/src/locales');
const enDir = path.join(localesDir, 'en');
const ruDir = path.join(localesDir, 'ru');

const files = fs.readdirSync(enDir).filter(f => f.endsWith('.json'));

function getDeepKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] !== null) {
            keys = keys.concat(getDeepKeys(obj[key], prefix + key + '.'));
        } else {
            keys.push(prefix + key);
        }
    }
    return keys;
}

console.log('--- i18n Parity Audit ---');

let totalMissing = 0;

files.forEach(file => {
    const enPath = path.join(enDir, file);
    const ruPath = path.join(ruDir, file);

    if (!fs.existsSync(ruPath)) {
        console.log(`[MISSING FILE] ${file} is missing in Russian locale.`);
        totalMissing++;
        return;
    }

    const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const ruContent = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

    const enKeys = getDeepKeys(enContent);
    const ruKeys = getDeepKeys(ruContent);

    const missingInRu = enKeys.filter(k => !ruKeys.includes(k));
    const missingInEn = ruKeys.filter(k => !enKeys.includes(k));

    if (missingInRu.length > 0 || missingInEn.length > 0) {
        console.log(`\nFile: ${file}`);
        if (missingInRu.length > 0) {
            console.log(`  Missing in RU (${missingInRu.length}):`);
            missingInRu.forEach(k => console.log(`    - ${k}`));
            totalMissing += missingInRu.length;
        }
        if (missingInEn.length > 0) {
            console.log(`  Missing in EN (${missingInEn.length}):`);
            missingInEn.forEach(k => console.log(`    - ${k}`));
            totalMissing += missingInEn.length;
        }
    } else {
        console.log(`[PASS] ${file} is perfectly synced.`);
    }
});

console.log(`\nTotal Missing Keys: ${totalMissing}`);
if (totalMissing === 0) {
    console.log('SUCCESS: Locales are in full parity!');
} else {
    console.log('FAILED: Parity issues found.');
    process.exit(1);
}
