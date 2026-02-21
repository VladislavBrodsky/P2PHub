import urllib.request
from PIL import Image
import os

icons = {
    'telegram.png': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/512px-Telegram_logo.svg.png',
    'x.png': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/X_logo_2023.svg/512px-X_logo_2023.svg.png',
    'linkedin.png': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/512px-LinkedIn_logo_initials.png',
    'pinterest.png': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Pinterest-logo.png/512px-Pinterest-logo.png',
    'threads.png': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Threads_%28app%29_logo.svg/512px-Threads_%28app%29_logo.svg.png',
    'facebook.png': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/512px-2021_Facebook_icon.svg.png',
    'discord.png': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Discord_Color_Text_Logo.svg/512px-Discord_Color_Text_Logo.svg.png'
}

os.makedirs('../frontend/public/social-icons', exist_ok=True)

for name, url in icons.items():
    png_path = f"../frontend/public/social-icons/{name}"
    webp_path = f"../frontend/public/social-icons/{name.replace('.png', '.webp')}"
    print(f"Downloading {name}...")
    urllib.request.urlretrieve(url, png_path)
    print(f"Converting {name} to webp...")
    img = Image.open(png_path)
    img.save(webp_path, 'webp')
    os.remove(png_path)

print("Done!")
