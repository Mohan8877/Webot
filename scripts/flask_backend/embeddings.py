"""
Embeddings Module
Handles text chunking, embedding generation, and vector storage using FAISS.
"""

import os
import re
import pickle
from typing import List, Dict, Optional
import numpy as np

# Try to import FAISS, fall back to simple similarity if not available
try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    print("[WARNING] FAISS not available, using simple similarity search")

# Try to import sentence-transformers
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    print("[WARNING] sentence-transformers not available, using simple TF-IDF")

# Fallback imports
from collections import Counter
import math


class SimpleEmbedder:
    """Simple TF-IDF based embedder as fallback."""
    
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.vocabulary = {}
        self.idf = {}
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization."""
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        return text.split()
    
    def _compute_tf(self, tokens: List[str]) -> Dict[str, float]:
        """Compute term frequency."""
        counter = Counter(tokens)
        total = len(tokens)
        return {word: count / total for word, count in counter.items()}
    
    def encode(self, texts: List[str]) -> np.ndarray:
        """Encode texts to vectors using simple TF-IDF."""
        all_tokens = []
        for text in texts:
            all_tokens.extend(self._tokenize(text))
        
        # Build vocabulary from all unique tokens
        unique_tokens = list(set(all_tokens))[:self.dimension]
        self.vocabulary = {token: idx for idx, token in enumerate(unique_tokens)}
        
        # Compute IDF
        doc_freq = Counter()
        for text in texts:
            tokens = set(self._tokenize(text))
            doc_freq.update(tokens)
        
        n_docs = len(texts)
        self.idf = {word: math.log(n_docs / (freq + 1)) for word, freq in doc_freq.items()}
        
        # Create vectors
        vectors = []
        for text in texts:
            tokens = self._tokenize(text)
            tf = self._compute_tf(tokens)
            
            vector = np.zeros(self.dimension)
            for word, tf_val in tf.items():
                if word in self.vocabulary:
                    idx = self.vocabulary[word]
                    idf_val = self.idf.get(word, 0)
                    vector[idx] = tf_val * idf_val
            
            # Normalize
            norm = np.linalg.norm(vector)
            if norm > 0:
                vector = vector / norm
            
            vectors.append(vector)
        
        return np.array(vectors, dtype=np.float32)


class EmbeddingManager:
    """Manages text embeddings and vector search."""
    
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        self.model_name = model_name
        self.dimension = 384  # Default dimension for MiniLM
        
        # Initialize embedder
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                self.model = SentenceTransformer(model_name)
                self.dimension = self.model.get_sentence_embedding_dimension()
                print(f"[EMBEDDINGS] Loaded SentenceTransformer model: {model_name}")
            except Exception as e:
                print(f"[EMBEDDINGS] Failed to load SentenceTransformer: {e}")
                self.model = SimpleEmbedder(self.dimension)
        else:
            self.model = SimpleEmbedder(self.dimension)
            print("[EMBEDDINGS] Using simple TF-IDF embedder")
        
        # Storage for indices and chunks
        self.indices: Dict[str, any] = {}
        self.chunks_store: Dict[str, List[str]] = {}
        self.embeddings_store: Dict[str, np.ndarray] = {}
    
    def chunk_text(
        self,
        text: str,
        chunk_size: int = 500,
        chunk_overlap: int = 100
    ) -> List[str]:
        """
        Split text into overlapping chunks.
        
        Args:
            text: Input text to chunk
            chunk_size: Target size of each chunk in characters
            chunk_overlap: Number of characters to overlap between chunks
        
        Returns:
            List of text chunks
        """
        # Clean the text
        text = re.sub(r'\s+', ' ', text).strip()
        
        if len(text) <= chunk_size:
            return [text]
        
        chunks = []
        
        # Split by paragraphs first
        paragraphs = re.split(r'\n\n+', text)
        
        current_chunk = ""
        
        for para in paragraphs:
            para = para.strip()
            
            if not para:
                continue
            
            # If adding this paragraph exceeds chunk size
            if len(current_chunk) + len(para) > chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                
                # If paragraph itself is too long, split it
                if len(para) > chunk_size:
                    sentences = re.split(r'(?<=[.!?])\s+', para)
                    current_chunk = ""
                    
                    for sentence in sentences:
                        if len(current_chunk) + len(sentence) > chunk_size:
                            if current_chunk:
                                chunks.append(current_chunk.strip())
                            current_chunk = sentence + " "
                        else:
                            current_chunk += sentence + " "
                else:
                    current_chunk = para + " "
            else:
                current_chunk += para + " "
        
        # Add the last chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        # Create overlapping chunks
        overlapped_chunks = []
        for i, chunk in enumerate(chunks):
            if i > 0 and chunk_overlap > 0:
                # Add overlap from previous chunk
                prev_chunk = chunks[i - 1]
                overlap_text = prev_chunk[-chunk_overlap:] if len(prev_chunk) > chunk_overlap else prev_chunk
                chunk = overlap_text + " " + chunk
            
            overlapped_chunks.append(chunk)
        
        # Filter out very short chunks
        overlapped_chunks = [c for c in overlapped_chunks if len(c) > 50]
        
        print(f"[EMBEDDINGS] Created {len(overlapped_chunks)} chunks from {len(text)} characters")
        
        return overlapped_chunks
    
    def create_embeddings(self, texts: List[str]) -> np.ndarray:
        """Create embeddings for a list of texts."""
        if isinstance(self.model, SimpleEmbedder):
            return self.model.encode(texts)
        else:
            embeddings = self.model.encode(texts, show_progress_bar=False)
            return np.array(embeddings, dtype=np.float32)
    
    def create_index(self, index_id: str, chunks: List[str]) -> None:
        """
        Create a FAISS index for the given chunks.
        
        Args:
            index_id: Unique identifier for this index (usually URL hash)
            chunks: List of text chunks to index
        """
        if not chunks:
            raise ValueError("No chunks provided for indexing")
        
        # Create embeddings
        embeddings = self.create_embeddings(chunks)
        
        # Store chunks and embeddings
        self.chunks_store[index_id] = chunks
        self.embeddings_store[index_id] = embeddings
        
        if FAISS_AVAILABLE:
            # Create FAISS index
            index = faiss.IndexFlatIP(self.dimension)  # Inner product (cosine similarity after normalization)
            
            # Normalize embeddings for cosine similarity
            faiss.normalize_L2(embeddings)
            
            # Add to index
            index.add(embeddings)
            
            self.indices[index_id] = index
            print(f"[EMBEDDINGS] Created FAISS index '{index_id}' with {len(chunks)} vectors")
        else:
            # Store normalized embeddings for simple search
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            norms[norms == 0] = 1  # Avoid division by zero
            self.embeddings_store[index_id] = embeddings / norms
            self.indices[index_id] = "simple"
            print(f"[EMBEDDINGS] Created simple index '{index_id}' with {len(chunks)} vectors")
    
    def search(
        self,
        index_id: str,
        query: str,
        top_k: int = 5
    ) -> List[str]:
        """
        Search for relevant chunks given a query.
        
        Args:
            index_id: Index identifier to search
            query: Search query
            top_k: Number of top results to return
        
        Returns:
            List of relevant text chunks
        """
        if index_id not in self.chunks_store:
            print(f"[EMBEDDINGS] Index '{index_id}' not found")
            return []
        
        chunks = self.chunks_store[index_id]
        
        # Create query embedding
        query_embedding = self.create_embeddings([query])
        
        if FAISS_AVAILABLE and index_id in self.indices and self.indices[index_id] != "simple":
            # Use FAISS search
            index = self.indices[index_id]
            
            # Normalize query embedding
            faiss.normalize_L2(query_embedding)
            
            # Search
            k = min(top_k, len(chunks))
            distances, indices = index.search(query_embedding, k)
            
            results = []
            for idx in indices[0]:
                if idx < len(chunks):
                    results.append(chunks[idx])
            
            return results
        else:
            # Simple cosine similarity search
            embeddings = self.embeddings_store[index_id]
            
            # Normalize query
            query_norm = np.linalg.norm(query_embedding)
            if query_norm > 0:
                query_embedding = query_embedding / query_norm
            
            # Compute similarities
            similarities = np.dot(embeddings, query_embedding.T).flatten()
            
            # Get top k indices
            k = min(top_k, len(chunks))
            top_indices = np.argsort(similarities)[-k:][::-1]
            
            return [chunks[i] for i in top_indices]
    
    def delete_index(self, index_id: str) -> bool:
        """Delete an index and its associated data."""
        if index_id in self.indices:
            del self.indices[index_id]
            del self.chunks_store[index_id]
            del self.embeddings_store[index_id]
            print(f"[EMBEDDINGS] Deleted index '{index_id}'")
            return True
        return False
