
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faBookOpen,
  faGraduationCap,
  faBriefcase,
  faCode,
  faDatabase,
  faMobile,
  faCloud,
  faSpinner,
  faPlay,
  faStar,
  faBolt
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import PathCard from '../components/cards/PathCard';
import { learningPathsAPI, freeResourcesAPI } from '../services/api';

const VaultPage = () => {
  const [paths, setPaths] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  const domains = [
    { id: 'all', label: 'All Domains', icon: faBookOpen },
    { id: 'frontend', label: 'Frontend', icon: faCode },
    { id: 'backend', label: 'Backend', icon: faDatabase },
    { id: 'fullstack', label: 'Full Stack', icon: faCode },
    { id: 'mobile', label: 'Mobile', icon: faMobile },
    { id: 'devops', label: 'DevOps', icon: faCloud },
    { id: 'data-science', label: 'Data Science', icon: faBriefcase },
  ];

  const levels = [
    { id: 'all', label: 'All Levels' },
    { id: 'Beginner', label: 'Beginner' },
    { id: 'Intermediate', label: 'Intermediate' },
    { id: 'Advanced', label: 'Advanced' },
  ];

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      setCoursesLoading(true);
      try {
        const response = await freeResourcesAPI.getCourses();
        setCourses(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Fetch paths from API
  useEffect(() => {
    const fetchPaths = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = {};
        if (selectedDomain !== 'all') params.domain = selectedDomain;
        if (selectedLevel !== 'all') params.level = selectedLevel;
        if (searchQuery.trim()) params.search = searchQuery.trim();
        
        const response = await learningPathsAPI.getAll(params);
        setPaths(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch learning paths:', err);
        setError('Failed to load learning paths. Please try again.');
        setPaths([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPaths();
  }, [selectedDomain, selectedLevel, searchQuery]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Transform API data to PathCard props
  const transformPath = (path) => ({
    id: path.slug || path._id,
    title: path.title,
    tags: path.tags || [],
    level: path.level,
    hours: parseInt(path.duration) || 0,
    progress: 0, // Will be populated from user progress later
    isPro: path.isPro,
    isEnrolled: false // Will be populated from user progress later
  });

  return (
    <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-glow-primary pointer-events-none z-0" />
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-mono uppercase tracking-wider mb-4">
            <FontAwesomeIcon icon={faBookOpen} className="mr-2" />
            Structured Learning
          </span>
          <h1 className="text-h1 text-text-main mb-4">Learning Vault</h1>
          <p className="text-body-lg text-text-muted max-w-2xl mx-auto">
            Discover structured learning paths that transform scattered tutorials into clear roadmaps.
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-8 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-xl blur opacity-25 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative">
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim group-hover:text-primary transition-colors" 
              />
              <input
                type="text"
                placeholder="Search paths, technologies, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-surface border border-border rounded-xl pl-14 pr-6 py-4 text-lg text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-xl"
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {/* Domain Filters */}
            <div className="flex flex-wrap justify-center gap-2 bg-bg-elevated/30 p-1.5 rounded-xl border border-border/50">
              {domains.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedDomain === domain.id
                      ? 'bg-bg-surface text-primary border border-border shadow-sm'
                      : 'text-text-muted hover:text-text-main hover:bg-bg-surface/50'
                  }`}
                >
                  <FontAwesomeIcon icon={domain.icon} className={`text-xs ${selectedDomain === domain.id ? 'text-primary' : 'text-text-dim'}`} />
                  {domain.label}
                </button>
              ))}
            </div>

            {/* Level Filter */}
            <div className="relative min-w-[180px]">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full bg-bg-surface border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-text-main appearance-none cursor-pointer hover:border-border/80 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              >
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>{level.label}</option>
                ))}
              </select>
              <FontAwesomeIcon 
                icon={faGraduationCap} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" 
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-dim">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Courses Section */}
        {!coursesLoading && courses.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.15 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <FontAwesomeIcon icon={faBolt} className="text-primary text-xl" />
              <h2 className="text-h3 text-text-main">Featured Courses</h2>
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-mono">
                {courses.length} courses
              </span>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <motion.div key={course._id} variants={fadeInUp}>
                  <Link to={`/vault/course/${course.slug}`}>
                    <div className="group relative bg-bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                      {/* Course Thumbnail */}
                      <div className="relative aspect-video bg-bg-elevated overflow-hidden">
                        {course.thumbnail ? (
                          <img 
                            src={course.thumbnail} 
                            alt={course.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faPlay} className="text-4xl text-text-dim" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-base/80 to-transparent" />
                        
                        {/* Score Badge */}
                        {course.averageScore > 0 && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-bg-base/80 backdrop-blur-sm rounded-lg border border-border">
                            <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-xs" />
                            <span className="text-sm font-bold text-text-main">{course.averageScore}</span>
                          </div>
                        )}
                        
                        {/* Provider Badge */}
                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-primary/20 backdrop-blur-sm rounded-lg border border-primary/30">
                          <span className="text-xs font-medium text-primary">{course.provider}</span>
                        </div>
                      </div>
                      
                      {/* Course Info */}
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-text-main mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {course.name}
                        </h3>
                        
                        <p className="text-text-muted text-sm mb-4 line-clamp-2">
                          {course.description || course.targetAudience}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-bg-elevated text-text-dim text-xs rounded-full">
                              {course.level || 'Beginner'}
                            </span>
                            <span className="text-text-dim text-xs">
                              {course.lectureCount || 0} lectures
                            </span>
                          </div>
                          
                          <span className="text-primary text-sm font-medium group-hover:translate-x-1 transition-transform">
                            View →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-24">
            <FontAwesomeIcon icon={faSpinner} className="text-4xl text-primary animate-spin mb-4" />
            <p className="text-text-muted font-mono">Loading learning paths...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-24">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results Count */}
        {!loading && !error && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
            className="mb-8 flex items-center justify-between"
          >
            <p className="text-text-muted text-sm font-mono">
              Showing <span className="text-primary font-bold">{paths.length}</span> learning paths
            </p>
          </motion.div>
        )}

        {/* Paths Grid */}
        {!loading && !error && paths.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05, delayChildren: 0.2 }
              }
            }}
            className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {paths.map((path) => (
              <motion.div key={path._id || path.slug} variants={fadeInUp}>
                <PathCard {...transformPath(path)} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && paths.length === 0 && courses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 rounded-full bg-bg-surface border border-border flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FontAwesomeIcon icon={faBookOpen} className="text-3xl text-text-dim" />
            </div>
            <h3 className="text-h3 text-text-main mb-2">No learning paths available</h3>
            <p className="text-text-muted max-w-md mx-auto">
              {searchQuery || selectedDomain !== 'all' || selectedLevel !== 'all'
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Learning paths will appear here once they are added to the database.'}
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default VaultPage;

