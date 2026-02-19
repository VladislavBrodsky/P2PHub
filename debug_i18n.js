const fs = require('fs');
const path = require('path');

const deepMerge = (target, source) => {
    const output = { ...target };
    if (source instanceof Object && target instanceof Object) {
        Object.keys(source).forEach(key => {
            if (source[key] instanceof Object) {
                if (!(key in target)) {
                    output[key] = source[key];
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                output[key] = source[key];
            }
        });
    }
    return output;
};

const localesDir = path.join(__dirname, 'frontend/src/locales/en');
const files = [
    'common.json', 'dashboard.json', 'marketing.json', 'academy.json', 'pro.json', 'social.json', 'cards.json', 'other.json'
];

let en = {};
files.forEach(file => {
    const filePath = path.join(localesDir, file);
    if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        en = deepMerge(en, content);
    }
});

console.log(JSON.stringify(en.network, null, 2));
