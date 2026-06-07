import asyncio
import os
import sys

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from sqlmodel import select, text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.audit_log import AuditLog

DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def check_audit():
    async with async_session_maker() as session:
        # Get recent 20 audit logs in general
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(20)
        res = await session.exec(stmt)
        logs = res.all()
        print("📋 General Recent Audit Logs:")
        for log in logs:
            print(f"[{log.created_at}] P_ID: {log.partner_id} | Type: {log.action_type} | Action: {log.action} | Desc: {log.description}")
            
        print("\n📋 Recent Audit Logs for @uslincoln:")
        stmt_us = select(AuditLog).where(AuditLog.partner_id == 1).order_by(AuditLog.created_at.desc()).limit(20)
        res_us = await session.exec(stmt_us)
        logs_us = res_us.all()
        for log in logs_us:
            print(f"[{log.created_at}] Action: {log.action} | Desc: {log.description} | Details: {log.details}")

if __name__ == "__main__":
    asyncio.run(check_audit())
