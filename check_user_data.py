
import asyncio
from sqlmodel import select
from app.models.partner import Partner, get_session

async def check_completed_stages():
    async for session in get_session():
        stmt = select(Partner).where(Partner.username == "lownocoder_TMR")
        result = await session.exec(stmt)
        user = result.first()
        if not user:
            print("User not found")
            return

        print(f"User: {user.username}")
        print(f"Completed Stages Raw: {user.completed_stages}")
        try:
            import json
            completed = json.loads(user.completed_stages or "[]")
            print(f"Completed Stages Count: {len(completed)}")
            print(f"Types in Completed: {[type(x).__name__ for x in completed[:10]]}")
        except Exception as e:
            print(f"Error parsing JSON: {e}")

if __name__ == "__main__":
    asyncio.run(check_completed_stages())
