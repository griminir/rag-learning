#!/bin/bash
# Script to pull the LLM model into the Ollama container
# Run this after starting the containers with: docker compose up -d

echo "Pulling llama3.1:8b model into Ollama container..."
echo "This may take a while (model is ~4.7GB)..."
echo ""

docker exec -it rag-ollama ollama pull llama3.1:8b

echo ""
echo "Done! You can now use the RAG CLI:"
echo "  docker exec -it rag-cli tsx testRag.ts \"Your question here\""
