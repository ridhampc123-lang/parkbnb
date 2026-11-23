import { UserRole } from '@/types/database';
import { UserSession } from './session';

export type { UserRole };

export type PermissionCode =
  // Customer permissions
  | 'customer:manage_self'
  | 'customer:create_booking'
  | 'customer:cancel_own_booking'
  // Provider / Owner permissions
  | 'provider:manage_spaces'
  | 'provider:view_gate_manifest'
  | 'provider:request_payout'
  // Support Agent permissions
  | 'support:view_tickets'
  | 'support:reply_tickets'
  | 'support:lookup_customer'
  // Verification Manager permissions
  | 'verification:audit_hosts'
  | 'verification:approve_spaces'
  | 'verification:reject_spaces'
  // Operations Manager permissions
  | 'operations:manage_spaces'
  | 'operations:arbitrate_disputes'
  | 'operations:suspend_accounts'
  // Finance Manager permissions
  | 'finance:manage_ledger'
  | 'finance:disburse_payouts'
  | 'finance:view_analytics'
  // Admin permissions
  | 'admin:full_access'
  | 'admin:view_dashboard'
  // Super Admin permissions
  | 'super_admin:all'
  | 'super_admin:manage_roles'
  | 'super_admin:view_security_audit';

export const ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
  visitor: [],
  customer: [
    'customer:manage_self',
    'customer:create_booking',
    'customer:cancel_own_booking',
  ],
  provider: [
    'provider:manage_spaces',
    'provider:view_gate_manifest',
    'provider:request_payout',
  ],
  support_agent: [
    'support:view_tickets',
    'support:reply_tickets',
    'support:lookup_customer',
  ],
  verification_manager: [
    'verification:audit_hosts',
    'verification:approve_spaces',
    'verification:reject_spaces',
    'operations:manage_spaces',
  ],
  operations_manager: [
    'operations:manage_spaces',
    'operations:arbitrate_disputes',
    'operations:suspend_accounts',
    'support:view_tickets',
    'support:reply_tickets',
    'verification:approve_spaces',
  ],
  finance_manager: [
    'finance:manage_ledger',
    'finance:disburse_payouts',
    'finance:view_analytics',
  ],
  admin: [
    'admin:full_access',
    'admin:view_dashboard',
    'support:view_tickets',
    'support:reply_tickets',
    'support:lookup_customer',
    'verification:audit_hosts',
    'verification:approve_spaces',
    'verification:reject_spaces',
    'operations:manage_spaces',
    'operations:arbitrate_disputes',
    'operations:suspend_accounts',
    'finance:manage_ledger',
    'finance:disburse_payouts',
    'finance:view_analytics',
  ],
  super_admin: [
    'super_admin:all',
    'super_admin:manage_roles',
    'super_admin:view_security_audit',
    'admin:full_access',
    'admin:view_dashboard',
    'support:view_tickets',
    'support:reply_tickets',
    'support:lookup_customer',
    'verification:audit_hosts',
    'verification:approve_spaces',
    'verification:reject_spaces',
    'operations:manage_spaces',
    'operations:arbitrate_disputes',
    'operations:suspend_accounts',
    'finance:manage_ledger',
    'finance:disburse_payouts',
    'finance:view_analytics',
  ],
};

/**
 * Validates if the authenticated session has the specific permission code.
 * Super Admin implicitly has all permissions.
 */
export function hasPermission(session: UserSession | null, permission: PermissionCode): boolean {
  if (!session || !session.isAuthenticated || !session.role) {
    return false;
  }

  if (session.role === 'super_admin') {
    return true;
  }

  const rolePermissions = ROLE_PERMISSIONS[session.role] || [];
  return rolePermissions.includes(permission) || rolePermissions.includes('admin:full_access');
}

/**
 * Checks whether user has any administrative or staff privilege.
 */
export function isStaffRole(role?: UserRole): boolean {
  if (!role) return false;
  return [
    'admin',
    'super_admin',
    'support_agent',
    'operations_manager',
    'finance_manager',
    'verification_manager',
  ].includes(role);
}

/**
 * Strict server assertion guard.
 */
export function assertPermission(session: UserSession | null, permission: PermissionCode, errorMessage?: string): void {
  if (!hasPermission(session, permission)) {
    throw new Error(errorMessage || `Access Denied: Missing required permission [${permission}].`);
  }
}
