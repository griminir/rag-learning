import { ChatOllama } from '@langchain/ollama';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// Configuration - Docker Ollama URL connects to ollama service
const MODEL_NAME = 'llama3.1:8b';
const OLLAMA_BASE_URL = 'http://ollama:11434';

// # On the remote server, set this environment variable before starting Ollama:
//OLLAMA_HOST=0.0.0.0:11434 ollama serve
// this makes Ollama listen on all interfaces, allowing access from other machines
// model must be available locally on the server
// firewall must allow access to port 11434 or the chosen port

// System prompt instructing the LLM to answer based on provided context
const SYSTEM_PROMPT_STRICT = `You are a helpful assistant that answers questions based on the provided context.
Your answers should be:
- Based ONLY on the information in the context provided
- Concise and directly addressing the question
- Honest about uncertainty - if the context doesn't contain enough information, say so

If the context doesn't contain relevant information to answer the question, respond with:
"I don't have enough information in the provided documents to answer that question."

Do NOT make up information or use knowledge outside of the provided context.`;

// System prompt that allows fallback to general knowledge
const SYSTEM_PROMPT_FALLBACK = `You are a helpful assistant that answers questions.
Your answers should be:
- Based primarily on the provided context when relevant
- Concise and directly addressing the question
- Clearly indicate when you're using general knowledge vs the provided context

If the context doesn't contain relevant information, you may use your general knowledge to answer,
but clearly indicate that the answer is not from the provided documents.`;

interface GenerateOptions {
  stream?: boolean; // Enable streaming of tokens
  allowFallback?: boolean; // Allow LLM to use general knowledge if no context
  onToken?: (token: string) => void; // Callback for streaming tokens
}

// Initialize the Ollama chat model (lazy singleton)
let llmInstance: ChatOllama | null = null;

function getLLM(): ChatOllama {
  if (!llmInstance) {
    llmInstance = new ChatOllama({
      model: MODEL_NAME,
      baseUrl: OLLAMA_BASE_URL,
      temperature: 0.3, // Lower temperature for more focused, factual responses
    });
  }
  return llmInstance;
}

/**
 * Generate an answer using the LLM based on retrieved context
 * @param query - The user's question
 * @param context - The retrieved document content to use as context
 * @param options - Generation options (stream, allowFallback, onToken callback)
 * @returns The generated answer
 */
export async function generateAnswer(
  query: string,
  context: string,
  options?: GenerateOptions
): Promise<string> {
  const llm = getLLM();
  const stream = options?.stream ?? false;
  const allowFallback = options?.allowFallback ?? false;
  const onToken = options?.onToken;

  // Choose system prompt based on fallback setting
  const systemPrompt = allowFallback
    ? SYSTEM_PROMPT_FALLBACK
    : SYSTEM_PROMPT_STRICT;

  // Build the prompt with context and question
  const userPrompt = `Context:
${context}

Question: ${query}

Answer:`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt),
  ];

  if (stream && onToken) {
    // Streaming mode
    const streamResponse = await llm.stream(messages);
    let fullAnswer = '';

    for await (const chunk of streamResponse) {
      const token = typeof chunk.content === 'string' ? chunk.content : '';
      fullAnswer += token;
      onToken(token);
    }

    return fullAnswer;
  } else {
    // Non-streaming mode
    console.log('Generating answer with Ollama...');
    const response = await llm.invoke(messages);

    // Extract the text content from the response
    const answer =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

    return answer;
  }
}

/**
 * Format retrieved documents into a context string
 * @param documents - Array of retrieved documents with text and metadata
 * @returns Formatted context string
 */
export function formatContext(
  documents: Array<{ text: string; metadata: any; score: number }>
): string {
  if (documents.length === 0) {
    return 'No relevant documents found.';
  }

  return documents
    .map((doc, idx) => {
      const source = doc.metadata?.source || 'unknown';
      return `[Document ${idx + 1}] (Source: ${source}, Relevance: ${(
        doc.score * 100
      ).toFixed(1)}%)
${doc.text}`;
    })
    .join('\n\n---\n\n');
}
