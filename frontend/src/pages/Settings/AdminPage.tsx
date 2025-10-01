import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Users, Shield, Settings } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { TabComponent } from '../../components/ui/TabComponent';
import { UsersTable } from '../../components/entities/UsersTable';
import { RolesTable } from '../../components/entities/RolesTable';
import { PermissionMatrix } from '../../components/entities/PermissionMatrix';
import { BulkRoleModal } from '../../components/entities/BulkRoleModal';
import { Modal } from '../../components/ui/Modal';
import { UserForm } from '../../components/entities/UserForm';
import { RoleForm } from '../../components/entities/RoleForm';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useBulkUpdateRoles } from '../../hooks/useUsers';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, useRolesWithPermissions } from '../../hooks/useRoles';
import { usePermissions } from '../../hooks/usePermissions';
import type { User, CreateUserData, UpdateUserData } from '../../hooks/useUsers';
import type { Role, CreateRoleData, UpdateRoleData } from '../../hooks/useRoles';

const AdminPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'users';

  // Users state
  const { data: usersData, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers();
  const users = usersData?.users || [];
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const bulkUpdateRoles = useBulkUpdateRoles();

  // Roles state
  const { data: rolesData, isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } = useRoles();
  const roles = rolesData?.roles || [];
  const { data: rolesWithPermissionsData } = useRolesWithPermissions();
  const rolesWithPermissions = (rolesWithPermissionsData as Role[]) || [];
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  // UI state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkRoleModal, setShowBulkRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  const { hasPermission } = usePermissions();


  // User handlers
  const handleCreateUser = async (userData: CreateUserData | UpdateUserData) => {
    try {
      await createUser.mutateAsync(userData as CreateUserData);
      setShowCreateUserModal(false);
      refetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (userData: CreateUserData | UpdateUserData) => {
    if (!selectedUser) return;

    try {
      await updateUser.mutateAsync({ id: selectedUser.id, data: userData as UpdateUserData });
      setShowEditUserModal(false);
      setSelectedUser(null);
      refetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteUserModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser.mutateAsync(userToDelete);
      setShowDeleteUserModal(false);
      setUserToDelete(null);
      refetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleBulkRoleUpdate = async (roleId: string) => {
    if (selectedUsers.length === 0 || !roleId) return;

    try {
      await bulkUpdateRoles.mutateAsync({
        userIds: selectedUsers,
        roleId: roleId,
      });
      setShowBulkRoleModal(false);
      setSelectedUsers([]);
      refetchUsers();
    } catch (error) {
      console.error('Failed to update user roles:', error);
    }
  };

  // Role handlers
  const handleCreateRole = async (roleData: CreateRoleData | UpdateRoleData) => {
    try {
      await createRole.mutateAsync(roleData as CreateRoleData);
      setShowCreateRoleModal(false);
      refetchRoles();
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setShowEditRoleModal(true);
  };

  const handleUpdateRole = async (roleData: CreateRoleData | UpdateRoleData) => {
    if (!selectedRole) return;

    try {
      await updateRole.mutateAsync({ id: selectedRole.id, data: roleData as UpdateRoleData });
      setShowEditRoleModal(false);
      setSelectedRole(null);
      refetchRoles();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDeleteRole = (roleId: string) => {
    setRoleToDelete(roleId);
    setShowDeleteRoleModal(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      await deleteRole.mutateAsync(roleToDelete);
      setShowDeleteRoleModal(false);
      setRoleToDelete(null);
      refetchRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  // Tab configuration
  const tabs = [
    {
      id: 'users',
      label: 'Users',
      content: (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                User Management
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage user accounts and roles
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {selectedUsers.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => setShowBulkRoleModal(true)}
                  leftIcon={<Users className="w-4 h-4" />}
                >
                  Bulk Assign Role ({selectedUsers.length})
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => setShowCreateUserModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create User
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow dark:bg-gray-800">
            <UsersTable
              users={users}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              isLoading={usersLoading}
              selectedUsers={selectedUsers}
              onSelectionChange={setSelectedUsers}
            />
          </div>

          {/* Error Display */}
          {usersError && (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-red-600 dark:text-red-400">{usersError.message}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'roles',
      label: 'Roles',
      content: (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Role Management
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage roles and their permissions
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowCreateRoleModal(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Role
            </Button>
          </div>

          {/* Roles Table */}
          <div className="bg-white rounded-lg shadow dark:bg-gray-800">
            <RolesTable
              roles={roles}
              onEdit={handleEditRole}
              onDelete={handleDeleteRole}
              isLoading={rolesLoading}
            />
          </div>

          {/* Permission Matrix */}
          {hasPermission('roles:manage') && (
            <div className="bg-white rounded-lg shadow dark:bg-gray-800">
              <PermissionMatrix roles={rolesWithPermissions} />
            </div>
          )}

          {/* Error Display */}
          {rolesError && (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-red-600 dark:text-red-400">{rolesError.message}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'permissions',
      label: 'Permissions',
      content: (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Permission Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Comprehensive view of all role permissions
            </p>
          </div>

          {/* Full Permission Matrix */}
          {hasPermission('roles:manage') ? (
            <div className="bg-white rounded-lg shadow dark:bg-gray-800">
              <PermissionMatrix roles={rolesWithPermissions} />
            </div>
          ) : (
            <div className="py-8 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                You don't have permission to manage role permissions.
              </p>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <Settings className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Centralized management for users, roles, and permissions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <TabComponent
        tabs={tabs}
        defaultActiveTab={activeTab}
        onTabChange={(tabId) => setSearchParams({ tab: tabId })}
        className="w-full"
      />

      {/* Bulk Role Modal */}
      <BulkRoleModal
        isOpen={showBulkRoleModal}
        onClose={() => setShowBulkRoleModal(false)}
        selectedUsers={selectedUsers}
        users={users}
        roles={roles}
        onConfirm={handleBulkRoleUpdate}
        isLoading={bulkUpdateRoles.isPending}
      />

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        title="Create New User"
        size="lg"
      >
        <UserForm
          onSave={handleCreateUser}
          onCancel={() => setShowCreateUserModal(false)}
          isLoading={createUser.isPending}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditUserModal}
        onClose={() => {
          setShowEditUserModal(false);
          setSelectedUser(null);
        }}
        title="Edit User"
        size="lg"
      >
        <UserForm
          user={selectedUser}
          onSave={handleUpdateUser}
          onCancel={() => {
            setShowEditUserModal(false);
            setSelectedUser(null);
          }}
          isLoading={updateUser.isPending}
        />
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={showDeleteUserModal}
        onClose={() => {
          setShowDeleteUserModal(false);
          setUserToDelete(null);
        }}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this user? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteUserModal(false);
                setUserToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteUser}
              isLoading={deleteUser.isPending}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Role Modal */}
      <Modal
        isOpen={showCreateRoleModal}
        onClose={() => setShowCreateRoleModal(false)}
        title="Create New Role"
        size="lg"
      >
        <RoleForm
          onSave={handleCreateRole}
          onCancel={() => setShowCreateRoleModal(false)}
          isLoading={createRole.isPending}
        />
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEditRoleModal}
        onClose={() => {
          setShowEditRoleModal(false);
          setSelectedRole(null);
        }}
        title="Edit Role"
        size="lg"
      >
        <RoleForm
          role={selectedRole}
          onSave={handleUpdateRole}
          onCancel={() => {
            setShowEditRoleModal(false);
            setSelectedRole(null);
          }}
          isLoading={updateRole.isPending}
        />
      </Modal>

      {/* Delete Role Modal */}
      <Modal
        isOpen={showDeleteRoleModal}
        onClose={() => {
          setShowDeleteRoleModal(false);
          setRoleToDelete(null);
        }}
        title="Delete Role"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this role? Users assigned to this role will lose these permissions. This action cannot be undone.
          </p>
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteRoleModal(false);
                setRoleToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteRole}
              isLoading={deleteRole.isPending}
            >
              Delete Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPage;