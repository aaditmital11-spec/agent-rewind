// Load the docs in data/docs into the chunks table.
//   npm run ingest
// Needs Postgres and the embedding service running. Replaces any chunks already there.
import { readdir, readFile } from "node:fs/promises";
import { pool } from "../src/lib/db.ts";
import { chunkMarkdown, embed } from "../src/lib/rag.ts";

const DOCS_DIR = "data/docs";

const chunks: { source: string; content: string }[] = [];
for (const file of (await readdir(DOCS_DIR)).filter((f) => f.endsWith(".md"))) {
  const text = await readFile(`${DOCS_DIR}/${file}`, "utf8");
  for (const content of chunkMarkdown(text)) chunks.push({ source: file, content });
}

const vectors = await embed(chunks.map((c) => c.content));

await pool.query("DELETE FROM chunks");
for (let i = 0; i < chunks.length; i++) {
  await pool.query("INSERT INTO chunks (source, content, embedding) VALUES ($1, $2, $3)", [
    chunks[i].source,
    chunks[i].content,
    JSON.stringify(vectors[i]),
  ]);
}

console.log(`Stored ${chunks.length} chunks from ${new Set(chunks.map((c) => c.source)).size} files`);
await pool.end();
