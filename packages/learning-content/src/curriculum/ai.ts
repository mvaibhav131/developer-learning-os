import { lessons } from '../builders';
import type { TrackDef } from '../types';

export const aiTrack: TrackDef = {
  slug: 'ai',
  title: 'AI Engineering Academy',
  shortTitle: 'AI Engineering',
  icon: 'brain',
  description:
    'From machine-learning intuition to production LLM systems: embeddings, RAG, LangChain.js, LangGraph.js agents, MCP and evaluation, taught with a TypeScript-first mindset.',
  courses: [
    {
      slug: 'ai-fundamentals',
      title: 'AI Fundamentals',
      subtitle: 'The mental models behind modern AI',
      description:
        'Start from zero in machine learning: what models are, how they learn and why transformers changed everything. Math is taught as engineering intuition, with TypeScript examples instead of notebooks.',
      difficulty: 'beginner',
      icon: 'brain',
      tags: ['machine learning', 'neural networks', 'math intuition', 'transformers'],
      outcomes: [
        'Explain supervised, unsupervised and reinforcement learning with real examples',
        'Reason about loss, gradients and overfitting when a model misbehaves',
        'Describe at a high level why the transformer architecture works',
      ],
      modules: [
        {
          slug: 'what-ai-is',
          title: 'What AI really is',
          description: 'The vocabulary and categories you will use for the rest of the academy.',
          lessons: lessons([
            ['what-is-ai', 'What is AI?', 'b', 25],
            ['ai-vs-ml-vs-deep-learning', 'AI vs machine learning vs deep learning', 'b', 25],
            [
              'supervised-and-unsupervised-learning',
              'Supervised, unsupervised and reinforcement learning',
              'b',
              35,
            ],
          ]),
        },
        {
          slug: 'math-intuition',
          title: 'Math intuition for engineers',
          description: 'Just enough statistics, probability and linear algebra to read ML material.',
          lessons: lessons([
            ['statistics-and-probability-for-ml', 'Statistics and probability for ML', 'b', 45],
            [
              'linear-algebra-intuition',
              'Linear algebra intuition: vectors, matrices and dot products',
              'b',
              40,
            ],
          ]),
        },
        {
          slug: 'how-models-learn',
          title: 'How models learn',
          description:
            'Neural networks, loss, gradient descent and the difference between training and inference.',
          lessons: lessons([
            ['neural-networks-basics', 'Neural networks from first principles', 'i', 45],
            ['loss-functions', 'Loss functions', 'i', 30],
            ['gradient-descent', 'Gradient descent and backpropagation intuition', 'i', 45],
            ['training-vs-inference', 'Training vs inference', 'b', 25],
            ['overfitting-and-generalization', 'Overfitting, underfitting and generalization', 'b', 30],
            ['transformers-introduction', 'Transformers: the 40-minute introduction', 'i', 40],
          ]),
        },
      ],
    },
    {
      slug: 'llm-fundamentals',
      title: 'LLM Fundamentals',
      subtitle: 'How large language models work and how to control them',
      description:
        'Tokens, embeddings, attention and context windows explained visually, followed by the levers you use every day: sampling, prompts, structured outputs and tool calling.',
      difficulty: 'intermediate',
      icon: 'sparkles',
      tags: ['llm', 'tokens', 'prompting', 'tool calling', 'evaluation'],
      outcomes: [
        'Explain tokenization, embeddings and attention to another engineer',
        'Choose temperature, prompts and structured-output settings deliberately',
        'Select and evaluate models for cost, latency, quality and licensing',
      ],
      modules: [
        {
          slug: 'inside-an-llm',
          title: 'Inside an LLM',
          description: 'What happens between your prompt and the first generated token.',
          lessons: lessons([
            ['what-is-an-llm', 'What is an LLM?', 'b', 30],
            ['tokens-and-tokenization', 'Tokens and tokenization', 'b', 35],
            ['embeddings-explained', 'Embeddings explained', 'i', 40],
            ['attention-mechanism', 'The attention mechanism', 'i', 45],
            ['transformer-architecture', 'Transformer architecture end to end', 'i', 50],
            ['context-windows', 'Context windows and memory limits', 'b', 25],
            ['model-parameters-and-scale', 'Model parameters, scale and memory', 'i', 30],
          ]),
        },
        {
          slug: 'controlling-output',
          title: 'Controlling model output',
          description: 'Sampling, prompts, schemas and tools: the practical levers.',
          lessons: lessons([
            ['temperature-and-sampling', 'Temperature, top-p, top-k and sampling', 'b', 30],
            ['prompt-engineering', 'Prompt engineering that survives production', 'i', 45],
            ['structured-outputs', 'Structured outputs and JSON schemas', 'i', 40],
            ['function-and-tool-calling', 'Function and tool calling', 'i', 45],
            ['inference-and-serving-basics', 'Inference: latency, throughput and batching', 'i', 35],
          ]),
        },
        {
          slug: 'choosing-and-trusting',
          title: 'Choosing and trusting models',
          description: 'Selection, failure modes, security and evaluation.',
          lessons: lessons([
            ['model-selection', 'Model selection: quality, cost and latency', 'i', 35],
            ['hallucinations', 'Hallucinations: causes and mitigations', 'i', 35],
            ['prompt-injection', 'Prompt injection and LLM security basics', 'i', 40],
            ['model-evaluation', 'Evaluating models and prompts', 'i', 45],
            ['quantization', 'Quantization and running models locally', 'i', 40],
            [
              'open-weight-vs-proprietary',
              'Open-weight vs proprietary models and their licenses',
              'b',
              30,
            ],
          ]),
        },
      ],
    },
    {
      slug: 'rag-mastery',
      title: 'RAG Mastery',
      subtitle: 'Retrieval-augmented generation from basics to production',
      description:
        'Ingestion, chunking, embeddings, vector stores, hybrid retrieval, reranking and evaluation, then advanced patterns such as agentic and corrective RAG with security and production tuning.',
      difficulty: 'intermediate',
      icon: 'database',
      tags: ['rag', 'embeddings', 'vector databases', 'retrieval', 'evaluation'],
      outcomes: [
        'Build and evaluate an end-to-end RAG pipeline with citations',
        'Choose chunking, retrieval and reranking strategies based on measurements',
        'Defend a RAG system against poisoning, leakage and prompt injection',
      ],
      modules: [
        {
          slug: 'rag-foundations',
          title: 'RAG foundations',
          description: 'Why RAG exists and how the pipeline fits together.',
          lessons: lessons([
            ['why-rag-exists', 'Why RAG exists', 'b', 25],
            ['rag-vs-fine-tuning', 'RAG vs fine-tuning vs long context', 'i', 35],
            ['rag-pipeline-overview', 'The RAG pipeline end to end', 'i', 30],
            [
              'rag-visualizer-walkthrough',
              'Walkthrough: the RAG pipeline visualizer',
              'i',
              30,
              'lab',
            ],
          ]),
        },
        {
          slug: 'ingestion-and-indexing',
          title: 'Ingestion and indexing',
          description: 'Turning documents into searchable vectors.',
          lessons: lessons([
            [
              'document-ingestion-and-pdf-loaders',
              'Document ingestion, PDF loaders and text extraction',
              'i',
              50,
            ],
            ['chunking-strategies', 'Chunking: fixed, recursive, overlap and metadata', 'i', 50],
            ['embedding-generation', 'Generating embeddings at scale', 'i', 35],
            ['vector-similarity-and-cosine', 'Vector similarity and cosine distance', 'i', 35],
            ['vector-databases-chroma', 'Vector databases with Chroma', 'i', 40],
            ['pgvector-in-postgres', 'pgvector inside PostgreSQL', 'i', 40],
          ]),
        },
        {
          slug: 'retrieval-and-generation',
          title: 'Retrieval and generation',
          description: 'Finding the right context and turning it into a cited answer.',
          lessons: lessons([
            ['retrieval-basics', 'Retrieval: top-k, thresholds and filters', 'i', 35],
            ['hybrid-retrieval-and-bm25', 'Hybrid retrieval and BM25', 'a', 45],
            ['query-rewriting-and-multi-query', 'Query rewriting and multi-query RAG', 'a', 40],
            ['reranking', 'Reranking retrieved chunks', 'a', 40],
            ['context-construction', 'Context construction and prompt assembly', 'i', 35],
            ['generation-with-citations', 'Answer generation with source citations', 'i', 40],
          ]),
        },
        {
          slug: 'evaluation-and-advanced-rag',
          title: 'Evaluation and advanced RAG',
          description: 'Measuring quality, advanced architectures, security and tuning.',
          lessons: lessons([
            ['retrieval-evaluation', 'Retrieval evaluation: recall, MRR and nDCG', 'a', 45],
            ['answer-evaluation', 'Answer evaluation: faithfulness and relevance', 'a', 45],
            ['agentic-rag', 'Agentic RAG', 'a', 40],
            ['self-rag-and-corrective-rag', 'Self-RAG and Corrective RAG', 'a', 40],
            ['graph-rag-concepts', 'Graph RAG concepts', 'a', 35],
            ['rag-security', 'RAG security: poisoning, leakage and access control', 'a', 40],
            [
              'production-rag-optimization',
              'Production RAG: latency, cost and quality tuning',
              'a',
              50,
            ],
          ]),
        },
      ],
    },
    {
      slug: 'langchain-js',
      title: 'LangChain.js',
      subtitle: 'Compose LLM applications in TypeScript',
      description:
        'Chat models, prompts, structured output, tools, loaders, splitters, vector stores and runnable chains, plus streaming, error handling and tests.',
      difficulty: 'intermediate',
      icon: 'workflow',
      tags: ['langchain', 'typescript', 'chains', 'tools', 'streaming'],
      outcomes: [
        'Compose prompts, models, parsers and retrievers into maintainable chains',
        'Stream responses and handle provider failures gracefully',
        'Test LLM-backed code without calling a live model',
      ],
      modules: [
        {
          slug: 'core-building-blocks',
          title: 'Core building blocks',
          description: 'Models, prompts, schemas and tools.',
          lessons: lessons([
            ['langchain-core-concepts', 'LangChain.js core concepts', 'i', 35],
            ['chat-models', 'Chat models and providers', 'i', 35],
            ['prompt-templates', 'Prompt templates and message history', 'i', 35],
            ['structured-output-langchain', 'Structured output with Zod', 'i', 35],
            ['langchain-tools', 'Defining and calling tools', 'i', 40],
          ]),
        },
        {
          slug: 'retrieval-with-langchain',
          title: 'Retrieval with LangChain',
          description: 'Loaders, splitters, vector stores and retrievers.',
          lessons: lessons([
            ['document-loaders-and-splitters', 'Document loaders and text splitters', 'i', 40],
            ['vector-stores-and-retrievers', 'Vector stores and retrievers', 'i', 40],
            ['lcel-chains-and-composition', 'Runnables, chains and composition', 'i', 45],
          ]),
        },
        {
          slug: 'shipping-langchain-apps',
          title: 'Shipping LangChain apps',
          description: 'Streaming, resilience, testing and a production example.',
          lessons: lessons([
            ['streaming-responses', 'Streaming responses end to end', 'i', 40],
            ['langchain-error-handling', 'Retries, fallbacks and error handling', 'i', 35],
            ['testing-llm-applications', 'Testing LLM applications', 'a', 45],
            [
              'langchain-production-example',
              'Production example: a documentation assistant API',
              'a',
              60,
            ],
          ]),
        },
      ],
    },
    {
      slug: 'langgraph-agents',
      title: 'LangGraph.js and AI Agents',
      subtitle: 'Stateful, durable and observable agent workflows',
      description:
        'Model agents as graphs with explicit state, routing, checkpoints and human approval, then extend to multi-agent systems and MCP while designing for security and observability.',
      difficulty: 'advanced',
      icon: 'git-branch',
      tags: ['agents', 'langgraph', 'mcp', 'multi-agent', 'observability'],
      outcomes: [
        'Design agent state, nodes and conditional edges for a multi-step workflow',
        'Add checkpointing, retries and human-in-the-loop controls',
        'Build and secure MCP servers and clients in TypeScript',
      ],
      modules: [
        {
          slug: 'agent-fundamentals',
          title: 'Agent fundamentals',
          description: 'The tool-calling loop, state and graph structure.',
          lessons: lessons([
            ['what-is-an-agent', 'What is an AI agent?', 'i', 30],
            ['agent-tool-calling-loop', 'The tool-calling loop', 'i', 40],
            ['agent-state-design', 'Agent state design', 'i', 35],
            ['nodes-edges-and-routing', 'Nodes, edges and conditional routing', 'a', 45],
            ['state-machines-for-agents', 'Agents as state machines', 'a', 35],
          ]),
        },
        {
          slug: 'durable-agents',
          title: 'Durable and controlled agents',
          description: 'Persistence, human approval and failure handling.',
          lessons: lessons([
            ['checkpointing-and-persistence', 'Checkpointing and persistence', 'a', 45],
            ['human-in-the-loop', 'Human-in-the-loop workflows', 'a', 40],
            ['retries-and-failure-handling', 'Retries and failure handling in graphs', 'a', 40],
            ['multi-step-workflows', 'Multi-step workflows', 'a', 45],
          ]),
        },
        {
          slug: 'multi-agent-patterns',
          title: 'Multi-agent patterns',
          description: 'Supervisors, planners and reflection.',
          lessons: lessons([
            ['multi-agent-systems', 'Multi-agent systems', 'a', 40],
            ['supervisor-pattern', 'The supervisor pattern', 'a', 40],
            ['planning-agents', 'Planning agents', 'a', 40],
            ['reflection-pattern', 'Reflection and self-critique', 'a', 35],
          ]),
        },
        {
          slug: 'mcp-and-safe-agents',
          title: 'MCP and safe agents',
          description: 'Model Context Protocol, security and observability.',
          lessons: lessons([
            ['mcp-fundamentals', 'Model Context Protocol fundamentals', 'i', 40],
            ['mcp-servers-and-clients', 'Building MCP servers and clients in TypeScript', 'a', 55],
            ['agent-security', 'Agent security', 'a', 40],
            ['agent-observability', 'Agent observability and tracing', 'a', 40],
          ]),
        },
      ],
    },
    {
      slug: 'production-ai',
      title: 'Production AI Engineering',
      subtitle: 'Ship LLM features that are fast, safe and measurable',
      description:
        'Integration patterns, local serving, caching, retries, prompt versioning, evaluation pipelines, tracing, guardrails, privacy, authentication, rate limiting, Docker and AWS deployment.',
      difficulty: 'advanced',
      icon: 'rocket',
      tags: ['production', 'evaluation', 'observability', 'security', 'deployment'],
      outcomes: [
        'Design evaluation and tracing so regressions are caught before users notice',
        'Apply guardrails, privacy controls and authorization to AI endpoints',
        'Package and deploy an AI service within cost and latency budgets',
      ],
      modules: [
        {
          slug: 'serving-and-integration',
          title: 'Serving and integration',
          description: 'Calling, streaming and caching models reliably.',
          lessons: lessons([
            ['llm-api-integration', 'LLM API integration patterns', 'i', 40],
            ['local-model-serving', 'Local model serving with Ollama', 'i', 40],
            ['streaming-over-http', 'Streaming responses over SSE and WebSockets', 'i', 40],
            ['caching-llm-calls', 'Caching: exact, semantic and prompt caching', 'a', 40],
            ['retry-strategies-llm', 'Retry, timeout and fallback strategies', 'i', 35],
          ]),
        },
        {
          slug: 'trust-quality-operations',
          title: 'Trust, quality and operations',
          description: 'Versioning, evaluation, tracing, guardrails and privacy.',
          lessons: lessons([
            ['prompt-versioning', 'Prompt versioning and release management', 'a', 35],
            ['evaluation-pipelines', 'Evaluation pipelines and regression tests', 'a', 50],
            ['llm-tracing', 'Tracing and observability for LLM apps', 'a', 45],
            ['guardrails', 'Guardrails and output validation', 'a', 40],
            ['data-privacy-for-ai', 'Data privacy for AI applications', 'i', 35],
            ['llm-security-threat-model', 'LLM application threat model', 'a', 45],
          ]),
        },
        {
          slug: 'auth-limits-delivery',
          title: 'Auth, limits and delivery',
          description: 'Access control, quotas, containers, cloud and cost.',
          lessons: lessons([
            [
              'ai-api-authentication-and-authorization',
              'Authentication and authorization for AI APIs',
              'a',
              40,
            ],
            ['rate-limiting-ai-endpoints', 'Rate limiting and quotas for AI endpoints', 'a', 35],
            ['dockerizing-ai-apps', 'Docker deployment for AI applications', 'a', 45],
            ['aws-deployment-for-ai', 'AWS deployment concepts for AI workloads', 'a', 45],
            ['performance-and-cost-optimization', 'Performance and cost optimization', 'a', 45],
          ]),
        },
      ],
    },
  ],
};
