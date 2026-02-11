import { useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faGlobe,
  faLink,
  faCopy,
  faCheck,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

/**
 * VisibilityToggle Component
 *
 * Controls for making a learning path public or private
 * Allows sharing via URL when public
 */

const VisibilityToggle = ({
  currentVisibility = "private",
  publicSlug = null,
  onToggle,
  isLoading = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);

  const isPublic = currentVisibility === "public";
  const shareUrl = publicSlug
    ? `${window.location.origin}/paths/${publicSlug}`
    : null;

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggle(isPublic ? "private" : "public");
    } finally {
      setToggling(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="visibility-toggle bg-bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon
            icon={isPublic ? faGlobe : faLock}
            className={isPublic ? "text-green-400" : "text-text-dim"}
          />
          <span className="text-sm font-medium text-text-main">
            {isPublic ? "Public" : "Private"}
          </span>
        </div>

        <button
          onClick={handleToggle}
          disabled={isLoading || toggling}
          className={`
            relative w-12 h-6 rounded-full transition-colors duration-200
            ${isPublic ? "bg-green-500" : "bg-bg-elevated border border-border"}
            ${isLoading || toggling ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <motion.div
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
            animate={{ left: isPublic ? "26px" : "4px" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
          {toggling && (
            <div className="absolute inset-0 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faSpinner}
                className="animate-spin text-xs text-text-dim"
              />
            </div>
          )}
        </button>
      </div>

      <p className="text-xs text-text-muted mb-3">
        {isPublic
          ? "Anyone with the link can view this path"
          : "Only you can see this path"}
      </p>

      {isPublic && shareUrl && (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-lg bg-bg-elevated text-xs text-text-muted truncate">
            <FontAwesomeIcon icon={faLink} className="mr-2 text-text-dim" />
            {shareUrl}
          </div>
          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors flex items-center gap-1"
          >
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
};

export default VisibilityToggle;
