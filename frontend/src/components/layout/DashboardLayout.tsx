import { motion } from "framer-motion";
import { lazy, Suspense, useMemo } from "react";
import Navbar from "./Navbar";

// Lazy load ParticleBackground for performance
const ParticleBackground = lazy(() => import("../ParticleBackground"));

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  // Detect mobile for throttling particles
  const isMobile = useMemo(() => window.innerWidth < 768, []);
  return (
    <div
      className="relative flex flex-col font-anime shadow-anime"
      style={{
        background: "linear-gradient(135deg, #18122B 0%, #393053 100%)",
      }}
    >
      <Navbar />
      <motion.main
        className="relative flex-1 p-4"
        style={{
          width: "100%",
          margin: "0 auto",
          background: "rgba(24, 18, 43, 0.85)",
          boxShadow: "0 6px 32px 0 rgba(168,139,250,0.18)",
          padding: "2rem 2.5rem",
        }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        {children}
      </motion.main>

      {/* Particle Background - lazy loaded and throttled on mobile */}
      <Suspense fallback={null}>
        <ParticleBackground
          className="z-0"
          particleCount={isMobile ? 8 : 15}
          isMobile={isMobile}
        />
      </Suspense>
    </div>
  );
};

export default DashboardLayout;
