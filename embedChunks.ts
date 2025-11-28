import { Document } from "@langchain/core/documents";
import { pipeline as transformersPipeline } from "@xenova/transformers";

// Step 3: Generate embeddings for chunks (only for new chunks)
export async function embedChunks(chunks: Document[]) {
  if (chunks.length === 0) {
    console.log("\n✓ No new chunks to embed (all exist in database)");
    return [];
  }

  console.log("\nLoading embedding model...");
  
  const extractor = await transformersPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  console.log(`Generating embeddings for ${chunks.length} new chunks...`);
  const vectors = await Promise.all(
    chunks.map(async (c) => {
      const output = await extractor(c.pageContent, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    })
  );

  const embedded = chunks.map((chunk, i) => ({
    metadata: chunk.metadata,
    text: chunk.pageContent,
    embedding: vectors[i],
  }));

  console.log(`✓ Created ${embedded.length} new embeddings, each with ${embedded[0].embedding.length} dimensions`);
  return embedded;
}
