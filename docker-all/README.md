# RAG Docker Setup

This folder contains a fully containerized version of the RAG application with three Docker containers working together.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Network                           │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   Ollama    │    │  ChromaDB   │    │      CLI App        │ │
│  │             │    │             │    │                     │ │
│  │ llama3.1:8b │    │ Vector DB   │    │  Node.js + RAG      │ │
│  │             │    │             │    │                     │ │
│  │ Port: 11434 │    │ Port: 8000  │    │  testRag.ts         │ │
│  │             │    │             │    │  index.ts (ingest)  │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│        ▲                  ▲                     │               │
│        │                  │                     │               │
│        └──────────────────┴─────────────────────┘               │
│                    http://ollama:11434                          │
│                    http://chromadb:8000                         │
└─────────────────────────────────────────────────────────────────┘
```

## Containers

| Container      | Image                    | Port  | Purpose                   |
| -------------- | ------------------------ | ----- | ------------------------- |
| `rag-ollama`   | `ollama/ollama:latest`   | 11434 | LLM service (llama3.1:8b) |
| `rag-chromadb` | `chromadb/chroma:latest` | 8000  | Vector database           |
| `rag-cli`      | Custom (Node.js 20)      | -     | RAG application           |

## Volumes

| Volume           | Mount Point             | Purpose                        |
| ---------------- | ----------------------- | ------------------------------ |
| `ollama_data`    | `/root/.ollama`         | Persists downloaded LLM models |
| `chromadb_data`  | `/chroma/chroma`        | Persists vector embeddings     |
| `cli_data`       | `/app/data`             | Persists file cache            |
| `../docs` (bind) | `/app/docs` (read-only) | Source documents               |

## Quick Start

### 1. Start the containers

```bash
cd docker-all
docker compose up -d
```

### 2. Pull the LLM model (first time only)

```bash
# Option A: Use the helper script
./pull-model.sh

# Option B: Run manually
docker exec -it rag-ollama ollama pull llama3.1:8b
```

This downloads ~4.7GB for the llama3.1:8b model. Only needed once as the model is persisted in a volume.

### 3. Ingest documents

```bash
docker exec -it rag-cli npx tsx index.ts
```

This processes all `.txt` and `.md` files from the `docs/` folder.

### 4. Query the RAG system

```bash
# Basic query
docker exec -it rag-cli npx tsx testRag.ts "What is the security policy?"

# With streaming output
docker exec -it rag-cli npx tsx testRag.ts "How many vacation days?" --stream

# With verbose mode (shows retrieved documents)
docker exec -it rag-cli npx tsx testRag.ts "What are the company values?" --verbose

# Allow fallback to general knowledge
docker exec -it rag-cli npx tsx testRag.ts "What is machine learning?" --fallback
```

### CLI Options

```
Usage: tsx testRag.ts <your question> [options]

Options:
  --k=<number>       Number of documents to retrieve (default: 5)
  --minScore=<0-1>   Minimum relevance score (default: 0.5)
  --verbose, -v      Show retrieved documents
  --stream, -s       Stream tokens as they generate
  --fallback, -f     Allow LLM to use general knowledge if no context
```

## Container Management

```bash
# Start containers
docker compose up -d

# Stop containers (preserves data)
docker compose stop

# View logs
docker compose logs -f

# View logs for specific container
docker compose logs -f ollama
docker compose logs -f chromadb
docker compose logs -f cli

# Restart containers
docker compose restart

# Stop and remove containers (preserves volumes)
docker compose down

# Stop and remove everything including volumes (DELETES ALL DATA)
docker compose down -v
```

## Troubleshooting

### Check if services are running

```bash
# Check container status
docker ps

# Test Ollama
curl http://localhost:11434/api/tags

# Test ChromaDB
curl http://localhost:8000/api/v2/heartbeat
```

### Rebuild CLI container after code changes

```bash
docker compose build cli
docker compose up -d cli
```

### Reset everything

```bash
# Remove all containers and volumes
docker compose down -v

# Rebuild and start fresh
docker compose up -d --build

# Re-pull model and re-ingest
./pull-model.sh
docker exec -it rag-cli npx tsx index.ts
```

---

## Changes from Original Code

The files in `docker-all/` are modified copies of the original project files. The original files remain unchanged.

### URL Changes

Files were modified to use Docker service names instead of `localhost`:

| File                 | Original URL             | Docker URL             |
| -------------------- | ------------------------ | ---------------------- |
| `initVectorStore.ts` | `http://localhost:8000`  | `http://chromadb:8000` |
| `generateAnswer.ts`  | `http://localhost:11434` | `http://ollama:11434`  |

### initVectorStore.ts

```diff
- const client = new ChromaClient({
-   path: "http://localhost:8000"
- });
+ const CHROMADB_URL = "http://chromadb:8000";
+
+ const client = new ChromaClient({
+   path: CHROMADB_URL
+ });
```

Error messages updated to reference Docker:

```diff
- console.error("✗ ChromaDB server not running at http://localhost:8000");
- console.error("Start with: chroma run --path ./data/vector_store --port 8000");
+ console.error(`✗ ChromaDB server not running at ${CHROMADB_URL}`);
+ console.error("Ensure the chromadb container is running: docker compose up -d");
```

### generateAnswer.ts

```diff
- const OLLAMA_BASE_URL = "http://localhost:11434";
+ const OLLAMA_BASE_URL = "http://ollama:11434";
```

### testRag.ts

Error messages updated:

```diff
- console.error("  Start Ollama with: ollama serve");
- console.error("  Then pull the model: ollama pull llama3.1:8b");
+ console.error("  Ensure the ollama container is running: docker compose up -d");
+ console.error("  And the model is pulled: docker exec rag-ollama ollama pull llama3.1:8b");

- console.error("  Start with: npm run db:start");
+ console.error("  Ensure the chromadb container is running: docker compose up -d");
```

### fileCache.ts

Cache file path changed to use Docker volume:

```diff
- const CACHE_FILE = "./data/.file_cache.json";
+ const CACHE_FILE = "/app/data/.file_cache.json";
```

Added directory creation for Docker volume:

```diff
+ import { mkdir } from "fs/promises";
+ import { dirname } from "path";

  async function saveCache(cache: FileCache): Promise<void> {
+   try {
+     await mkdir(dirname(CACHE_FILE), { recursive: true });
+   } catch {
+     // Directory already exists
+   }
    await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
  }
```

### index.ts

Changed default path for Docker:

```diff
- await pipeline("./docs");
+ await pipeline("/app/docs");
```

### Import Paths

All files use local imports (`./filename`) since they are self-contained in the `docker-all/` folder:

- `ragChain.ts` imports from `./initVectorStore`, `./retriever`, `./generateAnswer`
- `testRag.ts` imports from `./ragChain`
- `pipeline.ts` imports from local files

### Files Copied Without Changes

These files had no `localhost` URLs and were copied as-is:

- `retriever.ts` - Uses collection passed in, no hardcoded URLs
- `loadDocuments.ts` - File system operations only
- `splitDocuments.ts` - Text processing only
- `embedChunks.ts` - Uses Transformers.js locally
- `storeEmbeddings.ts` - Uses collection passed in
- `checkExistingChunks.ts` - Uses collection passed in
- `discoverFiles.ts` - File system operations only

---

## File Structure

```
docker-all/
├── docker-compose.yml      # Container orchestration
├── Dockerfile              # CLI container build
├── README.md               # This file
├── pull-model.sh           # Helper script for model download
├── package.json            # Node.js dependencies
├── tsconfig.json           # TypeScript configuration
│
├── # RAG Query Files
├── testRag.ts              # CLI entry point for queries
├── ragChain.ts             # RAG orchestration
├── initVectorStore.ts      # ChromaDB connection (modified)
├── generateAnswer.ts       # Ollama connection (modified)
├── retriever.ts            # Vector search
│
├── # Document Ingestion Files
├── index.ts                # Ingestion entry point
├── pipeline.ts             # Ingestion orchestration
├── discoverFiles.ts        # File discovery
├── loadDocuments.ts        # Document loading
├── splitDocuments.ts       # Text chunking
├── embedChunks.ts          # Embedding generation
├── storeEmbeddings.ts      # ChromaDB storage
├── checkExistingChunks.ts  # Deduplication
└── fileCache.ts            # File change tracking (modified)
```
