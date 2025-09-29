import { useState, useCallback } from "react";
import { apiEndpoints, handleApiError } from "../lib/api";

// User type definition - matches backend schema
export interface User {
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

// API response types
interface UsersListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ValidationResponse {
  type: string;
  on: string;
  found: {
    status: number;
    message: string;
    success: boolean;
    data: UsersListResponse;
  };
}

interface UserResponse {
  user: User;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  roles: string[];
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  roles?: string[];
}

export interface UseUsersReturn {
  users: User[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  fetchUsers: (search?: string) => Promise<void>;
  createUser: (userData: CreateUserData) => Promise<User | null>;
  updateUser: (id: string, userData: UpdateUserData) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiEndpoints.users.list();

      // Handle validation wrapper structure from backend
      if (
        (response.data as ValidationResponse).type === "validation" &&
        (response.data as ValidationResponse).found?.success
      ) {
        const { users: usersData, pagination: paginationData } = (
          response.data as ValidationResponse
        ).found.data;

        // Filter users based on search if provided
        let filteredUsers = usersData;
        if (search) {
          const searchLower = search.toLowerCase();
          filteredUsers = usersData.filter(
            (user) =>
              user.name.toLowerCase().includes(searchLower) ||
              user.email.toLowerCase().includes(searchLower)
          );
        }

        setUsers(filteredUsers);
        setPagination(paginationData);
        setError(null);
        setIsLoading(false);
      } else if (response.success && response.data) {
        // Handle direct response structure (fallback)
        let usersData = (response.data as UsersListResponse).users;

        // Filter users based on search if provided
        if (search) {
          const searchLower = search.toLowerCase();
          usersData = usersData.filter(
            (user) =>
              user.name.toLowerCase().includes(searchLower) ||
              user.email.toLowerCase().includes(searchLower)
          );
        }

        setUsers(usersData);
        setPagination((response.data as UsersListResponse).pagination || null);
      } else {
        setError("Failed to fetch users");
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUser = useCallback(
    async (userData: CreateUserData): Promise<User | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiEndpoints.users.create({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          roleId: userData.roles.length > 0 ? userData.roles[0] : undefined, // Backend expects single roleId
        });

        if (response.success && response.data) {
          const newUser = (response.data as UserResponse).user;
          setUsers((prev) => [...prev, newUser]);
          return newUser;
        } else {
          setError("Failed to create user");
          return null;
        }
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateUser = useCallback(
    async (id: string, userData: UpdateUserData): Promise<User | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiEndpoints.users.update(id, {
          name: userData.name,
          email: userData.email,
          roleId:
            userData.roles && userData.roles.length > 0
              ? userData.roles[0]
              : undefined,
        });

        if (response.success && response.data) {
          const updatedUser = (response.data as UserResponse).user;
          setUsers((prev) =>
            prev.map((user) => (user.id === id ? updatedUser : user))
          );
          return updatedUser;
        } else {
          setError("Failed to update user");
          return null;
        }
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiEndpoints.users.delete(id);

      if (response.success) {
        setUsers((prev) => prev.filter((user) => user.id !== id));
        return true;
      } else {
        setError("Failed to delete user");
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
    await fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    error,
    pagination,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    refetch,
  };
};
