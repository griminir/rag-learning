# ChromaDB with Docker

## Start ChromaDB
```powershell
npm run db:start
```

This will:
- Pull the ChromaDB Docker image (if needed)
- Start ChromaDB on http://localhost:8000
- Store data in `./data/vector_store` (persisted on your machine)

## Stop ChromaDB
```powershell
npm run db:stop
```

## View Logs
```powershell
npm run db:logs
```

## Test the Connection and that the database works
```powershell
npx tsx testVectorStore.ts
```
