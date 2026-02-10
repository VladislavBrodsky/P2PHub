import redis
import sys

# Connect to local Redis
r = redis.from_url("redis://localhost:6379", decode_responses=True)

def clear_cache(partner_id):
    # Clear tree stats
    stats_key = f"ref_tree_stats:{partner_id}"
    r.delete(stats_key)
    print(f"Cleared {stats_key}")
    
    # Clear tree members for all levels
    for level in range(1, 10):
        members_key = f"ref_tree_members:{partner_id}:{level}"
        r.delete(members_key)
        print(f"Cleared {members_key}")

if __name__ == "__main__":
    partner_id = sys.argv[1] if len(sys.argv) > 1 else "100"
    clear_cache(partner_id)
