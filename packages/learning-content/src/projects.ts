import type { ProjectDef } from './types';

/**
 * The ten AI labs. Milestones are the real checklist; the full guides (architecture, source code,
 * troubleshooting and so on) are authored in a later phase and tracked by `status` on the lab pages.
 */
export const projects: readonly ProjectDef[] = [
  {
    slug: 'ts-llm-api-client',
    title: 'Lab 1: TypeScript LLM API client',
    goal: 'Build a small, fully typed client for a local LLM endpoint with streaming, retries and tests.',
    summary:
      'You will talk to Ollama over plain HTTP from TypeScript: typed requests and responses, newline-delimited JSON streaming, cancellation, timeouts and exponential backoff. The same client shape later swaps to any OpenAI-compatible provider.',
    difficulty: 'beginner',
    estimatedHours: 6,
    prerequisites: ['llm-api-integration', 'inference-and-serving-basics'],
    stack: ['TypeScript', 'zod', 'vitest', 'Ollama REST API'],
    milestones: [
      [
        'Scaffold the package',
        'Create a strict TypeScript package with Vitest and an ESLint/Prettier setup.',
      ],
      [
        'Typed chat call',
        'Implement chat() against the local endpoint with Zod-validated request and response types.',
      ],
      [
        'Streaming',
        'Parse newline-delimited JSON chunks into an async iterator with AbortSignal cancellation.',
      ],
      [
        'Resilience',
        'Add timeouts, retries with exponential backoff and jitter, and a clear error taxonomy.',
      ],
      [
        'Tests and examples',
        'Cover the client with a mocked HTTP server and publish runnable usage examples.',
      ],
    ],
  },
  {
    slug: 'prompt-playground',
    title: 'Lab 2: Prompt playground and structured output explorer',
    goal: 'Compare prompts and models side by side and enforce structured JSON output with schemas.',
    summary:
      'A small web app for iterating on prompts: variables, presets, side-by-side model runs, JSON-schema constrained output and a history of experiments saved in SQLite.',
    difficulty: 'beginner',
    estimatedHours: 8,
    prerequisites: ['prompt-engineering', 'structured-outputs', 'ts-llm-api-client'],
    stack: ['TypeScript', 'React', 'zod', 'SQLite with Drizzle ORM', 'Ollama'],
    milestones: [
      ['Prompt editor', 'Build an editor with variables, presets and a live rendered prompt.'],
      ['Side-by-side runs', 'Run one prompt against two models and compare latency and output.'],
      ['Structured output', 'Define Zod schemas and request schema-constrained JSON responses.'],
      ['Validation feedback', 'Show schema violations clearly and allow one-click retry with the error.'],
      ['Experiment history', 'Persist prompt versions and results so experiments are reproducible.'],
    ],
  },
  {
    slug: 'embeddings-semantic-search',
    title: 'Lab 3: Embeddings and semantic search visualizer',
    goal: 'See embeddings work: generate vectors, search by meaning and visualize neighbours in 2D.',
    summary:
      'Embed a small corpus with a local embedding model, implement cosine similarity and top-k search from scratch, project vectors to two dimensions and compare brute-force search with an approximate index.',
    difficulty: 'intermediate',
    estimatedHours: 8,
    prerequisites: ['embeddings-explained', 'vector-similarity-and-cosine', 'embedding-generation'],
    stack: ['TypeScript', 'Ollama embeddings API', 'A small PCA implementation', 'Chroma (optional)'],
    milestones: [
      ['Embed a corpus', 'Generate and cache embeddings for 100 to 500 short documents.'],
      ['Cosine top-k', 'Implement cosine similarity and top-k search without a vector database.'],
      ['2D projection', 'Project embeddings with PCA and plot them interactively.'],
      ['Query playground', 'Add a search box that highlights nearest neighbours and their scores.'],
      ['Approximate search', 'Compare brute force with an HNSW index and record the speed and recall trade-off.'],
    ],
  },
  {
    slug: 'pdf-qa-app',
    title: 'Lab 4: PDF Q&A application',
    goal: 'Upload a PDF and ask questions that are answered with page-level citations.',
    summary:
      'A complete small RAG app: validated PDF upload, per-page text extraction, chunking with overlap, embeddings, retrieval and answers that cite the pages they used.',
    difficulty: 'intermediate',
    estimatedHours: 12,
    prerequisites: [
      'document-ingestion-and-pdf-loaders',
      'chunking-strategies',
      'generation-with-citations',
    ],
    stack: ['TypeScript', 'Express', 'A PDF text extraction library', 'Ollama', 'SQLite'],
    milestones: [
      ['Safe upload', 'Accept only PDFs within size and page limits and reject everything else clearly.'],
      ['Per-page extraction', 'Extract text page by page and keep source metadata.'],
      ['Chunk and embed', 'Chunk with overlap, embed the chunks and store vectors with page references.'],
      ['Cited answers', 'Retrieve top-k chunks and answer with page citations.'],
      ['Failure handling', 'Handle scanned or empty PDFs and an offline model with helpful messages.'],
    ],
  },
  {
    slug: 'local-rag-chatbot',
    title: 'Lab 5: Working local RAG chatbot',
    goal: 'Ship a chat interface over your own documents that runs fully on your machine.',
    summary:
      'Persistent vector storage, history-aware query rewriting, streaming answers with citations, a retrieval-only fallback when no model is running, and an evaluation set to measure hit rate.',
    difficulty: 'intermediate',
    estimatedHours: 16,
    prerequisites: ['pdf-qa-app', 'retrieval-basics', 'context-construction'],
    stack: ['TypeScript', 'Express with SSE', 'Chroma', 'Ollama chat and embeddings', 'React'],
    milestones: [
      ['Persistent vectors', 'Store vectors durably so restarts do not re-embed everything.'],
      ['History-aware retrieval', 'Rewrite follow-up questions into standalone queries.'],
      ['Streaming chat UI', 'Stream answers token by token and render clickable citations.'],
      ['Offline fallback', 'Show retrieval-only results with a clear label when the model is unavailable.'],
      ['Evaluation set', 'Write 30 question and answer pairs and report retrieval hit rate.'],
    ],
  },
  {
    slug: 'hybrid-retrieval-reranking',
    title: 'Lab 6: Hybrid retrieval and reranking experiment',
    goal: 'Measure whether keyword search, vectors, fusion and reranking actually improve results.',
    summary:
      'Implement BM25, combine it with dense retrieval using reciprocal rank fusion, add a reranker and build an evaluation harness that reports recall@k and MRR for every strategy.',
    difficulty: 'advanced',
    estimatedHours: 14,
    prerequisites: ['hybrid-retrieval-and-bm25', 'reranking', 'retrieval-evaluation'],
    stack: ['TypeScript', 'A BM25 implementation', 'Ollama', 'vitest'],
    milestones: [
      ['BM25 search', 'Implement or integrate BM25 keyword retrieval over the same corpus.'],
      ['Rank fusion', 'Combine dense and sparse rankings with reciprocal rank fusion.'],
      ['Reranker', 'Add a cross-encoder or LLM-based reranker for the top candidates.'],
      ['Evaluation harness', 'Compute recall@k and MRR against a labelled query set.'],
      ['Experiment report', 'Write up dense vs sparse vs hybrid vs reranked with latency and cost.'],
    ],
  },
  {
    slug: 'langchain-tool-assistant',
    title: 'Lab 7: LangChain.js tool-calling assistant',
    goal: 'Build an assistant that decides when to call typed tools and recovers from tool failures.',
    summary:
      'Wrap a chat model with LangChain.js, expose two Zod-typed tools, implement the tool-calling loop with an iteration guard and test it against mocked models.',
    difficulty: 'intermediate',
    estimatedHours: 10,
    prerequisites: ['langchain-core-concepts', 'langchain-tools', 'function-and-tool-calling'],
    stack: ['TypeScript', '@langchain/core', 'A LangChain Ollama integration', 'zod', 'vitest'],
    milestones: [
      ['Model wrapper', 'Create a configurable chat model wrapper with provider selection.'],
      ['Typed tools', 'Define two tools with Zod schemas and clear descriptions.'],
      ['Tool-calling loop', 'Run the loop with a maximum-iteration guard and structured final answer.'],
      ['Failure handling', 'Handle failing or slow tools without crashing the conversation.'],
      ['Tracing and tests', 'Trace tool calls and cover the flow with integration tests on mocked models.'],
    ],
  },
  {
    slug: 'langgraph-workflow-agent',
    title: 'Lab 8: LangGraph.js workflow agent',
    goal: 'Implement a multi-step agent as a stateful graph with persistence and human approval.',
    summary:
      'Model a research-and-action workflow as a LangGraph state graph: planner, tool and responder nodes, conditional routing, checkpointed runs you can resume, an approval step before side effects and a clear failure path.',
    difficulty: 'advanced',
    estimatedHours: 16,
    prerequisites: ['nodes-edges-and-routing', 'checkpointing-and-persistence', 'human-in-the-loop'],
    stack: ['TypeScript', '@langchain/langgraph', '@langchain/core', 'Ollama', 'SQLite or in-memory checkpointer'],
    milestones: [
      ['State graph', 'Define the state schema and nodes for the workflow.'],
      ['Conditional routing', 'Route between planner, tools and responder based on state.'],
      ['Checkpoints', 'Persist state so a run can be paused and resumed.'],
      ['Human approval', 'Interrupt before side-effecting actions and resume on approval.'],
      ['Failure path', 'Add retries, a dead-end route and user-facing error messages.'],
    ],
  },
  {
    slug: 'multi-document-rag',
    title: 'Lab 9: Multi-document RAG application',
    goal: 'Answer questions across many documents with filters, deduplicated context and per-source citations.',
    summary:
      'Ingest a folder of mixed documents with metadata, filter by document, date and tags at query time, merge overlapping context, show confidence signals and enforce document-level access checks during retrieval.',
    difficulty: 'advanced',
    estimatedHours: 14,
    prerequisites: ['local-rag-chatbot', 'rag-security', 'production-rag-optimization'],
    stack: ['TypeScript', 'Chroma or pgvector', 'Express', 'Ollama', 'React'],
    milestones: [
      ['Bulk ingestion', 'Ingest a folder of documents with per-document metadata.'],
      ['Metadata filters', 'Filter retrieval by document, date and tags.'],
      ['Context merging', 'Deduplicate and merge overlapping chunks from several documents.'],
      ['Per-source citations', 'Show citations per source with simple confidence signals.'],
      ['Access control', 'Apply document-level permissions before chunks reach the model.'],
    ],
  },
  {
    slug: 'production-ai-app',
    title: 'Lab 10: Production-oriented AI application',
    goal: 'Take one AI feature to production quality: auth, limits, tracing, evals, guardrails and deployment.',
    summary:
      'Wrap an AI service in an authenticated, rate-limited API; add structured logs and traces for every model call; run an evaluation regression suite in CI; add guardrails; containerize it and document deployment and rollback.',
    difficulty: 'advanced',
    estimatedHours: 24,
    prerequisites: ['evaluation-pipelines', 'llm-tracing', 'guardrails', 'dockerizing-ai-apps'],
    stack: ['TypeScript', 'Express with Zod', 'pino', 'OpenTelemetry', 'vitest', 'Docker', 'GitHub Actions'],
    milestones: [
      ['Secured API', 'Add authentication, authorization and rate limiting around the AI endpoint.'],
      ['Tracing and logs', 'Record structured logs and traces for every model call with cost and latency.'],
      ['Evaluation in CI', 'Run a regression dataset on every change and fail on quality drops.'],
      ['Guardrails', 'Validate inputs, detect prompt injection and enforce output schemas.'],
      ['Deploy and roll back', 'Containerize, deploy and document rollback and incident steps.'],
    ],
  },
];
