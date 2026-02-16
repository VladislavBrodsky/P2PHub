const fs = require('fs');
const path = require('path');

// Manually import the AVATAR_DATA by reading/parsing the file
const avatarsFilePath = path.join(__dirname, '../src/data/avatars.ts');
const fileContent = fs.readFileSync(avatarsFilePath, 'utf8');

// The file looks like: export const AVATAR_DATA: Record<string, string> = { ... };
const match = fileContent.match(/export const AVATAR_DATA: Record<string, string> = ({[\s\S]*});/);

if (!match) {
    console.error('Could not parse AVATAR_DATA from file.');
    process.exit(1);
}

const AVATAR_DATA = eval('(' + match[1] + ')');

// Changing output directory to avoid permission issues
const outputDir = path.join(__dirname, '../public_safe/img/avatars');
const publicPath = '/img/avatars/';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const newAvatarData = {};

let count = 0;
for (const [filename, base64String] of Object.entries(AVATAR_DATA)) {
    // Check if it's already a URL (in case script runs twice)
    if (!base64String.startsWith('data:')) {
        console.log(`Skipping ${filename} (not base64)`);
        newAvatarData[filename] = base64String;
        continue;
    }

    // Remove the data URL prefix
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const outputPath = path.join(outputDir, filename);

    try {
        fs.writeFileSync(outputPath, buffer);
        console.log(`Saved ${filename}`);
        newAvatarData[filename] = `${publicPath}${filename}`;
        count++;
    } catch (err) {
        console.error(`Error saving ${filename}:`, err.message);
    }
}

console.log(`Processed ${count} avatars.`);

const newContent = `// Static Asset Paths (Generated from previous Base64 data)
// These files are located in public_safe/img/avatars/
export const AVATAR_DATA: Record<string, string> = ${JSON.stringify(newAvatarData, null, 4)};`;

fs.writeFileSync(avatarsFilePath, newContent);
console.log('Updated src/data/avatars.ts with new paths.');
