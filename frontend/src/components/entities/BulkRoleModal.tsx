import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import type { User } from '../../hooks/useUsers';
import type { Role } from '../../hooks/useRoles';

export interface BulkRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUsers: string[];
  users: User[];
  roles: Role[];
  onConfirm: (roleId: string) => void;
  isLoading?: boolean;
}

export const BulkRoleModal: React.FC<BulkRoleModalProps> = ({
  isOpen,
  onClose,
  selectedUsers,
  users,
  roles,
  onConfirm,
  isLoading = false,
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const selectedUserObjects = users.filter(user => selectedUsers.includes(user.id));

  const handleConfirm = () => {
    if (selectedRoleId) {
      onConfirm(selectedRoleId);
    }
  };

  const handleClose = () => {
    setSelectedRoleId('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Assign Role"
      size="lg"
    >
      <div className="space-y-6">
        {/* Selected Users Summary */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Selected Users ({selectedUsers.length})
          </h3>
          <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="space-y-2">
              {selectedUserObjects.map((user) => (
                <div key={user.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {user.email}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Role to Assign
          </label>
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={isLoading}
          >
            <option value="">Choose a role...</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name} {role.description && `(${role.description})`}
              </option>
            ))}
          </select>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Warning:</strong> This action will replace the current role assignments for the selected users.
            Users will lose their existing roles and be assigned only to the selected role.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedRoleId || isLoading}
            isLoading={isLoading}
          >
            Assign Role
          </Button>
        </div>
      </div>
    </Modal>
  );
};