import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

// Step 2: Split documents into chunks
export async function splitDocuments(docs: Document[], verbose = false) {
  console.log("\nSplitting documents into chunks...");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const chunks = await splitter.splitDocuments(docs);
  
  console.log(`Created ${chunks.length} chunks`);

  if (verbose) {
    chunks.forEach((chunk, i) => {
      console.log(`\n--- Chunk ${i + 1} (${chunk.pageContent.length} chars) ---`);
      console.log(chunk.pageContent.slice(0, 100) + "...");
    });
  }
  
  return chunks;
}
