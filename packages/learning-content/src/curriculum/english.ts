import { lessons } from '../builders';
import type { TrackDef } from '../types';

export const englishTrack: TrackDef = {
  slug: 'english',
  title: 'English for Developers',
  shortTitle: 'English',
  icon: 'languages',
  description:
    'Speak, write and listen with confidence at work and in interviews. Written for Hindi and Hinglish speakers: practical grammar, pronunciation, vocabulary and the real situations of a developer job, such as stand-ups, code reviews and interviews.',
  courses: [
    {
      slug: 'english-grammar-foundations',
      title: 'English Grammar Foundations',
      subtitle: 'Sentences, tenses, articles and prepositions',
      description:
        'The grammar that matters most for clear workplace English. Every lesson starts from the mistakes Hindi speakers actually make and shows the natural alternative, with short exercises to lock it in.',
      difficulty: 'beginner',
      icon: 'languages',
      tags: ['grammar', 'tenses', 'articles', 'prepositions', 'sentences'],
      outcomes: [
        'Build correct sentences and questions without translating word for word from Hindi',
        'Choose the right tense for work updates, past events and plans',
        'Fix the common grammar mistakes that confuse colleagues and interviewers',
      ],
      modules: [
        {
          slug: 'sentence-building',
          title: 'Building sentences',
          description: 'Word order, questions and the mistakes to unlearn first.',
          lessons: lessons([
            ['en-sentence-structure', 'Sentence structure: subject, verb, object', 'b', 25],
            ['en-questions-and-negatives', 'Questions and negatives: do, does, did', 'b', 25],
            ['en-common-mistakes-hindi-speakers', 'Common mistakes and how to fix them', 'b', 30],
          ]),
        },
        {
          slug: 'tenses',
          title: 'Tenses for real situations',
          description: 'Present, past and future, taught through work updates.',
          lessons: lessons([
            ['en-present-simple-and-continuous', 'Present simple and present continuous', 'b', 30],
            ['en-past-simple-and-present-perfect', 'Past simple and present perfect', 'b', 30],
            ['en-future-forms', 'Talking about the future: will, going to, plans', 'b', 25],
          ]),
        },
        {
          slug: 'small-words',
          title: 'Small words that matter',
          description: 'Articles, prepositions and modal verbs.',
          lessons: lessons([
            ['en-articles-a-an-the', 'Articles: a, an, the', 'b', 30],
            ['en-prepositions-time-place', 'Prepositions of time and place: in, on, at', 'b', 25],
            ['en-modal-verbs', 'Modal verbs: can, could, should, must', 'i', 25],
          ]),
        },
      ],
    },
    {
      slug: 'english-pronunciation-and-fluency',
      title: 'Pronunciation and Fluency',
      subtitle: 'Sound clear, speak smoothly, stop freezing',
      description:
        'Train your ear and your mouth. Learn the sounds and stress patterns that decide whether people understand you, then build a daily speaking habit with shadowing and simple routines.',
      difficulty: 'beginner',
      icon: 'mic',
      tags: ['pronunciation', 'stress', 'fluency', 'shadowing', 'speaking'],
      outcomes: [
        'Pronounce the sounds and tech words that are most often misunderstood',
        'Use word and sentence stress so your meaning is clear',
        'Follow a 15-minute daily routine that steadily builds fluency',
      ],
      modules: [
        {
          slug: 'pronunciation',
          title: 'Pronunciation',
          description: 'Sounds, word stress and intonation.',
          lessons: lessons([
            ['en-sounds-hindi-speakers', 'Sounds that need attention: v, w, th and vowels', 'b', 30],
            ['en-word-stress-tech-terms', 'Word stress and tricky tech words', 'b', 30],
            ['en-sentence-stress-intonation', 'Sentence stress and intonation', 'i', 30],
          ]),
        },
        {
          slug: 'fluency',
          title: 'Fluency habits',
          description: 'Shadowing, thinking in English and recovering when you freeze.',
          lessons: lessons([
            ['en-shadowing-technique', 'Shadowing: speak along with native speech', 'b', 25],
            ['en-think-in-english', 'Start thinking in English', 'b', 25],
            ['en-fillers-and-pauses', 'Fillers, pauses and recovering when you freeze', 'i', 25],
            ['en-daily-speaking-routine', 'A 15-minute daily speaking routine', 'b', 20],
          ]),
        },
      ],
    },
    {
      slug: 'english-for-the-workplace',
      title: 'English at Work for Developers',
      subtitle: 'Stand-ups, reviews, emails and chat',
      description:
        'The English you need every day in a software team: stand-up updates, asking for clarification, explaining bugs, writing emails, chat messages, pull requests and bug reports, with ready-to-use phrases you can copy and hear.',
      difficulty: 'intermediate',
      icon: 'message-circle',
      tags: ['meetings', 'email', 'code review', 'stand-up', 'writing'],
      outcomes: [
        'Give clear stand-up updates and explain technical problems aloud',
        'Write polite, direct emails, chat messages and pull request descriptions',
        'Disagree, ask for help and follow up without sounding rude or unsure',
      ],
      modules: [
        {
          slug: 'meetings',
          title: 'Meetings and conversations',
          description: 'Speaking clearly with your team.',
          lessons: lessons([
            ['en-daily-standup-updates', 'Daily stand-up updates', 'b', 25],
            ['en-asking-for-clarification', 'Asking for clarification and repeating', 'b', 25],
            ['en-explaining-code-and-bugs', 'Explaining code, bugs and decisions aloud', 'i', 30],
            ['en-disagreeing-politely', 'Disagreeing and giving feedback politely', 'i', 25],
            ['en-small-talk', 'Small talk with colleagues', 'b', 20],
          ]),
        },
        {
          slug: 'written-communication',
          title: 'Writing at work',
          description: 'Emails, chat, pull requests and bug reports.',
          lessons: lessons([
            ['en-professional-emails', 'Professional emails', 'i', 30],
            ['en-chat-messages-tone', 'Chat messages: short, clear, polite', 'b', 25],
            ['en-pull-requests-and-commits', 'Pull requests, commits and review comments', 'i', 30],
            ['en-bug-reports-and-docs', 'Bug reports and documentation', 'i', 30],
            ['en-polite-requests-and-follow-ups', 'Requests, reminders and follow-ups', 'b', 20],
          ]),
        },
      ],
    },
    {
      slug: 'english-for-interviews',
      title: 'Interview English',
      subtitle: 'Say what you know, clearly and confidently',
      description:
        'Prepare the English of a job interview: your introduction, your projects, behavioural answers, what to say when you are stuck, and how to talk about salary and notice period.',
      difficulty: 'intermediate',
      icon: 'briefcase',
      tags: ['interview', 'self introduction', 'star', 'salary', 'projects'],
      outcomes: [
        'Deliver a confident two-minute self-introduction',
        'Explain a project with a clear problem, action and result',
        'Handle unknown questions, salary and notice-period talks professionally',
      ],
      modules: [
        {
          slug: 'interview-answers',
          title: 'Interview answers',
          description: 'Structures and phrases for the questions that always come up.',
          lessons: lessons([
            ['en-self-introduction', 'Tell me about yourself', 'b', 30],
            ['en-explaining-your-projects', 'Explaining your projects clearly', 'i', 30],
            ['en-star-answers', 'Behavioural answers with the STAR method', 'i', 35],
            ['en-i-dont-know', 'What to say when you do not know', 'b', 20],
            ['en-negotiation-and-notice-period', 'Salary, notice period and offers', 'i', 25],
            ['en-questions-for-interviewer', 'Questions to ask the interviewer', 'b', 20],
          ]),
        },
      ],
    },
    {
      slug: 'english-vocabulary-and-listening',
      title: 'Vocabulary and Listening',
      subtitle: 'Words you need and ears that keep up',
      description:
        'Build the words and phrases developers use every day, learn phrasal verbs and word partners, and set up a listening routine with videos so English keeps improving without extra effort.',
      difficulty: 'beginner',
      icon: 'headphones',
      tags: ['vocabulary', 'phrasal verbs', 'listening', 'idioms', 'habit'],
      outcomes: [
        'Use the core workplace vocabulary and phrasal verbs naturally',
        'Understand fast speech and different accents in meetings and videos',
        'Keep a daily English habit that lasts beyond the first two weeks',
      ],
      modules: [
        {
          slug: 'vocabulary',
          title: 'Vocabulary',
          description: 'Words, phrasal verbs, word partners and idioms.',
          lessons: lessons([
            ['en-workplace-vocabulary', 'Everyday workplace vocabulary', 'b', 30],
            ['en-phrasal-verbs-for-developers', 'Phrasal verbs developers use', 'b', 30],
            ['en-collocations', 'Word partners: make, do, take, give', 'i', 25],
            ['en-idioms-in-tech-teams', 'Idioms you hear in tech teams', 'i', 25],
          ]),
        },
        {
          slug: 'listening',
          title: 'Listening',
          description: 'Learning from videos, podcasts and different accents.',
          lessons: lessons([
            ['en-listening-routine', 'How to learn English from videos', 'b', 20],
            ['en-understanding-accents', 'Understanding different accents', 'i', 20],
            ['en-building-an-english-habit', 'Building an English habit that lasts', 'b', 20],
          ]),
        },
      ],
    },
  ],
};
