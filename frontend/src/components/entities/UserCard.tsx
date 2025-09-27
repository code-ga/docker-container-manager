import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Mail, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { FormBuilder } from '../data/FormBuilder';
import type { FormField } from '../data/FormBuilder';
import { RoleBadge } from './RoleBadge';
import { cn } from '../../lib/utils';

export interface User {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserCardProps {
  user: User;
  onUpdate?: (userId: string, data: Partial<User>) => void;
  className?: string;
}

const UserCard = ({ user, onUpdate, className }: UserCardProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = async (data: Record<string, unknown>) => {
    if (onUpdate) {
      await onUpdate(user.id, data as Partial<User>);
      setIsEditModalOpen(false);
    }
  };

  const editFields: FormField[] = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter user name'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'Enter email address'
    }
  ];

  return (
    <>
      <motion.div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neon-blue/10">
              <User className="w-6 h-6 text-neon-blue" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user.name}
              </h3>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Edit className="w-4 h-4" />}
          >
            Edit
          </Button>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {user.roleIds.map((roleId) => (
              <RoleBadge key={roleId} role={roleId} />
            ))}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Created: {new Date(user.createdAt).toLocaleDateString()}
        </div>
      </motion.div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
        description="Update user information"
      >
        <FormBuilder
          fields={editFields}
          onSubmit={handleEdit}
          initialData={{
            name: user.name,
            email: user.email
          }}
          submitLabel="Update User"
        />
      </Modal>
    </>
  );
};

export { UserCard };