# TestRag CLI Documentation

A command-line tool for testing the RAG (Retrieval-Augmented Generation) pipeline.

## Usage

```bash
npm run test:rag -- "your question here" [options]
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--k=<number>` | | Number of documents to retrieve (default: 5) |
| `--minScore=<0-1>` | | Minimum relevance score threshold (default: 0.5) |
| `--verbose` | `-v` | Show retrieved documents with relevance scores |
| `--stream` | `-s` | Stream tokens to console as they generate |
| `--fallback` | `-f` | Allow LLM to use general knowledge if no relevant context |

## Examples

### Basic query
```bash
npm run test:rag -- "What is semantic search?"
```

### Stream output in real-time
```bash
npm run test:rag -- "What is chunking?" --stream
```

### With verbose output (show retrieved docs)
```bash
npm run test:rag -- "How do embeddings work?" --verbose
```

### Allow fallback to general knowledge
```bash
npm run test:rag -- "What is quantum computing?" --fallback
```

### Combine multiple options
```bash
npm run test:rag -- "Explain vector databases" --stream --verbose --k=3
```

### Using short flags
```bash
npm run test:rag -- "What is RAG?" -s -v -f
```

### Adjust relevance threshold
```bash
npm run test:rag -- "What is HNSW?" --minScore=0.7
```

## Output

The tool displays:
1. The question being asked
2. Active modes (streaming, fallback)
3. Retrieved document sources with relevance scores
4. The generated answer
5. Total execution time

## Prerequisites

- ChromaDB must be running (`npm run db:start`)
- Ollama must be running with `llama3.1:8b` model pulled
- Documents must be indexed first (`npm run start`)
