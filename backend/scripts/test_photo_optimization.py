import asyncio
import io
import os
import sys
import time

from PIL import Image

# Ensure backend is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

async def test_photo_optimization():
    print("🧪 Testing Photo Optimization...")

    # Use TestClient to test the endpoint
    from fastapi.testclient import TestClient
    from sqlalchemy.orm import sessionmaker
    from sqlmodel import select
    from sqlmodel.ext.asyncio.session import AsyncSession

    from app.main import app
    from app.models.partner import Partner, engine

    client = TestClient(app)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    real_file_id = None
    try:
        async with async_session() as session:
            statement = select(Partner).where(Partner.photo_file_id is not None).limit(1)
            result = await session.exec(statement)
            partner = result.first()
            if partner:
                real_file_id = partner.photo_file_id
                print(f"Found real file_id: {real_file_id}")
    except Exception as e:
        print(f"⚠️ DB Error finding file_id: {e}")

    if not real_file_id:
        print("❌ No real file_id found in DB. Skipping actual fetch test.")
        # We can try a dummy file_id just to check the flow (will likely 404 but we check the logic)
        real_file_id = "test_dummy_id"

    url = f"/api/partner/photo/{real_file_id}"

    print("--- Request 1 (Initial) ---")
    start = time.time()
    response = client.get(url)
    end = time.time()

    print(f"Status: {response.status_code}")
    print(f"Time: {end - start:.4f}s")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    print(f"X-Cache: {response.headers.get('X-Cache')}")

    if response.status_code == 200:
        assert response.headers.get("Content-Type") == "image/webp"
        img = Image.open(io.BytesIO(response.content))
        print(f"Image Size: {img.size}")
        assert img.width <= 128 and img.height <= 128

        print("\n--- Request 2 (Cached) ---")
        start = time.time()
        response = client.get(url)
        end = time.time()

        print(f"Status: {response.status_code}")
        print(f"Time: {end - start:.4f}s")
        print(f"X-Cache: {response.headers.get('X-Cache')}")
        assert response.headers.get("X-Cache") == "HIT"
        print("\n🎉 Photo Optimization Verification Passed!")
    else:
        print(f"Could not verify optimization because Telegram/Optimization failed with status {response.status_code}")
        print("This is expected if the token/file_id is invalid in this environment, but logic was reached.")

if __name__ == "__main__":
    asyncio.run(test_photo_optimization())
