
# Backend Source of Truth for Task Rewards & Configs
# This must match frontend/src/data/earnData.ts

TASK_CONFIG = {
    # Onboarding
    'telegram_bot': {'reward': 25, 'type': 'social'},
    'banking_app': {'reward': 25, 'type': 'social'},
    'community_chat': {'reward': 25, 'type': 'social'},
    'ambassador_hub': {'reward': 25, 'type': 'social'},
    
    # Action
    'daily_checkin_5': {'reward': 100, 'type': 'action', 'requirement': 5},
    
    # Referral Progression
    'invite_1_friend': {'reward': 100, 'type': 'referral', 'requirement': 1},
    'invite_3_friends': {'reward': 150, 'type': 'referral', 'requirement': 3},
    'invite_5_friends': {'reward': 200, 'type': 'referral', 'requirement': 5},
    'invite_10_friends': {'reward': 350, 'type': 'referral', 'requirement': 10},
    'invite_25_friends': {'reward': 500, 'type': 'referral', 'requirement': 25},
    'invite_50_friends': {'reward': 700, 'type': 'referral', 'requirement': 50},
    'invite_100_friends': {'reward': 1200, 'type': 'referral', 'requirement': 100},
    'invite_250_friends': {'reward': 2500, 'type': 'referral', 'requirement': 250},
    'invite_500_friends': {'reward': 5000, 'type': 'referral', 'requirement': 500},
}

def get_task_reward(task_id: str) -> int:
    return TASK_CONFIG.get(task_id, {}).get('reward', 0)

def get_task_config(task_id: str) -> dict:
    return TASK_CONFIG.get(task_id, {})
