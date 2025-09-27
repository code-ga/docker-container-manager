import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface RoleBadgeProps {
  role: string;
  className?: string;
}

const roleColors = {
  admin: 'bg-red-500 text-white',
  moderator: 'bg-orange-500 text-white',
  user: 'bg-blue-500 text-white',
  guest: 'bg-gray-500 text-white',
  developer: 'bg-purple-500 text-white',
  support: 'bg-green-500 text-white',
};

const RoleBadge = ({ role, className }: RoleBadgeProps) => {
  const colorClass = roleColors[role.toLowerCase() as keyof typeof roleColors] || 'bg-gray-500 text-white';

  return (
    <motion.span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClass,
        className
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {role}
    </motion.span>
  );
};

export { RoleBadge };