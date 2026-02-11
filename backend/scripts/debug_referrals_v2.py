from sqlalchemy import create_engine, text

DATABASE_URL = "sqlite:///backend/dev.db"
engine = create_engine(DATABASE_URL)

def debug_user(username):
    with engine.connect() as conn:
        # Find the user
        result = conn.execute(text("SELECT id, telegram_id, username, first_name, referrer_id, path, xp FROM partner WHERE username = :username"), {"username": username})
        partner = result.fetchone()

        if not partner:
            print(f"User {username} not found.")
            return

        print(f"User Found: ID={partner.id}, TG={partner.telegram_id}, Name={partner.first_name}, ReferrerID={partner.referrer_id}, Path={partner.path}, XP={partner.xp}")

        # Check direct referrals (L1)
        result = conn.execute(text("SELECT id, username, first_name, xp, path FROM partner WHERE referrer_id = :id"), {"id": partner.id})
        referrals = result.fetchall()
        print(f"\nDirect Referrals (L1) Count: {len(referrals)}")
        for r in referrals:
            print(f" - ID={r.id}, Username={r.username}, Name={r.first_name}, XP={r.xp}, Path={r.path}")

        # Check deeper referrals using path
        # Path for descendants should start with partner.path + partner.id or just partner.id if no path
        base_path = f"{partner.path or ''}.{partner.id}".lstrip('.')
        result = conn.execute(text("SELECT id, username, first_name, xp, path FROM partner WHERE path LIKE :path"), {"path": f"{base_path}%"})
        descendants = result.fetchall()
        print(f"\nPotential Descendants (via Path) Count: {len(descendants)}")
        # Note: path like base_path% might pick up cousins if not careful, but path is root.ancestor.parent

        # Check all partners to see if anyone has this user as referrer but wrong path
        result = conn.execute(text("SELECT COUNT(*) FROM partner WHERE referrer_id = :id"), {"id": partner.id})
        l1_count = result.scalar()
        print(f"\nConfirming ReferrerID count: {l1_count}")

if __name__ == "__main__":
    import sys
    username = sys.argv[1] if len(sys.argv) > 1 else "uslincoln"
    debug_user(username)
