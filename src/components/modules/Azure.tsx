/**
 * Azure / M365 Module - Placeholder
 */
import React from 'react';
import { motion } from 'framer-motion';

const Azure: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex items-center justify-center bg-ninja-gray p-8"
    >
      <div className="text-center max-w-2xl">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
          <span className="text-5xl">☁️</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Azure / M365 Module</h1>
        <p className="text-gray-400">Cloud resource management (Prompt 7).</p>
      </div>
    </motion.div>
  );
};

export default Azure;
