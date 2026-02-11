# Backend source of truth for task rewards
# This must match frontend/src/data/earnData.ts

TASK_REWARDS = {
    'telegram_bot': 100,
    'banking_app': 150,
    'community_chat': 100,
    'ambassador_hub': 200,
    'invite_3_friends': 500,
    'daily_checkin_5': 250,
    'invite_10_friends': 1000
}

def get_task_reward(task_id: str) -> float:
    return float(TASK_REWARDS.get(task_id, 0))
