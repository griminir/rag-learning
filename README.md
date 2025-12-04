# RAG Learning Project

A Retrieval-Augmented Generation (RAG) pipeline built with TypeScript, ChromaDB, and Ollama.

## Prerequisites

Before running this project, you need the following installed:

### 1. Node.js (v20+)

Download from [nodejs.org](https://nodejs.org/) or use nvm:

```bash
nvm install 20
nvm use 20
```

### 2. Docker Desktop

Required for running ChromaDB. Download from [docker.com](https://www.docker.com/products/docker-desktop/).

After installation, make sure Docker Desktop is running.

### 3. Ollama

Required for the LLM. Download from [ollama.ai](https://ollama.ai/).

After installation, pull the required model:

```bash
ollama pull llama3.1:8b
```

Verify it's working:

```bash
ollama list
```

## Installation

1. Clone the repository:

```bash
git clone https://github.com/griminir/rag-learning.git
cd rag-learning
```

2. Install dependencies:

```bash
npm install
```

3. Start ChromaDB:

```bash
npm run db:start
```

## Quick Start

### 1. Index Documents

Add your `.txt` or `.md` files to the project root or a subdirectory, then update `index.ts` to point to them:

```typescript
await pipeline("./docs");  // Index all files in docs folder
await pipeline("myfile.txt");  // Index a single file
await pipeline(["file1.txt", "file2.txt"]);  // Index multiple files
```

Run the ingestion pipeline:

```bash
npm run start
```

### 2. Query Your Documents

```bash
npm run test:rag -- "Your question here"
```

## TestRag CLI

The `testRag.ts` script provides a command-line interface for querying the RAG pipeline.

### Basic Usage

```bash
npm run test:rag -- "your question here" [options]
```

**Important**: The `--` before your question is required to pass arguments to the script.

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--k=<number>` | | Number of documents to retrieve (default: 5) |
| `--minScore=<0-1>` | | Minimum relevance score threshold (default: 0.5) |
| `--verbose` | `-v` | Show retrieved documents with relevance scores |
| `--stream` | `-s` | Stream tokens as they generate (recommended) |
| `--fallback` | `-f` | Allow LLM to use general knowledge if no relevant context |

### Examples

**Basic query:**

```bash
npm run test:rag -- "What is semantic search?"
```

**Stream output in real-time:**

```bash
npm run test:rag -- "What is chunking?" --stream
```

**With verbose output (see what documents were retrieved):**

```bash
npm run test:rag -- "How do embeddings work?" --verbose
```

**Allow fallback to general knowledge:**

```bash
npm run test:rag -- "What is quantum computing?" --fallback
```

**Combine multiple options:**

```bash
npm run test:rag -- "Explain vector databases" -s -v --k=3
```

**Adjust relevance threshold:**

```bash
npm run test:rag -- "What is HNSW?" --minScore=0.7
```

### Output

The CLI displays:

1. The question being asked
2. Active modes (streaming, fallback)
3. The generated answer
4. Retrieved document sources with relevance scores
5. Total execution time

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Run the ingestion pipeline |
| `npm run test:rag -- "question"` | Query the RAG system |
| `npm run db:start` | Start ChromaDB container |
| `npm run db:stop` | Stop ChromaDB container |
| `npm run db:destroy` | Remove ChromaDB container |
| `npm run db:reset` | Reset database (clears all data) |
| `npm run db:logs` | View ChromaDB logs |

## Project Structure

```
rag-learn/
├── index.ts              # Main entry point for ingestion
├── pipeline.ts           # Orchestrates the ingestion pipeline
├── loadDocuments.ts      # Loads files from disk
├── splitDocuments.ts     # Splits documents into chunks
├── embedChunks.ts        # Generates embeddings
├── storeEmbeddings.ts    # Stores in ChromaDB
├── retriever.ts          # Semantic search retrieval
├── generateAnswer.ts     # LLM answer generation
├── ragChain.ts           # Full RAG pipeline orchestration
├── testRag.ts            # CLI for testing queries
├── docker-compose.yml    # ChromaDB container config
└── docs/                 # Sample documents
```

## Configuration

### Changing the LLM Model

Edit `generateAnswer.ts`:

```typescript
const MODEL_NAME = "llama3.1:8b";  // Change to any Ollama model
```

### Adjusting Chunk Size

Edit `splitDocuments.ts`:

```typescript
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,     // Characters per chunk
  chunkOverlap: 50,   // Overlap between chunks
});
```

### Connecting to Remote Ollama

Edit `generateAnswer.ts`:

```typescript
const OLLAMA_BASE_URL = "http://your-server-ip:11434";
```

## Troubleshooting

### "Ollama is not running"

Make sure Ollama is installed and the model is pulled:

```bash
ollama pull llama3.1:8b
ollama list
```

### "ChromaDB is not running"

Start the Docker container:

```bash
npm run db:start
```

Check if Docker Desktop is running.

### "No results found"

- Make sure you've indexed documents first (`npm run start`)
- Try lowering the `--minScore` threshold
- Check if your query relates to the indexed content
