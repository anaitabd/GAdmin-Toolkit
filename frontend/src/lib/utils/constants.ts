export const ACCOUNT_STATUS = {
  active: { label: 'Active', color: 'success' as const },
  paused: { label: 'Paused', color: 'warning' as const },
  suspended: { label: 'Suspended', color: 'error' as const },
  warming_up: { label: 'Warming Up', color: 'info' as const },
  paused_limit_reached: { label: 'Limit Reached', color: 'default' as const },
};

export const CAMPAIGN_STATUS = {
  active: { label: 'Active', color: 'success' as const },
  cancelled: { label: 'Cancelled', color: 'error' as const },
};

export const GSUITE_USER_STATUS = {
  pending: { label: 'Pending', color: 'default' as const },
  creating: { label: 'Creating', color: 'info' as const },
  active: { label: 'Active', color: 'success' as const },
  suspended: { label: 'Suspended', color: 'warning' as const },
  deleted: { label: 'Deleted', color: 'default' as const },
  failed: { label: 'Failed', color: 'error' as const },
};

export const AUTH_TYPES = {
  gmail: 'Gmail OAuth',
  smtp: 'SMTP',
  gmail_jwt: 'Gmail JWT',
};

export const DRAWER_WIDTH = 260;
