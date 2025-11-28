import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

// Step 2: Split documents into chunks
export async function splitDocuments(docs: Document[]) {
  console.log("\nSplitting documents into chunks...");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 50,
    chunkOverlap: 10,
  });

  const chunks = await splitter.splitDocuments(docs);
  
  console.log(`Created ${chunks.length} chunks`);

  chunks.forEach((chunk, i) => {
    console.log(`\n--- Chunk ${i + 1} (${chunk.pageContent.length} chars) ---`);
    console.log(chunk.pageContent);
    
    // Show overlap with next chunk for visualization
    if (i < chunks.length - 1) {
      const nextChunk = chunks[i + 1].pageContent;
      const currentEnd = chunk.pageContent;
      
      let overlap = "";
      for (let len = Math.min(currentEnd.length, nextChunk.length); len > 0; len--) {
        const currentSuffix = currentEnd.slice(-len);
        const nextPrefix = nextChunk.slice(0, len);
        if (currentSuffix === nextPrefix) {
          overlap = currentSuffix;
          break;
        }
      }
      
      if (overlap) {
        console.log(`↓ OVERLAP (${overlap.length} chars): "${overlap}"`);
      }
    }
  });
  
  console.log(chunks);
  return chunks;
}
