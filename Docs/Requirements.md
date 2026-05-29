# Product Requirements Document (PRD)
## Secure Intelligence Platform for NCMM (National Critical Mineral Mission)

### 1. Executive Summary
The Secure Intelligence Platform for the National Critical Mineral Mission (NCMM) is a B.Tech Capstone project designed to securely ingest, process, and query highly classified intelligence documents related to critical mineral supply chains, stockpiles, and geopolitical risks. The system leverages Retrieval-Augmented Generation (RAG) with a strict Attribute-Based Access Control (ABAC) mechanism and a multi-layered security firewall to prevent prompt injection and unauthorized data access.

### 2. User Roles and Personas
The system defines 5 strict access clearance levels (CL1 to CL5) and multiple roles:
- **Port Inspector (CL2)**: Access restricted to port-specific operational documents (e.g., JNPT or VIZAG).
- **Logistics Analyst (CL3)**: Access to supply chain and inventory assessments.
- **Mission Director (CL5)**: Full overriding access to all intelligence documents (COSMIC TOP SECRET).
- **Sysadmin (CL1)**: Platform management access but strictly denied reading intelligence documents (Separation of Duties).
- **Viewer (CL0)**: Default restrictive access.

### 3. Functional Requirements
- **F-01 Document Ingestion**: The system shall parse metadata, chunk documents (Parent: 512 tokens, Child: 128 tokens), generate embeddings using `all-MiniLM-L6-v2`, and store them in MongoDB and FAISS.
- **F-02 Attribute-Based Access Control (ABAC)**: The system shall use Open Policy Agent (OPA) with Rego policies to filter document access based on User Role, Clearance Level, and Department before any vector search occurs.
- **F-03 Hybrid Search Engine**: The system shall perform parallel semantic search (FAISS) and lexical search (BM25), combining results using Reciprocal Rank Fusion (RRF).
- **F-04 Re-Ranking**: The system shall re-rank top candidates using a Cross-Encoder to select the most contextually relevant parent chunks.
- **F-05 Generative AI Synthesis**: The system shall prompt an LLM (Ollama) to synthesize an answer based strictly on the retrieved context, providing exact citations.
- **F-06 Admin Dashboard**: The system shall provide metrics, logs, and a natural language query interface over MongoDB collections, restricted to Sysadmins.

### 4. Non-Functional Requirements
- **NFR-01 Security**: Implement a 3-layer prompt firewall (L1: Unicode Normalization, L2: Intent Classifier, L3: XML Vault) to prevent jailbreaks and prompt injections.
- **NFR-02 Authentication**: JWT tokens must be stored strictly in-memory within the React state, bypassing local storage.
- **NFR-03 Performance**: Document search and retrieval must return within 2 seconds prior to LLM generation.
- **NFR-04 Auditability**: Every access control decision made by OPA must be logged in a TTL-indexed MongoDB collection for 90 days.

### 5. Acceptance Criteria
- A Mission Director (CL5) can query and receive citations for classified Chinese mineral dominance briefs.
- A VIZAG Port Inspector cannot retrieve documents associated with the JNPT port, even if the semantic similarity is high.
- A malicious query containing payload characters (`<script>`, zero-width joiners) must be intercepted and blocked by the Firewall layers before hitting the LLM.
