import sqlite3
import os

def fix_schema():
    db_path = "dev.db"
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get existing columns
    cursor.execute("PRAGMA table_info(partner)")
    columns = [row[1] for row in cursor.fetchall()]

    new_columns = [
        ("photo_file_id", "VARCHAR"),
        ("level", "INTEGER DEFAULT 1"),
        ("total_earned_usdt", "FLOAT DEFAULT 0.0"),
        ("referral_count", "INTEGER DEFAULT 0")
    ]

    for col_name, col_type in new_columns:
        if col_name not in columns:
            print(f"Adding column {col_name} to partner table...")
            try:
                cursor.execute(f"ALTER TABLE partner ADD COLUMN {col_name} {col_type}")
                print(f"✅ Added {col_name}")
            except Exception as e:
                print(f"❌ Failed to add {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists.")

    conn.commit()
    conn.close()
    print("Schema fix completed.")

if __name__ == "__main__":
    fix_schema()
