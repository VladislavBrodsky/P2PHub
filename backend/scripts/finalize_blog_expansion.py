import os
import subprocess
import sys

def run_command(cmd, cwd=None):
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
    else:
        print(result.stdout)
    return result.returncode == 0

def finalize_blog():
    base_dir = os.getcwd()
    
    print("--- Stage 1: Polishing Content ---")
    run_command("python3 backend/scripts/sanitize_blog.py")
    
    print("--- Stage 2: Syncing Locales ---")
    run_command("python3 backend/scripts/sync_blog_locales.py")
    
    print("--- Stage 3: Migrating Database ---")
    db_env = 'export DATABASE_URL="postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway" && export PYTHONPATH=$PYTHONPATH:$(pwd)/backend'
    run_command(f"{db_env} && python3 backend/scripts/migrate_blog.py")
    
    print("--- Finalizing Deployment ---")
    # Add any other checks here
    print("Blog Expansion Complete!")

if __name__ == "__main__":
    finalize_blog()
