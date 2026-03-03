"""
Semantic retrieval of relevant careers from the vector store.
Embeds the user query and performs similarity search.
"""

from embeddings import generate_embedding
from rag.vector_store import query as vector_query
from config import RAG_N_RESULTS


def retrieve_relevant_careers(user_query: str, n_results: int = None) -> dict:
    """
    Retrieve the most relevant careers for a user query.

    Args:
        user_query: The student's message/question about their career interests
        n_results: Number of results to return (default from config)

    Returns:
        dict with:
            - documents: list of career text documents
            - metadatas: list of career metadata dicts
            - distances: list of distance scores (lower = more relevant)
            - ids: list of career IDs
    """
    if n_results is None:
        n_results = RAG_N_RESULTS

    # Embed the query using the same model as the index
    query_embedding = generate_embedding(user_query)

    # Search the numpy vector store
    results = vector_query(query_embedding, n_results=n_results)

    return results
