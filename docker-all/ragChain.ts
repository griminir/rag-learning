import { initVectorStore } from './initVectorStore';
import { createRetriever } from './retriever';
import { generateAnswer, formatContext } from './generateAnswer';

// Configuration
const DEFAULT_K = 5; // Number of documents to retrieve
const DEFAULT_MIN_SCORE = 0.5; // Minimum relevance score threshold

interface RAGOptions {
  k?: number; // Number of documents to retrieve
  minScore?: number; // Minimum similarity score filter
  verbose?: boolean; // Print retrieved documents
  stream?: boolean; // Stream tokens to console
  allowFallback?: boolean; // Allow LLM to use general knowledge if no context
  onToken?: (token: string) => void; // Callback for streaming tokens
}

interface RAGResponse {
  answer: string;
  sources: Array<{
    id: string;
    text: string;
    score: number;
    source: string;
  }>;
  query: string;
}

/**
 * Execute the full RAG pipeline:
 * 1. Retrieve relevant documents from vector store
 * 2. Format documents into context
 * 3. Generate answer using LLM
 *
 * @param query - The user's question
 * @param options - Configuration options
 * @returns RAG response with answer and sources
 */
export async function ragQuery(
  query: string,
  options?: RAGOptions
): Promise<RAGResponse> {
  const opts = {
    k: options?.k ?? DEFAULT_K,
    minScore: options?.minScore ?? DEFAULT_MIN_SCORE,
    verbose: options?.verbose ?? false,
    stream: options?.stream ?? false,
    allowFallback: options?.allowFallback ?? false,
    onToken: options?.onToken,
  };

  // Step 1: Initialize vector store and retriever
  console.log('Connecting to vector store...');
  const { collection } = await initVectorStore();

  const retriever = await createRetriever(collection, {
    k: opts.k,
    minScore: opts.minScore,
  });

  // Step 2: Retrieve relevant documents
  console.log(
    `\nSearching for relevant documents (k=${opts.k}, minScore=${opts.minScore})...`
  );
  const retrievedDocs = await retriever.retrieve(query, opts.k, opts.minScore);

  if (opts.verbose) {
    console.log(`\nRetrieved ${retrievedDocs.length} documents:`);
    retrievedDocs.forEach((doc, idx) => {
      console.log(
        `  ${idx + 1}. [${(doc.score * 100).toFixed(1)}%] ${
          doc.metadata?.source || 'unknown'
        }`
      );
    });
  }

  // Step 3: Format context from retrieved documents
  const context = formatContext(retrievedDocs);

  // Step 4: Generate answer using LLM
  if (opts.stream) {
    console.log('\nGenerating response (streaming)...\n');
  } else {
    console.log('\nGenerating response...');
  }

  const answer = await generateAnswer(query, context, {
    stream: opts.stream,
    allowFallback: opts.allowFallback,
    onToken: opts.onToken,
  });

  // Build response with sources
  const sources = retrievedDocs.map((doc) => ({
    id: doc.id,
    text: doc.text,
    score: doc.score,
    source: doc.metadata?.source || 'unknown',
  }));

  return {
    answer,
    sources,
    query,
  };
}

/**
 * Simple query function that just returns the answer string
 * @param query - The user's question
 * @returns The generated answer
 */
export async function ask(query: string): Promise<string> {
  const response = await ragQuery(query, { verbose: false });
  return response.answer;
}
