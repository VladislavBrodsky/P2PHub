import sharp from 'sharp';
import fs from 'fs';

const conversions = [
    { src: '/Users/grandmaestro/.gemini/antigravity/brain/4cf34c3b-45bd-4e7c-9f82-2bdfada794fb/avatar_girl_blue_hoodie_1771272110065.png', dest: '/Users/grandmaestro/Documents/P2PHub/frontend/public/avatars/ae_f_1.webp' },
    { src: '/Users/grandmaestro/.gemini/antigravity/brain/4cf34c3b-45bd-4e7c-9f82-2bdfada794fb/avatar_girl_red_top_1771272122992.png', dest: '/Users/grandmaestro/Documents/P2PHub/frontend/public/avatars/br_f_1.webp' },
    { src: '/Users/grandmaestro/.gemini/antigravity/brain/4cf34c3b-45bd-4e7c-9f82-2bdfada794fb/avatar_guy_hat_1771272136517.png', dest: '/Users/grandmaestro/Documents/P2PHub/frontend/public/avatars/ca_m_1.webp' },
    { src: '/Users/grandmaestro/.gemini/antigravity/brain/4cf34c3b-45bd-4e7c-9f82-2bdfada794fb/avatar_guy_beard_1771272151123.png', dest: '/Users/grandmaestro/Documents/P2PHub/frontend/public/avatars/de_m_1.webp' }
];

async function run() {
    for (const { src, dest } of conversions) {
        try {
            console.log(`Converting ${src} to ${dest}...`);
            await sharp(src)
                .webp({ quality: 90 })
                .toFile(dest);
            console.log('Done!');
        } catch (err) {
            console.error(`Error converting ${src}:`, err);
        }
    }
}

run();
