"""
Core ML classification pipeline.
Takes video analysis metadata, generates embeddings, and decides
which course a video belongs to (or whether to create a new one).
"""

from dataclasses import dataclass

import numpy as np

from config import HIGH_CONFIDENCE_THRESHOLD, LOW_CONFIDENCE_THRESHOLD, VALID_CATEGORIES
from embeddings import generate_embedding


@dataclass
class ClassificationResult:
    """Result of classifying a video."""
    course_id: str | None          # MongoDB ObjectId as string, None if new course
    course_name: str | None        # Name of matched/new course
    category: str                  # Category from VALID_CATEGORIES
    confidence: float              # 0.0 - 1.0
    is_new_course: bool            # True if no good match found
    match_details: dict            # Extra info about the match


def build_video_text(video_data: dict) -> str:
    """
    Construct a rich text representation from video analysis data.
    Combines title, tags, summary, topics, category, and channel name
    into a single string optimized for embedding generation.
    """
    parts = []

    # Title is the strongest signal
    title = video_data.get("title", "")
    if title:
        parts.append(title)

    # AI-generated summary captures the content essence
    summary = video_data.get("summary", "")
    if summary:
        parts.append(summary)

    # Topics covered give granular content signals
    topics = video_data.get("topics", [])
    if topics:
        parts.append("Topics: " + ", ".join(topics))

    # Tags provide additional categorization hints
    tags = video_data.get("tags", [])
    if tags:
        parts.append("Tags: " + ", ".join(tags))

    # Detected category/subcategory from the AI evaluator
    category = video_data.get("category", "")
    subcategory = video_data.get("subcategory", "")
    if category:
        parts.append(f"Category: {category}")
    if subcategory:
        parts.append(f"Subcategory: {subcategory}")

    # Channel name can indicate content type/style
    channel = video_data.get("channel", "")
    if channel:
        parts.append(f"Channel: {channel}")

    return " | ".join(parts)


def build_course_text(course: dict) -> str:
    """
    Build text representation of a course for embedding.
    Uses course name, description, tags, and AI overview.
    """
    parts = []

    name = course.get("name", "")
    if name:
        parts.append(name)

    description = course.get("description", "")
    if description:
        parts.append(description[:500])  # Cap description length

    tags = course.get("tags", [])
    if tags:
        parts.append("Tags: " + ", ".join(tags))

    category = course.get("category", "")
    if category:
        parts.append(f"Category: {category}")

    provider = course.get("provider", "")
    if provider:
        parts.append(f"Provider: {provider}")

    # AI overview fields
    ai_overview = course.get("aiOverview", {})
    if ai_overview:
        key_topics = ai_overview.get("keyTopics", [])
        if key_topics:
            parts.append("Key Topics: " + ", ".join(key_topics))
        learning_objectives = ai_overview.get("learningObjectives", [])
        if learning_objectives:
            parts.append("Objectives: " + ", ".join(learning_objectives[:5]))

    return " | ".join(parts)


def infer_category(video_data: dict) -> str:
    """
    Infer the best category from video data using keyword matching.
    This is used as a secondary signal alongside embedding similarity.
    Falls back to 'other' if no strong match is found.
    """
    text = (
        (video_data.get("title", "") + " " +
         video_data.get("category", "") + " " +
         video_data.get("subcategory", "") + " " +
         " ".join(video_data.get("tags", [])) + " " +
         " ".join(video_data.get("topics", [])))
    ).lower()

    # Order matters: more specific patterns first
    if any(kw in text for kw in ["react", "node", "express", "frontend", "backend", "html", "css", "web dev", "web development", "next.js", "vue", "angular", "tailwind"]):
        return "web-dev"
    if "javascript" in text or "typescript" in text or "js " in text:
        return "javascript"
    if "python" in text or "django" in text or "flask" in text or "fastapi" in text:
        return "python"
    if ("java" in text or "spring" in text or "kotlin" in text) and "javascript" not in text:
        return "java"
    if any(kw in text for kw in ["data science", "machine learning", "deep learning", "ml", "ai ", "artificial intelligence", "pandas", "tensorflow", "pytorch", "neural"]):
        return "data-science"
    if any(kw in text for kw in ["dsa", "algorithm", "data structure", "leetcode", "competitive programming", "sorting", "searching", "tree", "graph", "dynamic programming"]):
        return "dsa"
    if any(kw in text for kw in ["devops", "docker", "kubernetes", "aws", "cloud", "ci/cd", "jenkins", "terraform", "linux", "nginx"]):
        return "devops"
    if any(kw in text for kw in ["mobile", "android", "ios", "flutter", "react native", "swift", "swiftui"]):
        return "mobile"
    if any(kw in text for kw in ["c programming", "c language", " c ", "c tutorial", "pointers", "malloc"]):
        return "c-programming"

    return "other"


def classify_video(
    video_data: dict,
    course_index: list[dict],
    course_embeddings: np.ndarray | None,
) -> ClassificationResult:
    """
    Classify a video into the best matching course.

    Args:
        video_data: Video analysis metadata from the Node.js backend
        course_index: List of course dicts with _id, name, category, etc.
        course_embeddings: Pre-computed embedding matrix for all courses (N, 384)

    Returns:
        ClassificationResult with course assignment decision
    """
    # 1. Build text representation and generate embedding
    video_text = build_video_text(video_data)
    video_embedding = generate_embedding(video_text)

    # 2. Infer category from keywords (secondary signal)
    inferred_category = infer_category(video_data)

    # 3. If no courses exist or no embeddings, create a new course
    if course_embeddings is None or len(course_index) == 0:
        return ClassificationResult(
            course_id=None,
            course_name=_generate_course_name(video_data, inferred_category),
            category=inferred_category,
            confidence=0.0,
            is_new_course=True,
            match_details={
                "reason": "no_existing_courses",
                "inferred_category": inferred_category,
            },
        )

    # 4. Compute similarities against all courses
    from embeddings import compute_similarities_batch
    similarities = compute_similarities_batch(video_embedding, course_embeddings)

    # 5. Find best match
    best_idx = int(np.argmax(similarities))
    best_score = float(similarities[best_idx])
    best_course = course_index[best_idx]

    # 6. Also find the best match within the same category (if different)
    same_category_scores = []
    for i, course in enumerate(course_index):
        if course.get("category") == inferred_category:
            same_category_scores.append((i, float(similarities[i])))

    best_same_cat = None
    if same_category_scores:
        same_category_scores.sort(key=lambda x: x[1], reverse=True)
        cat_idx, cat_score = same_category_scores[0]
        best_same_cat = {
            "course": course_index[cat_idx],
            "score": cat_score,
        }

    # 7. Decision logic
    # Boost score if the best match is in the same inferred category
    effective_score = best_score
    if best_course.get("category") == inferred_category:
        effective_score = min(1.0, best_score + 0.05)  # Small category-match bonus

    if effective_score >= HIGH_CONFIDENCE_THRESHOLD:
        # High confidence match → auto-assign
        return ClassificationResult(
            course_id=str(best_course["_id"]),
            course_name=best_course.get("name", "Unknown"),
            category=best_course.get("category", inferred_category),
            confidence=effective_score,
            is_new_course=False,
            match_details={
                "reason": "high_confidence_match",
                "raw_similarity": best_score,
                "effective_similarity": effective_score,
                "category_bonus_applied": best_course.get("category") == inferred_category,
                "same_category_best": best_same_cat,
            },
        )
    elif effective_score >= LOW_CONFIDENCE_THRESHOLD:
        # Low confidence → suggest match but flag for review
        # Prefer same-category match if it's close
        if best_same_cat and best_same_cat["score"] >= LOW_CONFIDENCE_THRESHOLD:
            chosen = best_same_cat["course"]
            chosen_score = best_same_cat["score"]
        else:
            chosen = best_course
            chosen_score = effective_score

        return ClassificationResult(
            course_id=str(chosen["_id"]),
            course_name=chosen.get("name", "Unknown"),
            category=chosen.get("category", inferred_category),
            confidence=chosen_score,
            is_new_course=False,
            match_details={
                "reason": "low_confidence_match",
                "raw_similarity": best_score,
                "effective_similarity": effective_score,
                "needs_review": True,
                "same_category_best": best_same_cat,
            },
        )
    else:
        # No good match → create new course
        return ClassificationResult(
            course_id=None,
            course_name=_generate_course_name(video_data, inferred_category),
            category=inferred_category,
            confidence=best_score,
            is_new_course=True,
            match_details={
                "reason": "no_match_found",
                "best_existing_match": {
                    "name": best_course.get("name"),
                    "score": best_score,
                },
                "inferred_category": inferred_category,
            },
        )


def _generate_course_name(video_data: dict, category: str) -> str:
    """
    Generate a reasonable course name for auto-created courses.
    Uses the video title, cleaned up to be a good course name.
    """
    title = video_data.get("title", "Untitled Course")
    channel = video_data.get("channel", "")

    # Clean up common YouTube title patterns
    # Remove things like " | Full Course", " - Tutorial", etc.
    import re
    clean_title = re.sub(
        r"\s*[\|\-–—]\s*(Full Course|Tutorial|Complete|Course|Free|2024|2025|2026|Hindi|English|for Beginners).*$",
        "",
        title,
        flags=re.IGNORECASE,
    )
    clean_title = clean_title.strip()

    if not clean_title:
        clean_title = f"{category.replace('-', ' ').title()} Course"

    return clean_title
