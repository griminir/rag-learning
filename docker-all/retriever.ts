import type { Collection } from 'chromadb';
import { pipeline as transformersPipeline } from '@xenova/transformers';

interface RetrieverOptions {
  k?: number; // default number of results
  modelName?: string; // embedding model name
  minScore?: number; // minimum normalized similarity [0..1] to keep a hit (default 0) fine tune to your dataset
}

interface RetrievedDocument {
  id: string;
  score: number; // similarity score normalized to [0..1] (1 = most similar). computed as ( (1 - distance) + 1 ) / 2
  text: string;
  metadata: any;
}

// Factory: create a retriever bound to a ChromaDB collection
export async function createRetriever(
  collection: Collection,
  options?: RetrieverOptions
) {
  const opts = Object.assign(
    { k: 5, modelName: 'Xenova/all-MiniLM-L6-v2', minScore: 0 },
    options || {}
  );

  // Lazy-load the embedding extractor once and reuse
  console.log('Loading embedding model for retriever...');
  const extractor = await transformersPipeline(
    'feature-extraction',
    opts.modelName
  );

  // Embed a single piece of text into a vector (mean pooling, normalized)
  async function embedText(text: string): Promise<number[]> {
    const out = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(out.data);
  }

  // Retrieve nearest documents for a text query
  // optional overrideMinScore filters out results with normalized score < overrideMinScore
  async function retrieve(
    query: string,
    k?: number,
    overrideMinScore?: number
  ): Promise<RetrievedDocument[]> {
    const n = k || opts.k || 5;
    const effectiveMinScore =
      typeof overrideMinScore === 'number'
        ? overrideMinScore
        : opts.minScore ?? 0;

    // Create embedding for the query
    const queryVector = await embedText(query);

    // Query ChromaDB collection for nearest neighbors
    const results = await collection.query({
      queryEmbeddings: [queryVector],
      nResults: n,
      include: ['metadatas', 'documents', 'distances'] as any,
    });

    // The ChromaDB response is columnar: arrays inside arrays (one query -> index 0)
    const returnedIds = results.ids?.[0] || [];
    const returnedDocuments = results.documents?.[0] || [];
    const returnedMetadatas = results.metadatas?.[0] || [];
    const returnedDistances = results.distances?.[0] || [];

    // Convert distance -> similarity for cosine: similarity = 1 - distance
    // then normalize cosine from [-1,1] to [0,1] and apply the similarity filter
    const retrievedResults: RetrievedDocument[] = [];
    returnedIds.forEach((docId: string, idx: number) => {
      const rawDistance = returnedDistances[idx];
      const cosineSimilarity =
        typeof rawDistance === 'number' ? 1 - rawDistance : 0;
      const normalizedScore = Math.max(
        0,
        Math.min(1, (cosineSimilarity + 1) / 2)
      );
      if (normalizedScore >= effectiveMinScore) {
        retrievedResults.push({
          id: docId,
          score: normalizedScore,
          text: returnedDocuments[idx] || '',
          metadata: returnedMetadatas[idx] || {},
        });
      }
    });

    return retrievedResults;
  }

  return { retrieve };
}
