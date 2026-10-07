import { pool } from "./db.ts";

const EMBED_SERVICE_URL = process.env.EMBED_SERVICE_URL ?? "http://localhost:8000";

// Turns each text into a 384-number vector using the Python embedding service.
export async function embed(texts: string[]): Promise<number[][]> {
  const res = await fetch(`${EMBED_SERVICE_URL}/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts }),
  });
  if (!res.ok) throw new Error(`Embed service returned ${res.status}`);
  const data = await res.json();
  return data.embeddings;
}

export type RetrievedChunk = {
  id: number;
  source: string;
  content: string;
  similarity: number;
};

// Finds the k chunks closest in meaning to the query.
// <=> is pgvector's cosine distance (0 = same direction), so similarity = 1 - distance.
export async function searchDocs(query: string, k = 3): Promise<RetrievedChunk[]> {
  const [vector] = await embed([query]);
  const result = await pool.query(
    `SELECT id, source, content, 1 - (embedding <=> $1::vector) AS similarity
     FROM chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    // pgvector accepts a vector written as text: "[0.1,0.2,...]", which is what JSON.stringify gives.
    [JSON.stringify(vector), k]
  );
  return result.rows.map((row) => ({ ...row, similarity: Math.round(row.similarity * 1000) / 1000 }));
}
