const fs = require('fs');
const path = require('path');

const avatarsFilePath = path.join(__dirname, '../src/data/avatars.ts');
const publicDir = path.join(__dirname, '../public_safe/cdn/avatars');

console.log('📦 Extracting Raw Assets to CDN...');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const fileContent = fs.readFileSync(avatarsFilePath, 'utf8');
const match = fileContent.match(/export const AVATAR_DATA: Record<string, string> = ({[\s\S]*});/);
if (!match) {
    console.error('❌ AVATAR_DATA not found.');
    process.exit(1);
}

const AVATAR_DATA = eval('(' + match[1] + ')');
const newAvatarData = {};
let count = 0;

for (const [key, value] of Object.entries(AVATAR_DATA)) {
    if (!value.startsWith('data:')) {
        newAvatarData[key] = value;
        continue;
    }

    try {
        const base64Content = value.split(',')[1];
        const buffer = Buffer.from(base64Content, 'base64');

        // Use the original filename as the static path
        const targetPath = path.join(publicDir, key);
        const publicUrl = `/cdn/avatars/${key}`;

        fs.writeFileSync(targetPath, buffer);

        newAvatarData[key] = publicUrl;
        process.stdout.write('.');
        count++;
    } catch (err) {
        console.error(`\n❌ Error writing ${key}:`, err.message);
        newAvatarData[key] = value;
    }
}

console.log(`\n✨ Successfully extracted ${count} assets.`);

const newContent = `// Static Asset Paths (Extracted from Base64)
export const AVATAR_DATA: Record<string, string> = ${JSON.stringify(newAvatarData, null, 4)};`;

fs.writeFileSync(avatarsFilePath, newContent);
console.log('💾 Updated src/data/avatars.ts');
