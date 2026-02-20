import asyncio
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)
env_path = os.path.join(parent_dir, ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                try:
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip().strip("'").strip('"')
                except ValueError:
                    pass

from sqlmodel import select

from app.models.partner import Partner, async_session_maker


async def main():
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.xp > 14000)
        res = await session.exec(stmt)
        for p in res.all():
            print(f"ID: {p.id} Name: {p.first_name} {p.last_name} username: {p.username} XP: {p.xp} photo_file_id: {p.photo_file_id} photo_url: {p.photo_url}")

if __name__ == "__main__":
    asyncio.run(main())
