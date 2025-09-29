import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';
import { RolesTable } from '../../components/entities/RolesTable';
import { RoleForm } from '../../components/entities/RoleForm';
import { useRoles } from '../../hooks/useRoles';
import type { Role, CreateRoleData, UpdateRoleData } from '../../hooks/useRoles';

const RolesPage: React.FC = () => {
  const { roles, isLoading, error, fetchRoles, createRole, updateRole, deleteRole } = useRoles();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error'; title: string; message: string }>>([]);

  // Helper function to add toast
  const addToast = (type: 'success' | 'error', title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  // Helper function to remove toast
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchRoles(query);
  };

  // Handle create role
  const handleCreateRole = async (roleData: CreateRoleData | UpdateRoleData) => {
    const success = await createRole(roleData as CreateRoleData);
    if (success) {
      setShowCreateModal(false);
      addToast('success', 'Success', 'Role created successfully');
      // Refetch roles to get updated list
      fetchRoles(searchQuery);
    } else {
      addToast('error', 'Error', 'Failed to create role');
    }
  };

  // Handle edit role
  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  // Handle update role
  const handleUpdateRole = async (roleData: CreateRoleData | UpdateRoleData) => {
    if (!selectedRole) return;

    const success = await updateRole(selectedRole.id, roleData as UpdateRoleData);
    if (success) {
      setShowEditModal(false);
      setSelectedRole(null);
      addToast('success', 'Success', 'Role updated successfully');
      // Refetch roles to get updated list
      fetchRoles(searchQuery);
    } else {
      addToast('error', 'Error', 'Failed to update role');
    }
  };

  // Handle delete role
  const handleDeleteRole = (roleId: string) => {
    setRoleToDelete(roleId);
    setShowDeleteModal(true);
  };

  // Confirm delete role
  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    const success = await deleteRole(roleToDelete);
    if (success) {
      setShowDeleteModal(false);
      setRoleToDelete(null);
      addToast('success', 'Success', 'Role deleted successfully');
      // Refetch roles to get updated list
      fetchRoles(searchQuery);
    } else {
      addToast('error', 'Error', 'Failed to delete role');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Roles
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage roles and permissions
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Role
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <Input
            placeholder="Search roles by name or description..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <RolesTable
          roles={roles}
          onEdit={handleEditRole}
          onDelete={handleDeleteRole}
          isLoading={isLoading}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed z-50 space-y-2 top-4 right-4">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={removeToast}
          />
        ))}
      </div>

      {/* Create Role Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Role"
        size="lg"
      >
        <RoleForm
          onSave={handleCreateRole}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isLoading}
        />
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRole(null);
        }}
        title="Edit Role"
        size="lg"
      >
        <RoleForm
          role={selectedRole}
          onSave={handleUpdateRole}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedRole(null);
          }}
          isLoading={isLoading}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
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
                setShowDeleteModal(false);
                setRoleToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteRole}
              isLoading={isLoading}
            >
              Delete Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RolesPage;