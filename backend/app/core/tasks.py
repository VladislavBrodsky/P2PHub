# Backend source of truth for task rewards and requirements
# This must match frontend/src/data/earnData.ts

TASK_CONFIG = {
    'telegram_bot': {'reward': 100, 'type': 'social'},
    'banking_app': {'reward': 150, 'type': 'social'},
    'community_chat': {'reward': 100, 'type': 'social'},
    'ambassador_hub': {'reward': 200, 'type': 'social'},
    
    # Referral Progression
    'invite_1_friend': {'reward': 250, 'type': 'referral', 'requirement': 1},
    'invite_3_friends': {'reward': 500, 'type': 'referral', 'requirement': 3},
    'invite_5_friends': {'reward': 750, 'type': 'referral', 'requirement': 5},
    'invite_10_friends': {'reward': 1000, 'type': 'referral', 'requirement': 10},
    'invite_25_friends': {'reward': 2500, 'type': 'referral', 'requirement': 25},
    'invite_50_friends': {'reward': 3000, 'type': 'referral', 'requirement': 50},
    'invite_100_friends': {'reward': 5000, 'type': 'referral', 'requirement': 100},
    'invite_250_friends': {'reward': 7000, 'type': 'referral', 'requirement': 250},
    'invite_500_friends': {'reward': 10000, 'type': 'referral', 'requirement': 500},

    'daily_checkin_5': {'reward': 250, 'type': 'action', 'requirement': 5},
}

def get_task_reward(task_id: str) -> float:
    return float(TASK_CONFIG.get(task_id, {}).get('reward', 0))

def get_task_config(task_id: str) -> dict:
    return TASK_CONFIG.get(task_id, {})
