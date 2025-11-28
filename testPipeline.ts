import { pipeline } from "./pipeline";
import { initVectorStore } from "./initVectorStore";
import { writeFile, unlink } from "fs/promises";

// Query helper to check what's in the database
async function queryDatabase(collection: any) {
  console.log("\n=== Querying Database Contents ===");
  
  const allData = await collection.get({
    include: ["documents", "metadatas"] as any
  });
  
  console.log(`\n✓ Total chunks in database: ${allData.ids.length}`);
  
  if (allData.ids.length > 0) {
    console.log("\nChunk samples:");
    allData.documents.slice(0, 3).forEach((doc: string, i: number) => {
      console.log(`  ${i + 1}. "${doc.substring(0, 50)}${doc.length > 50 ? '...' : ''}"`);
    });
  }
  
  return allData;
}

// Search for specific text to verify it exists or was removed
async function searchForText(collection: any, searchText: string) {
  console.log(`\n--- Searching for text containing: "${searchText.substring(0, 30)}..." ---`);
  
  const allData = await collection.get({
    include: ["documents"] as any
  });
  
  const matches = allData.documents.filter((doc: string) => 
    doc.toLowerCase().includes(searchText.toLowerCase())
  );
  
  if (matches.length > 0) {
    console.log(`✓ FOUND ${matches.length} chunk(s) containing this text`);
    matches.forEach((match: string) => {
      console.log(`  - "${match}"`);
    });
    return true;
  } else {
    console.log(`✗ NO chunks found containing this text`);
    return false;
  }
}

// Test suite
async function runTests() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║           RAG PIPELINE COMPREHENSIVE TEST SUITE                ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  // TEST 1: Fresh run with original content
  console.log("\n█████ TEST 1: Fresh Run (Original Content) █████");
  
  // Clear cache for fresh test
  await unlink("./data/.file_cache.json").catch(() => {});
  
  let result = await pipeline("input.txt");
  const { collection } = await initVectorStore();
  let data = await queryDatabase(collection);
  
  console.log("\n✓ TEST 1 ASSERTIONS:");
  console.log(`  - Expected 10 chunks, got ${data.ids.length}: ${data.ids.length === 10 ? '✅ PASS' : '❌ FAIL'}`);
  
  const hasLangChain = await searchForText(collection, "LangChain");
  console.log(`  - Should contain "LangChain": ${hasLangChain ? '✅ PASS' : '❌ FAIL'}`);

  // TEST 2: Unchanged file (should skip with file cache)
  console.log("\n\n█████ TEST 2: Unchanged File (File Cache Test) █████");
  result = await pipeline("input.txt");
  data = await queryDatabase(collection);
  
  console.log("\n✓ TEST 2 ASSERTIONS:");
  console.log(`  - Expected 10 chunks, got ${data.ids.length}: ${data.ids.length === 10 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  - Should skip processing (check for "Fast path" message above): Look for ⚡ symbol`);

  // TEST 3: Modified file (new content)
  console.log("\n\n█████ TEST 3: Modified File (New Content) █████");
  
  const newContent = `Vector databases enable semantic search by storing embeddings. Chunks are embedded into high-dimensional vectors.

Similarity search retrieves relevant chunks based on cosine distance. This is the foundation of RAG systems.`;
  
  await writeFile("input.txt", newContent, "utf-8");
  console.log("✓ File changed automatically for testing");
  
  result = await pipeline("input.txt");
  data = await queryDatabase(collection);
  
  console.log("\n✓ TEST 3 ASSERTIONS:");
  console.log(`  - Expected 6 chunks, got ${data.ids.length}: ${data.ids.length === 6 ? '✅ PASS' : '❌ FAIL'}`);
  
  // TEST 4: Verify old text is gone
  console.log("\n\n█████ TEST 4: Old Text Removed █████");
  const hasLangChainAfter = await searchForText(collection, "LangChain");
  console.log(`  - Old text "LangChain" should be gone: ${!hasLangChainAfter ? '✅ PASS' : '❌ FAIL'}`);
  
  const hasRecursive = await searchForText(collection, "RecursiveCharacter");
  console.log(`  - Old text "RecursiveCharacter" should be gone: ${!hasRecursive ? '✅ PASS' : '❌ FAIL'}`);

  // TEST 5: Verify new text exists
  console.log("\n\n█████ TEST 5: New Text Present █████");
  const hasVectorDB = await searchForText(collection, "Vector databases");
  console.log(`  - New text "Vector databases" should exist: ${hasVectorDB ? '✅ PASS' : '❌ FAIL'}`);
  
  const hasCosine = await searchForText(collection, "cosine distance");
  console.log(`  - New text "cosine distance" should exist: ${hasCosine ? '✅ PASS' : '❌ FAIL'}`);
  
  const hasRAG = await searchForText(collection, "RAG systems");
  console.log(`  - New text "RAG systems" should exist: ${hasRAG ? '✅ PASS' : '❌ FAIL'}`);

  // Cleanup: Restore original file
  console.log("\n\n█████ Cleanup: Restoring Original File █████");
  const originalContent = `This is a sample text file for demonstrating document loading and text chunking with LangChain.

The RecursiveCharacterTextSplitter will break this text into smaller chunks while maintaining some overlap between chunks to preserve context.

This helps when working with large documents that need to be processed by language models with token limits.`;
  await writeFile("input.txt", originalContent, "utf-8");
  console.log("✓ Original content restored");
  
  // Clear cache so next run processes fresh
  await unlink("./data/.file_cache.json").catch(() => {});
  console.log("✓ File cache cleared");

  // Summary
  console.log("\n\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║                    TEST SUITE COMPLETE                         ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
}

runTests();
