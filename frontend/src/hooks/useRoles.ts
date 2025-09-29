import { useState, useCallback } from 'react';
import { apiEndpoints, handleApiError } from '../lib/api';

// Role type definition
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

// API response types
interface RolesListResponse {
  roles: Role[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface RoleResponse {
  role: Role;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface UseRolesReturn {
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  fetchRoles: (search?: string) => Promise<void>;
  createRole: (roleData: CreateRoleData) => Promise<Role | null>;
  updateRole: (id: string, roleData: UpdateRoleData) => Promise<Role | null>;
  deleteRole: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const useRoles = (): UseRolesReturn => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiEndpoints.roles.list();

      if (response.success && response.data) {
        let rolesData = (response.data as RolesListResponse).roles;

        // Filter roles based on search if provided
        if (search) {
          const searchLower = search.toLowerCase();
          rolesData = rolesData.filter(role =>
            role.name.toLowerCase().includes(searchLower) ||
            (role.description && role.description.toLowerCase().includes(searchLower))
          );
        }

        setRoles(rolesData);
      } else {
        setError('Failed to fetch roles');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRole = useCallback(async (roleData: CreateRoleData): Promise<Role | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiEndpoints.roles.create({
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
      });

      if (response.success && response.data) {
        const newRole = (response.data as RoleResponse).role;
        setRoles(prev => [...prev, newRole]);
        return newRole;
      } else {
        setError('Failed to create role');
        return null;
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateRole = useCallback(async (id: string, roleData: UpdateRoleData): Promise<Role | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiEndpoints.roles.update(id, {
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
      });

      if (response.success && response.data) {
        const updatedRole = (response.data as RoleResponse).role;
        setRoles(prev => prev.map(role => role.id === id ? updatedRole : role));
        return updatedRole;
      } else {
        setError('Failed to update role');
        return null;
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteRole = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiEndpoints.roles.delete(id);

      if (response.success) {
        setRoles(prev => prev.filter(role => role.id !== id));
        return true;
      } else {
        setError('Failed to delete role');
        return false;
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    isLoading,
    error,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    refetch,
  };
};