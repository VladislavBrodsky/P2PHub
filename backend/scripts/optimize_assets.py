
import os
from PIL import Image

# #comment: Global Asset Optimization Script.
# Converts legacy PNG/JPG assets to high-compression WebP while maintaining visual fidelity.
# This dramatically reduces initial payload (e.g. LOGO.PNG 2.5MB -> 200KB) and improves LCP.

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES_DIR = os.path.join(BASE_DIR, "app_images")

def optimize_images():
    print(f"🚀 Scanning {IMAGES_DIR} for optimization candidates...")
    
    for filename in os.listdir(IMAGES_DIR):
        file_path = os.path.join(IMAGES_DIR, filename)
        
        # Skip directories and existing webp unless we want to re-optimize
        if os.path.isdir(file_path):
            continue
            
        ext = os.path.splitext(filename)[1].lower()
        if ext in ['.png', '.jpg', '.jpeg']:
            target_name = os.path.splitext(filename)[0].replace(" ", "_") + ".webp"
            target_path = os.path.join(IMAGES_DIR, target_name)
            
            try:
                with Image.open(file_path) as img:
                    # Convert to RGB if necessary (e.g. for JPG)
                    if img.mode in ('RGBA', 'P') and ext in ['.jpg', '.jpeg']:
                        img = img.convert('RGB')
                    
                    # Log size improvement
                    original_size = os.path.getsize(file_path)
                    img.save(target_path, "WEBP", quality=80, method=6)
                    new_size = os.path.getsize(target_path)
                    
                    reduction = ( original_size - new_size ) / original_size * 100
                    print(f"✅ Optimized: {filename} ({original_size/1024:.1f}KB) -> {target_name} ({new_size/1024:.1f}KB) [-{reduction:.1f}%]")
                    
                    # We keep originals for now but move them to a 'backup' if needed.
                    # For this task, we just ensure webp version exists.
            except Exception as e:
                print(f"❌ Failed to optimize {filename}: {e}")

if __name__ == "__main__":
    optimize_images()
