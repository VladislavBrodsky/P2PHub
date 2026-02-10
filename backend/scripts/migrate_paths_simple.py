import sqlite3
import os

def migrate_paths():
    db_path = "dev.db"
    if not os.path.exists(db_path):
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Recursive function to update children
    def update_children(parent_id, parent_path):
        cursor.execute("SELECT id FROM partner WHERE referrer_id = ?", (parent_id,))
        children = cursor.fetchall()
        for (child_id,) in children:
            new_path = f"{parent_path}.{parent_id}".lstrip(".")
            print(f"Updating partner {child_id} path to {new_path}")
            cursor.execute("UPDATE partner SET path = ? WHERE id = ?", (new_path, child_id))
            update_children(child_id, new_path)

    # Start from roots (no referrer)
    print("Finding root partners...")
    cursor.execute("SELECT id FROM partner WHERE referrer_id IS NULL OR referrer_id = 0")
    roots = cursor.fetchall()
    for (root_id,) in roots:
        print(f"Processing root partner {root_id}")
        cursor.execute("UPDATE partner SET path = NULL WHERE id = ?", (root_id,))
        update_children(root_id, "")

    conn.commit()
    conn.close()
    print("✅ All paths migrated successfully.")

if __name__ == "__main__":
    migrate_paths()
