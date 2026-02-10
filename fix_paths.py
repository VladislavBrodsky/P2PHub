
import os
import sys
import sqlite3

def fix_paths():
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
        # 1. Fetch all users (id, referrer_id)
        print("Fetching all users...")
        cursor.execute("SELECT id, referrer_id, path FROM partner")
        users = cursor.fetchall()
        
        user_map = {u['id']: {'referrer_id': u['referrer_id'], 'current_path': u['path']} for u in users}
        print(f"Found {len(user_map)} users.")
        
        # 2. Compute Paths strictly in memory
        # Path format: "ancestor.parent"
        # If I am root, path is NULL.
        # If my referrer is root (ID 1), my path is "1".
        # If my referrer is ID 2 (who is child of 1), my path is "1.2".
        
        updates = []
        
        # Helper to get path
        memo = {}
        
        def get_path(uid, depth=0):
            if uid in memo: return memo[uid]
            if depth > 20: # Safety break
                print(f"WARNING: Circular dependency or too deep at ID {uid}")
                return None
            
            user = user_map.get(uid)
            if not user: return None
            
            rid = user['referrer_id']
            if not rid:
                memo[uid] = None
                return None
            
            parent_path = get_path(rid, depth+1)
            
            # If parent has no path (is root), my path is just "parent_id"
            if parent_path is None:
                new_path = str(rid)
            else:
                new_path = f"{parent_path}.{rid}"
                
            memo[uid] = new_path
            return new_path

        # Calculate for everyone
        for uid in user_map.keys():
            calculated_path = get_path(uid)
            current_path = user_map[uid]['current_path']
            
            if calculated_path != current_path:
                 updates.append((calculated_path, uid))
        
        if updates:
            print(f"Updating {len(updates)} user paths...")
            cursor.executemany("UPDATE partner SET path = ? WHERE id = ?", updates)
            conn.commit()
            print("Migration Complete.")
        else:
            print("All paths are already correct.")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_paths()
