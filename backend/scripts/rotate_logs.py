import os
import time
from pathlib import Path

def rotate_logs(directory: str, max_age_days: int = 7):
    """
    Deletes files in the specified directory that are older than max_age_days.
    Assumes filenames are in the format logs.<timestamp_ms>.json or checks file mtime.
    """
    now_ms = int(time.time() * 1000)
    max_age_ms = max_age_days * 24 * 60 * 60 * 1000
    cutoff_ms = now_ms - max_age_ms
    
    path = Path(directory)
    if not path.exists():
        print(f"Directory {directory} does not exist.")
        return

    deleted_count = 0
    total_freed_bytes = 0

    print(f"Starting log rotation in {directory} (Cutoff: {max_age_days} days ago)")

    for file in path.glob("logs.*.json"):
        try:
            # Try parsing timestamp from filename
            parts = file.name.split('.')
            if len(parts) >= 2:
                file_ts_ms = int(parts[1])
                
                if file_ts_ms < cutoff_ms:
                    size = file.stat().st_size
                    file.unlink()
                    deleted_count += 1
                    total_freed_bytes += size
                    print(f"Deleted {file.name} ({size} bytes)")
        except (ValueError, OSError) as e:
            print(f"Error processing {file.name}: {e}")

    print(f"Rotation complete. Deleted {deleted_count} files. Freed {total_freed_bytes / 1024:.2f} KB.")

if __name__ == "__main__":
    # Get project root (script is in backend/scripts/rotate_logs.py)
    base_dir = Path(__file__).parent.parent.parent
    archive_logs_dir = base_dir / "archive_logs"
    
    rotate_logs(str(archive_logs_dir))
