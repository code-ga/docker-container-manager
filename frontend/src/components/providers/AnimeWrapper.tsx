import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface AnimeWrapperProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  in: {
    opacity: 1,
    scale: 1,
  },
  out: {
    opacity: 0,
    scale: 0.95,
  },
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 20,
  duration: 0.3,
};

export const AnimeWrapper: React.FC<AnimeWrapperProps> = ({ children }) => {
  const location = useLocation();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initialize particle effects after component mounts
    setIsLoaded(true);
  }, []);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-screen"
      >
        {children}
      </motion.div>

      {/* Lazy-loaded particle effects */}
      {isLoaded && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="particle-container">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  '--delay': `${i * 0.5}s`,
                  '--duration': `${3 + Math.random() * 4}s`,
                  '--size': `${2 + Math.random() * 4}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
