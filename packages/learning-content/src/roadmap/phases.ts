import type { RoadmapPhaseDef } from '../types';

export const roadmapPhases: readonly RoadmapPhaseDef[] = [
  {
    key: 'foundations',
    title: 'Foundations',
    summary: 'AI fundamentals, LLM basics, DSA patterns and high-level design basics.',
    weekStart: 1,
    weekEnd: 4,
  },
  {
    key: 'building-blocks',
    title: 'Building blocks',
    summary:
      'LLM APIs, prompting, embeddings, vector databases, trees, graphs, caching and scalability.',
    weekStart: 5,
    weekEnd: 8,
  },
  {
    key: 'applications',
    title: 'Applications',
    summary: 'RAG applications, LangChain.js, advanced DSA, message queues and distributed systems.',
    weekStart: 9,
    weekEnd: 12,
  },
  {
    key: 'advanced-systems',
    title: 'Advanced systems',
    summary: 'Advanced RAG, LangGraph agents, dynamic programming, LLD and design patterns.',
    weekStart: 13,
    weekEnd: 16,
  },
  {
    key: 'production',
    title: 'Production',
    summary: 'Production AI, evaluation, MCP, cloud architecture and advanced system design.',
    weekStart: 17,
    weekEnd: 20,
  },
  {
    key: 'capstone',
    title: 'Capstone and readiness',
    summary: 'Capstone AI project, portfolio, mock interviews, DSA revision and design assessments.',
    weekStart: 21,
    weekEnd: 24,
  },
];
