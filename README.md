# Spring AI RAG Orchestrator

## Overview
The Spring AI RAG Orchestrator is a robust middleware designed to facilitate Retrieval-Augmented Generation (RAG) at scale. Built on Java 25 and Spring Boot 3, this system provides a secure, high-throughput pipeline for document ingestion, semantic chunking, and AI-driven data querying. 

By routing inference through high-speed API and utilizing Supabase (PostgreSQL + pgvector) for high-dimensional similarity search, the architecture guarantees strict source grounding and rapid response times for enterprise document intelligence.

## System Architecture

### 1. Ingestion Pipeline
* **Multipart Processing:** Accepts secure PDF uploads via REST payload.
* **Extraction:** Utilizes Apache PDFBox for precise text and metadata extraction.
* **Vectorization:** Implements semantic chunking and generates embeddings via Spring AI.
* **Persistence:** Stores document vectors and relational metadata in Supabase.

### 2. Retrieval & Inference Pipeline
* **Query Embedding:** Converts user prompts into vector representations.
* **Similarity Search:** Executes nearest-neighbor searches within PostgreSQL using the `pgvector` extension.
* **Contextual Injection:** Orchestrates the LLM prompt by appending retrieved document chunks as immutable context.
* **Inference:** Streams the localized context to ensure zero-hallucination responses.



