// Load the docs in data/docs into the chunks table.
//   npm run ingest
// Needs Postgres and the embedding service running. Replaces any chunks already there.
import { readdir, readFile } from "node:fs/promises";
import { pool } from "../src/lib/db.ts";
import { embed } from "../src/lib/rag.ts";

const DOCS_DIR = "data/docs";

// One chunk per "## " section. Each chunk starts with the document title,
// so a section like "## Pro plan" still says which document it came from.
function chunkMarkdown(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const title = lines[0].replace(/^#\s*/, "");
  const sections: string[][] = [[]];
  for (const line of lines.slice(1)) {
    if (line.startsWith("## ")) sections.push([]);
    sections[sections.length - 1].push(line);
  }
  return sections
    .map((section) => section.join("\n").trim())
    .filter((body) => body !== "")
    .map((body) => `${title}\n${body}`);
}

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
