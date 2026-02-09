def get_level(xp: float) -> int:
    """
    Calculates current level based on total XP.
    Formula: Total XP to reach Level L+1 = 50 * L * (L+1)
    L=1: 100 XP
    L=2: 300 XP
    L=3: 600 XP
    """
    level = 1
    while xp >= (50 * level * (level + 1)):
        level += 1
    return level

RANKS = [
    {"name": 'Beginner', "minLevel": 1},
    {"name": 'Novice', "minLevel": 3},
    {"name": 'Apprentice', "minLevel": 6},
    {"name": 'Contributor', "minLevel": 9},
    {"name": 'Pioneer', "minLevel": 12},
    {"name": 'Pathbreaker', "minLevel": 15},
    {"name": 'Adventurer', "minLevel": 18},
    {"name": 'Voyager', "minLevel": 21},
    {"name": 'Ambassador', "minLevel": 24},
    {"name": 'Leader', "minLevel": 27},
    {"name": 'Senior Leader', "minLevel": 30},
    {"name": 'Executive', "minLevel": 33},
    {"name": 'Director', "minLevel": 36},
    {"name": 'President', "minLevel": 40},
    {"name": 'Global Partner', "minLevel": 44},
    {"name": 'World Partner', "minLevel": 48},
    {"name": 'Elite', "minLevel": 52},
    {"name": 'Master', "minLevel": 56},
    {"name": 'Grandmaster', "minLevel": 60},
    {"name": 'Legend', "minLevel": 64},
    {"name": 'VIP', "minLevel": 68},
    {"name": 'VIP II', "minLevel": 72},
    {"name": 'VIP III', "minLevel": 76},
    {"name": 'VIP Elite', "minLevel": 80},
    {"name": 'Premium', "minLevel": 84},
    {"name": 'Premium Plus', "minLevel": 88},
    {"name": 'PRO', "minLevel": 92},
    {"name": 'PRO Max', "minLevel": 96},
    {"name": 'Immortal', "minLevel": 100},
    {"name": 'Eternal', "minLevel": 110},
]

def get_rank(xp: float) -> str:
    level = get_level(xp)
    current_rank = "Beginner"
    for rank in RANKS:
        if level >= rank["minLevel"]:
            current_rank = rank["name"]
    return current_rank

def get_xp_for_level(level: int) -> float:
    """
    Returns the total XP required to reach the start of a specific level.
    """
    if level <= 1:
        return 0.0
    return 50 * (level - 1) * level
