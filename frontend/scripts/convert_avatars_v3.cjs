const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const avatarsFilePath = path.join(__dirname, '../src/data/avatars.ts');
const fileContent = fs.readFileSync(avatarsFilePath, 'utf8');

const match = fileContent.match(/export const AVATAR_DATA: Record<string, string> = ({[\s\S]*});/);
if (!match) {
    console.error('Could not parse AVATAR_DATA from file.');
    process.exit(1);
}

const AVATAR_DATA = eval('(' + match[1] + ')');
const tmpDir = path.join(__dirname, '../avatars_tmp');
const publicDir = path.join(__dirname, '../public_safe/avatars_v2');

if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const newAvatarData = {};
let count = 0;

for (const [filename, value] of Object.entries(AVATAR_DATA)) {
    if (!value.startsWith('data:')) {
        newAvatarData[filename] = value;
        continue;
    }

    const base64Data = value.split(';base64,')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    const baseName = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    const webpFilename = `${baseName}.webp`;

    const tempJpg = path.join(tmpDir, `work_${count}.jpg`);
    const tempWebp = path.join(tmpDir, `work_${count}.webp`);
    const finalWebp = path.join(publicDir, webpFilename);

    try {
        fs.writeFileSync(tempJpg, buffer);
        execSync(`sips -s format webp "${tempJpg}" --out "${tempWebp}"`, { stdio: 'ignore' });

        // Copy to public dir
        fs.copyFileSync(tempWebp, finalWebp);

        // Cleanup tmp
        if (fs.existsSync(tempJpg)) fs.unlinkSync(tempJpg);
        if (fs.existsSync(tempWebp)) fs.unlinkSync(tempWebp);

        newAvatarData[filename] = `/avatars_v2/${webpFilename}`;
        console.log(`Converted ${filename}`);
        count++;
    } catch (err) {
        console.error(`Error ${filename}:`, err.message);
    }
}

console.log(`Successfully processed ${count} avatars.`);

const newContent = `// Static Optimized Asset Paths
// Generated from Base64 data via sips (WebP)
export const AVATAR_DATA: Record<string, string> = ${JSON.stringify(newAvatarData, null, 4)};`;

fs.writeFileSync(avatarsFilePath, newContent);
