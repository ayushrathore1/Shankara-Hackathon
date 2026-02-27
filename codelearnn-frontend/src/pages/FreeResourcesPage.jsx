import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faSpinner,
  faSortAmountDown,
  faSortAmountUp,
  faFilter,
  faRedo,
  faGem,
} from "@fortawesome/free-solid-svg-icons";

// Components
import VideoResourceCard from "../components/cards/VideoResourceCard";
import VaultTutorialCard from "../components/cards/VaultTutorialCard";
import VideoAnalyzer from "../components/forms/VideoAnalyzer";
import CategoryTabs from "../components/common/CategoryTabs";
import MedhaScore from "../components/common/MedhaScore";

// API
import { freeResourcesAPI } from "../services/api";

/**
 * FreeResourcesPage - Main page for discovering free coding resources
 * Features YouTube video analysis and curated content
 */
const FreeResourcesPage = () => {
  // State
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("codeLearnnScore");
  const [sortOrder, setSortOrder] = useState("desc");
  const [level, setLevel] = useState("");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
    hasMore: false,
  });

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await freeResourcesAPI.getCategories();
      setCategories(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  // Fetch resources
  const fetchResources = useCallback(
    async (page = 1, append = false) => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const params = {
          page,
          limit: pagination.limit,
          sortBy,
          sortOrder,
        };

        if (activeCategory !== "all") {
          params.category = activeCategory;
        }

        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        if (level) {
          params.level = level;
        }

        const response = await freeResourcesAPI.getAll(params);

        if (append) {
          setResources((prev) => [...prev, ...(response.data.data || [])]);
        } else {
          setResources(response.data.data || []);
        }

        setPagination(
          response.data.pagination || {
            page: 1,
            limit: 12,
            total: 0,
            pages: 0,
            hasMore: false,
          },
        );
      } catch (err) {
        setError("Failed to load resources. Please try again.");
        console.error("Failed to fetch resources:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeCategory, searchQuery, sortBy, sortOrder, level, pagination.limit],
  );

  // Initial load
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch resources when filters change
  useEffect(() => {
    fetchResources(1, false);
  }, [activeCategory, searchQuery, sortBy, sortOrder, level]);

  // Handle load more
  const handleLoadMore = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchResources(pagination.page + 1, true);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchResources(1, false);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  // Sort options
  const sortOptions = [
    { value: "codeLearnnScore", label: "Medha Score" },
    { value: "statistics.viewCount", label: "Views" },
    { value: "statistics.likeCount", label: "Likes" },
    { value: "createdAt", label: "Recently Added" },
  ];

  // Level options
  const levelOptions = [
    { value: "", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  return (
    <main className="bg-navy min-h-screen pt-24">
      {/* Hero Section */}
      <section className="section-padding pb-8 text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-green/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-green/5 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <p className="text-green font-mono text-sm mb-4 flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faGem} className="text-green" />
            THE VAULT
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-4">
            Curated <span className="text-gradient-accent">Tutorials</span>
          </h1>
          <p className="text-slate text-lg max-w-2xl mx-auto mb-8">
            Premium collection of AI-verified coding tutorials. Every video is
            analyzed, scored, and cached for instant access.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-12">
            <div className="text-center">
              <p className="text-3xl font-heading font-bold text-white">
                {categories.reduce((sum, cat) => sum + (cat.count || 0), 0) ||
                  "100+"}
              </p>
              <p className="text-slate text-sm font-mono">Curated Videos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-heading font-bold text-white">
                {categories.length || 8}
              </p>
              <p className="text-slate text-sm font-mono">Tech Categories</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-heading font-bold text-green">AI</p>
              <p className="text-slate text-sm font-mono">Quality Rated</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Video Analyzer Section */}
      <section className="section-padding py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="text-center mb-6">
            <h2 className="text-xl font-heading font-semibold text-white">
              Analyze Any YouTube Video
            </h2>
            <p className="text-slate text-sm mt-2">
              Paste a YouTube URL to instantly assess the quality of any coding
              tutorial
            </p>
          </div>

          <VideoAnalyzer />
        </motion.div>
      </section>

      {/* Curated Resources Section */}
      <section className="section-padding pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-white flex items-center gap-4 mb-6">
              Curated Vault
              <span className="flex-1 h-px bg-lightest-navy ml-4 hidden md:block max-w-xs" />
            </h2>

            {/* Category Tabs */}
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={(cat) => {
                setActiveCategory(cat);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              loading={loading}
            />
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-light-navy rounded-lg border border-lightest-navy">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search videos..."
                  className="w-full pl-10 pr-4 py-2 rounded bg-navy border border-lightest-navy focus:border-green text-sm font-mono"
                />
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate"
                />
              </div>
            </form>

            {/* Level Filter */}
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="text-slate text-sm" />
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="bg-navy border border-lightest-navy rounded px-3 py-2 text-sm font-mono text-light-slate focus:border-green"
              >
                {levelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-navy border border-lightest-navy rounded px-3 py-2 text-sm font-mono text-light-slate focus:border-green"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={toggleSortOrder}
                className="p-2 border border-lightest-navy rounded hover:border-green hover:text-green transition-colors"
              >
                <FontAwesomeIcon
                  icon={
                    sortOrder === "desc" ? faSortAmountDown : faSortAmountUp
                  }
                />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => fetchResources(1, false)}
              disabled={loading}
              className="p-2 border border-lightest-navy rounded hover:border-green hover:text-green transition-colors disabled:opacity-50"
            >
              <FontAwesomeIcon
                icon={faRedo}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center mb-8">
              {error}
              <button
                onClick={() => fetchResources(1, false)}
                className="ml-4 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-light-navy rounded-lg overflow-hidden animate-pulse"
                >
                  <div className="aspect-video bg-lightest-navy" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-lightest-navy rounded w-3/4" />
                    <div className="h-3 bg-lightest-navy rounded w-1/2" />
                    <div className="h-3 bg-lightest-navy rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resources Grid */}
          {!loading && resources.length > 0 && (
            <>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 },
                  },
                }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {resources.map((resource, index) => (
                  <motion.div
                    key={resource._id || index}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <VideoResourceCard resource={resource} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Load More */}
              {pagination.hasMore && (
                <div className="mt-12 text-center">
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="btn-primary"
                  >
                    {loadingMore ? (
                      <>
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="animate-spin mr-2"
                        />
                        Loading...
                      </>
                    ) : (
                      `Load More (${pagination.total - resources.length} remaining)`
                    )}
                  </motion.button>
                </div>
              )}

              {/* Pagination info */}
              <p className="text-center text-slate text-sm font-mono mt-6">
                Showing {resources.length} of {pagination.total} resources
              </p>
            </>
          )}

          {/* Empty State */}
          {!loading && resources.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-light-navy rounded-full flex items-center justify-center">
                <span className="text-4xl">📚</span>
              </div>
              <h3 className="text-white font-heading font-semibold text-xl mb-2">
                No resources found
              </h3>
              <p className="text-slate mb-6">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "No curated resources available yet for this category"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="btn-primary"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="section-padding bg-light-navy/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-2xl font-heading font-bold text-white text-center mb-12">
            How <span className="text-green">Medha Score</span> Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: "📊",
                title: "Fetch Data",
                description:
                  "We gather video metrics from YouTube: views, likes, comments, and more",
              },
              {
                icon: "🤖",
                title: "AI Analysis",
                description:
                  "Our AI evaluates content quality, teaching clarity, and viewer feedback",
              },
              {
                icon: "⭐",
                title: "Score Calculation",
                description:
                  "Multiple factors combine into a single 0-100 quality score",
              },
              {
                icon: "✅",
                title: "Curated Results",
                description:
                  "Only the best videos make it to our curated collection",
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-slate text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  );
};

export default FreeResourcesPage;
