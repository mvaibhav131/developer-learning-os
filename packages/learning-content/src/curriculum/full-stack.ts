import { lessons } from '../builders';
import type { TrackDef } from '../types';

export const fullStackTrack: TrackDef = {
  slug: 'full-stack',
  title: 'Full-Stack, Database and Cloud Mastery',
  shortTitle: 'Full-Stack and Cloud',
  icon: 'layers',
  description:
    'Senior-level depth in TypeScript, Node.js internals, API security, PostgreSQL, Redis, MongoDB, Docker, Kubernetes, AWS, Terraform and production operations, built around real scenarios.',
  courses: [
    {
      slug: 'ts-node-internals',
      title: 'Advanced TypeScript and Node.js Internals',
      subtitle: 'The type system and the runtime under your services',
      description:
        'Advanced generics, conditional and mapped types, type-safe API contracts, and how the Node.js event loop, streams and memory model behave in production.',
      difficulty: 'advanced',
      icon: 'code',
      tags: ['typescript', 'node.js', 'event loop', 'streams', 'performance'],
      outcomes: [
        'Model complex domains with generics and conditional types without losing readability',
        'Predict event-loop ordering and avoid blocking the loop',
        'Use streams with backpressure and diagnose memory growth',
      ],
      modules: [
        {
          slug: 'advanced-typescript',
          title: 'Advanced TypeScript',
          description: 'The type system as a design tool.',
          lessons: lessons([
            [
              'ts-type-system-deep-dive',
              'Type system deep dive: generics, conditional and mapped types',
              'a',
              50,
            ],
            ['ts-type-safe-api-patterns', 'Type-safe API contracts with Zod', 'a', 40],
          ]),
        },
        {
          slug: 'node-internals',
          title: 'Node.js internals',
          description: 'Event loop, streams, memory and profiling.',
          lessons: lessons([
            ['node-event-loop', 'The event loop, microtasks and timers', 'a', 45],
            ['node-streams-and-backpressure', 'Streams and backpressure', 'a', 45],
            ['node-memory-and-performance', 'Memory, profiling and performance', 'a', 50],
          ]),
        },
      ],
    },
    {
      slug: 'apis-auth-security',
      title: 'APIs, Authentication and Security',
      subtitle: 'Production-grade interfaces',
      description:
        'REST design details that matter in production, authentication with sessions, JWT and OAuth 2.0, authorization models, the OWASP API risks, real-time systems and testing strategy.',
      difficulty: 'advanced',
      icon: 'shield',
      tags: ['rest', 'authentication', 'authorization', 'owasp', 'websockets', 'testing'],
      outcomes: [
        'Design pagination, error models and versioning that age well',
        'Choose between sessions, JWT and OAuth flows for a given product',
        'Test an API at the right levels without brittle end-to-end suites',
      ],
      modules: [
        {
          slug: 'api-design-and-security',
          title: 'API design and security',
          description: 'Contracts, identity and the OWASP API Top 10.',
          lessons: lessons([
            [
              'rest-api-production-design',
              'Production REST API design: pagination, errors and versioning',
              'a',
              45,
            ],
            ['authentication-sessions-jwt-oauth', 'Authentication: sessions, JWT and OAuth 2.0', 'a', 50],
            ['authorization-rbac-abac', 'Authorization: RBAC, ABAC and ownership checks', 'a', 40],
            ['api-security-owasp', 'API security and the OWASP API Top 10', 'a', 45],
          ]),
        },
        {
          slug: 'realtime-and-testing',
          title: 'Real-time systems and testing',
          description: 'WebSockets at scale and a pragmatic test strategy.',
          lessons: lessons([
            ['websockets-at-scale', 'WebSockets and real-time systems at scale', 'a', 40],
            ['testing-strategies-full-stack', 'Testing strategies: pyramid, contracts and e2e', 'a', 45],
          ]),
        },
      ],
    },
    {
      slug: 'databases-deep-dive',
      title: 'Databases in Depth',
      subtitle: 'PostgreSQL, Redis and MongoDB for senior engineers',
      description:
        'Advanced PostgreSQL queries, execution plans and indexing, transactions and isolation levels, Redis caching patterns and MongoDB data modeling.',
      difficulty: 'advanced',
      icon: 'database',
      tags: ['postgresql', 'sql performance', 'transactions', 'redis', 'mongodb'],
      outcomes: [
        'Read EXPLAIN output and fix slow queries with the right index',
        'Explain isolation levels with a concrete anomaly for each',
        'Model documents and cache keys for access patterns, not for tables',
      ],
      modules: [
        {
          slug: 'postgresql-and-sql',
          title: 'PostgreSQL and SQL performance',
          description: 'Advanced SQL, plans, indexes and transactions.',
          lessons: lessons([
            [
              'postgres-advanced-queries',
              'PostgreSQL advanced queries: CTEs, window functions and JSONB',
              'a',
              50,
            ],
            ['sql-performance-and-indexing', 'SQL performance: EXPLAIN, indexes and query plans', 'a', 50],
            ['transactions-and-isolation', 'Transactions, isolation levels and locking', 'a', 50],
          ]),
        },
        {
          slug: 'redis-and-mongodb',
          title: 'Redis and MongoDB',
          description: 'Caching patterns and document modeling.',
          lessons: lessons([
            ['redis-caching-patterns', 'Redis caching patterns and data structures', 'a', 40],
            ['mongodb-data-modeling', 'MongoDB data modeling', 'i', 40],
          ]),
        },
      ],
    },
    {
      slug: 'cloud-devops-production',
      title: 'Cloud, DevOps and Production Operations',
      subtitle: 'Containers, AWS, Terraform and running software for real',
      description:
        'Docker for production, Kubernetes fundamentals, AWS services (Lambda, S3, API Gateway, SQS, SNS, CloudWatch, ECS), Terraform, CI/CD, logging, production debugging, secure deployment and managing technical debt.',
      difficulty: 'advanced',
      icon: 'cloud',
      tags: ['docker', 'kubernetes', 'aws', 'terraform', 'ci/cd', 'observability'],
      outcomes: [
        'Package, deploy and roll back a service on AWS with infrastructure as code',
        'Debug production incidents using logs, metrics and traces',
        'Plan refactoring and technical-debt work that stakeholders will support',
      ],
      modules: [
        {
          slug: 'containers-and-orchestration',
          title: 'Containers and orchestration',
          description: 'Docker for production and Kubernetes fundamentals.',
          lessons: lessons([
            ['docker-for-production', 'Docker for production', 'a', 45],
            ['kubernetes-fundamentals', 'Kubernetes fundamentals', 'a', 50],
          ]),
        },
        {
          slug: 'aws-services',
          title: 'AWS services',
          description: 'Serverless, messaging, monitoring and containers on AWS.',
          lessons: lessons([
            ['aws-lambda-s3-api-gateway', 'AWS Lambda, S3 and API Gateway', 'a', 50],
            ['aws-sqs-sns-cloudwatch', 'AWS SQS, SNS and CloudWatch', 'a', 45],
            ['aws-ecs-and-containers', 'AWS ECS and container deployment', 'a', 45],
          ]),
        },
        {
          slug: 'delivery-and-operations',
          title: 'Delivery and operations',
          description: 'Infrastructure as code, pipelines, debugging and code health.',
          lessons: lessons([
            ['terraform-infrastructure-as-code', 'Terraform and infrastructure as code', 'a', 50],
            ['ci-cd-pipelines', 'CI/CD pipelines: GitHub Actions and Bamboo', 'a', 45],
            ['secure-deployment', 'Secure deployment and secrets management', 'a', 40],
            ['logging-and-production-debugging', 'Logging and production debugging', 'a', 45],
            ['technical-debt-and-refactoring', 'Technical debt and refactoring strategies', 'a', 40],
          ]),
        },
      ],
    },
  ],
};
