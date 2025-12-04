import { createHash } from 'crypto';
import { readFile, access, writeFile, mkdir } from 'fs/promises';
import { constants } from 'fs';
import { dirname } from 'path';

// works as a simple file-based cache to track file changes and chunk counts
// Docker path - cache stored in /app/data
const CACHE_FILE = '/app/data/.file_cache.json';

interface FileCache {
  [filePath: string]: {
    hash: string;
    lastProcessed: number;
    chunkCount: number;
  };
}

// Generate hash of file content
async function hashFile(filePath: string): Promise<string> {
  const content = await readFile(filePath, 'utf-8');
  return createHash('sha256').update(content).digest('hex');
}

// Load cache from disk
async function loadCache(): Promise<FileCache> {
  try {
    await access(CACHE_FILE, constants.R_OK);
    const data = await readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Save cache to disk
async function saveCache(cache: FileCache): Promise<void> {
  // Ensure directory exists
  try {
    await mkdir(dirname(CACHE_FILE), { recursive: true });
  } catch {
    // Directory already exists
  }
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

// Check if file has changed since last processing
export async function hasFileChanged(filePath: string): Promise<boolean> {
  const currentHash = await hashFile(filePath);
  const cache = await loadCache();

  const cached = cache[filePath];

  if (!cached) {
    console.log(`\n🔍 File "${filePath}" not in cache - needs processing`);
    return true;
  }

  if (cached.hash !== currentHash) {
    console.log(`\n🔍 File "${filePath}" changed - needs processing`);
    return true;
  }

  console.log(
    `\n✓ File "${filePath}" unchanged since last run - skipping all processing`
  );
  return false;
}

// Update cache after successful processing
export async function updateFileCache(
  filePath: string,
  chunkCount: number
): Promise<void> {
  const currentHash = await hashFile(filePath);
  const cache = await loadCache();

  cache[filePath] = {
    hash: currentHash,
    lastProcessed: Date.now(),
    chunkCount,
  };

  await saveCache(cache);
}

// Get cached chunk count (for fast return when file unchanged)
export async function getCachedChunkCount(
  filePath: string
): Promise<number | null> {
  const cache = await loadCache();
  return cache[filePath]?.chunkCount || null;
}
