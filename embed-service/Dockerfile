FROM python:3.11-slim

WORKDIR /app

# CPU-only PyTorch. The default build also ships GPU libraries and is several GB larger.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download the model while building, so the container starts without fetching it.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY main.py .

# 0.0.0.0 so other containers (and your machine) can reach it, not just the container itself.
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
