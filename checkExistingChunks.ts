import { createHash } from "crypto";
import type { Collection } from "chromadb";
import type { Document } from "@langchain/core/documents";

interface ChunkStatus {
  needsEmbedding: Document[];
  existing: Array<{
    chunk: Document;
    id: string;
    embedding: number[];
  }>;
}

// Check which chunks already exist in ChromaDB
export async function checkExistingChunks(
  collection: Collection,
  chunks: Document[],
  sourceFile: string
): Promise<ChunkStatus> {
  const clearSource = sourceFile.split("\\").pop() || sourceFile.split("/").pop() || sourceFile;

  // OPTIMIZATION #3: Generate deterministic IDs in parallel batches
  console.log("\nGenerating chunk IDs in parallel...");
  const BATCH_SIZE = 100;
  const chunkIds: string[] = [];
  
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchIds = await Promise.all(
      batch.map(async (chunk) => {
        const hash = createHash("sha256");
        hash.update(chunk.pageContent);
        hash.update(clearSource);
        return hash.digest("hex").substring(0, 36);
      })
    );
    chunkIds.push(...batchIds);
  }

  console.log("Checking for existing chunks in ChromaDB...");

  // Query ChromaDB for these specific IDs
  try {
    const existingData = await collection.get({
      ids: chunkIds,
      include: ["embeddings"] as any, // Include embeddings to reuse them
    });

    const existingIds = new Set(existingData.ids);
    const existingMap = new Map<string, number[]>();

    // Map existing IDs to their embeddings
    existingData.ids.forEach((id, index) => {
      if (existingData.embeddings && existingData.embeddings[index]) {
        existingMap.set(id, existingData.embeddings[index]);
      }
    });

    const needsEmbedding: Document[] = [];
    const existing: Array<{ chunk: Document; id: string; embedding: number[] }> = [];

    chunks.forEach((chunk, index) => {
      const id = chunkIds[index];
      if (existingIds.has(id)) {
        const embedding = existingMap.get(id);
        if (embedding) {
          existing.push({ chunk, id, embedding });
        } else {
          needsEmbedding.push(chunk);
        }
      } else {
        needsEmbedding.push(chunk);
      }
    });

    console.log(`✓ Found ${existing.length} existing chunks (reusing embeddings)`);
    console.log(`✓ Need to embed ${needsEmbedding.length} new chunks`);

    return { needsEmbedding, existing };
  } catch (error) {
    // If query fails, assume all chunks need embedding
    console.log("✓ No existing chunks found, will embed all");
    return { needsEmbedding: chunks, existing: [] };
  }
}
