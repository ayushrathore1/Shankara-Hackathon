import { motion } from "framer-motion";
import PropTypes from "prop-types";

/**
 * CategoryTabs - Horizontal scrollable category tabs
 * @param {Object} props - Component props
 */
const CategoryTabs = ({
  categories = [],
  activeCategory = "all",
  onCategoryChange,
  showCounts = true,
  loading = false,
}) => {
  // Default "All" tab
  const allTab = {
    id: "all",
    name: "All",
    icon: "🎯",
    count: categories.reduce((sum, cat) => sum + (cat.count || 0), 0),
  };

  const tabs = [allTab, ...categories];

  return (
    <div className="relative">
      {/* Gradient masks for scroll indication */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-navy to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-navy to-transparent z-10 pointer-events-none" />

      {/* Scrollable tabs container */}
      <div className="overflow-x-auto scrollbar-hide py-2 px-4 -mx-4">
        <div className="flex gap-2 min-w-max">
          {tabs.map((category) => {
            const isActive = activeCategory === category.id;

            return (
              <motion.button
                key={category.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCategoryChange?.(category.id)}
                disabled={loading}
                className={`
                  relative flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm
                  transition-all duration-200 whitespace-nowrap
                  ${
                    isActive
                      ? "bg-green text-navy font-semibold"
                      : "bg-light-navy border border-lightest-navy text-slate hover:border-green hover:text-green"
                  }
                  ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                {/* Icon */}
                <span className="text-base">{category.icon}</span>

                {/* Name */}
                <span>{category.name}</span>

                {/* Count badge */}
                {showCounts && category.count > 0 && (
                  <span
                    className={`
                      text-xs px-1.5 py-0.5 rounded
                      ${
                        isActive
                          ? "bg-navy/20 text-navy"
                          : "bg-lightest-navy text-light-slate"
                      }
                    `}
                  >
                    {category.count}
                  </span>
                )}

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg bg-green -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Optional: Average score display */}
      {activeCategory !== "all" && (
        <div className="mt-4 flex items-center gap-4">
          {categories
            .filter((c) => c.id === activeCategory)
            .map(
              (cat) =>
                cat.avgScore > 0 && (
                  <p key={cat.id} className="text-slate text-xs font-mono">
                    Average Medha Score:
                    <span className="text-green ml-1 font-semibold">
                      {cat.avgScore}
                    </span>
                  </p>
                ),
            )}
        </div>
      )}
    </div>
  );
};

CategoryTabs.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      icon: PropTypes.string,
      count: PropTypes.number,
      avgScore: PropTypes.number,
    }),
  ),
  activeCategory: PropTypes.string,
  onCategoryChange: PropTypes.func,
  showCounts: PropTypes.bool,
  loading: PropTypes.bool,
};

export default CategoryTabs;
