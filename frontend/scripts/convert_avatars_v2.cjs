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
const outputDir = path.join(__dirname, '../public_safe/avatars_v2');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const newAvatarData = {};
let count = 0;

for (const [filename, value] of Object.entries(AVATAR_DATA)) {
    if (!value.startsWith('data:')) {
        console.log(`Skipping ${filename} - not base64`);
        newAvatarData[filename] = value;
        continue;
    }

    const base64Data = value.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // Use a clean filename (remove .jpg if present, we'll use .webp)
    const baseName = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    const webpFilename = `${baseName}.webp`;

    const tempJpg = path.join(outputDir, `temp_${count}.jpg`);
    const targetWebp = path.join(outputDir, webpFilename);

    try {
        fs.writeFileSync(tempJpg, buffer);

        // Convert to WebP using sips
        // -s format webp
        execSync(`sips -s format webp "${tempJpg}" --out "${targetWebp}"`, { stdio: 'ignore' });

        fs.unlinkSync(tempJpg);

        // Map to the public URL
        newAvatarData[filename] = `/avatars_v2/${webpFilename}`;
        console.log(`Converted ${filename} -> ${webpFilename}`);
        count++;
    } catch (err) {
        console.error(`Error processing ${filename}:`, err.message);
        // Fallback to base64 if conversion fails? 
        // No, let's just keep the original key mapping to something.
    }
}

console.log(`Processed ${count} avatars.`);

const newContent = `// Static Optimized Asset Paths
// Generated from previous Base64 data via sips (WebP)
export const AVATAR_DATA: Record<string, string> = ${JSON.stringify(newAvatarData, null, 4)};`;

fs.writeFileSync(avatarsFilePath, newContent);
console.log('Updated src/data/avatars.ts');
