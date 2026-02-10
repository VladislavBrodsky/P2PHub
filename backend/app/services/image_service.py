import os
import aiohttp
from PIL import Image
import logging
from io import BytesIO

logger = logging.getLogger(__name__)

class ImageService:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.images_dir = os.path.join(self.base_dir, "app_images")
        os.makedirs(self.images_dir, exist_ok=True)

    async def download_and_convert_to_webp(self, telegram_photo_url: str, telegram_id: str) -> str:
        """
        Downloads a photo from Telegram, converts it to WebP, and saves it locally.
        Returns the public URL path.
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(telegram_photo_url) as response:
                    if response.status != 200:
                        logger.error(f"Failed to download image from {telegram_photo_url}: {response.status}")
                        return None
                    
                    data = await response.read()
                    
                    # Process with Pillow
                    img = Image.open(BytesIO(data))
                    
                    # Generate filename
                    filename = f"partner_{telegram_id}.webp"
                    filepath = os.path.join(self.images_dir, filename)
                    
                    # Convert to WebP
                    img.save(filepath, "WEBP", quality=80)
                    
                    # Return the URL path
                    return f"/images/{filename}"
                    
        except Exception as e:
            logger.error(f"Error in download_and_convert_to_webp: {e}")
            return None

image_service = ImageService()
