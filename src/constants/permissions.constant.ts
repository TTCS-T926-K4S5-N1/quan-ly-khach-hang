export enum Permission {
  CUSTOMER_CARE_VIEW = 'CUSTOMER_CARE_VIEW',
  CUSTOMER_CARE_MANAGE = 'CUSTOMER_CARE_MANAGE',
  LEAD_VIEW = 'LEAD_VIEW',
  LEAD_CREATE = 'LEAD_CREATE',
  LEAD_MANAGE = 'LEAD_MANAGE',
  LEAD_CONVERT = 'LEAD_CONVERT',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CARE_MANAGER = 'CARE_MANAGER',
  CARE_STAFF = 'CARE_STAFF',
  SALES = 'SALES',
  MARKETING = 'MARKETING',
  VIEWER = 'VIEWER',
}

export const RolePermissionsMap: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.CUSTOMER_CARE_VIEW,
    Permission.CUSTOMER_CARE_MANAGE,
    Permission.LEAD_VIEW,
    Permission.LEAD_CREATE,
    Permission.LEAD_MANAGE,
    Permission.LEAD_CONVERT,
  ],
  [UserRole.CARE_MANAGER]: [
    Permission.CUSTOMER_CARE_VIEW,
    Permission.CUSTOMER_CARE_MANAGE,
    Permission.LEAD_VIEW,
    Permission.LEAD_CREATE,
    Permission.LEAD_MANAGE,
    Permission.LEAD_CONVERT,
  ],
  [UserRole.CARE_STAFF]: [
    Permission.CUSTOMER_CARE_VIEW,
    Permission.CUSTOMER_CARE_MANAGE,
    Permission.LEAD_VIEW,
    Permission.LEAD_CREATE,
    Permission.LEAD_CONVERT,
  ],
  [UserRole.SALES]: [
    Permission.CUSTOMER_CARE_VIEW,
    Permission.LEAD_VIEW,
    Permission.LEAD_CREATE,
    Permission.LEAD_MANAGE,
    Permission.LEAD_CONVERT,
  ],
  [UserRole.MARKETING]: [
    Permission.LEAD_VIEW,
    Permission.LEAD_CREATE,
    Permission.LEAD_MANAGE,
    Permission.LEAD_CONVERT,
  ],
  [UserRole.VIEWER]: [
    Permission.CUSTOMER_CARE_VIEW,
    Permission.LEAD_VIEW,
  ],
};

