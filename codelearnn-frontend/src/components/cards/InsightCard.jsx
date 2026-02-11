import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * InsightCard - Card for displaying analyzer insights
 *
 * @param {object} props
 * @param {object} props.icon - FontAwesome icon
 * @param {string} props.title - Card title
 * @param {string|React.ReactNode} props.content - Content (can be text or list)
 * @param {string} props.variant - 'default' | 'good' | 'ok' | 'bad'
 */
const InsightCard = ({ icon, title, content, variant = "default" }) => {
  const variantStyles = {
    default: {
      border: "border-border",
      iconBg: "bg-bg-elevated",
      iconColor: "text-text-muted",
    },
    good: {
      border: "border-emerald/30",
      iconBg: "bg-emerald/10",
      iconColor: "text-emerald",
    },
    ok: {
      border: "border-amber/30",
      iconBg: "bg-amber/10",
      iconColor: "text-amber",
    },
    bad: {
      border: "border-red/30",
      iconBg: "bg-red/10",
      iconColor: "text-red",
    },
  };

  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-5 rounded-xl bg-bg-surface border ${styles.border}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {icon && (
          <div
            className={`w-9 h-9 rounded-lg ${styles.iconBg} flex items-center justify-center`}
          >
            <FontAwesomeIcon icon={icon} className={`${styles.iconColor}`} />
          </div>
        )}
        <h4 className="font-heading font-semibold text-text-primary text-sm">
          {title}
        </h4>
      </div>

      {/* Content */}
      <div className="text-text-secondary text-sm leading-relaxed">
        {typeof content === "string" ? <p>{content}</p> : content}
      </div>
    </motion.div>
  );
};

export default InsightCard;
