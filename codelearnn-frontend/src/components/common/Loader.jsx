import { motion, AnimatePresence } from "framer-motion";

const Loader = ({ isLoading = true }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-bg-base flex items-center justify-center z-[9999]"
        >
          <div className="text-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8 font-heading font-bold text-4xl"
            >
              <span className="text-primary">&lt;</span>
              <span className="text-white mx-1">Medha</span>
              <span className="text-secondary">/&gt;</span>
            </motion.div>

            {/* Progress Bar Container */}
            <div className="w-64 h-1 bg-bg-elevated rounded-full overflow-hidden mx-auto relative border border-border/30">
              {/* Increasing Progress Bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse",
                  repeatDelay: 0.5,
                }}
                className="h-full bg-gradient-to-r from-primary to-secondary absolute left-0 top-0 shadow-[0_0_10px_rgba(204,255,0,0.5)]"
              />
            </div>

            {/* Status Text */}
            <motion.p
              className="text-text-dim text-xs font-mono mt-4 tracking-widest uppercase"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Initializing
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loader;
