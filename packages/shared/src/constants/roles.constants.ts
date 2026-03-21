import { Permissions, UserRole } from '../types/common.types';

export const ROLE_PERMISSIONS: Record<UserRole, Permissions> = {
  admin: {
    ponds: ['read', 'write', 'delete'],
    water_params: ['read', 'write', 'delete'],
    harvest: ['read', 'write', 'delete'],
    chemicals: ['read', 'write', 'delete'],
    expenses: ['read', 'write', 'delete', 'approve'],
    customers: ['read', 'write', 'delete'],
    leads: ['read', 'write', 'delete'],
    orders: ['read', 'write', 'delete'],
    inventory: ['read', 'write', 'delete'],
    marketing: ['read', 'write', 'delete'],
    ai: ['read', 'write'],
    reports: ['read', 'export'],
    settings: ['read', 'write'],
    users: ['read', 'write', 'delete'],
  },
  manager: {
    ponds: ['read', 'write'],
    water_params: ['read', 'write'],
    harvest: ['read', 'write'],
    chemicals: ['read', 'write'],
    expenses: ['read', 'write', 'approve'],
    customers: ['read', 'write'],
    leads: ['read', 'write'],
    orders: ['read', 'write'],
    inventory: ['read', 'write'],
    marketing: ['read', 'write'],
    ai: ['read', 'write'],
    reports: ['read', 'export'],
    settings: ['read'],
    users: ['read'],
  },
  lab_technician: {
    ponds: ['read', 'write'],
    water_params: ['read', 'write'],
    harvest: ['read', 'write'],
    chemicals: ['read', 'write'],
    inventory: ['read'],
    ai: ['read', 'write'],
    reports: ['read'],
  },
  sales_team: {
    customers: ['read', 'write'],
    leads: ['read', 'write'],
    orders: ['read', 'write'],
    inventory: ['read'],
    marketing: ['read', 'write'],
    ai: ['read'],
    reports: ['read', 'export'],
  },
};

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  lab_technician: 'Lab Technician',
  sales_team: 'Sales Team',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full system access including user management and settings',
  manager: 'Manages all operations except system settings and users',
  lab_technician: 'Access to pond data, water parameters, harvest, and chemicals',
  sales_team: 'Access to CRM, orders, marketing, and reports',
};
