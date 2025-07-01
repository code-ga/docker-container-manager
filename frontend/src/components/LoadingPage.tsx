import React from "react";

const LoadingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200">
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-24 h-24 border-8 border-dashed border-pink-400 rounded-full animate-spin-anime"></div>
        <div className="absolute w-12 h-12 bg-gradient-to-tr from-pink-400 via-purple-400 to-indigo-400 rounded-full shadow-anime animate-bounce-anime"></div>
      </div>
      <h2 className="text-2xl font-anime text-indigo-700 animate-pulse">Loading...</h2>
    </div>
  );
};

// Add these to your global CSS (e.g., index.css or tailwind.config.js):
// .font-anime { font-family: 'Zen Dots', 'Orbitron', cursive; }
// .shadow-anime { box-shadow: 0 4px 20px 0 rgba(168,139,250,0.3); }
// .animate-spin-anime { animation: spinAnime 1.2s linear infinite; }
// .animate-bounce-anime { animation: bounceAnime 1.2s infinite alternate; }
// @keyframes spinAnime { 100% { transform: rotate(360deg); } }
// @keyframes bounceAnime { 0% { transform: translateY(0); } 100% { transform: translateY(-18px) scale(1.08); } }

export default LoadingPage;
