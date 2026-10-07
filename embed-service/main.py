from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()

# Loaded once when the server starts, not on every request.
# all-MiniLM-L6-v2 turns a piece of text into 384 numbers.
model = SentenceTransformer("all-MiniLM-L6-v2")


class EmbedRequest(BaseModel):
    texts: list[str]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/embed")
def embed(request: EmbedRequest):
    # Normalized vectors have length 1, so cosine similarity is just a dot product.
    vectors = model.encode(request.texts, normalize_embeddings=True)
    return {"embeddings": vectors.tolist()}
