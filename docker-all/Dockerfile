# Node.js 18+ container for RAG CLI
FROM node:20-slim

# Install curl for healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json tsconfig.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY *.ts ./

# Create directories (will be mounted at runtime)
RUN mkdir -p /app/docs /app/data

# Default command: keep container running for interactive use
CMD ["tail", "-f", "/dev/null"]
