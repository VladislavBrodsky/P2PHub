
import os
import sys
import sqlite3
import random

def create_test_data():
    db_paths = ["backend/dev.db", "dev.db"]
    db_path = None
    for p in db_paths:
        if os.path.exists(p):
            db_path = p
            break
            
    if not db_path:
        # Create new one if needed
        db_path = "backend/dev.db"
        if not os.path.exists(os.path.dirname(db_path)):
            os.makedirs(os.path.dirname(db_path))
        print(f"Creating new DB at {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Ensure table exists (simple check)
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='partner'")
    if not cursor.fetchone():
        print("Table 'partner' does not exist! Run the backend to create tables first.")
        return

    # Create Root User: uslincoln
    user_id = 100
    root_username = "uslincoln"
    
    print(f"Creating/Updating Root User @{root_username} (ID: {user_id})")
    cursor.execute("INSERT OR REPLACE INTO partner (id, telegram_id, username, first_name, xp, level, referral_code, created_at, path) VALUES (?, ?, ?, ?, 1000, 5, 'USLINCOLN', datetime(), NULL)", 
                   (user_id, "100", root_username, "Abraham",))

    # Create Level 1 referrals
    for i in range(1, 4):
        child_id = user_id + i
        username = f"child_l1_{i}"
        path = str(user_id)
        print(f"Creating Child L1 @{username} (ID: {child_id}, Referrer: {user_id}, Path: {path})")
        cursor.execute("INSERT OR REPLACE INTO partner (id, telegram_id, username, first_name, xp, level, referral_code, referrer_id, path, created_at) VALUES (?, ?, ?, ?, 100, 1, ?, ?, ?, datetime())",
                       (child_id, str(child_id), username, f"Child {i}", f"REF{child_id}", user_id, path))
                       
        # Create Level 2 referrals
        for j in range(1, 3):
            grandchild_id = child_id * 10 + j
            username_gc = f"child_l2_{i}_{j}"
            path_gc = f"{path}.{child_id}"
            print(f"  Creating Child L2 @{username_gc} (ID: {grandchild_id}, Referrer: {child_id}, Path: {path_gc})")
            cursor.execute("INSERT OR REPLACE INTO partner (id, telegram_id, username, first_name, xp, level, referral_code, referrer_id, path, created_at) VALUES (?, ?, ?, ?, 50, 1, ?, ?, ?, datetime())",
                           (grandchild_id, str(grandchild_id), username_gc, f"Grandchild {i}-{j}", f"REF{grandchild_id}", child_id, path_gc))

    conn.commit()
    conn.close()
    print("Test data created successfully.")

if __name__ == "__main__":
    create_test_data()
