import os
import stat

# Determine absolute path to .env
current_file = os.path.abspath(__file__)
backend_dir = os.path.dirname(os.path.dirname(current_file))
env_path = os.path.join(backend_dir, ".env")

print(f"Backend Dir: {backend_dir}")

files = os.listdir(backend_dir)
env_files = [f for f in files if ".env" in f]
print(f"Files containing '.env': {env_files}")

for f in env_files:
    full_path = os.path.join(backend_dir, f)
    print(f"\nChecking: '{f}' (len={len(f)})")
    print(f"  Repr: {repr(f)}")
    try:
        st = os.stat(full_path)
        print(f"  Size: {st.st_size}")
        print(f"  Mode: {oct(st.st_mode)}")
        print(f"  Type: {'Dir' if stat.S_ISDIR(st.st_mode) else 'File'}")

        # Try reading
        with open(full_path, "rb") as file:
            content = file.read(50)
            print(f"  First 50 bytes: {content}")
    except Exception as e:
        print(f"  Error accessing: {e}")

# Check specifically the one we want
print(f"\nDirect check val env_path='{env_path}'")
if os.path.exists(env_path):
    print("  os.path.exists says YES")
else:
    print("  os.path.exists says NO")
