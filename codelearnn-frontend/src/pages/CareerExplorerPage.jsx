import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faSpinner,
  faChevronDown,
  faArrowLeft,
  faBriefcase,
  faMapMarkerAlt,
  faExternalLinkAlt,
  faDollarSign,
  faLightbulb,
  faChartLine,
  faTerminal,
  faMicrochip,
  faRocket,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";

// API
import { careerAPI } from "../services/api";

// Components
import StartJourneyModal from "../components/StartJourneyModal";

// Context
import { useCareerJourney } from "../context/CareerJourneyContext";

/**
 * CareerExplorerPage - Premium Developer Theme
 * "Command Center" for career initialization
 */
const CareerExplorerPage = () => {
  const { journey, hasActiveJourney } = useCareerJourney();

  // Data states
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("India");
  const [analysisData, setAnalysisData] = useState(null);

  // Accordion expand states (Sets allow multiple simultaneous expansions)
  const [expandedCats, setExpandedCats] = useState(new Set());
  const [expandedDoms, setExpandedDoms] = useState(new Set());
  const [expandedRoles, setExpandedRoles] = useState(new Set());

  // Cached API responses keyed by id/name
  const [domainCache, setDomainCache] = useState({});
  const [roleCache, setRoleCache] = useState({});

  // Per-item loading indicators
  const [loadingDoms, setLoadingDoms] = useState(new Set());
  const [loadingRoles, setLoadingRoles] = useState(new Set());

  // Trending domains for dashboard view
  const [trendingDomains, setTrendingDomains] = useState(null);
  const [loadingTrending, setLoadingTrending] = useState(true);

  // Loading states
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  // Journey modal state
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState(null);

  // Load dashboard data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingTrending(true);
      try {
        const [trendingRes, popularRes] = await Promise.all([
          careerAPI.getTrending().catch(() => ({ data: { data: null } })),
          careerAPI.getPopular(12).catch(() => ({ data: { data: [] } })),
        ]);

        setTrendingDomains({
          ...trendingRes.data.data,
          popularSearches: popularRes.data.data || [],
        });
      } catch (err) {
        console.error("Failed to load system data:", err);
      } finally {
        setLoadingTrending(false);
      }
    };
    loadData();
  }, []);

  // Location options
  const locationOptions = [
    { value: "India", label: "🇮🇳 IN" },
    { value: "United States", label: "🇺🇸 US" },
    { value: "Remote", label: "🌐 Remote" },
    { value: "", label: "🌍 Global" },
  ];

  // Handle keyword search
  const handleSearch = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!keyword.trim() || keyword.trim().length < 2) {
        setError("Input error: Minimum 2 characters required");
        return;
      }

      setLoading(true);
      setError(null);
      setAnalysisData(null);
      setExpandedCats(new Set());
      setExpandedDoms(new Set());
      setExpandedRoles(new Set());
      setDomainCache({});
      setRoleCache({});

      try {
        const response = await careerAPI.exploreKeyword(
          keyword.trim(),
          location,
        );
        setAnalysisData(response.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "System Error: Failed to analyze keyword.",
        );
        console.error("Analysis error:", err);
      } finally {
        setLoading(false);
      }
    },
    [keyword, location],
  );

  // ──────────── Accordion toggles ────────────

  const toggleCategory = (catKey) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(catKey) ? next.delete(catKey) : next.add(catKey);
      return next;
    });
  };

  const toggleDomain = async (domain, parentCatName) => {
    const key = domain.id || domain.name;
    setExpandedDoms((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    // Fetch domain details if not cached
    if (!domainCache[key]) {
      setLoadingDoms((prev) => new Set(prev).add(key));
      try {
        const response = await careerAPI.getDomainDetails(domain.name, keyword);
        setDomainCache((prev) => ({ ...prev, [key]: response.data.data }));
      } catch (err) {
        console.error("Domain fetch error:", err);
      } finally {
        setLoadingDoms((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    }
  };

  const toggleRole = async (role, contextDomainName) => {
    const key = role.title;
    setExpandedRoles((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    // Fetch role details if not cached
    if (!roleCache[key]) {
      setLoadingRoles((prev) => new Set(prev).add(key));
      try {
        const response = await careerAPI.getJobRoleDetails(role.title, contextDomainName);
        setRoleCache((prev) => ({ ...prev, [key]: response.data.data }));
      } catch (err) {
        console.error("Role details fetch error:", err);
      } finally {
        setLoadingRoles((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    }
  };

  const handleReset = () => {
    setAnalysisData(null);
    setExpandedCats(new Set());
    setExpandedDoms(new Set());
    setExpandedRoles(new Set());
    setDomainCache({});
    setRoleCache({});
    setKeyword("");
  };

  return (
    <main className="min-h-screen pt-28 pb-16 bg-bg-base relative overflow-hidden text-text-main">
      <div className="absolute inset-0 pointer-events-none bg-tech-career opacity-60 z-0"></div>

      {/* Command Center Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 border border-primary/20 mb-6 font-mono text-xs text-primary">
            <FontAwesomeIcon icon={faTerminal} className="text-[10px]" />
            <span>SYSTEM_READY</span>
          </div>

          <h1 className="text-h1 md:text-6xl font-heading font-bold text-text-main mb-6 leading-tight">
            Initialize{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-glow">
              Career Protocol
            </span>
          </h1>

          <p className="text-text-muted text-lg max-w-2xl mx-auto mb-10 font-light">
            Input any skill or field. System will compile optimal career paths, salary
            metrics, and required dependencies — tech, business, design, or beyond.
          </p>

          {/* Command Palette Input */}
          <motion.form
            onSubmit={handleSearch}
            className={`relative max-w-2xl mx-auto transition-all duration-300 ${isFocused ? "scale-105" : ""}`}
          >
            <div
              className={`
              flex items-center p-1 rounded-xl bg-bg-surface border transition-all duration-300
              ${isFocused ? "border-primary shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-primary" : "border-border shadow-xl"}
            `}
            >
              <div className="pl-4 pr-3 text-text-dim">
                <FontAwesomeIcon icon={faSearch} />
              </div>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="> Enter any skill or field (e.g., Marketing, Python, Design, Finance)..."
                className="flex-1 bg-transparent border-none text-text-main font-mono placeholder:text-text-dim focus:ring-0 py-4 text-lg"
              />

              <div className="border-l border-border pl-3 pr-2">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-transparent border-none text-text-muted font-mono text-sm focus:ring-0 cursor-pointer hover:text-text-main transition-colors"
                >
                  {locationOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ml-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-bg-base font-mono text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
              >
                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "RUN"}
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-xs font-mono mt-2 text-left animate-pulse">
                ! Error: {error}
              </p>
            )}
          </motion.form>
        </motion.div>
      </section>

      {/* Quick Nav — Career Hub sub-pages */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide justify-center">
          {[
            { to: '/my-career-journey', label: '📍 My Journey', show: hasActiveJourney },
            { to: '/learning-paths', label: '📚 Learning Paths', show: true },
            { to: '/analytics', label: '📊 Analytics', show: true },
            { to: '/certificates', label: '🎓 Certificates', show: true },
          ].filter(l => l.show).map(link => (
            <Link key={link.to} to={link.to}
              className="px-4 py-2 rounded-lg text-sm whitespace-nowrap bg-bg-surface text-text-muted border border-border hover:border-primary/30 hover:text-primary transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Main Content Area */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 mt-8 pb-20">
        <AnimatePresence mode="wait">
          {/* Loading State */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="font-mono text-primary mb-4 animate-pulse">
                {`> Analyzing "${keyword}"...`}
              </div>
              <div className="w-64 h-2 bg-bg-elevated rounded-full mx-auto overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="mt-4 text-xs text-text-muted font-mono">
                [Fetching market data]... [Parsing job roles]... [Compiling
                roadmap]
              </div>
            </motion.div>
          )}

          {/* Analysis Results — Expandable Accordion */}
          {!loading && analysisData && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              {/* Back to Dashboard */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors font-mono text-xs group"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span>BACK_TO_DASHBOARD</span>
                </button>
              </div>

              {/* Root keyword header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-bg-surface border border-primary/30 rounded-xl">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <FontAwesomeIcon icon={faLayerGroup} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-mono text-primary">TARGET_PROTOCOL</div>
                    <div className="text-xl font-bold text-text-main">{keyword}</div>
                  </div>
                  <div className="pl-4 border-l border-border text-right">
                    <div className="text-[10px] font-mono text-text-dim">DOMAINS</div>
                    <div className="text-lg font-mono text-text-main">{analysisData.analysis?.totalDomainsFound || 0}</div>
                  </div>
                </div>
                {analysisData.analysis?.summary && (
                  <p className="text-sm text-text-muted font-mono mt-3 max-w-2xl mx-auto leading-relaxed">
                    {`// ${analysisData.analysis.summary}`}
                  </p>
                )}
              </div>

              {/* ── Categories Grid — All cards always visible ── */}
              <div className="text-center mb-6">
                <span className="px-3 py-1 bg-bg-elevated rounded border border-border text-xs font-mono text-text-muted">
                  AVAILABLE_PATHS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisData.analysis?.categories?.map((category, idx) => {
                  const catKey = category.id || idx;
                  const isCatExpanded = expandedCats.has(catKey);

                  return (
                    <motion.div
                      key={catKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="flex flex-col"
                    >
                      {/* Category card */}
                      <button
                        onClick={() => toggleCategory(catKey)}
                        className={`p-5 rounded-xl border text-left transition-all group relative overflow-hidden ${
                          isCatExpanded
                            ? "bg-bg-elevated border-primary shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                            : "bg-bg-surface border-border hover:border-primary/50 hover:bg-bg-elevated"
                        }`}
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-3xl">{category.icon}</span>
                            <FontAwesomeIcon
                              icon={faChevronDown}
                              className={`text-xs transition-all duration-300 ${
                                isCatExpanded ? "rotate-180 text-primary" : "text-text-dim group-hover:text-primary"
                              }`}
                            />
                          </div>
                          <h3 className={`font-bold transition-colors mb-1 ${isCatExpanded ? "text-primary" : "text-text-main group-hover:text-primary"}`}>
                            {category.name}
                          </h3>
                          <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
                            <span>
                              <FontAwesomeIcon icon={faBriefcase} className="mr-1" />
                              {category.jobCount?.toLocaleString()}+ jobs
                            </span>
                            <span className="text-text-dim">·</span>
                            <span>{category.domains?.length || 0} domains</span>
                          </div>
                        </div>
                      </button>

                      {/* Expanded domains — slide down below the card */}
                      <AnimatePresence>
                        {isCatExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 space-y-2">
                              {category.domains?.map((domain, dIdx) => {
                                const domKey = domain.id || domain.name;
                                const isDomExpanded = expandedDoms.has(domKey);
                                const isDomLoading = loadingDoms.has(domKey);
                                const details = domainCache[domKey];

                                return (
                                  <div key={dIdx} className="rounded-lg border border-border bg-bg-surface overflow-hidden">
                                    {/* Domain button */}
                                    <button
                                      onClick={() => toggleDomain(domain, category.name)}
                                      className={`w-full p-3 text-left flex items-center justify-between transition-colors ${
                                        isDomExpanded ? "bg-bg-elevated" : "hover:bg-bg-elevated"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faLightbulb} className="text-secondary text-xs" />
                                        <span className={`text-sm font-medium ${isDomExpanded ? "text-secondary" : "text-text-main"}`}>
                                          {domain.name}
                                        </span>
                                      </div>
                                      <FontAwesomeIcon
                                        icon={faChevronDown}
                                        className={`text-[10px] transition-transform duration-300 ${
                                          isDomExpanded ? "rotate-180 text-secondary" : "text-text-dim"
                                        }`}
                                      />
                                    </button>

                                    {/* Expanded domain details */}
                                    <AnimatePresence>
                                      {isDomExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.25 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                                            {/* Generate Learning Plan CTA */}
                                            <Link
                                              to={`/career/learning-plan/${encodeURIComponent(domain.name)}`}
                                              className="flex items-center justify-center gap-2 w-full py-2.5 bg-secondary/10 hover:bg-secondary/20 text-secondary font-bold text-xs rounded-lg transition-all border border-secondary/20 hover:border-secondary/40"
                                            >
                                              <FontAwesomeIcon icon={faChartLine} />
                                              AI Learning Plan → {domain.name}
                                            </Link>

                                            {isDomLoading ? (
                                              <div className="text-center py-4">
                                                <FontAwesomeIcon icon={faSpinner} spin className="text-secondary text-sm" />
                                                <p className="text-[10px] text-text-muted font-mono mt-1">Loading...</p>
                                              </div>
                                            ) : (
                                              <>
                                                <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider pt-1">Job Roles</div>
                                                {(details?.domain?.jobRoles || domain.relatedJobTitles?.map((t) => ({ title: t })))
                                                  ?.slice(0, 6)
                                                  .map((role, rIdx) => {
                                                    const roleKey = role.title;
                                                    const isRoleExpanded = expandedRoles.has(roleKey);
                                                    const isRoleLoading = loadingRoles.has(roleKey);
                                                    const roleData = roleCache[roleKey];

                                                    return (
                                                      <div key={rIdx} className="rounded-md border border-border overflow-hidden">
                                                        {/* Role button */}
                                                        <button
                                                          onClick={() => toggleRole(role, domain.name)}
                                                          className={`w-full p-2.5 text-left flex items-center justify-between transition-colors text-xs ${
                                                            isRoleExpanded ? "bg-bg-elevated" : "bg-bg-surface hover:bg-bg-elevated"
                                                          }`}
                                                        >
                                                          <div className="flex items-center gap-2">
                                                            <span className="text-accent font-mono">›</span>
                                                            <span className={`font-medium ${isRoleExpanded ? "text-accent" : "text-text-main"}`}>
                                                              {role.title}
                                                            </span>
                                                            {role.experienceLevel && (
                                                              <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-accent/10 text-accent border border-accent/20">
                                                                {role.experienceLevel}
                                                              </span>
                                                            )}
                                                          </div>
                                                          <FontAwesomeIcon
                                                            icon={faChevronDown}
                                                            className={`text-[9px] transition-transform duration-300 ${
                                                              isRoleExpanded ? "rotate-180 text-accent" : "text-text-dim"
                                                            }`}
                                                          />
                                                        </button>

                                                        {/* Expanded role detail */}
                                                        <AnimatePresence>
                                                          {isRoleExpanded && (
                                                            <motion.div
                                                              initial={{ height: 0, opacity: 0 }}
                                                              animate={{ height: "auto", opacity: 1 }}
                                                              exit={{ height: 0, opacity: 0 }}
                                                              transition={{ duration: 0.2 }}
                                                              className="overflow-hidden"
                                                            >
                                                              <div className="px-2.5 pb-2.5 border-t border-border pt-2 space-y-2">
                                                                {isRoleLoading ? (
                                                                  <div className="text-center py-3">
                                                                    <FontAwesomeIcon icon={faSpinner} spin className="text-accent text-sm" />
                                                                    <p className="text-[10px] text-text-muted font-mono mt-1">Fetching...</p>
                                                                  </div>
                                                                ) : (
                                                                  <>
                                                                    {/* Salary */}
                                                                    {roleData?.role?.salaryInsights && (
                                                                      <div className="flex items-center gap-2 text-primary text-xs font-mono p-2 bg-primary/10 rounded-md border border-primary/30">
                                                                        <FontAwesomeIcon icon={faDollarSign} />
                                                                        <span>
                                                                          ${roleData.role.salaryInsights.entry?.min?.toLocaleString()} - ${roleData.role.salaryInsights.senior?.max?.toLocaleString()}
                                                                        </span>
                                                                      </div>
                                                                    )}

                                                                    {/* Learning Plan */}
                                                                    <Link
                                                                      to={`/career/learning-plan/${encodeURIComponent(role.title)}`}
                                                                      className="flex items-center justify-center gap-2 w-full py-2 bg-primary hover:bg-primary/90 text-bg-base font-bold text-xs rounded-md transition-all shadow-md shadow-primary/20"
                                                                    >
                                                                      <FontAwesomeIcon icon={faRocket} />
                                                                      Generate Learning Plan
                                                                    </Link>

                                                                    {/* Job listings */}
                                                                    {(roleData?.jobListings || []).length > 0 && (
                                                                      <div className="space-y-1">
                                                                        <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider">Live Openings</div>
                                                                        {roleData.jobListings.slice(0, 3).map((job, jIdx) => (
                                                                          <a
                                                                            key={jIdx}
                                                                            href={job.applyUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="block p-2 bg-bg-surface rounded-md border border-border hover:border-secondary/50 transition-all text-xs group"
                                                                          >
                                                                            <div className="flex justify-between items-start">
                                                                              <div>
                                                                                <span className="text-text-main font-medium group-hover:text-secondary">
                                                                                  {job.title || role.title}
                                                                                </span>
                                                                                <p className="text-[10px] text-text-muted">{job.company?.name}</p>
                                                                              </div>
                                                                              <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[8px] text-text-dim" />
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 text-[9px] text-text-dim mt-1">
                                                                              <FontAwesomeIcon icon={faMapMarkerAlt} />
                                                                              <span>{job.location}</span>
                                                                              {job.salary && (
                                                                                <span className="text-primary font-mono">
                                                                                  {typeof job.salary === "object"
                                                                                    ? `${job.salary.min}-${job.salary.max} ${job.salary.currency || ""}`
                                                                                    : job.salary}
                                                                                </span>
                                                                              )}
                                                                            </div>
                                                                          </a>
                                                                        ))}

                                                                        {roleData?.linkedinSearchUrl && (
                                                                          <a
                                                                            href={roleData.linkedinSearchUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="block w-full py-1.5 text-center bg-[#0077b5] hover:bg-[#006396] text-white text-[10px] font-bold rounded-md transition-colors"
                                                                          >
                                                                            <FontAwesomeIcon icon={faLinkedin} className="mr-1" />
                                                                            View on LinkedIn
                                                                          </a>
                                                                        )}
                                                                      </div>
                                                                    )}

                                                                    {/* Start Journey */}
                                                                    <button
                                                                      onClick={() => {
                                                                        setSelectedCareer({ name: role.title, ...role });
                                                                        setShowJourneyModal(true);
                                                                      }}
                                                                      className="w-full py-2 bg-bg-surface hover:bg-bg-elevated border border-border hover:border-primary/40 text-text-main text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                      <FontAwesomeIcon icon={faRocket} className="text-primary" />
                                                                      Start Career Journey
                                                                    </button>
                                                                  </>
                                                                )}
                                                              </div>
                                                            </motion.div>
                                                          )}
                                                        </AnimatePresence>
                                                      </div>
                                                    );
                                                  })}
                                              </>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Dashboard (Trending + Popular) */}
          {!loading && !analysisData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded text-primary">
                    <FontAwesomeIcon icon={faChartLine} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-main">
                      Market Intelligence
                    </h2>
                    <p className="text-xs text-text-muted font-mono">
                      Live Data: 2025-2026 Cycle
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-bg-surface rounded text-xs font-mono text-text-muted flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    System Online
                  </div>
                </div>
              </div>

              {loadingTrending ? (
                <div className="text-center py-20 text-text-muted font-mono text-sm">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className="text-primary mr-3"
                  />
                  Streaming_Market_Data...
                </div>
              ) : (
                <>
                  {/* Trending Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {trendingDomains?.domains?.map((domain, idx) => (
                      <motion.div
                        key={domain.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-bg-surface hover:bg-bg-elevated border border-border hover:border-secondary/50 rounded-xl p-5 text-left transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-secondary/10 transition-colors"></div>

                        <div className="flex justify-between items-start mb-4">
                          <div className="text-3xl">{domain.icon}</div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                              domain.demandLevel === "Extreme"
                                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                : domain.demandLevel === "Very High"
                                  ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                  : "bg-secondary/10 text-secondary border border-secondary/20"
                            }`}
                          >
                            {domain.demandLevel} Demand
                          </span>
                        </div>

                        <h3
                          className="text-lg font-bold text-text-main mb-2 group-hover:text-secondary transition-colors cursor-pointer"
                          onClick={() => {
                            setKeyword(domain.name);
                            setTimeout(() => {
                              const searchBtn = document.querySelector(
                                'form button[type="submit"]',
                              );
                              searchBtn?.click();
                            }, 100);
                          }}
                        >
                          {domain.name}
                        </h3>
                        <p className="text-sm text-text-muted mb-4 line-clamp-2 leading-relaxed">
                          {domain.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-border mb-4">
                          <div className="font-mono text-xs text-text-muted">
                            <div className="text-[10px] text-text-dim mb-0.5">
                              COMPENSATION
                            </div>
                            <span className="text-text-main">
                              ${domain.avgSalaryUSD?.toLocaleString()}
                            </span>
                          </div>
                          <div className="font-mono text-xs text-right text-text-muted">
                            <div className="text-[10px] text-text-dim mb-0.5">
                              GROWTH
                            </div>
                            <span className="text-secondary">
                              +{domain.growthRate}
                            </span>
                          </div>
                        </div>

                        {/* Start Journey Button */}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCareer(domain);
                              setShowJourneyModal(true);
                            }}
                            className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-bg-base text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                          >
                            <FontAwesomeIcon icon={faRocket} />
                            Start Journey
                          </button>
                          <Link
                            to={`/career/learning-plan/${encodeURIComponent(domain.name)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="py-2.5 px-4 bg-secondary/10 hover:bg-secondary/20 text-secondary text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 border border-secondary/20 hover:border-secondary/40"
                            title="AI Learning Plan"
                          >
                            <FontAwesomeIcon icon={faChartLine} />
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Recently Explored */}
                  {trendingDomains?.popularSearches?.length > 0 && (
                    <div className="bg-bg-elevated rounded-2xl p-8 border border-border">
                      <div className="flex items-center gap-3 mb-6">
                        <FontAwesomeIcon
                          icon={faMicrochip}
                          className="text-secondary"
                        />
                        <h3 className="text-lg font-bold text-text-main">
                          Recent System Activities
                        </h3>
                        <span className="text-xs font-mono text-text-dim">
                          // Recently processed queries
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {trendingDomains.popularSearches.map((item, idx) => (
                          <motion.button
                            key={item.keyword}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => {
                              setKeyword(item.keyword);
                              setTimeout(() => {
                                const searchBtn = document.querySelector(
                                  'form button[type="submit"]',
                                );
                                searchBtn?.click();
                              }, 100);
                            }}
                            className="group flex items-center gap-3 px-4 py-2 bg-text-surface border border-border rounded-lg hover:border-secondary hover:bg-bg-surface transition-all"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-text-dim group-hover:bg-secondary transition-colors"></div>
                            <span className="text-sm font-medium text-text-muted group-hover:text-text-main capitalize">
                              {item.keyword}
                            </span>
                            <span className="text-[10px] font-mono text-text-dim bg-bg-base px-1.5 rounded group-hover:text-secondary">
                              {item.usageCount}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Start Journey Modal */}
      <StartJourneyModal
        isOpen={showJourneyModal}
        onClose={() => {
          setShowJourneyModal(false);
          setSelectedCareer(null);
        }}
        career={selectedCareer}
      />

      {/* Active Journey Banner */}
      {hasActiveJourney() && (
        <div className="fixed bottom-6 right-6 z-40">
          <Link
            to="/my-career-journey"
            className="flex items-center gap-3 px-4 py-3 bg-primary text-bg-base rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-bg-base/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faRocket} className="text-lg" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">Continue Journey</div>
              <div className="text-xs opacity-80">{journey?.career?.title}</div>
            </div>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="transform -rotate-90 group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      )}
    </main>
  );
};

export default CareerExplorerPage;
