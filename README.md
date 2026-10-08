# Agent Rewind

Record, inspect, and replay AI agent runs from any step, including RAG pipelines.

An AI agent runs in a loop of LLM calls, tool calls, and document retrievals. When a run gives a wrong answer, it is hard to tell which step went wrong, and rerunning the whole thing is slow, costs API calls, and may not even fail the same way twice. Agent Rewind records every step of a run so you can open it as a timeline, edit any step, and replay the run from that point.

<!-- Demo GIF goes here: ![Agent Rewind demo](docs/demo.gif) -->

## Features

- **Record** every LLM call, tool call, and retrieval as a step with its input, output, error, and duration.
- **Inspect** a run as a timeline. Failed steps are highlighted and opened first.
- **Replay from step N** with an edited input or a different Gemini model. Steps before N come from the recording, so they cost no API calls.
- **Debug RAG**: see which chunks were retrieved for a query and their similarity scores, then replay with a different query or `k` to see if better retrieval fixes the answer.

## How it works

Every call the agent makes goes through one function, `step()` in [src/lib/recorder.ts](src/lib/recorder.ts):

```ts
const reply = await step(ctx, "llm", "gemini", { model, contents }, (input) => callGemini(input));
```

On a normal run, `step()` calls the function and saves a row in the `steps` table. On a replay from step N:

| Step | What happens |
|---|---|
| before N | Returns the recorded output from Postgres. The function is not called. |
| N | Runs live with the edited input. |
| after N | Runs live. |

A replay is a new run with `replayed_from_run_id` pointing at the original, so both stay side by side. Postgres is the cache: `(run_id, seq)` is unique, and replay looks up recorded steps by their `seq`. If the agent takes a different path than the recording before step N, the replay stops with a "Replay mismatch" error instead of serving the wrong output.

### RAG

```
question -> Gemini -> search_docs(query)
                          |
                          +-> embed service (FastAPI, all-MiniLM-L6-v2) -> 384-number vector
                          +-> Postgres + pgvector: ORDER BY embedding <=> query LIMIT k
                          |
                      top k chunks + similarity scores, recorded as a "retrieval" step
```

The sample docs in [data/docs](data/docs) describe a fictional company, Nimbus Cloud. One of them is an archived 2023 pricing page, left in on purpose. For "How much does Nimbus Pro cost?" it ranks close to (sometimes above) the current pricing page, which is the kind of retrieval problem the tool is built to catch.

## Tech stack

- **Next.js** (App Router), TypeScript, Tailwind: UI and API routes
- **PostgreSQL 16 + pgvector**: runs, steps, and document embeddings, using raw SQL through `pg`
- **Python + FastAPI + sentence-transformers**: embedding service (`all-MiniLM-L6-v2`, 384 dimensions)
- **Gemini API** via `@google/genai`
- **Docker Compose** for all three services, **GitHub Actions** for CI, Node's built-in `node:test` for tests

## Run it with Docker

You need Docker Desktop and a [Gemini API key](https://aistudio.google.com/apikey).

```powershell
copy .env.local.example .env.local      # then put your GEMINI_API_KEY in .env.local
docker compose up -d --build
docker compose exec app npm run ingest  # embed the sample docs
```

Open http://localhost:3000 and click one of the demo questions.

The first build takes a few minutes and needs a few GB of disk: the embedding image includes PyTorch (CPU-only) and the model.

## Run it for development

```powershell
docker compose up -d db                  # Postgres only

# Embedding service, in its own terminal
cd embed-service
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000

# App, in another terminal
npm install
npm run ingest
npm run dev
```

`.env.local` needs `DATABASE_URL`, `GEMINI_API_KEY`, and `EMBED_SERVICE_URL` (see [.env.local.example](.env.local.example)).

## Tests

```powershell
npm test
```

Tests cover the agent's tools, document chunking, and `step()` recording and replay against a real Postgres. They never call Gemini or the embedding service. CI runs lint, type checking, the tests, a production build, and both Docker image builds on every push.

## API

| Route | Description |
|---|---|
| `POST /api/runs` | Start a run. Body: `{ question }` |
| `GET /api/runs` | List runs, newest first |
| `GET /api/runs/[id]` | One run with its steps in order |
| `POST /api/runs/[id]/replay` | Replay. Body: `{ fromSeq, newInput, model? }` |

## Project structure

```
src/
  app/                pages and API routes
  components/         run timeline, step panel, replay form
  lib/recorder.ts     step(): records and replays every call
  lib/agent.ts        demo agent: Gemini loop and its tools
  lib/rag.ts          embedding, chunking, and pgvector search
embed-service/        FastAPI embedding service
db/init.sql           schema: runs, steps, chunks
data/docs/            sample docs for RAG
scripts/              demo runner and ingest script
tests/                node:test tests
```

## Limitations

- Runs are synchronous: `POST /api/runs` waits for the agent to finish. There is no streaming.
- Replay assumes an edited input has the same shape as the original.
- No auth. It is meant to run locally.
