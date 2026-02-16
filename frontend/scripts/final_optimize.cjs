const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const avatarsFilePath = path.join(__dirname, '../src/data/avatars.ts');
const publicDir = path.join(__dirname, '../public_safe/cdn/avatars');
const tmpDir = '/tmp/p2phub_webp_gen';

console.log('🖼️ Running Final Performance Optimization (WebP + Static Paths)...');

if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
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

        const safeName = key.replace(/[^a-z0-9_\.]/gi, '_').replace(/\.(jpg|jpeg|png)$/i, '');
        const tempPath = path.join(tmpDir, `${safeName}.jpg`);
        const targetPath = path.join(publicDir, `${safeName}.webp`);
        const publicUrl = `/cdn/avatars/${safeName}.webp`;

        // 1. Write temp JPG
        fs.writeFileSync(tempPath, buffer);

        // 2. Convert to WebP using macOS native sips
        // We use -s format webp and -s formatOptions 80 (quality)
        execSync(`sips -s format webp -s formatOptions 80 "${tempPath}" --out "${targetPath}"`, { stdio: 'ignore' });

        // 3. Mark as complete
        newAvatarData[key] = publicUrl;

        // 4. Cleanup
        fs.unlinkSync(tempPath);

        process.stdout.write('.');
        count++;
    } catch (err) {
        console.error(`\n❌ Error on ${key}:`, err.message);
        newAvatarData[key] = value;
    }
}

console.log(`\n✨ Successfully processed ${count} avatars into WebP.`);

const newContent = `// Optimized Static Asset Paths (WebP)
// Source: Auto-generated from Base64
export const AVATAR_DATA: Record<string, string> = ${JSON.stringify(newAvatarData, null, 4)};`;

fs.writeFileSync(avatarsFilePath, newContent);
console.log('💾 Updated src/data/avatars.ts');
