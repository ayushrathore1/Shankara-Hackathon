import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

/**
 * FeatureCard - Used on homepage for main features (Vault, Analyzer, Visualizations, Career)
 *
 * @param {object} props
 * @param {React.ReactNode} props.icon - FontAwesome icon component
 * @param {string} props.title - Feature title
 * @param {string} props.description - 2-line description
 * @param {string} props.to - Link destination
 * @param {string} props.color - Color variant: 'cyan' | 'emerald' | 'violet' | 'amber'
 */
const FeatureCard = ({ icon, title, description, to, color = "cyan" }) => {
  const colorClasses = {
    cyan: {
      iconBg: "bg-cyan/10",
      iconText: "text-cyan",
      hoverBorder: "hover:border-cyan",
      hoverGlow: "hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]",
    },
    emerald: {
      iconBg: "bg-emerald/10",
      iconText: "text-emerald",
      hoverBorder: "hover:border-emerald",
      hoverGlow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    },
    violet: {
      iconBg: "bg-violet/10",
      iconText: "text-violet",
      hoverBorder: "hover:border-violet",
      hoverGlow: "hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]",
    },
    amber: {
      iconBg: "bg-amber/10",
      iconText: "text-amber",
      hoverBorder: "hover:border-amber",
      hoverGlow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    },
  };

  const classes = colorClasses[color] || colorClasses.cyan;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link
        to={to}
        className={`
          block p-6 rounded-xl bg-bg-surface border border-border
          transition-all duration-300
          ${classes.hoverBorder} ${classes.hoverGlow}
          group
        `}
      >
        {/* Icon */}
        <div
          className={`
          w-12 h-12 rounded-lg ${classes.iconBg} 
          flex items-center justify-center mb-4
          transition-transform duration-300 group-hover:scale-110
        `}
        >
          <FontAwesomeIcon
            icon={icon}
            className={`text-xl ${classes.iconText}`}
          />
        </div>

        {/* Title */}
        <h3 className="font-heading font-semibold text-lg text-text-primary mb-2 group-hover:text-cyan transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-text-muted text-sm leading-relaxed line-clamp-2 mb-4">
          {description}
        </p>

        {/* Arrow */}
        <div className="flex items-center text-text-dim group-hover:text-cyan transition-colors">
          <span className="text-sm font-medium mr-2">Explore</span>
          <FontAwesomeIcon
            icon={faArrowRight}
            className="text-xs transition-transform duration-300 group-hover:translate-x-1"
          />
        </div>
      </Link>
    </motion.div>
  );
};

export default FeatureCard;
