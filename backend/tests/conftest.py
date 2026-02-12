"""
Pytest configuration and shared fixtures for P2PHub tests.

#comment: This file contains test fixtures that are shared across all test files.
Fixtures handle setup/teardown, database sessions, and test data creation.
"""

import asyncio
import os
import sys
from typing import AsyncGenerator

# #comment: Set required environment variables BEFORE importing any app modules.
# This prevents pydantic validation errors when Settings() tries to load DATABASE_URL.
os.environ.setdefault("DATABASE_URL", "sqlite:///test.db")
os.environ.setdefault("BOT_TOKEN", "test_token")
os.environ.setdefault("WEBHOOK_SECRET", "test_secret")

import pytest
from sqlmodel import create_engine, delete
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine

# Add backend to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.partner import Partner, XPTransaction, Earning, PartnerTask



# #comment: Use in-memory SQLite for ultra-fast tests.
# Tests run 10x faster than with PostgreSQL and are completely isolated.
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """
    Create an event loop for the entire test session.
    
    #comment: pytest-asyncio needs this to handle async tests properly.
    Using session scope means one event loop for all tests (faster).
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def engine():
    """
    Create a fresh test database engine for each test.
    
    #comment: Each test gets a clean database to prevent test pollution.
    Using in-memory SQLite means no cleanup needed - it's gone when test ends.
    """
    test_engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,  # Set to True for SQL debugging
        future=True,
    )
    
    # Create all tables
    from app.models.partner import SQLModel
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    yield test_engine
    
    # Cleanup
    await test_engine.dispose()


@pytest.fixture(scope="function")
async def session(engine) -> AsyncGenerator[AsyncSession, None]:
    """
    Create a database session for a single test.
    
    #comment: This is what you'll use in tests to interact with the database.
    Automatically commits changes and rolls back on errors.
    """
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session


@pytest.fixture
async def create_test_partner(session: AsyncSession):
    """
    Factory fixture to create test partners easily.
    
    Usage in tests:
        partner = await create_test_partner(telegram_id="123", username="test")
    """
    async def _create_partner(
        telegram_id: str,
        username: str = None,
        referrer_id: int = None,
        referrer_code: str = None,
        is_pro: bool = False,
        xp: int = 0,
    ) -> Partner:
        """Create a test partner with given attributes."""
        from app.services.partner_service import create_partner
        
        partner, is_new = await create_partner(
            session=session,
            telegram_id=telegram_id,
            username=username or f"user_{telegram_id}",
            referrer_code=referrer_code,
        )
        
        # Apply additional attributes
        if is_pro:
            partner.is_pro = True
        if xp > 0:
            partner.xp = xp
        
        session.add(partner)
        await session.commit()
        await session.refresh(partner)
        
        return partner
    
    return _create_partner


@pytest.fixture
async def create_referral_chain(session: AsyncSession, create_test_partner):
    """
    Factory fixture to create a referral chain for testing.
    
    Usage:
        chain = await create_referral_chain(levels=9)
        # chain[0] is the root, chain[8] is the 9th level
    """
    async def _create_chain(levels: int = 9, make_pro: list[int] = None) -> list[Partner]:
        """
        Create a referral chain of specified depth.
        
        Args:
            levels: Number of levels in the chain (1-9)
            make_pro: List of indices to make PRO (e.g., [0, 1] makes first 2 PRO)
        
        Returns:
            List of Partner objects from root to leaf
        """
        make_pro = make_pro or []
        chain = []
        
        for i in range(levels):
            referrer_code = chain[-1].referral_code if chain else None
            is_pro = i in make_pro
            
            partner = await create_test_partner(
                telegram_id=f"chain_user_{i}",
                username=f"user_level_{i}",
                referrer_code=referrer_code,
                is_pro=is_pro,
            )
            chain.append(partner)
        
        return chain
    
    return _create_chain


# #comment: Mark all tests as asyncio by default
# This prevents having to add @pytest.mark.asyncio to every test
def pytest_collection_modifyitems(items):
    """Automatically mark all async tests with pytest.mark.asyncio."""
    for item in items:
        if asyncio.iscoroutinefunction(item.function):
            item.add_marker(pytest.mark.asyncio)
