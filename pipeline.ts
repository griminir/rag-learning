import { loadDocuments } from "./loadDocuments";
import { splitDocuments } from "./splitDocuments";
import { embedChunks } from "./embedChunks";
import { storeEmbeddings } from "./storeEmbeddings";
import { initVectorStore } from "./initVectorStore";
import { checkExistingChunks } from "./checkExistingChunks";
import { hasFileChanged, updateFileCache, getCachedChunkCount } from "./fileCache";
import { discoverFiles } from "./discoverFiles";

// Main pipeline with smart embedding optimization
export async function pipeline(inputPath: string | string[]) {
  // Discover all files to process
  const filePaths = await discoverFiles(inputPath, {
    extensions: [".txt", ".md"],
    recursive: false
  });
  
  if (filePaths.length === 0) {
    console.log(`\n⚠️ No files found matching: ${inputPath}`);
    return { ids: [], collection: null };
  }
  
  console.log(`\n📂 Found ${filePaths.length} file(s) to process:`);
  filePaths.forEach(fp => console.log(`   - ${fp}`));
  
  // Initialize vector store ONCE for all files
  const { collection } = await initVectorStore(); // this should probably be initilized later right before needed
  
  let totalProcessed = 0;
  let totalNew = 0;
  let totalReused = 0;
  let totalSkipped = 0;
  
  // Process each file
  for (const filePath of filePaths) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 Processing: ${filePath}`);
    console.log('='.repeat(60));
  
    // OPTIMIZATION #1: Check if file changed - skip everything if unchanged
    const fileChanged = await hasFileChanged(filePath);
    if (!fileChanged) {
      const cachedCount = await getCachedChunkCount(filePath);
      console.log(`⚡ Fast path: File unchanged, ${cachedCount} chunks already in database`);
      totalSkipped++;
      totalProcessed += cachedCount || 0;
      continue;
    }
    
    // step 1 data ingestion
    const docs = await loadDocuments(filePath);
    // step 2 chucking
    const chunks = await splitDocuments(docs);
    
    // OPTIMIZATION #2: Check which chunks already exist (to avoid re-embedding)
    const { needsEmbedding, existing } = await checkExistingChunks(collection, chunks, filePath);
    
    // step 3 embedding
    // Only embed new chunks
    const newEmbeddings = await embedChunks(needsEmbedding);
    
    // Combine new embeddings with existing ones
    const allEmbeddings = [
      ...newEmbeddings,
      ...existing.map(e => ({
        metadata: e.chunk.metadata,
        text: e.chunk.pageContent,
        embedding: e.embedding
      }))
    ];
    
    // step 4 storing the embeddings
    const ids = await storeEmbeddings(collection, allEmbeddings, filePath);

    // Update cache after successful processing
    await updateFileCache(filePath, ids.length);
    
    totalProcessed += ids.length;
    totalNew += newEmbeddings.length;
    totalReused += existing.length;
    
    console.log(`✓ File complete: ${ids.length} chunks (${newEmbeddings.length} new, ${existing.length} reused)`);
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✓ Pipeline complete!`);
  console.log(`   Files processed: ${filePaths.length - totalSkipped}/${filePaths.length}`);
  console.log(`   Files skipped (unchanged): ${totalSkipped}`);
  console.log(`   Total chunks: ${totalProcessed}`);
  console.log(`   New embeddings: ${totalNew}`);
  console.log(`   Reused embeddings: ${totalReused}`);
  console.log('='.repeat(60));
  
  return { totalProcessed, totalNew, totalReused, collection };
}