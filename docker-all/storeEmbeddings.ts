import { createHash } from 'crypto';
import type { Collection } from 'chromadb';

interface EmbeddedChunk {
  metadata: any;
  text: string;
  embedding: number[];
}

// Step 4: Store embeddings in ChromaDB with smart deduplication
export async function storeEmbeddings(
  collection: Collection,
  embedded: EmbeddedChunk[],
  clearSource?: string
) {
  console.log('\nStoring embeddings in ChromaDB...');

  // Generate deterministic IDs based on content hash
  const newIds = embedded.map((e) => {
    const hash = createHash('sha256')
      .update(e.text)
      .update(e.metadata.source || '')
      .digest('hex');
    return hash.substring(0, 36);
  });

  // Find and remove stale chunks first (to check if any work is needed)
  let staleIds: string[] = [];
  if (clearSource) {
    try {
      const existing = await collection.get({
        where: { source: clearSource },
      });

      staleIds = existing.ids.filter((id) => !newIds.includes(id));
    } catch (error) {
      // No existing chunks
    }
  }

  // OPTIMIZATION #4: Skip DB operations if nothing changed
  const hasNewChunks = embedded.some((e) => e.embedding.length > 0); // Check if there are new embeddings
  if (!hasNewChunks && staleIds.length === 0) {
    console.log(
      `⚡ Fast path: All ${embedded.length} chunks already in database with correct data, skipping upsert`
    );
    return newIds;
  }

  // Extract embeddings, documents, and metadata
  const embeddings = embedded.map((e) => e.embedding);
  const documents = embedded.map((e) => e.text);
  // ChromaDB only accepts flat metadata (string, number, boolean)
  const metadatas = embedded.map((e) => ({
    source: e.metadata.source || 'unknown',
  }));

  // Upsert chunks (updates existing, inserts new - no re-embedding needed for unchanged chunks)
  await collection.upsert({
    ids: newIds,
    embeddings,
    documents,
    metadatas,
  });

  console.log(`✓ Upserted ${embedded.length} chunks`);

  // Remove stale chunks if any were found
  if (staleIds.length > 0) {
    await collection.delete({
      ids: staleIds,
    });
    console.log(`✓ Removed ${staleIds.length} stale chunks`);
  } else {
    console.log(`✓ No stale chunks found`);
  }

  console.log(`Sample IDs: ${newIds.slice(0, 3).join(', ')}...`);

  return newIds;
}
