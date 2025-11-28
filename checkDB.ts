import { initVectorStore } from "./initVectorStore";

async function checkDB() {
  const { collection } = await initVectorStore();
  
  const results = await collection.get();
  
  console.log(`\nTotal chunks in database: ${results.ids.length}`);
  
  if (results.ids.length > 0) {
    console.log(`\nSample chunks:`);
    results.ids.slice(0, 5).forEach((id, i) => {
      console.log(`\nID: ${id}`);
      console.log(`Source: ${results.metadatas?.[i]?.source}`);
      console.log(`Text: ${results.documents?.[i]?.substring(0, 50)}...`);
    });
  } else {
    console.log("\n⚠️ Database is empty!");
  }
}

checkDB();
