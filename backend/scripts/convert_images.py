import os
from PIL import Image

def convert_to_webp(directory):
    for filename in os.listdir(directory):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            full_path = os.path.join(directory, filename)
            try:
                with Image.open(full_path) as img:
                    # Clean filename: replace spaces with underscores, lower case extension
                    base_name = os.path.splitext(filename)[0].replace(' ', '_')
                    new_filename = f"{base_name}.webp"
                    output_path = os.path.join(directory, new_filename)
                    
                    print(f"Converting {filename} -> {new_filename}...")
                    img.save(output_path, "WEBP", quality=85 if filename.lower().endswith(('.jpg', '.jpeg')) else 100)
                    
            except Exception as e:
                print(f"Failed to convert {filename}: {e}")

if __name__ == "__main__":
    img_dir = "/Users/grandmaestro/Documents/P2PHub/backend/app_images"
    convert_to_webp(img_dir)
