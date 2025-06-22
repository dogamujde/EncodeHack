'use client';

import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackWarningProps {
  message: string | null;
  onClose: () => void;
}

export const FeedbackWarning: React.FC<FeedbackWarningProps> = ({ message, onClose }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute top-5 left-1/2 -translate-x-1/2 bg-yellow-400/90 border border-yellow-500/50 text-gray-900 px-4 py-2 rounded-lg shadow-xl flex items-center space-x-3 z-50"
        >
          <AlertTriangle size={20} className="text-yellow-800" />
          <p className="font-semibold text-sm">{message}</p>
          <button 
            onClick={onClose} 
            className="text-gray-800 hover:text-black transition-colors"
            aria-label="Close warning"
          >
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 