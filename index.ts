import { pipeline } from "./pipeline";

// Example usage: Call pipeline programmatically

async function main() {
  // Process a single file
  // await pipeline("input.txt");
  
  // Process multiple files
  await pipeline(["input.txt", "input2.txt"]);
  
  // Process all files in current directory
  // await pipeline(".");
  
  // Process files in a subdirectory
  // await pipeline("./docs");
}

main();
