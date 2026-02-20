"""
FastAPI entry point for the ML Video Classifier service.
Endpoints:
  POST /classify       — Classify a video into a course
  POST /rebuild-index  — Force rebuild the course embedding index
  GET  /health         — Health check
  GET  /stats          — Index statistics
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import SERVICE_HOST, SERVICE_PORT


# ─── Lifespan (startup/shutdown) ─────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the matcher (loads model + builds index) on startup."""
    from course_matcher import get_matcher
    print("🚀 ML Classifier starting up...")
    get_matcher()  # Triggers model load + index build
    print("✅ ML Classifier ready!")
    yield
    print("👋 ML Classifier shutting down")


app = FastAPI(
    title="CodeLearnn ML Video Classifier",
    description="Classifies analyzed YouTube videos into courses using semantic embeddings",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow requests from the Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request/Response Models ─────────────────────────────────────────
class ClassifyRequest(BaseModel):
    """Video analysis data sent by the Node.js backend."""
    title: str
    tags: list[str] = []
    summary: str = ""
    topics: list[str] = []
    category: str = ""
    subcategory: str = ""
    channel: str = ""
    duration: str = ""
    score: float = 0.0
    youtubeId: str = ""
    thumbnail: str = ""
    recommendedFor: str = ""


class ClassifyResponse(BaseModel):
    """Classification result returned to the Node.js backend."""
    courseId: str | None
    courseName: str | None
    category: str
    isNewCourse: bool
    confidence: float
    matchDetails: dict


class RebuildResponse(BaseModel):
    """Result of index rebuild."""
    courses_indexed: int
    time_ms: int


class StatsResponse(BaseModel):
    """Index statistics."""
    courses_indexed: int
    last_rebuild_ago_seconds: int
    has_embeddings: bool
    categories: list[str]


class RecommendRequest(BaseModel):
    """User profile for generating recommendations."""
    skills: list[str] = []
    interests: list[str] = []
    career: str = ""
    completedCourseIds: list[str] = []
    limit: int = 5


class RecommendItem(BaseModel):
    """A single recommendation entry."""
    courseId: str | None
    courseName: str
    category: str
    confidence: float
    reason: str
    tags: list[str] = []
    level: str = "beginner"


# ─── Endpoints ───────────────────────────────────────────────────────
@app.post("/classify", response_model=ClassifyResponse)
async def classify_video(request: ClassifyRequest):
    """
    Classify a video into the best matching course.
    If no good match is found, auto-creates a new course (as draft).
    """
    from course_matcher import get_matcher
    import traceback

    try:
        result = get_matcher().classify(request.model_dump())
        return ClassifyResponse(**result)
    except Exception as e:
        traceback.print_exc()
        print(f"❌ Classification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rebuild-index", response_model=RebuildResponse)
async def rebuild_index():
    """Force rebuild the course embedding index from MongoDB."""
    from course_matcher import get_matcher

    try:
        stats = get_matcher().rebuild_index()
        return RebuildResponse(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "ml-classifier"}


@app.get("/stats", response_model=StatsResponse)
async def stats():
    """Get current index statistics."""
    from course_matcher import get_matcher
    return StatsResponse(**get_matcher().get_index_stats())


@app.post("/recommend", response_model=list[RecommendItem])
async def recommend(request: RecommendRequest):
    """
    Get personalized course recommendations based on user profile.
    Falls back to trending courses for new/empty profiles.
    """
    from course_matcher import get_matcher
    try:
        results = get_matcher().recommend(
            user_profile=request.model_dump(),
            limit=request.limit,
        )
        return [RecommendItem(**r) for r in results]
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/trending", response_model=list[RecommendItem])
async def trending(limit: int = 5):
    """Get trending courses (no auth required, for new users)."""
    from course_matcher import get_matcher
    try:
        results = get_matcher().get_trending(limit)
        return [RecommendItem(**r) for r in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Main ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host=SERVICE_HOST,
        port=SERVICE_PORT,
        reload=True,
        log_level="info",
    )
