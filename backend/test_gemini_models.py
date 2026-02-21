from google import genai
import os
from dotenv import load_dotenv
load_dotenv(".env.backend")
client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
for m in client.models.list():
    if "gemini" in m.name:
        print(m.name)
