from logging.config import fileConfig

import sqlalchemy as sa
from alembic import context
from sqlalchemy import pool
from sqlmodel import SQLModel

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
    import os

    # Prefer specific env vars for production if available, else fallback to settings
    url = os.getenv("DATABASE_URL") or settings.async_database_url
    
    # Ensure async driver for Postgres
    if url and url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
    import sys
    print(f"DEBUG: Using database URL: {url}", file=sys.stderr)

    connectable = create_async_engine(
        url,
        poolclass=pool.NullPool,
        future=True
    )

    async with connectable.begin() as connection:
        if "sqlite" not in url:
             # Optional: Just set a lock timeout if needed, but skip the aggressive killing for now
             # to avoid disconnecting ourselves or causing proxy issues.
             print("🔍 Settings lock timeout to 30s...")
             try:
                 await connection.execute(sa.text("SET lock_timeout = '30s'"))
             except Exception as e:
                 print(f"⚠️ Warning: Could not set lock timeout: {e}")

        print("🚀 Starting Alembic's do_run_migrations...")
        await connection.run_sync(do_run_migrations)
        print("🏁 Finished Alembic's do_run_migrations.")

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
