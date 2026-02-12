
import os

# #comment: Asset Cleanup Script.
# Removes redundant legacy image formats (PNG/JPG) now that optimized WebP versions exist.
# This prevents them from being accidentally served or included in deployments.

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES_DIR = os.path.join(BASE_DIR, "app_images")

def cleanup_legacy_assets():
    print(f"🧹 Cleaning up legacy assets in {IMAGES_DIR}...")
    
    count = 0
    for filename in os.listdir(IMAGES_DIR):
        file_path = os.path.join(IMAGES_DIR, filename)
        
        if os.path.isdir(file_path):
            continue
            
        ext = os.path.splitext(filename)[1].lower()
        if ext in ['.png', '.jpg', '.jpeg']:
            # Double check that webp version exists
            name = os.path.splitext(filename)[0].replace(" ", "_")
            webp_path = os.path.join(IMAGES_DIR, f"{name}.webp")
            
            if os.path.exists(webp_path):
                # Small exception for PWA icons if they were here, but they aren't.
                os.remove(file_path)
                print(f"🗑️ Deleted redundant original: {filename}")
                count += 1
            else:
                print(f"⚠️ Skipping {filename}: No WebP equivalent found.")
                
    print(f"✅ Cleanup complete. {count} legacy files removed.")

if __name__ == "__main__":
    cleanup_legacy_assets()
