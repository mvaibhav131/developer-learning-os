import { lessons } from '../builders';
import type { TrackDef } from '../types';

export const interviewTrack: TrackDef = {
  slug: 'interview',
  title: 'Senior Interview Preparation',
  shortTitle: 'Interviews',
  icon: 'target',
  description:
    'Role-specific guides, interview craft for system design and DSA, mock interview playbooks and self-scoring rubrics for senior full-stack, backend, AI, LLM application and RAG roles.',
  courses: [
    {
      slug: 'interview-role-tracks',
      title: 'Role-Specific Interview Guides',
      subtitle: 'What each senior role is really tested on',
      description:
        'What interviewers look for in senior full-stack, backend, AI engineer, LLM application engineer and RAG engineer loops, with the topics, depth and follow-ups to prepare.',
      difficulty: 'advanced',
      icon: 'target',
      tags: ['senior full-stack', 'backend', 'ai engineer', 'llm engineer', 'rag engineer'],
      outcomes: [
        'Map your experience to the competencies each role is hiring for',
        'Prepare focused study plans per role instead of generic revision',
        'Anticipate follow-up questions and prepare evidence-backed answers',
      ],
      modules: [
        {
          slug: 'role-guides',
          title: 'Role guides',
          description: 'One guide per target role.',
          lessons: lessons([
            ['senior-fullstack-interview-guide', 'Senior Full-Stack Developer interviews', 'a', 40],
            ['senior-backend-interview-guide', 'Senior Backend Developer interviews', 'a', 40],
            ['ai-engineer-interview-guide', 'AI Engineer interviews', 'a', 40],
            [
              'llm-application-engineer-interview-guide',
              'LLM Application Engineer interviews',
              'a',
              40,
            ],
            ['rag-engineer-interview-guide', 'RAG Engineer interviews', 'a', 40],
          ]),
        },
      ],
    },
    {
      slug: 'interview-craft',
      title: 'System Design and DSA Interview Craft',
      subtitle: 'Structure, communication and trade-off reasoning',
      description:
        'A repeatable framework for system design interviews, how to communicate while coding, how to approach scenario-based debugging and how to argue architecture trade-offs.',
      difficulty: 'advanced',
      icon: 'sparkles',
      tags: ['system design interview', 'dsa interview', 'debugging', 'trade-offs'],
      outcomes: [
        'Run a system design interview with a clear structure and time boxes',
        'Narrate your thinking while coding without losing momentum',
        'Defend architectural decisions with explicit trade-offs',
      ],
      modules: [
        {
          slug: 'interview-techniques',
          title: 'Interview techniques',
          description: 'Frameworks you can rehearse and reuse.',
          lessons: lessons([
            ['system-design-interview-framework', 'The system design interview framework', 'a', 45],
            ['dsa-interview-communication', 'Communicating in DSA interviews', 'i', 35],
            ['scenario-based-debugging-interviews', 'Scenario-based debugging questions', 'a', 40],
            ['architecture-trade-off-questions', 'Architecture trade-off questions', 'a', 40],
          ]),
        },
      ],
    },
    {
      slug: 'mock-interviews',
      title: 'Mock Interviews and Readiness',
      subtitle: 'Practise under pressure and measure honestly',
      description:
        'How to run and review mock interviews, score yourself against rubrics without fooling yourself, and prepare behavioral and leadership answers for senior roles.',
      difficulty: 'intermediate',
      icon: 'flask',
      tags: ['mock interview', 'rubrics', 'behavioral', 'leadership'],
      outcomes: [
        'Run a timed mock interview and extract concrete improvement actions',
        'Self-score with rubrics and track readiness over time',
        'Tell structured stories about leadership, conflict and delivery',
      ],
      modules: [
        {
          slug: 'mock-interview-practice',
          title: 'Mock interview practice',
          description: 'Process, rubrics and behavioral preparation.',
          lessons: lessons([
            ['mock-interview-playbook', 'How to run and review a mock interview', 'i', 30],
            ['self-scoring-rubrics', 'Self-scoring with rubrics', 'i', 30],
            [
              'behavioral-and-leadership-questions',
              'Behavioral and leadership questions for senior roles',
              'i',
              40,
            ],
          ]),
        },
      ],
    },
  ],
};
