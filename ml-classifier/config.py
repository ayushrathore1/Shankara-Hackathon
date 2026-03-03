"""
Configuration for the ML Video Classifier service.
Reads from the project's root .env file.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the project root (one level up from ml-classifier/)
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

# ─── MongoDB ──────────────────────────────────────────────────────────
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/codelearnn")
MONGODB_DB = os.getenv("MONGODB_DB", "test")

# ─── ML Model ────────────────────────────────────────────────────────
# all-MiniLM-L6-v2: Fast, 80MB, 384-dim embeddings, great for semantic similarity
MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384

# ─── Classification Thresholds ───────────────────────────────────────
# Cosine similarity thresholds for course matching decisions
HIGH_CONFIDENCE_THRESHOLD = 0.75   # Auto-assign to existing course
LOW_CONFIDENCE_THRESHOLD = 0.50    # Suggest match, flag for review
# Below LOW_CONFIDENCE_THRESHOLD → auto-create new course

# ─── Course Categories (must match Course.js enum) ───────────────────
VALID_CATEGORIES = [
    "web-dev", "java", "javascript", "data-science",
    "python", "dsa", "devops", "mobile", "c-programming", "other"
]

# ─── Service ─────────────────────────────────────────────────────────
SERVICE_HOST = "0.0.0.0"
SERVICE_PORT = 8100

# ─── Index Rebuild ───────────────────────────────────────────────────
# How often to auto-rebuild course index (seconds)
INDEX_REBUILD_INTERVAL = 3600  # 1 hour

# ─── RAG (Career Mentor) ────────────────────────────────────────────
CHROMA_PERSIST_DIR = Path(__file__).resolve().parent / "chroma_data"
RAG_COLLECTION_NAME = "careers"
RAG_N_RESULTS = 3  # Number of careers to retrieve per query
