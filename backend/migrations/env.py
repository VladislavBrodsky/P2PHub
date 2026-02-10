from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
import sqlalchemy as sa

from alembic import context

from sqlmodel import SQLModel
from app.models.partner import Partner
from app.models.transaction import PartnerTransaction

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# target_metadata = mymodel.Base.metadata
target_metadata = SQLModel.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


import asyncio
from app.core.config import settings

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() will emit the user string to the
    script output.

    """
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection, 
        target_metadata=target_metadata,
        render_as_batch=True
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    from sqlalchemy.ext.asyncio import create_async_engine
    
    url = settings.DATABASE_URL
    if url and url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    connectable = create_async_engine(
        url,
        poolclass=pool.NullPool,
        future=True
    )

    async with connectable.connect() as connection:
        print("🔍 Checking for blocking locks before migration...")
        try:
            await connection.execute(sa.text("SET lock_timeout = '30s'"))
            
            # First, try to cancel active queries gracefully
            await connection.execute(sa.text("""
                SELECT pg_cancel_backend(pid)
                FROM pg_stat_activity
                WHERE pid != pg_backend_pid()
                  AND usename = current_user
                  AND state = 'active';
            """))
            
            # Then, terminate anything else that's not idle
            await connection.execute(sa.text("""
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE pid != pg_backend_pid()
                  AND usename = current_user
                  AND state IN ('active', 'idle in transaction');
            """))
            print("✅ Cleared potentially blocking connections.")
        except Exception as e:
            print(f"⚠️ Warning: Could not clear locks or set timeout: {e}")

        print("🚀 Starting Alembic's do_run_migrations...")
        await connection.run_sync(do_run_migrations)
        print("🏁 Finished Alembic's do_run_migrations.")

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
