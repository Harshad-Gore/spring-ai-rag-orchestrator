# Spring AI RAG Orchestrator

## Overview

The Spring AI RAG Orchestrator is a full-stack, robust platform designed to facilitate Retrieval-Augmented Generation (RAG) at scale. It provides a seamless, secure, and high-performance pipeline for document ingestion, semantic chunking, and AI-driven conversational querying. 

Users can create separate "Notebooks", upload multiple source documents (PDF, DOCX, TXT) into them, and interact with an AI assistant that strictly grounds its answers based on the uploaded contextual data.

## Features

- **Notebook Workspaces:** Organize your data into isolated notebooks. Chat interactions are scoped strictly to the documents within the active notebook.
- **Multi-Format Ingestion:** Supports uploading PDF, DOCX, and TXT files securely via multipart upload.
- **Intelligent RAG Pipeline:** Extracts text, chunks it semantically, generates vector embeddings, and stores them for high-speed similarity search.
- **Source Grounding & Citations:** The AI assistant provides accurate answers based *only* on the uploaded documents and cites its sources inline.
- **JWT-Based Authentication:** Secure, stateless user authentication with JSON Web Tokens.
- **Modern UI:** A highly responsive, dark-themed React frontend crafted with Tailwind CSS for a premium user experience.

## Technology Stack

### Frontend
- **React (Vite):** Fast, modern frontend framework.
- **Tailwind CSS:** Utility-first styling for a sleek, responsive dark UI.
- **Lucide React:** Beautiful, consistent iconography.
- **React Router:** Client-side routing for seamless navigation.

### Backend
- **Java & Spring Boot:** Robust, enterprise-grade backend infrastructure.
- **Spring AI:** Abstraction layer for interacting with LLMs (Groq/OpenAI) and managing the RAG pipeline.
- **Spring Security:** Handles JWT-based stateless authentication and route protection.
- **Apache PDFBox & POI:** Document parsing and text extraction.
- **AWS SDK (S3):** Used to interface with S3-compatible storage for storing raw uploaded documents.

### Data & Infrastructure
- **Supabase (PostgreSQL):** Relational database for users, notebooks, and document metadata.
- **pgvector:** PostgreSQL extension for storing high-dimensional vector embeddings and performing extremely fast nearest-neighbor similarity searches.
- **S3-Compatible Storage:** Secure blob storage for the uploaded source files.
- **Flyway:** Automated database schema migrations.

## System Architecture

1. **Ingestion Pipeline:**
   - **Upload:** Users upload files via the React frontend.
   - **Storage:** Raw files are saved to S3 Storage.
   - **Extraction:** Backend parses the files using Apache PDFBox/POI to extract raw text.
   - **Vectorization:** Text is split into logical chunks. Spring AI generates embeddings for each chunk.
   - **Persistence:** Chunks and their vector embeddings are stored in the Supabase PostgreSQL database using `pgvector`.

2. **Retrieval & Inference Pipeline (RAG):**
   - **Query Processing:** User asks a question in the chat interface.
   - **Similarity Search:** The query is embedded and compared against the document chunks in the current notebook using vector similarity search in PostgreSQL.
   - **Prompt Engineering:** The most relevant chunks are retrieved and injected into the LLM system prompt as context.
   - **Inference & Citation:** The LLM (via Groq/OpenAI) generates a response based *strictly* on the context and returns the answer along with source citations.

## Local Development Setup

### Prerequisites
- Node.js (v18+)
- Java JDK 25
- Maven
- Supabase account (or local Supabase instance)
- OpenAI API Key

### Database & Storage Setup (Supabase)
1. Create a new Supabase project.
2. Enable the `vector` extension in the database.
3. Create an S3 storage bucket and retrieve the S3 access keys.
4. Note your database connection string and password.

### Backend Setup
1. Navigate to the `backend` directory.
2. Copy `.env.example` to `.env` and fill in the required variables:
   - Database credentials (`DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD`)
   - JWT Secret (`AUTH_JWT_SECRET`)
   - S3 credentials (`S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`)
   - LLM API Key (`OPENAI_API_KEY`, `GROQ_BASE_URL`)
3. Run the application:
   ```bash
   ./mvnw clean spring-boot:run
   ```
   *Flyway will automatically create the necessary tables and schema on startup.*

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure the backend URL if necessary:
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5173` in your browser.
