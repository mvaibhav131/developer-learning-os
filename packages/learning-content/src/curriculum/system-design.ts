import { lessons } from '../builders';
import type { TrackDef } from '../types';

export const systemDesignTrack: TrackDef = {
  slug: 'system-design',
  title: 'System Design Academy',
  shortTitle: 'System Design',
  icon: 'network',
  description:
    'High-level and low-level design for senior engineers: scalability, distributed systems, design patterns and sixteen real-world case studies, including AI chatbot, RAG and multi-agent systems.',
  courses: [
    {
      slug: 'hld',
      title: 'High-Level Design',
      subtitle: 'Scalable, reliable distributed architectures',
      description:
        'Networking, APIs, caching, data stores, replication, sharding, messaging, consistency, reliability and observability: the building blocks of every system design interview.',
      difficulty: 'intermediate',
      icon: 'network',
      tags: ['hld', 'scalability', 'caching', 'databases', 'messaging', 'distributed systems'],
      outcomes: [
        'Estimate capacity and choose building blocks with explicit trade-offs',
        'Explain CAP, consistency models and failure handling in plain language',
        'Compare queues, streams and events and know when each one fits',
      ],
      modules: [
        {
          slug: 'foundations-and-networking',
          title: 'Foundations and networking',
          description: 'How clients and servers talk, and the API styles built on top.',
          lessons: lessons([
            ['client-server-architecture', 'Client-server architecture', 'b', 30],
            ['networking-basics', 'Networking basics: IP, ports and latency', 'b', 30],
            ['dns-and-http-https', 'DNS, HTTP and HTTPS', 'b', 35],
            ['tcp-vs-udp', 'TCP vs UDP', 'b', 25],
            ['websockets-and-realtime', 'WebSockets and real-time communication', 'i', 35],
            ['rest-api-design', 'REST API design', 'i', 35],
            ['graphql-fundamentals', 'GraphQL and when to use it', 'i', 30],
          ]),
        },
        {
          slug: 'traffic-and-scaling',
          title: 'Traffic and scaling',
          description: 'Gateways, load balancers, CDNs, caches and capacity planning.',
          lessons: lessons([
            ['api-gateways-and-reverse-proxies', 'API gateways and reverse proxies', 'i', 30],
            ['load-balancing', 'Load balancing', 'i', 35],
            ['cdn-and-edge-caching', 'CDN and edge caching', 'i', 30],
            ['horizontal-vs-vertical-scaling', 'Horizontal vs vertical scaling', 'b', 25],
            ['caching-strategies', 'Caching strategies', 'i', 40],
            ['redis-and-cache-invalidation', 'Redis and cache invalidation', 'i', 40],
            ['rate-limiting-design', 'Rate limiting algorithms', 'i', 35],
            ['capacity-estimation', 'Capacity estimation: back-of-the-envelope math', 'i', 40],
          ]),
        },
        {
          slug: 'data-layer',
          title: 'The data layer',
          description: 'Indexing, SQL vs NoSQL, replication, sharding and consistency.',
          lessons: lessons([
            ['database-indexing-concepts', 'Database indexing', 'i', 35],
            ['sql-vs-nosql', 'SQL vs NoSQL', 'i', 30],
            ['replication', 'Replication', 'i', 35],
            ['sharding-and-partitioning', 'Sharding and partitioning', 'a', 40],
            ['cap-theorem', 'CAP theorem and PACELC', 'a', 35],
            ['consistency-models', 'Consistency models', 'a', 40],
          ]),
        },
        {
          slug: 'reliability-and-distributed-systems',
          title: 'Reliability and distributed systems',
          description: 'Messaging, events, retries, transactions and event-driven patterns.',
          lessons: lessons([
            [
              'availability-reliability-fault-tolerance',
              'Availability, reliability and fault tolerance',
              'i',
              35,
            ],
            ['message-queues', 'Message queues', 'i', 35],
            ['event-driven-architecture', 'Event-driven architecture', 'a', 40],
            ['kafka-fundamentals', 'Kafka fundamentals', 'a', 45],
            ['aws-sns-sqs-lambda', 'AWS SNS, SQS and Lambda patterns', 'a', 40],
            ['retries-backoff-idempotency', 'Retries, backoff and idempotency', 'a', 40],
            ['dead-letter-queues', 'Dead-letter queues and poison messages', 'a', 30],
            ['distributed-transactions', 'Distributed transactions', 'a', 40],
            ['saga-pattern', 'Saga pattern', 'a', 40],
            ['cqrs-and-event-sourcing', 'CQRS and event sourcing', 'a', 45],
          ]),
        },
        {
          slug: 'architecture-styles-and-operations',
          title: 'Architecture styles and operations',
          description: 'Monolith vs microservices, observability and security.',
          lessons: lessons([
            ['monolith-vs-microservices', 'Monolith vs microservices', 'i', 35],
            [
              'distributed-tracing-and-observability',
              'Distributed tracing and observability',
              'a',
              40,
            ],
            ['security-for-system-design', 'Security in system design', 'i', 40],
          ]),
        },
      ],
    },
    {
      slug: 'lld',
      title: 'Low-Level Design',
      subtitle: 'Object-oriented design with TypeScript',
      description:
        'OOP, SOLID, the core design patterns, repositories and dependency injection, clean architecture, UML-style diagrams and unit-testable, maintainable TypeScript.',
      difficulty: 'intermediate',
      icon: 'boxes',
      tags: ['lld', 'solid', 'design patterns', 'clean architecture', 'typescript'],
      outcomes: [
        'Model a domain with clear responsibilities and interfaces',
        'Apply Factory, Builder, Strategy, Observer, Adapter and Decorator where they pay off',
        'Draw class and sequence diagrams that communicate a design quickly',
      ],
      modules: [
        {
          slug: 'oo-foundations',
          title: 'Object-oriented foundations',
          description: 'OOP, SOLID and domain modeling.',
          lessons: lessons([
            ['oop-fundamentals', 'OOP fundamentals in TypeScript', 'b', 35],
            ['solid-principles', 'SOLID principles', 'i', 45],
            ['interfaces-and-domain-modeling', 'Interfaces and domain modeling', 'i', 40],
          ]),
        },
        {
          slug: 'design-patterns',
          title: 'Design patterns',
          description: 'The patterns that show up in real codebases and interviews.',
          lessons: lessons([
            ['factory-and-builder', 'Factory and Builder', 'i', 40],
            ['strategy-pattern', 'Strategy', 'i', 30],
            ['observer-pattern', 'Observer', 'i', 30],
            ['adapter-and-decorator', 'Adapter and Decorator', 'i', 35],
            [
              'repository-and-dependency-injection',
              'Repository pattern and dependency injection',
              'i',
              40,
            ],
          ]),
        },
        {
          slug: 'architecture-and-diagrams',
          title: 'Architecture and diagrams',
          description: 'Clean architecture, diagrams and testability.',
          lessons: lessons([
            ['clean-architecture', 'Clean architecture', 'a', 45],
            ['class-and-sequence-diagrams', 'Class and sequence diagrams', 'i', 35],
            [
              'unit-testing-and-maintainable-typescript',
              'Unit testing and maintainable TypeScript',
              'i',
              45,
            ],
          ]),
        },
      ],
    },
    {
      slug: 'design-cases',
      title: 'Real-World Design Cases',
      subtitle: 'Sixteen end-to-end system design walkthroughs',
      description:
        'Structured case studies covering requirements, estimation, APIs, schemas, diagrams, data flow, failure handling, scaling, security, trade-offs and follow-up questions.',
      difficulty: 'advanced',
      icon: 'server',
      tags: ['case studies', 'system design interview', 'architecture'],
      outcomes: [
        'Drive a 45-minute design interview from requirements to trade-offs',
        'Reuse proven components across very different problem domains',
        'Design AI-specific systems with evaluation, cost and safety in mind',
      ],
      modules: [
        {
          slug: 'classic-platform-designs',
          title: 'Classic platform designs',
          description: 'The systems every senior interview eventually asks about.',
          lessons: lessons([
            ['design-url-shortener', 'Design a URL shortener', 'i', 45, 'case-study'],
            ['design-chat-service', 'Design a WhatsApp-style chat service', 'a', 50, 'case-study'],
            ['design-notification-system', 'Design a notification system', 'i', 45, 'case-study'],
            [
              'design-video-streaming-platform',
              'Design a YouTube-like streaming platform',
              'a',
              50,
              'case-study',
            ],
            ['design-ride-sharing', 'Design a ride-sharing service', 'a', 50, 'case-study'],
            ['design-ecommerce-platform', 'Design an e-commerce platform', 'a', 50, 'case-study'],
            ['design-payment-system', 'Design a payment processing system', 'a', 50, 'case-study'],
            ['design-job-scheduler', 'Design a job scheduling service', 'i', 45, 'case-study'],
            ['design-file-storage', 'Design a file storage platform', 'a', 50, 'case-study'],
            ['design-api-rate-limiter', 'Design an API rate limiter', 'i', 40, 'case-study'],
            ['design-search-platform', 'Design a search platform', 'a', 50, 'case-study'],
          ]),
        },
        {
          slug: 'event-driven-and-domain-designs',
          title: 'Event-driven and domain designs',
          description: 'Microservices and a workflow system modeled on fictional data.',
          lessons: lessons([
            [
              'design-event-driven-microservices',
              'Design event-driven microservices',
              'a',
              50,
              'case-study',
            ],
            [
              'design-research-funding-workflow',
              'Design a research funding workflow (fictional data)',
              'a',
              50,
              'case-study',
            ],
          ]),
        },
        {
          slug: 'ai-system-designs',
          title: 'AI system designs',
          description: 'Architectures for LLM products, RAG platforms and agent fleets.',
          lessons: lessons([
            [
              'design-production-ai-chatbot',
              'Design a production AI chatbot',
              'a',
              50,
              'case-study',
            ],
            [
              'design-enterprise-rag-platform',
              'Design an enterprise RAG platform',
              'a',
              55,
              'case-study',
            ],
            ['design-multi-agent-system', 'Design a multi-agent system', 'a', 55, 'case-study'],
          ]),
        },
      ],
    },
  ],
};
