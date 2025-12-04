import { ChromaClient } from 'chromadb';

const COLLECTION_NAME = 'test_collection'; // should probably be a param

// Docker ChromaDB URL - connects to chromadb service
const CHROMADB_URL = 'http://chromadb:8000';

// Initialize ChromaDB vector store
export async function initVectorStore() {
  console.log(`Initializing ChromaDB...`);

  // Suppress ChromaDB's default embedding function warnings
  // We provide embeddings directly via Transformers.js
  const originalConsoleWarn = console.warn;
  console.warn = () => {};

  // ChromaDB requires a running server
  const client = new ChromaClient({
    path: CHROMADB_URL,
  });

  // Get or create collection
  let collection;
  try {
    collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { 'hnsw:space': 'cosine' }, // Use cosine similarity
    });

    // Restore console.warn
    console.warn = originalConsoleWarn;

    console.log(`✓ Collection "${COLLECTION_NAME}" ready`);
  } catch (error) {
    // Restore console.warn even on error
    console.warn = originalConsoleWarn;
    console.error(`✗ ChromaDB server not running at ${CHROMADB_URL}`);
    console.error(
      'Ensure the chromadb container is running: docker compose up -d'
    );
    throw error;
  }

  return { client, collection };
}
