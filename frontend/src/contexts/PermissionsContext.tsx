import React, { createContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useSession } from '../lib/auth';
import { apiEndpoints, handleApiError } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  postIds: string[];
  roleIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface RoleWithPermissions {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface PermissionsContextType {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isLoading: boolean;
  userRoles: string[];
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

interface PermissionsProviderProps {
  children: ReactNode;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ children }) => {
  const { data: session } = useSession();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rolesWithPermissions, setRolesWithPermissions] = useState<RoleWithPermissions[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // Fetch current user with roles when session is available
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (session?.user) {
        try {
          const response = await apiEndpoints.users.me();
          if (response.success && response.data && typeof response.data === 'object' && 'user' in response.data) {
            setCurrentUser(response.data.user as User);
          } else {
            // Fallback to session data if API call fails
            setCurrentUser({
              id: session.user.id,
              name: session.user.name || '',
              email: session.user.email || '',
              emailVerified: session.user.emailVerified || false,
              image: session.user.image || null,
              postIds: [],
              roleIds: (session.user as { roleIds?: string[] }).roleIds || [],
              createdAt: session.user.createdAt?.toISOString() || new Date().toISOString(),
              updatedAt: session.user.updatedAt?.toISOString() || new Date().toISOString(),
            });
          }
        } catch {
          // Fallback to session data if API call fails
          setCurrentUser({
            id: session.user.id,
            name: session.user.name || '',
            email: session.user.email || '',
            emailVerified: session.user.emailVerified || false,
            image: session.user.image || null,
            postIds: [],
            roleIds: (session.user as { roleIds?: string[] }).roleIds || [],
            createdAt: session.user.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: session.user.updatedAt?.toISOString() || new Date().toISOString(),
          });
        }
      } else {
        setCurrentUser(null);
      }
    };

    fetchCurrentUser();
  }, [session]);

  // Fetch roles with permissions
  const fetchRolesWithPermissions = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const response = await apiEndpoints.roles.listWithPermissions();
      if (response.success && response.data) {
        setRolesWithPermissions((response.data as { roles: RoleWithPermissions[] }).roles);
      }
    } catch (error) {
      console.error('Failed to fetch roles with permissions:', handleApiError(error));
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  // Fetch roles with permissions on mount
  useEffect(() => {
    fetchRolesWithPermissions();
  }, [fetchRolesWithPermissions]);

  // Get user roles
  const userRoles = currentUser?.roleIds || [];

  // Map roles to permissions using API data
  const getPermissionsFromRoles = useCallback((roleIds: string[]): string[] => {
    const permissions: string[] = [];

    // Default permissions for all authenticated users
    permissions.push('dashboard:read');

    // Find roles by IDs and collect their permissions
    roleIds.forEach(roleId => {
      const role = rolesWithPermissions.find(r => r.id === roleId);
      if (role) {
        permissions.push(...role.permissions);
      }
    });

    // Remove duplicates
    return [...new Set(permissions)];
  }, [rolesWithPermissions]);

  const userPermissions = getPermissionsFromRoles(userRoles);
  console.log('User Permissions:', userPermissions);

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;

    // Check for exact permission match
    if (userPermissions.includes(permission)) {
      return true;
    }

    // Check for wildcard permissions (e.g., 'container:*' matches 'container:read')
    const permissionParts = permission.split(':');
    if (permissionParts.length === 2) {
      const wildcardPermission = `${permissionParts[0]}:*`;
      return userPermissions.includes(wildcardPermission);
    }

    return false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const isLoading = !session || isLoadingRoles;

  const value: PermissionsContextType = {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
    userRoles,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export default PermissionsContext;