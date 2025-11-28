import { initVectorStore } from "./initVectorStore";
import { createRetriever } from "./retriever";

function parseArgs(argv: string[]) {
  let minScore: number | undefined;
  const otherArgs: string[] = [];

  for (const a of argv) {
    if (a.startsWith("--minScore=") || a.startsWith("--min-score=")) {
      const v = a.split("=")[1];
      const n = Number(v);
      if (!Number.isNaN(n)) minScore = Math.max(0, Math.min(1, n));
      continue;
    }
    // allow a numeric trailing arg as minScore
    const n = Number(a);
    if (!Number.isNaN(n) && a.match(/^-?\d+(\.\d+)?$/)) {
      // treat as minScore only if in [0,1]
      if (n >= 0 && n <= 1) {
        minScore = n;
        continue;
      }
    }
    otherArgs.push(a);
  }

  const query = otherArgs.join(" ");
  return { query, minScore };
}

async function testRetriever() {
  try {
    const { collection } = await initVectorStore();

    // Create retriever (loads embedding model)
    const retriever = await createRetriever(collection, { k: 5 });

    const { query: rawQuery, minScore } = parseArgs(process.argv.slice(2));
    const query = rawQuery || "What is semantic search?";
    console.log(`Query: ${query}`);
    if (typeof minScore === "number") console.log(`Using minScore filter: ${minScore}`);

    const hits = await retriever.retrieve(query, 5, minScore);

    if (!hits || hits.length === 0) {
      console.log("No results found.");
      return;
    }

    console.log(`Found ${hits.length} results:`);
    for (let i = 0; i < hits.length; i++) {
      const h = hits[i];
      console.log(`\n#${i + 1}  id=${h.id}  score=${h.score.toFixed(4)}  source=${h.metadata?.source || "unknown"}`);
      console.log(h.text.slice(0, 600));
      console.log("---");
    }
  } catch (err) {
    console.error("Test retriever failed:", err);
    process.exit(1);
  }
}

testRetriever();
