export const EMPLOYEE_TYPES = ['Admin', 'Employee', 'Hr'];
export const EMPLOYEE_TYPE_MAP = {
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
  HR: 'Hr',
};
export const USER_TYPES = [...EMPLOYEE_TYPES, 'Client'];

export const USER_REF = ['Employee', 'Client'];

export const USER_TYPE_MAP = {
  EMPLOYEE: 'Employee',
  CLIENT: 'Client',
};

export enum CALENDAR_EVENT_TYPE {
  EVENT = 'EVENT',
  TASK = 'TASK',
  MEETING = 'MEETING',
  HOLIDAY = 'HOLIDAY',
  OPTIONAL_HOLIDAY = 'OPTIONAL_HOLIDAY',
}

export enum NOTIFICATION_STATUS {
  UNREAD = 'unread',
  READ = 'read',
  DISMISSED = 'dismissed',
}

export enum NOTIFICATION_PRIORITY {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}
export enum NOTIFICATION_USER_TYPE {
  ALL = 'ALL',
  SPECIFIC = 'SPECIFIC',
}

export enum LEAVE_DURATION {
  HALF_DAY_FIRST_HALF = 'HALF_DAY_FIRST_HALF',
  HALF_DAY_LAST_HALF = 'HALF_DAY_LAST_HALF',
  FULL_DAY = 'FULL_DAY',
}
export enum STATUS {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
export enum LEAVE_STATUS {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  APPLIED = 'APPLIED',
  CANCELLED = 'CANCELLED',
}
export enum ACTIVITY_STATUS {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  APPLIED = 'APPLIED',
  CANCELLED = 'CANCELLED',
  UPLOADED = 'UPLOADED',
  FORWARDED = 'FORWARDED'
}


export enum TRANSACTION_TYPE {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
  UPDATE = 'UPDATE',
}


export const TASK_PRIORITY = [
  'immediate',
  'urgent',
  'high',
  'medium',
  'normal',
  'low',
  'relax',
];
