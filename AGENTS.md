AGENTS.md
Project

Agent Rewind: record, inspect, and replay AI agent runs from any step, including RAG pipelines.

An AI agent runs in a loop of LLM calls, tool calls, and document retrievals. When a run fails, this tool lets you:

Record every call as a step (input, output, timing, error)
Inspect each run as a timeline and open any step
Replay a run from step N with an edited input or a different model
Debug RAG by seeing which chunks were retrieved and their similarity scores
Tech stack
Frontend + main backend: Next.js (App Router), TypeScript, Tailwind, in src/
Embedding service: Python, FastAPI, Hugging Face sentence-transformers (all-MiniLM-L6-v2, 384 dimensions), in embed-service/
Database: PostgreSQL 16 with pgvector, via Docker, accessed with pg (raw SQL, no ORM)
LLM: Gemini API via @google/genai
Project structure
agent-rewind/
  src/
    app/                 pages and API routes
    lib/db.ts            shared Postgres pool
    lib/recorder.ts      step() wrapper: records and replays every call
    lib/agent.ts         demo agent and its tools
    lib/rag.ts           search_docs tool (calls embed service + pgvector)
  embed-service/
    main.py              FastAPI app with /embed
    requirements.txt
  db/init.sql            schema (runs, steps, chunks)
  docker-compose.yml
Commands

The developer is on Windows PowerShell. Give commands that work there.

powershell
docker compose up -d                 # start Postgres (Docker Desktop must be running)
npm run dev                          # Next.js at localhost:3000
docker compose exec db psql -U postgres -d agentrewind   # SQL shell
docker compose down -v               # reset the database (deletes all data)

# Embedding service
cd embed-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

Environment variables live in .env.local (never commit it):

DATABASE_URL
GEMINI_API_KEY
EMBED_SERVICE_URL (default http://localhost:8000)
Data model
runs: id, name, status (running | success | failed), error, replayed_from_run_id, started_at
steps: id, run_id, seq, type (llm | tool | retrieval), name, input JSONB, output JSONB, error, duration_ms
chunks: id, source, content, embedding vector(384)
(run_id, seq) is unique. Replay depends on this.
Core concept: step() and replay

Every LLM call, tool call, and retrieval goes through step(ctx, type, name, input, fn) in src/lib/recorder.ts.

When replaying from step N:

Steps before N return their recorded output from Postgres and do not call any API
Step N uses the edited input (or a different model) and runs live
Steps after N run live

A replay creates a new run with replayed_from_run_id set to the original run. Postgres is the cache. Do not add Redis or another caching layer.

Rule: never call Gemini, a tool, or the embed service directly from the agent. Always go through step().

RAG
Documents are split into chunks, embedded by the Python service, and stored in chunks.
The agent's search_docs tool embeds the query, finds the nearest chunks with pgvector (ORDER BY embedding <=> $1 LIMIT k), and returns them with similarity scores.
Retrievals are recorded as retrieval steps so the UI can show chunks and scores.
API routes
POST /api/runs: start a new agent run
GET /api/runs: list runs
GET /api/runs/[id]: one run with its steps ordered by seq
POST /api/runs/[id]/replay: body { fromSeq, newInput, model? }, starts a replay
Conventions
Write the simplest code that works. Plain functions over classes and abstractions.
Python code should be minimal and readable.
Use parameterized SQL ($1, $2), never string concatenation.
Tailwind only, no extra UI libraries.
No em dashes in comments, docs, or UI text.
Working with me
I am learning as I build and must be able to explain every line in interviews. After each change, briefly explain what it does and why.
Make small, focused changes so each one can be its own commit.
Do not add yourself as a co-author on commits. I commit my own work.
Ask before adding new dependencies.
Build order
Setup: Next.js, Postgres with pgvector, schema, repo
Demo agent + step() recorder
API routes
Viewer UI: runs list, run detail timeline, step panel
Replay
Python embedding service
RAG search_docs tool, recorded as retrieval steps
Ship: Docker Compose for all services, GitHub Actions CI, tests, deploy, README with GIF

Stretch: replay with a different model (Llama via Ollama), side-by-side diff of original vs replay, PyTorch fine-tuning of a reranker on labeled retrieval failures.

Out of scope for now: OpenTelemetry, auth, other agent frameworks, streaming, Redis.

Accuracy

Do not describe this project as using a tool (OpenTelemetry, PyTorch, Ollama, Playwright, Redis) until it is actually in the code.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
