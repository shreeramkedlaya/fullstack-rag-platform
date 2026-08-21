# To-Be-Implemented: Advanced AI Feature Roadmap

This document outlines the four potential paths for upgrading the AI Microservice from a standard document-retriever into a highly advanced, differentiated AI application. We will select one of these paths to implement next.

## 1. Agentic RAG (Tool-Calling AI)
**Core Functionality:** Transform the AI from a passive responder into an active Agent capable of deciding *how* to find information. Instead of always querying the vector database, the LLM is given access to a suite of "Tools".

**Implementation Details:**
- **LangChain ReAct Agent:** Implement a ReAct (Reason + Act) loop using `gemini-2.5-flash`.
- **Tool 1: Web Search Engine:** Integrate DuckDuckGo or Google Search APIs so the AI can pull real-time data from the internet when a user asks about current events.
- **Tool 2: Document Retriever:** The existing hybrid RAG pipeline becomes a tool the AI can choose to call when the user asks about uploaded PDFs.
- **Tool 3: SQL Database Querying:** Grant the AI read-only access to the Django MySQL databases (e.g., `customer_orders_db`) so it can answer questions like *"How many customers ordered last week?"* by dynamically generating and executing SQL.

## 2. GraphRAG (Knowledge Graphs)
**Core Functionality:** Move beyond simple semantic similarity (vector distance) by extracting explicit entities (People, Organizations, Concepts) and their relationships from the uploaded PDFs to build a Knowledge Graph.

**Implementation Details:**
- **Entity Extraction Pipeline:** During the `/chat/ingest/` phase, use an LLM to parse chunks and extract nodes (e.g., "Company X") and edges (e.g., "Acquired", "Company Y").
- **Graph Database Integration:** Integrate a graph database like Neo4j to store these relationships.
- **Multi-Hop Reasoning:** When a user asks a complex question requiring synthesized knowledge across multiple documents, traverse the Neo4j graph to fetch connected entities before passing them to the LLM as context.

## 3. Multi-Modal Vision RAG
**Core Functionality:** Give the RAG pipeline "eyes". Standard PDF parsers strip out or mangle images, charts, and tables. This upgrade allows the AI to natively read and analyze visual data inside documents.

**Implementation Details:**
- **Visual Ingestion:** Update the ingestion pipeline to convert PDF pages into high-resolution images (using libraries like `pdf2image`) alongside standard text extraction.
- **Vision-Language Models (VLM):** Route retrieved images directly into Gemini's multi-modal endpoint (`gemini-2.5-flash` supports images natively).
- **Chart & Table Analysis:** Enable users to ask questions like *"What is the trend shown in the bar chart on page 4?"* and receive accurate visual analysis.

## 4. Self-Correcting RAG (CRAG)
**Core Functionality:** Implement an automated "Critic" loop (Corrective RAG) that grades the AI's own retrieved context to eliminate hallucinations.

**Implementation Details:**
- **Context Evaluator Node:** Before generating a final answer, a secondary LLM call evaluates the retrieved vector chunks. It asks: *"Does this text actually contain the answer to the user's question?"*
- **Fallback Web Search:** If the evaluator grades the vector context as poor/irrelevant, the pipeline automatically falls back to a live Web Search to find the correct answer instead of hallucinating.
- **Response Rewrite:** Ensure the final output is highly accurate by filtering out irrelevant context *before* the final generation step.

## 5. Agentic Routing (Supervisor/Dispatcher Pattern)
**Core Functionality:** Dynamically switch between different specialized AI agents based on the complexity and intent of the user's request, ensuring optimal speed and depth of answer.

**Implementation Details:**
- **Intent Classification:** When a request comes in, a lightweight, fast LLM acts as a "Router" to classify the query.
- **Agent Switching:** 
  - If the user says *"Hello"*, route to a standard conversational agent (bypassing the database entirely for maximum speed).
  - If the user asks about an uploaded document, route to the RAG Agent.
  - If the user asks a deep, complex analytical question, route to a Deep-Research Agent (Agentic RAG) that uses tools and takes more time to process.
- **Cost & Speed Optimization:** This ensures that expensive, time-consuming agentic loops are only triggered when genuinely necessary, significantly improving the UX for standard chat queries.
