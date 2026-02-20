"""
Pytest configuration and shared fixtures for P2PHub tests.

#comment: This file contains test fixtures that are shared across all test files.
Fixtures handle setup/teardown, database sessions, and test data creation.
"""

import asyncio
import os
import sys
from collections.abc import AsyncGenerator

# #comment: Set required environment variables BEFORE importing any app modules.
# This prevents pydantic validation errors when Settings() tries to load DATABASE_URL.
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("BOT_TOKEN", "12345678:ABC-DEF1234ghIkl-zyx57W2v1u123ew11")
os.environ.setdefault("WEBHOOK_SECRET", "test_secret")

import pytest
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import create_engine, delete
from sqlmodel.ext.asyncio.session import AsyncSession

# Add backend to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.partner import Earning, Partner, PartnerTask, XPTransaction

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
    from app.models.notification_retry import NotificationRetry
    from app.models.partner import Partner, SQLModel
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    # Patch the global engine so services use the same test DB
    from app.models import partner as partner_module
    from app.services import referral_service as referral_module
    
    original_engine = partner_module.engine
    original_referral_engine = referral_module.engine
    
    partner_module.engine = test_engine
    referral_module.engine = test_engine
    
    yield test_engine
    
    # Restore and cleanup
    partner_module.engine = original_engine
    referral_module.engine = original_referral_engine
    
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
        username: str | None = None,
        referrer_id: int | None = None,
        referrer_code: str | None = None,
        is_pro: bool = False,
        xp: int = 0,
    ) -> Partner:
        """Create a test partner with given attributes."""
        from app.services.partner_service import create_partner
        
        partner, _is_new = await create_partner(
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
    async def _create_chain(levels: int = 9, make_pro: list[int] | None = None) -> list[Partner]:
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
                telegram_id=f"{10000 + i}",  # Numeric string for notification service compatibility
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

@pytest.fixture(autouse=True)
async def mock_broker():
    """
    Globally patch the TaskIQ broker with InMemoryBroker.
    We must patch the .broker attribute on the tasks themselves because
    decorators bind the broker at import time.
    """
    from taskiq import InMemoryBroker
    
    mock_broker = InMemoryBroker()
    await mock_broker.startup()
    
    # Import tasks that need patching
    from app.services.maintenance_service import migrate_blog_task, restore_names_task
    from app.services.partner_service import handle_partner_creation_task
    from app.services.referral_service import process_referral_logic
    from app.services.support_service import warm_up_kb_task
    
    # Save original brokers
    original_brokers = {
        "handle_partner_creation_task": handle_partner_creation_task.broker,
        "process_referral_logic": process_referral_logic.broker
    }
    
    # Swap with InMemoryBroker
    handle_partner_creation_task.broker = mock_broker
    process_referral_logic.broker = mock_broker
    
    # Patch kick to do nothing, avoiding UnknownTaskError and avoiding execution
    # This is fine because tests manually await the logic functions they want to test.
    async def noop_kick(message):
        pass
    mock_broker.kick = noop_kick
    
    # Also patch defaults just in case
    from app.core import broker as broker_module
    orig_global_broker = broker_module.broker
    broker_module.broker = mock_broker
    
    yield mock_broker
    
    # Restore
    handle_partner_creation_task.broker = original_brokers["handle_partner_creation_task"]
    process_referral_logic.broker = original_brokers["process_referral_logic"]
    broker_module.broker = orig_global_broker
    
    await mock_broker.shutdown()


@pytest.fixture(autouse=True)
async def mock_redis():
    """
    Mock the Redis service to prevent connection errors.
    """
    from unittest.mock import AsyncMock, MagicMock
    
    # 1. Pipeline Mock
    mock_pipeline = MagicMock()
    mock_pipeline.delete = MagicMock()
    mock_pipeline.set = MagicMock()
    mock_pipeline.expire = MagicMock()
    mock_pipeline.incr = MagicMock()
    
    mock_pipeline.__aenter__ = AsyncMock(return_value=mock_pipeline)
    mock_pipeline.__aexit__ = AsyncMock(return_value=None)
    mock_pipeline.execute = AsyncMock(return_value=[])
    
    # 2. Client Mock
    mock_client = AsyncMock() 
    mock_client.pipeline = MagicMock(return_value=mock_pipeline)
    
    # Set return values for common redis methods to avoid comparison errors
    mock_client.get = AsyncMock(return_value=None)
    mock_client.set = AsyncMock(return_value=True)
    mock_client.incr = AsyncMock(return_value=1)
    mock_client.exists = AsyncMock(return_value=0)
    
    # Patch the service
    from app.services import redis_service as redis_service_module
    
    original_client = redis_service_module.redis_service.client
    redis_service_module.redis_service.client = mock_client
    
    # Patch _check_level_up to avoid await issues with notifications
    async def noop_check_level_up(referrer, deferred_tasks, current_xp):
        pass

    # Also patch referral_service internal function which was causing problems
    from app.services import referral_service
    original_check_level_up = referral_service._check_level_up
    referral_service._check_level_up = noop_check_level_up
    
    # Patch Notification Service to avoid Event Loop errors
    from app.services.notification_service import notification_service
    
    # Save original methods for restoration
    original_enqueue = notification_service.enqueue_notification
    original_send_level = notification_service.send_level_up_notification
    original_send_standard = notification_service.send_standard
    original_send_low_prio = notification_service.send_low_prio
    original_send_critical = notification_service.send_critical
    
    # Mock all methods so tests can call .reset_mock() and check .call_count
    notification_service.enqueue_notification = AsyncMock(return_value=True)
    notification_service.send_level_up_notification = AsyncMock(return_value=True)
    notification_service.send_standard = AsyncMock(return_value=True)
    notification_service.send_low_prio = AsyncMock(return_value=True)
    notification_service.send_critical = AsyncMock(return_value=True)
    
    yield mock_client
    
    # Restore
    redis_service_module.redis_service.client = original_client
    referral_service._check_level_up = original_check_level_up
    notification_service.enqueue_notification = original_enqueue
    notification_service.send_level_up_notification = original_send_level
    notification_service.send_standard = original_send_standard
    notification_service.send_low_prio = original_send_low_prio
    notification_service.send_critical = original_send_critical


@pytest.fixture(autouse=True)
async def mock_audit_service():
    """
    Patch audit service to avoid detailed logging and potential DB conflicts during tests.
    """
    from unittest.mock import AsyncMock

    from app.services.audit_service import audit_service
    
    original_log_xp = audit_service.log_xp_award
    original_log_comm = audit_service.log_commission
    
    audit_service.log_xp_award = AsyncMock(return_value=None)
    audit_service.log_commission = AsyncMock(return_value=None)
    
    yield
    
    audit_service.log_xp_award = original_log_xp
    audit_service.log_commission = original_log_comm


@pytest.fixture(autouse=True)
async def mock_leaderboard_service():
    """
    Mock leaderboard service.
    """
    from unittest.mock import AsyncMock

    from app.services.leaderboard_service import leaderboard_service
    
    original_update = leaderboard_service.update_score
    leaderboard_service.update_score = AsyncMock(return_value=None)
    
    yield
    
    leaderboard_service.update_score = original_update
