import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faSpinner,
  faSearch,
  faCode,
  faGraduationCap,
  faNewspaper,
  faLightbulb,
  faTags,
  faEye,
  faHeart,
  faClock,
  faArrowRight,
  faFire,
  faBookOpen,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { blogsAPI } from "../services/api";
import CreateBlogModal from "../components/blogs/CreateBlogModal";

const categoryIcons = {
  technology: faCode,
  tutorial: faGraduationCap,
  news: faNewspaper,
  opinion: faLightbulb,
};

const categoryColors = {
  technology: "from-blue-500 to-cyan-500",
  tutorial: "from-green-500 to-emerald-500",
  news: "from-purple-500 to-pink-500",
  opinion: "from-orange-500 to-yellow-500",
};

// Premium Blog Card with enhanced animations
const BlogCard = ({ blog, index = 0 }) => {
  const categoryColor =
    categoryColors[blog.category] || "from-primary to-secondary";
  const categoryIcon = categoryIcons[blog.category] || faCode;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative"
    >
      <Link to={`/blogs/${blog.slug}`} className="block">
        {/* Glow effect on hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative bg-bg-elevated rounded-2xl border border-border overflow-hidden backdrop-blur-sm">
          {/* Cover Image */}
          <div className="aspect-video bg-bg-base relative overflow-hidden">
            {blog.coverImage ? (
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${categoryColor} opacity-20`}
              />
            )}
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-elevated via-transparent to-transparent opacity-60" />

            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r ${categoryColor} text-white shadow-lg`}
              >
                <FontAwesomeIcon icon={categoryIcon} />
                {blog.category}
              </span>
            </div>

            {/* Read time badge */}
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-bg-base/80 backdrop-blur-sm text-text-main border border-border/50">
                <FontAwesomeIcon icon={faClock} className="text-primary" />
                {blog.readTime} min read
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="font-heading font-bold text-text-main text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {blog.title}
            </h3>
            <p className="text-text-muted text-sm line-clamp-2 mb-5 leading-relaxed">
              {blog.excerpt}
            </p>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {blog.tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-bg-base/80 rounded-lg text-xs text-text-dim font-medium border border-border/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-5 border-t border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-xs font-bold text-bg-base ring-2 ring-bg-elevated">
                  {blog.author?.name?.charAt(0) || "A"}
                </div>
                <div>
                  <span className="text-text-main text-sm font-medium">
                    {blog.author?.name || "Anonymous"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-text-dim text-xs">
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faEye} className="text-secondary" />
                  {blog.views}
                </span>
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faHeart} className="text-red-400" />
                  {blog.likeCount || 0}
                </span>
              </div>
            </div>

            {/* Read more indicator */}
            <div className="mt-4 flex items-center gap-2 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span>Read article</span>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="text-xs group-hover:translate-x-1 transition-transform"
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

// Featured Blog Card (larger format for top blogs)
const FeaturedBlogCard = ({ blog }) => {
  const categoryColor =
    categoryColors[blog.category] || "from-primary to-secondary";
  const categoryIcon = categoryIcons[blog.category] || faCode;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -5 }}
      className="group relative"
    >
      <Link to={`/blogs/${blog.slug}`} className="block">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500" />

        <div className="relative grid md:grid-cols-2 gap-0 bg-bg-elevated rounded-2xl border border-border overflow-hidden">
          {/* Image */}
          <div className="aspect-video md:aspect-auto bg-bg-base relative overflow-hidden">
            {blog.coverImage ? (
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${categoryColor} opacity-30`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bg-elevated/80 hidden md:block" />

            {/* Featured badge */}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg">
                <FontAwesomeIcon icon={faFire} />
                Featured
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r ${categoryColor} text-white`}
              >
                <FontAwesomeIcon icon={categoryIcon} />
                {blog.category}
              </span>
              <span className="text-text-dim text-xs">
                {blog.readTime} min read
              </span>
            </div>

            <h2 className="font-heading font-bold text-text-main text-2xl md:text-3xl mb-4 group-hover:text-primary transition-colors">
              {blog.title}
            </h2>

            <p className="text-text-muted text-base mb-6 line-clamp-3 leading-relaxed">
              {blog.excerpt}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-sm font-bold text-bg-base">
                  {blog.author?.name?.charAt(0) || "A"}
                </div>
                <div>
                  <p className="text-text-main font-medium">
                    {blog.author?.name}
                  </p>
                  <p className="text-text-dim text-xs">
                    {new Date(blog.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-primary font-medium">
                <span>Read more</span>
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="group-hover:translate-x-2 transition-transform"
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

const BlogsPage = () => {
  const { isAuthenticated } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const categories = [
    { id: "all", label: "All Posts", icon: faTags },
    { id: "technology", label: "Technology", icon: faCode },
    { id: "tutorial", label: "Tutorials", icon: faGraduationCap },
    { id: "news", label: "News", icon: faNewspaper },
    { id: "opinion", label: "Opinion", icon: faLightbulb },
  ];

  useEffect(() => {
    fetchBlogs();
  }, [selectedCategory, pagination.page]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 12,
      };

      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await blogsAPI.getAll(params);

      if (response.data.success) {
        setBlogs(response.data.data);
        setPagination((prev) => ({
          ...prev,
          pages: response.data.pagination.pages,
          total: response.data.pagination.total,
        }));
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchBlogs();
  };

  const handleBlogCreated = () => {
    setShowCreateModal(false);
    fetchBlogs();
  };

  const featuredBlog = blogs.length > 0 ? blogs[0] : null;
  const remainingBlogs = blogs.slice(1);

  return (
    <main className="min-h-screen bg-bg-base selection:bg-primary selection:text-black">
      {/* Hero Section with premium glow effects */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Glow Effects - matching HomePage */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute top-40 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Tag */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono font-medium">
                <FontAwesomeIcon icon={faBookOpen} />
                <span className="text-metallic">Community Knowledge Hub</span>
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-heading text-5xl md:text-6xl font-bold mb-6 tracking-tight"
            >
              <span className="text-text-main">Engineering </span>
              <span className="text-gradient">Insights</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-text-muted text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Deep dives into technology, tutorials from the community, and
              insights that actually matter for your engineering career.
            </motion.p>

            {/* Search Bar - Premium Style */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search for tutorials, insights, news..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 pl-14 rounded-2xl bg-bg-elevated border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary/50 transition-all text-base"
                  />
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-5 text-text-dim group-focus-within:text-primary transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-bg-base font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/25"
                  >
                    Search
                  </button>
                </div>
              </div>
            </motion.form>

            {/* Write Blog Button */}
            {isAuthenticated && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-bg-base font-semibold text-base hover:shadow-[0_0_40px_-5px_var(--primary-glow)] transition-all"
              >
                <FontAwesomeIcon icon={faPen} />
                Share Your Knowledge
              </motion.button>
            )}

            {!isAuthenticated && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-text-dim text-sm"
              >
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>{" "}
                to write and share your own articles
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Category Tabs - Premium Style */}
      <section className="container mx-auto px-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                selectedCategory === cat.id
                  ? "bg-gradient-to-r from-primary to-secondary text-bg-base shadow-lg shadow-primary/25"
                  : "bg-bg-elevated border border-border text-text-muted hover:text-primary hover:border-primary/50 hover:bg-bg-elevated/80"
              }`}
            >
              <FontAwesomeIcon icon={cat.icon} />
              {cat.label}
            </button>
          ))}
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section className="container mx-auto px-6 mb-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-8 md:gap-16 py-6 border-y border-border/30"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-text-main">
              {pagination.total || blogs.length}
            </div>
            <div className="text-xs text-text-dim uppercase tracking-wide">
              Articles
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-main">
              {categories.length - 1}
            </div>
            <div className="text-xs text-text-dim uppercase tracking-wide">
              Categories
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">Free</div>
            <div className="text-xs text-text-dim uppercase tracking-wide">
              Forever
            </div>
          </div>
        </motion.div>
      </section>

      {/* Blogs Content */}
      <section className="container mx-auto px-6 pb-20">
        {/* Pinned Featured Guide — always visible */}
        {pagination.page === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <Link to="/learning-guides/vibe-coding" className="block group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-orange-500/20 border border-purple-500/30 p-6 md:p-8 hover:border-purple-500/50 transition-all">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="text-5xl">🚀</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black uppercase">New</span>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">Complete Guide</span>
                    </div>
                    <h3 className="font-heading font-bold text-text-main text-xl md:text-2xl mb-1 group-hover:text-primary transition-colors">
                      The Complete Vibe Coding Guide
                    </h3>
                    <p className="text-text-muted text-sm">
                      From Zero to Deployed — Build a full-stack AI web app using Antigravity, Groq, MongoDB, and more. No prior web dev experience needed.
                    </p>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="text-primary text-lg group-hover:translate-x-2 transition-transform hidden md:block" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <FontAwesomeIcon
              icon={faSpinner}
              className="text-5xl text-primary animate-spin mb-4"
            />
            <p className="text-text-muted">Loading amazing content...</p>
          </div>
        ) : blogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-bg-elevated border border-border flex items-center justify-center">
              <FontAwesomeIcon
                icon={faBookOpen}
                className="text-4xl text-text-dim"
              />
            </div>
            <p className="text-text-muted text-xl mb-4">No articles found</p>
            <p className="text-text-dim mb-6">
              Be the first to share knowledge with the community!
            </p>
            {isAuthenticated && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary px-6 py-3"
              >
                <FontAwesomeIcon icon={faPen} className="mr-2" />
                Write First Article
              </button>
            )}
          </motion.div>
        ) : (
          <>
            {/* Featured Blog */}
            {featuredBlog && pagination.page === 1 && (
              <div className="mb-12">
                <FeaturedBlogCard blog={featuredBlog} />
              </div>
            )}

            {/* Blogs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {remainingBlogs.map((blog, index) => (
                  <BlogCard key={blog._id} blog={blog} index={index} />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center gap-2 mt-16"
              >
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page }))
                      }
                      className={`w-12 h-12 rounded-xl font-medium transition-all duration-300 ${
                        pagination.page === page
                          ? "bg-gradient-to-r from-primary to-secondary text-bg-base shadow-lg shadow-primary/25"
                          : "bg-bg-elevated border border-border text-text-muted hover:border-primary hover:text-primary"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </motion.div>
            )}
          </>
        )}
      </section>

      {/* Create Blog Modal */}
      {showCreateModal && (
        <CreateBlogModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleBlogCreated}
        />
      )}
    </main>
  );
};

export default BlogsPage;
