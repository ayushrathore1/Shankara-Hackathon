import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlay,
  faStar,
  faSpinner,
  faCheckCircle,
  faTag,
  faChevronRight,
  faChevronLeft,
  faList,
} from "@fortawesome/free-solid-svg-icons";
import { freeResourcesAPI } from "../services/api";

const CoursePage = () => {
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLectureIndex, setCurrentLectureIndex] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const playerRef = useRef(null);

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const response = await freeResourcesAPI.getCourseBySlug(slug);
        if (response.data.success) {
          setCourse(response.data.data.course);
          setLectures(response.data.data.lectures || []);
        }
      } catch (err) {
        console.error("Failed to fetch course:", err);
        setError("Failed to load course. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [slug]);

  // Scroll to player when changing lectures
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentLectureIndex]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const currentLecture = lectures[currentLectureIndex];
  const hasNext = currentLectureIndex < lectures.length - 1;
  const hasPrev = currentLectureIndex > 0;

  const goToNext = () => {
    if (hasNext) {
      setCurrentLectureIndex((prev) => prev + 1);
    }
  };

  const goToPrev = () => {
    if (hasPrev) {
      setCurrentLectureIndex((prev) => prev - 1);
    }
  };

  const selectLecture = (index) => {
    setCurrentLectureIndex(index);
  };

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  // Get C relation badge
  const getCRelationBadge = (relation) => {
    if (relation === "specifically-for-c") {
      return (
        <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium">
          ⚡ For C
        </span>
      );
    }
    if (relation === "related-to-c") {
      return (
        <span className="px-2 py-0.5 bg-secondary/20 text-secondary text-xs rounded-full font-medium">
          🔗 Related
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base">
        <div className="container mx-auto max-w-7xl text-center py-24">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-4xl text-primary animate-spin mb-4"
          />
          <p className="text-text-muted font-mono">Loading course...</p>
        </div>
      </main>
    );
  }

  if (error || !course) {
    return (
      <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base">
        <div className="container mx-auto max-w-7xl text-center py-24">
          <p className="text-red-400 mb-4">{error || "Course not found"}</p>
          <Link to="/vault" className="text-primary hover:underline">
            ← Back to Vault
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-20 pb-8 bg-bg-base">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header Bar */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="flex items-center justify-between mb-4"
        >
          <Link
            to="/vault"
            className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-sm"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Vault</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full font-medium">
              {course.provider}
            </span>
            {course.averageScore > 0 && (
              <span
                className={`text-sm font-bold ${getScoreColor(course.averageScore)}`}
              >
                <FontAwesomeIcon
                  icon={faStar}
                  className="mr-1 text-yellow-400"
                />
                {course.averageScore}/100
              </span>
            )}
          </div>
        </motion.div>

        {/* Course Title */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-h3 text-text-main mb-6"
        >
          {course.name}
        </motion.h1>

        {/* Main Layout: Video Player + Playlist */}
        <div className="flex flex-col lg:flex-row gap-4" ref={playerRef}>
          {/* Video Player Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className={`${showPlaylist ? "lg:w-2/3" : "w-full"} transition-all duration-300`}
          >
            {currentLecture && (
              <>
                {/* Video Embed */}
                <div className="relative aspect-video bg-bg-elevated rounded-2xl overflow-hidden border border-border shadow-2xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${currentLecture.youtubeId}?rel=0&modestbranding=1&autoplay=0`}
                    title={currentLecture.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {/* Video Controls */}
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={goToPrev}
                    disabled={!hasPrev}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      hasPrev
                        ? "bg-bg-surface border border-border text-text-main hover:border-primary/50"
                        : "bg-bg-elevated text-text-dim cursor-not-allowed"
                    }`}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-text-dim text-sm font-mono">
                      {currentLectureIndex + 1} / {lectures.length}
                    </span>
                    <button
                      onClick={() => setShowPlaylist(!showPlaylist)}
                      className="p-2 rounded-lg bg-bg-surface border border-border text-text-muted hover:text-primary transition-colors lg:hidden"
                    >
                      <FontAwesomeIcon icon={faList} />
                    </button>
                  </div>

                  <button
                    onClick={goToNext}
                    disabled={!hasNext}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      hasNext
                        ? "bg-primary text-white hover:bg-primary/80"
                        : "bg-bg-elevated text-text-dim cursor-not-allowed"
                    }`}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>

                {/* Current Video Info */}
                <div className="mt-6 bg-bg-surface border border-border rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-text-dim text-sm font-mono">
                          {currentLecture.lectureNumber ||
                            `Lecture ${currentLectureIndex + 1}`}
                        </span>
                        {getCRelationBadge(currentLecture.cRelation)}
                        {currentLecture.codeLearnnScore > 0 && (
                          <span
                            className={`text-sm font-bold ${getScoreColor(currentLecture.codeLearnnScore)}`}
                          >
                            Medha: {currentLecture.codeLearnnScore}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-semibold text-text-main">
                        {currentLecture.title}
                      </h2>
                    </div>
                  </div>

                  {/* AI Summary */}
                  {currentLecture.aiAnalysis?.summary && (
                    <div className="mt-4 p-4 bg-bg-elevated rounded-lg border border-border/50">
                      <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                        <span>🤖</span> AI Analysis
                      </h3>
                      <p className="text-text-muted text-sm">
                        {currentLecture.aiAnalysis.summary}
                      </p>

                      {/* Strengths */}
                      {currentLecture.aiAnalysis?.strengths?.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-semibold text-text-dim mb-1">
                            Strengths
                          </h4>
                          <ul className="space-y-1">
                            {currentLecture.aiAnalysis.strengths
                              .slice(0, 3)
                              .map((s, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-text-muted text-xs"
                                >
                                  <FontAwesomeIcon
                                    icon={faCheckCircle}
                                    className="text-green-400 mt-0.5"
                                  />
                                  {s}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {currentLecture.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {currentLecture.tags.slice(0, 5).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-bg-elevated text-text-dim text-xs rounded-full"
                        >
                          <FontAwesomeIcon
                            icon={faTag}
                            className="mr-1 text-text-dim/50"
                          />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Up Next Preview */}
                {hasNext && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-xl cursor-pointer group"
                    onClick={goToNext}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-bg-elevated">
                        <img
                          src={lectures[currentLectureIndex + 1].thumbnail}
                          alt="Next video"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-bg-base/40">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FontAwesomeIcon
                              icon={faPlay}
                              className="text-white text-xs ml-0.5"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-primary font-semibold uppercase tracking-wider">
                          Up Next
                        </span>
                        <h4 className="text-text-main font-medium line-clamp-1 group-hover:text-primary transition-colors">
                          {lectures[currentLectureIndex + 1].title}
                        </h4>
                      </div>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-primary text-xl group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>

          {/* Playlist Sidebar */}
          {showPlaylist && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-1/3 lg:sticky lg:top-20 bg-bg-surface border border-border rounded-2xl overflow-hidden flex flex-col"
              style={{ height: "calc(100vh - 140px)", maxHeight: "700px" }}
            >
              {/* Playlist Header */}
              <div className="p-4 border-b border-border bg-bg-elevated/50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-text-main flex items-center gap-2">
                    <FontAwesomeIcon icon={faList} className="text-primary" />
                    Course Content
                  </h3>
                  <span className="text-text-dim text-sm font-mono">
                    {lectures.length} lectures
                  </span>
                </div>
              </div>

              {/* Playlist Items - scrollable with isolated scroll */}
              <div
                className="overflow-y-auto flex-1 overscroll-contain"
                style={{ scrollbarGutter: "stable" }}
              >
                {lectures.map((lecture, index) => (
                  <div
                    key={lecture._id}
                    onClick={() => selectLecture(index)}
                    className={`flex gap-3 p-3 cursor-pointer transition-all border-b border-border/50 ${
                      index === currentLectureIndex
                        ? "bg-primary/10 border-l-2 border-l-primary"
                        : "hover:bg-bg-elevated"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-28 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-bg-elevated">
                      <img
                        src={lecture.thumbnail}
                        alt={lecture.title}
                        className="w-full h-full object-cover"
                      />
                      {index === currentLectureIndex && (
                        <div className="absolute inset-0 flex items-center justify-center bg-bg-base/60">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
                            <FontAwesomeIcon
                              icon={faPlay}
                              className="text-white text-xs ml-0.5"
                            />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-bg-base/80 text-text-main text-xs rounded">
                        {lecture.duration}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-text-dim text-xs font-mono">
                          {index + 1}.
                        </span>
                        {lecture.codeLearnnScore > 0 && (
                          <span
                            className={`text-xs font-bold ${getScoreColor(lecture.codeLearnnScore)}`}
                          >
                            {lecture.codeLearnnScore}
                          </span>
                        )}
                      </div>
                      <h4
                        className={`text-sm font-medium line-clamp-2 ${
                          index === currentLectureIndex
                            ? "text-primary"
                            : "text-text-main"
                        }`}
                      >
                        {lecture.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {getCRelationBadge(lecture.cRelation)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Toggle Playlist Button for Desktop */}
        <button
          onClick={() => setShowPlaylist(!showPlaylist)}
          className="hidden lg:flex fixed right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-bg-surface border border-border text-text-muted hover:text-primary hover:border-primary/50 transition-all z-10"
        >
          <FontAwesomeIcon
            icon={showPlaylist ? faChevronRight : faChevronLeft}
          />
        </button>
      </div>
    </main>
  );
};

export default CoursePage;
