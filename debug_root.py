
import os
import sys
import sqlite3

def debug_network(username: str):
    # Try multiple locations for db
    db_paths = ["backend/dev.db", "dev.db"]
    db_path = None
    for p in db_paths:
        if os.path.exists(p):
            db_path = p
            break
    
    if not db_path:
        print(f"ERROR: Could not find dev.db in {db_paths}")
        return

    print(f"Using Database: {db_path}")
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        print(f"--- Debugging Network for @{username} ---")
        
        # 1. Get User
        cursor.execute("SELECT id, first_name, path, referrer_id FROM partner WHERE username = ?", (username,))
        user = cursor.fetchone()
        
        if not user:
            print(f"User @{username} not found!")
            return

        user_id = user['id']
        user_path = user['path'] if user['path'] else None
        user_referrer_id = user['referrer_id']

        print(f"User: {user['first_name']} (ID: {user_id})")
        print(f"Path: '{user_path}'")
        print(f"Referrer ID: {user_referrer_id}")
        
        # 2. Check Children (Level 1)
        print(f"\n--- Direct Referrals (Database Check) ---")
        cursor.execute("SELECT id, path, username FROM partner WHERE referrer_id = ?", (user_id,))
        children = cursor.fetchall()
        print(f"Found {len(children)} direct children via referrer_id.")
        
        for child in children:
            child_path = child['path']
            # Logic: child path should be "user_path.user_id"
            expected_path = f"{user_path}.{user_id}" if user_path else str(user_id)
            valid = child_path == expected_path
            print(f"- Child ID: {child['id']} (@{child['username']}) | Path: '{child_path}' | Expected: '{expected_path}' | Valid: {valid}")

        # 3. Simulate Logic
        # base_path = f"{partner.path or ''}.{partner.id}".lstrip(".")
        base_path = f"{user_path}.{user_id}" if user_path else str(user_id)
        base_dots = base_path.count('.')
        target_level = 1
        target_dots = base_dots + target_level - 1
        
        print(f"\n--- Simulation (Level 1) ---")
        print(f"Base Path: {base_path}")
        print(f"Target Dots: {target_dots}")
        
        # WHERE (path = :base_path OR path LIKE :base_path || '.%')
        # AND (length(path) - length(replace(path, '.', ''))) = :target_dots
        
        query = """
            SELECT id, first_name, path 
            FROM partner
            WHERE (path = ? OR path LIKE ? || '.%')
            AND (length(path) - length(replace(path, '.', ''))) = ?
        """
        
        cursor.execute(query, (base_path, base_path, target_dots))
        rows = cursor.fetchall()
        print(f"Query returned {len(rows)} rows.")
        for r in rows:
            print(f"Match: ID {r['id']} | Path {r['path']}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target = sys.argv[1]
        if target == "list":
            # List users
            db_path = "backend/dev.db"
            if not os.path.exists(db_path): db_path = "dev.db"
            print(f"Using DB: {db_path}")
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT id, username, first_name, last_name FROM partner ORDER BY id DESC LIMIT 20")
            for r in cursor.fetchall():
                print(r)
            conn.close()
        else:
            target = target.replace("@", "")
            debug_network(target)
    else:
        print("Usage: python debug_root.py <username> OR python debug_root.py list")
