import React, { useMemo } from 'react';

interface ParticleBackgroundProps {
  className?: string;
  particleCount?: number;
  isMobile?: boolean;
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  className = '',
  particleCount = 15,
  isMobile = false
}) => {
  // Generate particles with random properties
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2, // 2-6px
      duration: Math.random() * 10 + 10, // 10-20s
      delay: Math.random() * 5, // 0-5s delay
      color: Math.random() > 0.5 ? 'var(--neon-blue)' : 'var(--neon-purple)',
      opacity: Math.random() * 0.5 + 0.3, // 0.3-0.8
    }));
  }, [particleCount]);

  // Reduce particle count on mobile for performance
  const displayParticles = isMobile ? particles.slice(0, 8) : particles;

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {displayParticles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            '--x': particle.x,
            '--y': particle.y,
            '--size': `${particle.size}px`,
            '--duration': `${particle.duration}s`,
            '--delay': `${particle.delay}s`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default ParticleBackground;