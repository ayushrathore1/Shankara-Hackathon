"""
FastAPI entry point for the ML Video Classifier service.
Endpoints:
  POST /classify       — Classify a video into a course
  POST /rebuild-index  — Force rebuild the course embedding index
  GET  /health         — Health check
  GET  /stats          — Index statistics
"""

import sys
import os
# Fix Windows encoding — ensure emoji print() calls don't crash on cp1252
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from config import SERVICE_HOST, SERVICE_PORT


# ─── Lifespan (startup/shutdown) ─────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the matcher (loads model + builds index) + RAG index on startup."""
    from course_matcher import get_matcher
    print("🚀 ML Classifier starting up...")
    get_matcher()  # Triggers model load + index build
    print("✅ ML Classifier ready!")

    # ─── RAG Career Index ────────────────────────────────────────
    try:
        from rag.vector_store import load_and_index_careers
        print("🧠 Loading RAG career knowledge base...")
        rag_stats = load_and_index_careers()
        print(f"✅ RAG index ready ({rag_stats['careers_indexed']} careers)")
    except Exception as e:
        print(f"⚠️  RAG index failed to load: {e}")
        print("   RAG mentor endpoints will return errors until fixed.")

    # ─── TTS (Edge-TTS) ───────────────────────────────────────────────
    try:
        from tts_service import is_ready
        if is_ready():
            print("✅ Edge-TTS ready (18 languages, 300+ voices)")
    except Exception as e:
        print(f"⚠️  Edge-TTS check failed: {e}")

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


# ─── RAG Mentor Models ───────────────────────────────────────────────

class RAGRetrieveRequest(BaseModel):
    """User query for RAG retrieval."""
    query: str
    n_results: int = 3


class RAGRetrieveResponse(BaseModel):
    """RAG retrieval result with prompt ready for Groq."""
    retrieved_careers: list[dict]
    prompt: dict  # {system, user}
    query: str


# ─── RAG Endpoints ───────────────────────────────────────────────────

@app.post("/rag/retrieve", response_model=RAGRetrieveResponse)
async def rag_retrieve(request: RAGRetrieveRequest):
    """
    Retrieve relevant careers from the vector DB and build a prompt.
    The Node.js backend calls this, then sends the prompt to Groq.
    """
    try:
        from rag.retriever import retrieve_relevant_careers
        from rag.prompt_builder import build_mentor_prompt

        # 1. Semantic search in ChromaDB
        results = retrieve_relevant_careers(request.query, request.n_results)

        # 2. Build prompt with retrieved context
        prompt = build_mentor_prompt(request.query, results["documents"])

        # 3. Format retrieved careers for the response
        retrieved = []
        for i, doc in enumerate(results["documents"]):
            retrieved.append({
                "id": results["ids"][i] if i < len(results["ids"]) else "",
                "title": results["metadatas"][i].get("title", "") if i < len(results["metadatas"]) else "",
                "distance": results["distances"][i] if i < len(results["distances"]) else 0,
                "document": doc,
            })

        return RAGRetrieveResponse(
            retrieved_careers=retrieved,
            prompt=prompt,
            query=request.query,
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"RAG retrieval failed: {str(e)}")


@app.get("/rag/health")
async def rag_health():
    """Check RAG index health and stats."""
    try:
        from rag.vector_store import get_collection_stats
        stats = get_collection_stats()
        return {"status": "healthy", "service": "rag-mentor", **stats}
    except Exception as e:
        return {"status": "unhealthy", "service": "rag-mentor", "error": str(e)}


# ─── TTS Endpoints ───────────────────────────────────────────────────

class TTSSynthesizeRequest(BaseModel):
    """Text to synthesize as speech."""
    text: str
    language: str = "en"


@app.post("/tts/synthesize")
async def tts_synthesize(request: TTSSynthesizeRequest):
    """
    Convert text to speech audio (MP3).
    Returns binary MP3 data.
    """
    try:
        from tts_service import synthesize_speech

        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text is required")

        audio_bytes = synthesize_speech(request.text, request.language)

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"}
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {str(e)}")


@app.get("/tts/health")
async def tts_health():
    """Check TTS engine health."""
    try:
        from tts_service import get_health
        return {"status": "healthy", **get_health()}
    except Exception as e:
        return {"status": "unhealthy", "service": "coqui-tts", "error": str(e)}


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
