import { ragQuery } from "./ragChain";

function parseArgs(argv: string[]) {
  let minScore: number | undefined;
  let k: number | undefined;
  let verbose = false;
  let stream = false;
  let fallback = false;
  const queryParts: string[] = [];

  for (const arg of argv) {
    // Parse --minScore=0.5 or --min-score=0.5
    if (arg.startsWith("--minScore=") || arg.startsWith("--min-score=")) {
      const v = parseFloat(arg.split("=")[1]);
      if (!isNaN(v)) minScore = Math.max(0, Math.min(1, v));
      continue;
    }
    // Parse --k=5
    if (arg.startsWith("--k=")) {
      const v = parseInt(arg.split("=")[1], 10);
      if (!isNaN(v) && v > 0) k = v;
      continue;
    }
    // Parse --verbose or -v
    if (arg === "--verbose" || arg === "-v") {
      verbose = true;
      continue;
    }
    // Parse --stream or -s
    if (arg === "--stream" || arg === "-s") {
      stream = true;
      continue;
    }
    // Parse --fallback or -f (allow LLM to use general knowledge)
    if (arg === "--fallback" || arg === "-f") {
      fallback = true;
      continue;
    }
    // Everything else is part of the query
    queryParts.push(arg);
  }

  return {
    query: queryParts.join(" "),
    minScore,
    k,
    verbose,
    stream,
    fallback,
  };
}

async function main() {
  const { query, minScore, k, verbose, stream, fallback } = parseArgs(process.argv.slice(2));

  if (!query) {
    console.log("Usage: tsx testRag.ts <your question> [options]");
    console.log("");
    console.log("Options:");
    console.log("  --k=<number>       Number of documents to retrieve (default: 5)");
    console.log("  --minScore=<0-1>   Minimum relevance score (default: 0.5)");
    console.log("  --verbose, -v      Show retrieved documents");
    console.log("  --stream, -s       Stream tokens as they generate");
    console.log("  --fallback, -f     Allow LLM to use general knowledge if no context");
    console.log("");
    console.log("Examples:");
    console.log('  tsx testRag.ts "What is semantic search?"');
    console.log('  tsx testRag.ts "How do vector databases work?" --stream');
    console.log('  tsx testRag.ts "What is quantum computing?" --fallback');
    console.log('  tsx testRag.ts "Explain embeddings" --k=3 --verbose --stream');
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("RAG Query Test");
  console.log("=".repeat(60));
  console.log(`\nQuestion: ${query}`);
  if (fallback) console.log("Mode: Fallback enabled (will use general knowledge if needed)");
  if (stream) console.log("Output: Streaming");
  console.log("");

  try {
    const startTime = Date.now();
    
    const response = await ragQuery(query, {
      k: k ?? 5,
      minScore: minScore ?? 0.5,
      verbose: verbose,
      stream: stream,
      allowFallback: fallback,
      onToken: stream ? (token) => process.stdout.write(token) : undefined,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    if (stream) {
      // Add newline after streamed output
      console.log("\n");
    } else {
      console.log("\n" + "=".repeat(60));
      console.log("ANSWER");
      console.log("=".repeat(60));
      console.log(response.answer);
    }

    console.log("-".repeat(60));
    console.log(`Sources (${response.sources.length} documents):`);
    response.sources.forEach((src, idx) => {
      console.log(`  ${idx + 1}. ${src.source} (relevance: ${(src.score * 100).toFixed(1)}%)`);
    });

    console.log("\n" + "-".repeat(60));
    console.log(`Total time: ${elapsed}s`);

  } catch (error: any) {
    if (error.message?.includes("ECONNREFUSED") && error.message?.includes("11434")) {
      console.error("\n✗ Ollama is not running!");
      console.error("  Start Ollama with: ollama serve");
      console.error("  Then pull the model: ollama pull llama3.1:8b");
    } else if (error.message?.includes("ECONNREFUSED") && error.message?.includes("8000")) {
      console.error("\n✗ ChromaDB is not running!");
      console.error("  Start with: npm run db:start");
    } else {
      console.error("\n✗ Error:", error.message || error);
    }
    process.exit(1);
  }
}

main();
