"""
Lightweight Vector Store for career knowledge base.
Uses numpy + sentence-transformers (already in the project) instead of ChromaDB.
For 23 careers, in-memory numpy search is faster and has zero external dependencies.
"""

import json
import numpy as np
from pathlib import Path

from config import RAG_COLLECTION_NAME, MODEL_NAME

# ─── In-memory vector index ─────────────────────────────────────────
_index = {
    "ids": [],
    "documents": [],
    "metadatas": [],
    "embeddings": None,  # numpy array (N, 384)
}
_is_indexed = False


def _career_to_text(career: dict) -> str:
    """Convert a career entry to a searchable text document."""
    skills = ", ".join(career.get("skills_required", []))
    roadmap = " → ".join(career.get("roadmap", []))
    resources = ", ".join(career.get("resources", []))

    return f"""Career: {career['title']}
Description: {career['description']}
Skills Required: {skills}
Personality Fit: {career.get('personality_fit', '')}
Career Roadmap: {roadmap}
Resources: {resources}
Salary Range: {career.get('salary_range', 'N/A')}
Demand Level: {career.get('demand_level', 'N/A')}"""


def index_careers(career_list: list[dict]) -> dict:
    """
    Embed and index all careers into in-memory numpy store.
    Uses the sentence-transformer model from the existing embeddings module.
    """
    global _index, _is_indexed
    from embeddings import generate_embeddings_batch

    documents = []
    metadatas = []
    ids = []

    for career in career_list:
        text = _career_to_text(career)
        documents.append(text)
        metadatas.append({
            "title": career["title"],
            "id": career["id"],
            "demand_level": career.get("demand_level", "unknown"),
            "salary_range": career.get("salary_range", "N/A"),
        })
        ids.append(career["id"])

    # Generate embeddings in batch (uses all-MiniLM-L6-v2)
    print(f"⏳ Generating embeddings for {len(documents)} careers...")
    embeddings = generate_embeddings_batch(documents)

    _index = {
        "ids": ids,
        "documents": documents,
        "metadatas": metadatas,
        "embeddings": embeddings,  # numpy array (N, 384)
    }
    _is_indexed = True

    stats = {
        "careers_indexed": len(ids),
        "model": MODEL_NAME,
    }
    print(f"✅ Indexed {stats['careers_indexed']} careers (numpy vector store)")
    return stats


def query(query_embedding: np.ndarray, n_results: int = 3) -> dict:
    """
    Find the most similar careers to a query embedding.
    Uses cosine similarity via the existing embeddings module.
    """
    global _index
    if not _is_indexed or _index["embeddings"] is None:
        raise RuntimeError("Vector store not indexed. Call index_careers() first.")

    from embeddings import compute_similarities_batch

    # Compute cosine similarity between query and all career embeddings
    similarities = compute_similarities_batch(query_embedding, _index["embeddings"])

    # Get top N indices (highest similarity first)
    top_indices = np.argsort(similarities)[::-1][:n_results]

    results = {
        "ids": [_index["ids"][i] for i in top_indices],
        "documents": [_index["documents"][i] for i in top_indices],
        "metadatas": [_index["metadatas"][i] for i in top_indices],
        "distances": [float(1 - similarities[i]) for i in top_indices],  # Convert to distance
    }

    return results


def load_and_index_careers() -> dict:
    """Load careers.json and index into vector store."""
    data_path = Path(__file__).resolve().parent.parent / "data" / "careers.json"

    if not data_path.exists():
        raise FileNotFoundError(f"Career data not found: {data_path}")

    with open(data_path, "r", encoding="utf-8") as f:
        careers = json.load(f)

    print(f"📂 Loaded {len(careers)} careers from {data_path.name}")
    return index_careers(careers)


def get_collection_stats() -> dict:
    """Get current index statistics."""
    return {
        "careers_indexed": len(_index["ids"]),
        "collection_name": RAG_COLLECTION_NAME,
        "storage": "in-memory (numpy)",
        "healthy": _is_indexed,
    }
