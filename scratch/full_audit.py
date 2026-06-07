"""
Comprehensive production audit:
1. Subscription expiry - users with expired subs still marked is_pro=True
2. Income chart data integrity
3. Token balance consistency  
4. Referral chain integrity
5. Missing/null critical fields
"""
import asyncio, sys, os
from datetime import datetime, timezone

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))
sys.path.insert(0, BASE_DIR)

from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv(os.path.join(BASE_DIR, "backend/.env"))
load_dotenv(os.path.join(BASE_DIR, ".env"))

from app.models.partner import Partner

DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

SEP = "=" * 72

async def audit():
    async with AsyncSessionLocal() as session:
        now = datetime.now(timezone.utc)
        issues = []

        # ─────────────────────────────────────────────────────────────────
        print(f"\n{SEP}")
        print("  1. SUBSCRIPTION EXPIRY AUDIT — is_pro=True but expired?")
        print(SEP)

        all_pro = (await session.exec(select(Partner).where(Partner.is_pro == True))).all()
        expired_pro = []
        for p in all_pro:
            if p.pro_expires_at:
                exp = p.pro_expires_at
                if exp.tzinfo is None:
                    exp = exp.replace(tzinfo=timezone.utc)
                if exp < now:
                    expired_pro.append(p)
                    days_ago = (now - exp).days
                    uname = f"@{p.username}" if p.username else f"id:{p.telegram_id}"
                    plan = p.subscription_plan or "none"
                    print(f"  ⚠️  EXPIRED {days_ago}d ago: {uname:25} plan={plan} expired={str(exp)[:10]}")
                    issues.append(f"CRITICAL: {uname} has is_pro=True but subscription expired {days_ago}d ago")

        if not expired_pro:
            print("  ✅ No users have is_pro=True with an expired subscription")
        else:
            print(f"\n  ❌ {len(expired_pro)} users with EXPIRED subscriptions still marked as PRO!")

        # ─────────────────────────────────────────────────────────────────
        print(f"\n{SEP}")
        print("  2. INCOME CHART DATA — Check commission/transaction tables")
        print(SEP)

        # Find what tables exist
        tables_result = await session.exec(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' ORDER BY table_name
        """))
        tables = [r[0] for r in tables_result.all()]
        print(f"  Tables in DB: {', '.join(tables)}")

        # Look for commission/transaction/income tables
        income_tables = [t for t in tables if any(k in t.lower() for k in ['commission', 'transaction', 'income', 'payment', 'earning', 'payout', 'referral_earning'])]
        print(f"  Income-related tables: {income_tables or 'NONE FOUND'}")

        if 'commissions' in tables:
            c_result = await session.exec(text("SELECT COUNT(*), MAX(created_at), MIN(created_at) FROM commissions"))
            row = c_result.first()
            print(f"  commissions: count={row[0]}, newest={row[1]}, oldest={row[2]}")

            # Check for any NULL amounts
            null_result = await session.exec(text("SELECT COUNT(*) FROM commissions WHERE amount IS NULL OR amount <= 0"))
            null_count = null_result.first()[0]
            if null_count > 0:
                print(f"  ⚠️  {null_count} commission rows with NULL or zero amount!")
                issues.append(f"HIGH: {null_count} commission rows with invalid amount")
            else:
                print(f"  ✅ All commission amounts are valid")

        if 'payments' in tables:
            p_result = await session.exec(text("SELECT COUNT(*), SUM(amount), MAX(created_at) FROM payments WHERE status='confirmed'"))
            row = p_result.first()
            print(f"  payments (confirmed): count={row[0]}, total={row[1]}, newest={row[2]}")

        # Check for analytics endpoint data
        if 'partner' in tables or 'partners' in tables:
            tname = 'partners' if 'partners' in tables else 'partner'
            analytics = await session.exec(text(f"""
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE is_pro=true) as pro,
                    COUNT(*) FILTER (WHERE created_at > now() - interval '30 days') as new_30d,
                    COUNT(*) FILTER (WHERE created_at > now() - interval '7 days') as new_7d
                FROM {tname}
            """))
            row = analytics.first()
            print(f"\n  Partner stats: total={row[0]}, pro={row[1]}, new_30d={row[2]}, new_7d={row[3]}")

        # ─────────────────────────────────────────────────────────────────
        print(f"\n{SEP}")
        print("  3. NULL CRITICAL FIELDS AUDIT")
        print(SEP)

        null_referral = (await session.exec(
            select(Partner).where(Partner.referral_code == None)
        )).all()
        if null_referral:
            print(f"  ❌ {len(null_referral)} partners with NULL referral_code!")
            issues.append(f"HIGH: {len(null_referral)} partners missing referral_code")
        else:
            print(f"  ✅ All partners have referral_code")

        null_tg = (await session.exec(
            select(Partner).where(Partner.telegram_id == None)
        )).all()
        if null_tg:
            print(f"  ❌ {len(null_tg)} partners with NULL telegram_id!")
            issues.append(f"CRITICAL: {len(null_tg)} partners missing telegram_id")
        else:
            print(f"  ✅ All partners have telegram_id")

        # Check for duplicate telegram_ids
        dup_result = await session.exec(text("""
            SELECT telegram_id, COUNT(*) as cnt FROM partner 
            GROUP BY telegram_id HAVING COUNT(*) > 1
        """))
        dups = dup_result.all()
        if dups:
            print(f"  ❌ DUPLICATE telegram_ids found: {[(r[0], r[1]) for r in dups]}")
            issues.append(f"CRITICAL: Duplicate telegram_ids - data integrity broken")
        else:
            print(f"  ✅ No duplicate telegram_ids")

        # ─────────────────────────────────────────────────────────────────
        print(f"\n{SEP}")
        print("  4. REFERRAL CHAIN INTEGRITY")
        print(SEP)

        # Find partners whose referrer doesn't exist
        orphan_result = await session.exec(text("""
            SELECT p.username, p.telegram_id, p.referred_by
            FROM partner p 
            WHERE p.referred_by IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM partner r WHERE r.referral_code = p.referred_by
            )
            LIMIT 20
        """))
        orphans = orphan_result.all()
        if orphans:
            print(f"  ⚠️  {len(orphans)} partners reference non-existent referrer codes:")
            for o in orphans[:10]:
                print(f"       @{o[0]} (id:{o[1]}) -> code:{o[2]}")
            issues.append(f"MEDIUM: {len(orphans)} partners have broken referral chains")
        else:
            print(f"  ✅ All referral chains are intact")

        # ─────────────────────────────────────────────────────────────────
        print(f"\n{SEP}")
        print("  5. TOKEN BALANCE INTEGRITY")
        print(SEP)

        neg_tokens = (await session.exec(
            select(Partner).where(Partner.pro_tokens < 0)  # type: ignore
        )).all()
        if neg_tokens:
            for p in neg_tokens:
                uname = f"@{p.username}" if p.username else f"id:{p.telegram_id}"
                print(f"  ❌ NEGATIVE tokens: {uname} has {p.pro_tokens} tokens!")
                issues.append(f"HIGH: {uname} has negative pro_tokens ({p.pro_tokens})")
        else:
            print(f"  ✅ No negative token balances")

        over_tokens = (await session.exec(
            select(Partner).where(Partner.pro_tokens > 500)  # type: ignore
        )).all()
        if over_tokens:
            for p in over_tokens:
                uname = f"@{p.username}" if p.username else f"id:{p.telegram_id}"
                print(f"  ⚠️  OVER-LIMIT tokens: {uname} has {p.pro_tokens} (max=500)")
                issues.append(f"MEDIUM: {uname} has {p.pro_tokens} pro_tokens (exceeds 500 cap)")
        else:
            print(f"  ✅ All token balances within expected range (≤500)")

        # ─────────────────────────────────────────────────────────────────
        print(f"\n{SEP}")
        print("  6. MISSING DB INDEXES — Check key query fields")
        print(SEP)

        index_result = await session.exec(text("""
            SELECT indexname, tablename, indexdef
            FROM pg_indexes 
            WHERE tablename IN (SELECT table_name FROM information_schema.tables WHERE table_schema='public')
            ORDER BY tablename, indexname
        """))
        indexes = index_result.all()
        index_cols = set()
        for idx in indexes:
            print(f"  idx: {idx[1]}.{idx[0]}")
            index_cols.add(f"{idx[1]}:{idx[2]}")

        # Check if critical columns are indexed
        critical_cols = ['telegram_id', 'referral_code', 'referred_by', 'username']
        partner_indexes = [i for i in indexes if i[1] == 'partner']
        indexed_partner_cols = ' '.join([i[2] for i in partner_indexes])

        for col in critical_cols:
            if col in indexed_partner_cols:
                print(f"  ✅ partner.{col} IS indexed")
            else:
                print(f"  ⚠️  partner.{col} may NOT be indexed — check manually")
                issues.append(f"MEDIUM: partner.{col} may be missing an index")

        # ─────────────────────────────────────────────────────────────────
        print(f"\n{SEP}")
        print("  AUDIT SUMMARY")
        print(SEP)

        if issues:
            print(f"  ❌ {len(issues)} issues found:\n")
            for i, issue in enumerate(issues, 1):
                print(f"  {i}. {issue}")
        else:
            print("  ✅ No critical issues found!")
        print(f"\n{SEP}\n")

asyncio.run(audit())
