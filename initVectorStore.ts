import { ChromaClient } from "chromadb";

const COLLECTION_NAME = "test_collection"; // should probably be a param

// Initialize ChromaDB vector store
export async function initVectorStore() {
  console.log(`Initializing ChromaDB...`);
  
  // Suppress ChromaDB's default embedding function warnings
  // We provide embeddings directly via Transformers.js
  const originalConsoleWarn = console.warn;
  console.warn = () => {};
  
  // ChromaDB requires a running server
  const client = new ChromaClient({
    path: "http://localhost:8000"
  });

  // Get or create collection
  let collection;
  try {
    collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { "hnsw:space": "cosine" }, // Use cosine similarity
    });
    
    // Restore console.warn
    console.warn = originalConsoleWarn;
    
    console.log(`✓ Collection "${COLLECTION_NAME}" ready`);
  } catch (error) {
    // Restore console.warn even on error
    console.warn = originalConsoleWarn;
    console.error("✗ ChromaDB server not running at http://localhost:8000");
    console.error("Start with: chroma run --path ./data/vector_store --port 8000");
    throw error;
  }

  return { client, collection };
}
