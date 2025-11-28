import { readFile } from "fs/promises";
import { Document } from "@langchain/core/documents";

// Step 1: Load documents (plain text only)
export async function loadDocuments(filePath: string) {
  console.log("Loading documents...");
  const text = await readFile(filePath, "utf-8");
  const docs = [new Document({ pageContent: text, metadata: { source: filePath } })];

  console.log(`Loaded ${docs.length} document(s)`);
  console.log(docs);
  return docs;
}
