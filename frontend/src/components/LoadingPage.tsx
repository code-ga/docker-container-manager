import React from "react";
import "./LoadingPage.css";

const LoadingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200">
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-24 h-24 border-8 border-pink-400 border-dashed rounded-full animate-spin-anime"></div>
        <div className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-pink-400 via-purple-400 to-indigo-400 shadow-anime animate-bounce-anime"></div>
      </div>
      <h2 className="text-2xl text-indigo-700 font-anime animate-pulse">Loading...</h2>
    </div>
  );
};

// Add these to your global CSS (e.g., index.css or tailwind.config.js):


export default LoadingPage;
