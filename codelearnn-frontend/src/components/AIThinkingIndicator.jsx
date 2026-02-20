import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Live cycling AI status indicator — shows 2-3 word phrases changing in real-time.
 * Use this wherever AI/API calls cause a delay so users don't feel stuck.
 *
 * @param {string[]} messages - Array of short status phrases to cycle through
 * @param {number} interval - Milliseconds between phrase changes (default 2200)
 * @param {string} className - Optional additional className
 */
const AIThinkingIndicator = ({
  messages = [
    "Analyzing trends",
    "Gathering data",
    "Building roadmap",
    "Curating resources",
    "Mapping skills",
    "Personalizing plan",
    "Finishing touches",
  ],
  interval = 2200,
  className = "",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, interval);
    return () => clearInterval(timer);
  }, [messages.length, interval]);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Pulsing dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Cycling status text */}
      <div className="h-6 relative overflow-hidden min-w-[200px] text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-sm font-mono text-primary absolute inset-0 flex items-center justify-center"
          >
            {messages[currentIndex]}
            <span className="animate-pulse ml-0.5">...</span>
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIThinkingIndicator;
