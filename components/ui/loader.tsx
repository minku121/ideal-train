"use client";

import { motion } from "framer-motion";

type LoaderProps = {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
};

export function Loader({ size = "md", text = "Loading...", fullScreen = false }: LoaderProps) {
  const sizeClasses = {
    sm: "h-6 w-6 border-2",
    md: "h-10 w-10 border-2",
    lg: "h-16 w-16 border-3",
  };

  const spinnerClass = `animate-spin rounded-full ${sizeClasses[size]} border-t-blue-600 border-blue-200`;
  
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={spinnerClass}></div>
      {text && <p className="text-gray-600 dark:text-gray-300 font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex justify-center items-center py-10"
    >
      {content}
    </motion.div>
  );
}
