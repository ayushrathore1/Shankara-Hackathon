"""
Course matching and auto-creation logic.
Maintains an in-memory index of course embeddings,
connects to MongoDB for reading/writing courses.
"""

import time
import threading
from datetime import datetime

import numpy as np
from bson import ObjectId
from pymongo import MongoClient

from config import MONGODB_URI, MONGODB_DB, INDEX_REBUILD_INTERVAL, VALID_CATEGORIES
from classifier import build_course_text, classify_video, ClassificationResult
from embeddings import generate_embeddings_batch


class CourseMatcher:
    """
    Manages the course embedding index and handles course matching/creation.
    Thread-safe with periodic index rebuilding.
    """

    def __init__(self):
        self._client = MongoClient(MONGODB_URI)
        self._db = self._client[MONGODB_DB]
        self._courses_col = self._db["courses"]
        self._resources_col = self._db["freeresources"]

        # In-memory index
        self._course_index: list[dict] = []      # List of course metadata
        self._course_embeddings: np.ndarray | None = None  # (N, 384) matrix
        self._last_rebuild: float = 0
        self._lock = threading.Lock()

        # Build index on init
        self.rebuild_index()

    def rebuild_index(self) -> dict:
        """
        Rebuild the course embedding index from MongoDB.
        Returns stats about the rebuild.
        """
        print("🔄 Rebuilding course embedding index...")
        start = time.time()

        # Fetch all active courses
        courses = list(self._courses_col.find(
            {"isActive": True},
            {
                "_id": 1, "name": 1, "description": 1, "category": 1,
                "provider": 1, "tags": 1, "aiOverview": 1,
                "averageScore": 1, "lectureCount": 1,
            },
        ))

        if not courses:
            with self._lock:
                self._course_index = []
                self._course_embeddings = None
                self._last_rebuild = time.time()
            print("⚠️  No active courses found in database")
            return {"courses_indexed": 0, "time_ms": 0}

        # Generate text representations
        texts = [build_course_text(c) for c in courses]

        # Batch encode all courses
        embeddings = generate_embeddings_batch(texts)

        # Update the index atomically
        with self._lock:
            self._course_index = courses
            self._course_embeddings = embeddings
            self._last_rebuild = time.time()

        elapsed = (time.time() - start) * 1000
        print(f"✅ Indexed {len(courses)} courses in {elapsed:.0f}ms")

        return {
            "courses_indexed": len(courses),
            "time_ms": round(elapsed),
        }

    def _maybe_rebuild(self):
        """Rebuild index if it's stale."""
        if time.time() - self._last_rebuild > INDEX_REBUILD_INTERVAL:
            self.rebuild_index()

    def classify(self, video_data: dict) -> dict:
        """
        Classify a video and optionally create a new course.

        Args:
            video_data: Video analysis metadata from the Node.js backend

        Returns:
            Dict with courseId, courseName, category, isNewCourse, confidence
        """
        self._maybe_rebuild()

        with self._lock:
            course_index = self._course_index.copy()
            course_embeddings = (
                self._course_embeddings.copy()
                if self._course_embeddings is not None
                else None
            )

        # Run the classifier
        result: ClassificationResult = classify_video(
            video_data, course_index, course_embeddings
        )

        # If new course needed, auto-create it
        if result.is_new_course:
            new_course = self._create_course(video_data, result)
            result.course_id = str(new_course["_id"])
            result.course_name = new_course["name"]

            # Trigger index rebuild to include the new course
            self.rebuild_index()

        # Also create/update the FreeResource entry linked to the course
        if result.course_id:
            self._create_or_update_resource(video_data, result)

        return {
            "courseId": result.course_id,
            "courseName": result.course_name,
            "category": result.category,
            "isNewCourse": result.is_new_course,
            "confidence": round(result.confidence, 4),
            "matchDetails": self._serialize_for_json(result.match_details),
        }

    @staticmethod
    def _serialize_for_json(obj):
        """Recursively convert MongoDB ObjectId and numpy types to JSON-safe types."""
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, dict):
            return {k: CourseMatcher._serialize_for_json(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [CourseMatcher._serialize_for_json(item) for item in obj]
        return obj

    def _create_course(self, video_data: dict, result: ClassificationResult) -> dict:
        """
        Auto-create a new course in MongoDB.
        New courses are created as drafts (isActive: false) to require admin approval.
        """
        category = result.category if result.category in VALID_CATEGORIES else "other"

        # Determine level from video data
        score = video_data.get("score", 0)
        level = "beginner"
        if any(kw in (video_data.get("title", "") + " " + " ".join(video_data.get("tags", []))).lower()
               for kw in ["advanced", "expert", "senior", "architecture"]):
            level = "advanced"
        elif any(kw in (video_data.get("title", "") + " " + " ".join(video_data.get("tags", []))).lower()
                 for kw in ["intermediate", "mid-level"]):
            level = "intermediate"

        course_doc = {
            "name": result.course_name,
            "provider": video_data.get("channel", "Unknown"),
            "description": video_data.get("summary", "")[:2000],
            "thumbnail": video_data.get("thumbnail", ""),
            "category": category,
            "level": level,
            "targetAudience": video_data.get("recommendedFor", ""),
            "tags": video_data.get("tags", [])[:20],
            "lectureCount": 1,
            "totalDuration": video_data.get("duration", ""),
            "averageScore": score,
            "isActive": False,  # Draft — requires admin approval
            "isFeatured": False,
            "mlGenerated": True,
            "mlConfidence": round(result.confidence, 4),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }

        # Auto-generate slug
        slug = f"{course_doc['provider']}-{course_doc['name']}".lower()
        import re
        slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
        course_doc["slug"] = slug

        insert_result = self._courses_col.insert_one(course_doc)
        course_doc["_id"] = insert_result.inserted_id

        print(f"🆕 Auto-created course: '{course_doc['name']}' [{category}] (draft)")
        return course_doc

    def _create_or_update_resource(self, video_data: dict, result: ClassificationResult):
        """
        Create or update a FreeResource entry linked to the matched/new course.
        """
        youtube_id = video_data.get("youtubeId")
        if not youtube_id:
            return

        course_id = ObjectId(result.course_id) if result.course_id else None
        if not course_id:
            return

        # Check if resource already exists
        existing = self._resources_col.find_one({"youtubeId": youtube_id})

        if existing:
            # Update with course reference if not already set
            if not existing.get("courseId"):
                self._resources_col.update_one(
                    {"_id": existing["_id"]},
                    {
                        "$set": {
                            "courseId": course_id,
                            "updatedAt": datetime.utcnow(),
                        }
                    },
                )
                print(f"🔗 Linked existing resource '{youtube_id}' to course '{result.course_name}'")
        else:
            # We don't create the full FreeResource here — that's the Node.js backend's job.
            # The classification result (courseId) will be sent back to Node.js,
            # which will handle FreeResource creation with full evaluation data.
            pass

    def recommend(self, user_profile: dict, limit: int = 5) -> list[dict]:
        """
        Recommend courses for a user based on their profile.

        Args:
            user_profile: Dict with keys:
                - skills: list[str]        (user's current skills)
                - interests: list[str]     (topics user is interested in)
                - career: str              (career goal name)
                - completedCourseIds: list[str]  (already completed, to exclude)
            limit: Max recommendations to return

        Returns:
            List of dicts with courseId, courseName, category, confidence, reason
        """
        self._maybe_rebuild()

        with self._lock:
            course_index = self._course_index.copy()
            course_embeddings = (
                self._course_embeddings.copy()
                if self._course_embeddings is not None
                else None
            )

        if not course_index or course_embeddings is None:
            return self.get_trending(limit)

        # Build a text profile from user data
        skills = user_profile.get("skills", [])
        interests = user_profile.get("interests", [])
        career = user_profile.get("career", "")
        completed_ids = set(user_profile.get("completedCourseIds", []))

        profile_parts = []
        if career:
            profile_parts.append(f"career goal: {career}")
        if skills:
            profile_parts.append(f"skills: {', '.join(skills)}")
        if interests:
            profile_parts.append(f"interested in: {', '.join(interests)}")

        # Fallback for completely empty profile
        if not profile_parts:
            return self.get_trending(limit)

        profile_text = ". ".join(profile_parts)

        # Generate embedding for the user profile
        from embeddings import generate_embedding, compute_similarities_batch
        profile_embedding = generate_embedding(profile_text)

        # Compute similarities
        similarities = compute_similarities_batch(profile_embedding, course_embeddings)

        # Rank courses by similarity, exclude completed
        scored = []
        for i, sim in enumerate(similarities):
            course = course_index[i]
            course_id = str(course["_id"])
            if course_id in completed_ids:
                continue
            scored.append((float(sim), course))

        # Sort descending by similarity
        scored.sort(key=lambda x: x[0], reverse=True)

        # Take top N
        results = []
        for sim, course in scored[:limit]:
            reason = "Matches your skills" if skills else "Matches your career goal"
            if any(t in (course.get("tags") or []) for t in interests):
                reason = "Aligns with your interests"

            results.append({
                "courseId": str(course["_id"]),
                "courseName": course.get("name", "Unknown"),
                "category": course.get("category", "other"),
                "confidence": round(sim, 4),
                "reason": reason,
                "tags": (course.get("tags") or [])[:5],
                "level": course.get("level", "beginner"),
            })

        return results

    def get_trending(self, limit: int = 5) -> list[dict]:
        """
        Get trending/popular courses (fallback for new users or empty profiles).
        Sorted by averageScore descending.
        """
        with self._lock:
            courses = sorted(
                self._course_index,
                key=lambda c: c.get("averageScore", 0),
                reverse=True
            )[:limit]

        return [
            {
                "courseId": str(c["_id"]),
                "courseName": c.get("name", "Unknown"),
                "category": c.get("category", "other"),
                "confidence": round(c.get("averageScore", 0) / 10, 4),
                "reason": "Trending on CodeLearnn",
                "tags": (c.get("tags") or [])[:5],
                "level": c.get("level", "beginner"),
            }
            for c in courses
        ]

    def get_index_stats(self) -> dict:
        """Return stats about the current index."""
        with self._lock:
            return {
                "courses_indexed": len(self._course_index),
                "last_rebuild_ago_seconds": round(time.time() - self._last_rebuild),
                "has_embeddings": self._course_embeddings is not None,
                "categories": list(set(
                    c.get("category", "other") for c in self._course_index
                )),
            }


# ─── Singleton instance ──────────────────────────────────────────────
_matcher = None


def get_matcher() -> CourseMatcher:
    """Get or create the singleton CourseMatcher."""
    global _matcher
    if _matcher is None:
        _matcher = CourseMatcher()
    return _matcher
