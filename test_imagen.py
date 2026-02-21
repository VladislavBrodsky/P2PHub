import asyncio
import os
from google import genai
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def test_gen_image():
    api_key = os.getenv("GOOGLE_API_KEY")
    print(f"Key loaded: {'YES' if api_key else 'NO'}")
    client = genai.Client(api_key=api_key)
    
    prompt = "A futuristic city"
    try:
        models = [
            'imagen-3.0-generate-001',
            'imagen-3.0-fast-generate-001'
        ]
        for m in models:
            try:
                print(f"Trying model: {m}")
                res = await client.aio.models.generate_images(
                    model=m,
                    prompt=prompt,
                    config=genai.types.GenerateImagesConfig(number_of_images=1)
                )
                print(f"Success with {m}!")
                return
            except Exception as e:
                print(f"Failed with {m}: {type(e).__name__} - {e}")
                
    except Exception as e:
        print(f"Outer exception: {e}")

asyncio.run(test_gen_image())
