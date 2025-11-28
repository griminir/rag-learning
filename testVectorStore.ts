import { initVectorStore } from "./initVectorStore";

async function testVectorStore() {
  try {
    // Initialize the vector store
    const { client, collection } = await initVectorStore();
    
    // Check collection info
    const count = await collection.count();
    console.log(`\nCollection has ${count} items`);
    
    // Test adding a simple vector
    await collection.add({
      ids: ["test-2"], // Unique ID for the vector should be i dont know for real db
      embeddings: [[0.1, 0.2, 0.3, 0.4]], // Simple 4D vector
      documents: ["This is a test document"],
      metadatas: [{ source: "test" }],
    });
    
    console.log("✓ Successfully added test vector");
    
    // Verify it was added
    const newCount = await collection.count();
    console.log(`Collection now has ${newCount} items`);
    
    // Query the vector
    const results = await collection.query({
      queryEmbeddings: [[0.1, 0.2, 0.3, 0.5]], // play with this
      nResults: 10, // Return up to 10 results
    });
    
    console.log("\nQuery results:");
    console.log(`Found ${results.ids[0].length} matches:`);
    console.log(results);
    
    console.log("\n✓ Vector store is working correctly!");
  } catch (error) {
    console.error("✗ Test failed:", error);
  }
}

// Cosine Similarity (the mathematical concept)
// - 1 = identical (pointing same direction)
// - 0 = orthogonal (unrelated)
// - -1 = opposite
// ChromaDB converts similarity to distance so that "closer to 0 = more similar" 
// is consistent with other distance metrics like Euclidean distance.
// so in chromaDB, distance = 1 - cosine_similarity

testVectorStore();
