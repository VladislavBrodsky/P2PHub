# Backend source of truth for task rewards and requirements
# This must match frontend/src/data/earnData.ts

TASK_CONFIG = {
    'telegram_bot': {'reward': 100, 'type': 'social'},
    'banking_app': {'reward': 150, 'type': 'social'},
    'community_chat': {'reward': 100, 'type': 'social'},
    'ambassador_hub': {'reward': 200, 'type': 'social'},
    'invite_3_friends': {'reward': 500, 'type': 'referral', 'requirement': 3},
    'daily_checkin_5': {'reward': 250, 'type': 'action', 'requirement': 5},
    'invite_10_friends': {'reward': 1000, 'type': 'referral', 'requirement': 10}
}

def get_task_reward(task_id: str) -> float:
    return float(TASK_CONFIG.get(task_id, {}).get('reward', 0))

def get_task_config(task_id: str) -> dict:
    return TASK_CONFIG.get(task_id, {})
