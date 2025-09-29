import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { UsersTable } from '../../components/entities/UsersTable';
import { UserForm } from '../../components/entities/UserForm';
import { useUsers } from '../../hooks/useUsers';
import type { User, CreateUserData, UpdateUserData } from '../../hooks/useUsers';

const UsersPage: React.FC = () => {
  const { users, isLoading, error, fetchUsers, createUser, updateUser, deleteUser } = useUsers();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  console.log("UsersPage render: ", { users, isLoading, error });
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchUsers(query);
  };

  // Handle create user
  const handleCreateUser = async (userData: CreateUserData | UpdateUserData) => {
    const success = await createUser(userData as CreateUserData);
    if (success) {
      setShowCreateModal(false);
      // Refetch users to get updated list
      fetchUsers(searchQuery);
    }
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handle update user
  const handleUpdateUser = async (userData: CreateUserData | UpdateUserData) => {
    if (!selectedUser) return;

    const success = await updateUser(selectedUser.id, userData as UpdateUserData);
    if (success) {
      setShowEditModal(false);
      setSelectedUser(null);
      // Refetch users to get updated list
      fetchUsers(searchQuery);
    }
  };

  // Handle delete user
  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  // Confirm delete user
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    const success = await deleteUser(userToDelete);
    if (success) {
      setShowDeleteModal(false);
      setUserToDelete(null);
      // Refetch users to get updated list
      fetchUsers(searchQuery);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Users
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage user accounts and permissions
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create User
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        <UsersTable
          users={users}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          isLoading={isLoading}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        size="lg"
      >
        <UserForm
          onSave={handleCreateUser}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isLoading}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        title="Edit User"
        size="lg"
      >
        <UserForm
          user={selectedUser}
          onSave={handleUpdateUser}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          isLoading={isLoading}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
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
                setShowDeleteModal(false);
                setUserToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteUser}
              isLoading={isLoading}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;