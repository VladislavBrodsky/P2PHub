
import os
import sys
from sqlmodel import create_engine, Session, select, text
from app.models.partner import Partner

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def debug_network(username: str):
    # DIRECT DB CONNECTION to backend/dev.db or dev.db
    # Try to find the db file
    db_path = "backend/dev.db"
    if not os.path.exists(db_path):
        db_path = "dev.db"
    
    if not os.path.exists(db_path):
        print(f"ERROR: Could not find dev.db at {db_path} or backend/dev.db")
        return

    print(f"Using Database: {db_path}")
    engine = create_engine(f"sqlite:///{db_path}")

    with Session(engine) as session:
        print(f"--- Debugging Network for @{username} ---")
        
        # 1. Get User
        stmt = select(Partner).where(Partner.username == username)
        result = session.exec(stmt)
        user = result.first()
        
        if not user:
            print(f"User @{username} not found!")
            return

        print(f"User: {user.first_name} (ID: {user.id})")
        print(f"Path: '{user.path}'")
        print(f"Referrer ID: {user.referrer_id}")
        
        # 2. Check Children (Level 1)
        print(f"\n--- Direct Referrals (Database Check) ---")
        stmt_children = select(Partner).where(Partner.referrer_id == user.id)
        res_children = session.exec(stmt_children)
        children = res_children.all()
        print(f"Found {len(children)} direct children via referrer_id.")
        
        for child in children:
            valid_legacy = child.path == str(user.id)
            valid_new = child.path == f"{user.path}.{user.id}" if user.path else child.path == str(user.id)
            print(f"- Child ID: {child.id} | Path: '{child.path}' | Valid: {valid_new}")

        # 3. Simulate Logic
        base_path = f"{user.path or ''}.{user.id}".lstrip(".")
        base_dots = base_path.count('.') if base_path else -1
        target_level = 1
        target_dots = base_dots + target_level - 1
        
        print(f"\n--- Simulation (Level 1) ---")
        print(f"Base Path: {base_path}")
        print(f"Target Dots: {target_dots}")
        
        query = text("""
            SELECT id, first_name, path 
            FROM partner
            WHERE (path = :base_path OR path LIKE :base_path || '.%')
            AND (length(path) - length(replace(path, '.', ''))) = :target_dots
        """)
        
        try:
            res_sim = session.exec(query, params={"base_path": base_path, "target_dots": target_dots})
            rows = res_sim.fetchall()
            print(f"Query returned {len(rows)} rows.")
            for r in rows:
                print(f"Match: ID {r[0]} | Path {r[2]}")
        except Exception as e:
            print(f"Query Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target = sys.argv[1].replace("@", "")
        debug_network(target)
    else:
        print("Usage: python debug_network.py <username>")
