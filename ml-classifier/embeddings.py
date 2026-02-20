"""
Text embedding generation using sentence-transformers.
Uses all-MiniLM-L6-v2 for fast, CPU-friendly 384-dim embeddings.
"""

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity as sk_cosine_similarity

from config import MODEL_NAME, EMBEDDING_DIM

# ─── Lazy-loaded singleton model ─────────────────────────────────────
_model = None


def _get_model() -> SentenceTransformer:
    """Load the sentence-transformer model (downloads on first use, ~80MB)."""
    global _model
    if _model is None:
        print(f"⏳ Loading embedding model: {MODEL_NAME} ...")
        _model = SentenceTransformer(MODEL_NAME)
        print(f"✅ Model loaded ({EMBEDDING_DIM}-dim embeddings)")
    return _model


def generate_embedding(text: str) -> np.ndarray:
    """
    Generate a normalized embedding vector for the given text.
    Returns a 1-D numpy array of shape (384,).
    """
    model = _get_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding


def generate_embeddings_batch(texts: list[str]) -> np.ndarray:
    """
    Generate embeddings for a batch of texts.
    Returns a 2-D numpy array of shape (N, 384).
    """
    model = _get_model()
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=True)
    return embeddings


def compute_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """
    Compute cosine similarity between two embedding vectors.
    Returns a float in [-1, 1] (typically [0, 1] for normalized embeddings).
    """
    a = vec_a.reshape(1, -1)
    b = vec_b.reshape(1, -1)
    return float(sk_cosine_similarity(a, b)[0][0])


def compute_similarities_batch(query_vec: np.ndarray, index_matrix: np.ndarray) -> np.ndarray:
    """
    Compute cosine similarity between a query vector and all vectors in an index.
    Returns a 1-D array of similarity scores.
    """
    query = query_vec.reshape(1, -1)
    sims = sk_cosine_similarity(query, index_matrix)
    return sims[0]
