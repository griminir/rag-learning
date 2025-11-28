import { readdir, stat } from "fs/promises";
import { join, extname } from "path";

export interface FileDiscoveryOptions {
  // Glob-like patterns: e.g., ["*.txt", "*.md"]
  extensions?: string[];
  // Recursive search
  recursive?: boolean;
  // Maximum depth for recursive search
  maxDepth?: number;
}


// Discover files in a directory based on patterns
export async function discoverFiles(
  pathOrPaths: string | string[],
  options: FileDiscoveryOptions = {}
): Promise<string[]> {
  const { extensions = [".txt", ".md"], recursive = false, maxDepth = 10 } = options;
  
  // Normalize to array
  const paths = Array.isArray(pathOrPaths) ? pathOrPaths : [pathOrPaths];
  const allFiles: string[] = [];
  
  for (const path of paths) {
    const files = await discoverFilesInPath(path, extensions, recursive, maxDepth, 0);
    allFiles.push(...files);
  }
  
  // Deduplicate and sort
  return [...new Set(allFiles)].sort();
}

async function discoverFilesInPath(
  path: string,
  extensions: string[],
  recursive: boolean,
  maxDepth: number,
  currentDepth: number
): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const stats = await stat(path);
    
    // If it's a file, check if it matches our extensions
    if (stats.isFile()) {
      const ext = extname(path).toLowerCase();
      if (extensions.includes(ext)) {
        files.push(path);
      }
      return files;
    }
    
    // If it's a directory, scan it
    if (stats.isDirectory()) {
      if (currentDepth >= maxDepth) {
        console.log(`⚠️ Max depth reached for ${path}`);
        return files;
      }
      
      const entries = await readdir(path, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(path, entry.name);
        
        if (entry.isFile()) {
          const ext = extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        } else if (entry.isDirectory() && recursive) {
          const subFiles = await discoverFilesInPath(
            fullPath,
            extensions,
            recursive,
            maxDepth,
            currentDepth + 1
          );
          files.push(...subFiles);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error processing ${path}:`, error instanceof Error ? error.message : error);
  }
  
  return files;
}
