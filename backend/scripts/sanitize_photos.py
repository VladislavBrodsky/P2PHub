import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
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

from sqlmodel import select, update

from app.models.partner import Partner, async_session_maker


async def main():
    async with async_session_maker() as session:
        # fetch those with bad urls
        stmt = select(Partner).where(
            Partner.photo_url.startswith("/images/") |
            Partner.photo_url.startswith("/avatars/")
        )
        res = await session.exec(stmt)
        partners = res.all()
        print(f"Found {len(partners)} partners with bad photo_url.")
        for p in partners:
            print(f"Fixing {p.id}: {p.photo_url}")
            p.photo_url = None
            session.add(p)
        await session.commit()
        print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
