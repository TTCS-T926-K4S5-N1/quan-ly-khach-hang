from enum import Enum

class RoleEnum(str, Enum):
    SALES_REP = "SALES_REP"
    TEAM_LEAD = "TEAM_LEAD"
    MANAGER = "MANAGER"
    ADMIN = "ADMIN"

# Roles allowed to reopen closed opportunities
REOPEN_ALLOWED_ROLES = {
    RoleEnum.TEAM_LEAD.value,
    RoleEnum.MANAGER.value,
    RoleEnum.ADMIN.value,
    "TEAM_LEADER",
    "LEADER"
}

def can_user_reopen(user_role: str) -> bool:
    """Return True if user's role allows reopening a closed opportunity."""
    return user_role.upper() in REOPEN_ALLOWED_ROLES

def can_user_access_opportunity(user_id: int, user_role: str, owner_id: int) -> bool:
    """
    Check if a user has permission to view or close an opportunity.
    - ADMIN and MANAGER can access all.
    - TEAM_LEAD can access opportunities within team / all.
    - SALES_REP can access their own opportunities.
    """
    role = user_role.upper()
    if role in {RoleEnum.ADMIN.value, RoleEnum.MANAGER.value, RoleEnum.TEAM_LEAD.value, "TEAM_LEADER"}:
        return True
    return user_id == owner_id
