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

def get_xp_for_level(level: int) -> float:
    """
    Returns the total XP required to reach the start of a specific level.
    """
    if level <= 1:
        return 0.0
    return 50 * (level - 1) * level
