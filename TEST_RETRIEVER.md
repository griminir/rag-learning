# testRetriever — Usage & examples

This document explains how to run and use `testRetriever.ts` in this repo. It describes CLI flags, expected output, and common troubleshooting.

## Purpose
`testRetriever.ts` is a small test program that:
- Initializes the vector store (via `initVectorStore()`),
- Creates the retriever (loads embedding model),
- Runs a text query against the Chroma collection,
- Prints the top hits and metadata to the console.

Use it to validate retrieval behavior, verify embedding/model setup, and experiment with similarity thresholds.

## Prerequisites
- ChromaDB server running (see `CHROMADB.md`): e.g. `npm run db:start`
- Vector store populated (run npm start)
- Node environment with `tsx` available (already used in project)

## How to run
PowerShell / Command Prompt:

- Default run (uses default query):
  npx tsx .\testRetriever.ts

- Run with custom query:
  npx tsx .\testRetriever.ts "How do vector DBs work?"

- Run with query + minimum similarity filter:
  npx tsx .\testRetriever.ts "How do vector DBs work?" --minScore=0.7

- Alternate minScore syntax (dash):
  npx tsx .\testRetriever.ts "How do vector DBs work?" --min-score=0.7

- Trailing numeric arg is accepted as minScore if in [0,1]:
  npx tsx .\testRetriever.ts "How do vector DBs work?" 0.7

## CLI options (supported)
- --minScore=NUM or --min-score=NUM
  - NUM must be in [0, 1]
  - Filters out results with normalized score < NUM
- Trailing numeric argument in [0,1] is treated as minScore
- Any other positional args are joined into the query string

Notes:
- The script does not currently accept `k` (number of results) via CLI. To change `k`, edit the call to `createRetriever(collection, { k: ... })` or modify the script to add a `--k` flag.

## Score semantics
- Scores printed are normalized to [0..1].
- Computation: Chroma returns distance = 1 - cosineSimilarity. The retriever computes:
  - cosine = 1 - distance (range -1..1)
  - normalizedScore = (cosine + 1) / 2 → maps to [0..1]
- Use `--minScore` with values like:
  - 0.5 — moderate similarity
  - 0.7 — strong match
  - 0.85+ — very strong match

## Output format
Example console output:
- Query and optional minScore notice:
  Query: How do vector DBs work?
  Using minScore filter: 0.7

- Then for each hit:
  #1  id=...  score=0.8123  source=path/or/source-field
  <document text snippet (up to 600 chars)>
  ---

- On failure the script logs the error and exits with status code 1.

## Tips & troubleshooting
- If `No results found.` appears:
  - Ensure ChromaDB is running and the collection contains embeddings.
  - Lower `--minScore` to see weaker matches.
  - Confirm the embedding model used for indexing matches the retriever model.
- If model loading is slow: the retriever loads the embedding model at start — reuse the retriever in code for multiple queries.
- To inspect raw Chroma responses or change score behavior, edit `retriever.ts` (conversion from distance → score is in that file).

## Suggested improvements
- Add a `--k` flag to control number of results from CLI.
- Add an option to print JSON output (`--json`) for automated testing.
- Add a `--raw` mode to show raw distances / cosine values for debugging.

## Example commands summary
- Default test:
  npx tsx .\testRetriever.ts

- With custom query:
  npx tsx .\testRetriever.ts "What is semantic search?"

- With minScore threshold:
  npx tsx .\testRetriever.ts "What is semantic search?" --minScore=0.65

- Using trailing numeric minScore:
  npx tsx .\testRetriever.ts "What is semantic search?" 0.65