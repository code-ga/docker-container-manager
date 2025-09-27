import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    onClick
  }, ref) => {
    const baseClasses = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
       primary: 'bg-neon-blue text-black hover:bg-neon-cyan focus:ring-neon-blue shadow-neon hover:shadow-anime hover:drop-shadow-[0_0_10px_rgba(0,245,255,0.8)]',
       secondary: 'bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-500 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]',
       danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500 hover:drop-shadow-[0_0_8px_rgba(255,0,0,0.6)]'
     };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-base rounded-lg',
      lg: 'px-6 py-3 text-lg rounded-xl'
    };

    const combinedClasses = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <motion.button
        ref={ref}
        className={combinedClasses}
        disabled={disabled || isLoading}
        onClick={onClick}
        whileHover={!disabled && !isLoading ? { scale: 1.05 } : {}}
        whileTap={!disabled && !isLoading ? { scale: 0.95 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {isLoading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-4 h-4 border-2 border-current rounded-full border-t-transparent animate-spin" />
          </motion.div>
        )}
        
        <motion.span
          className={cn("flex items-center gap-2", isLoading && "invisible")}
          initial={{ opacity: 1 }}
          animate={{ opacity: isLoading ? 0 : 1 }}
        >
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </motion.span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };