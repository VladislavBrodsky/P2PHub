const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const avatarsFilePath = path.join(__dirname, '../src/data/avatars.ts');
const tmpDir = '/tmp/p2phub_cv_work';
const publicDir = path.join(__dirname, '../public_safe/v2/avatars');

console.log('🚀 Starting Bulletproof Avatar Optimization...');

// 1. Initial Setup
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
// We use a NEW dir v2/avatars to ensure no permission overlap
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// 2. Read existing data
const fileContent = fs.readFileSync(avatarsFilePath, 'utf8');
const match = fileContent.match(/export const AVATAR_DATA: Record<string, string> = ({[\s\S]*});/);
if (!match) {
    console.error('❌ Could not parse AVATAR_DATA from file.');
    process.exit(1);
}

const AVATAR_DATA = eval('(' + match[1] + ')');
const newAvatarData = {};
let count = 0;

for (const [filename, value] of Object.entries(AVATAR_DATA)) {
    // If it's already optimized or not base64, keep it
    if (!value.startsWith('data:')) {
        newAvatarData[filename] = value;
        continue;
    }

    try {
        const base64Data = value.split(';base64,')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        const baseName = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');
        const webpFilename = `${baseName}.webp`;

        // WORK IN /TMP (Exempt from Documents folder restrictions)
        const tempPath = path.join(tmpDir, `img_${count}.bin`);
        const tempWebp = path.join(tmpDir, `img_${count}.webp`);
        const finalWebp = path.join(publicDir, webpFilename);

        fs.writeFileSync(tempPath, buffer);

        // Use macOS native 'sips' for high-quality WebP conversion
        execSync(`sips -s format webp "${tempPath}" --out "${tempWebp}"`, { stdio: 'ignore' });

        // Copy back to project
        fs.copyFileSync(tempWebp, finalWebp);

        // Map to public path
        newAvatarData[filename] = `/v2/avatars/${webpFilename}`;

        // Cleanup temp
        fs.unlinkSync(tempPath);
        fs.unlinkSync(tempWebp);

        console.log(`✅ Optimized: ${filename} -> ${webpFilename}`);
        count++;
    } catch (err) {
        console.error(`❌ Error on ${filename}:`, err.message);
        newAvatarData[filename] = value; // Fallback
    }
}

console.log(`\n✨ Successfully processed ${count} avatars.`);

// 3. Write sanitized avatars.ts
const newContent = `// Optimized Static Assets
// These are served from public_safe/v2/avatars/
export const AVATAR_DATA: Record<string, string> = ${JSON.stringify(newAvatarData, null, 4)};`;

fs.writeFileSync(avatarsFilePath, newContent);
console.log('💾 Updated src/data/avatars.ts');
