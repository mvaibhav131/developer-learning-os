import { loadQuizFiles } from '@dlos/learning-content';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './test/helpers';

const quizFiles = loadQuizFiles();
const [quizFile] = quizFiles;

let t: TestApp;
beforeEach(() => {
  t = createTestApp();
});
afterEach(() => {
  t.close();
});

function requireQuiz() {
  if (!quizFile) throw new Error('These tests need at least one quiz file.');
  return quizFile;
}

interface PublicQuestion {
  id: number;
  kind: string;
  prompt: string;
  options: Array<{ id: string; text: string }>;
}

/** The questions from the API, matched by position with the authored file. */
async function loadQuestions(slug: string): Promise<PublicQuestion[]> {
  const res = await t.request.get(`/api/v1/quizzes/${slug}`).expect(200);
  return res.body.questions as PublicQuestion[];
}

describe('lesson quizzes', () => {
  it('ships a quiz for every authored English lesson', () => {
    expect(quizFiles.length).toBeGreaterThanOrEqual(39);
    for (const quiz of quizFiles) expect(quiz.questions.length).toBeGreaterThanOrEqual(3);
  });

  it('serves questions without the answers and attaches the quiz to its lesson', async () => {
    const file = requireQuiz();
    const res = await t.request.get(`/api/v1/quizzes/${file.slug}`).expect(200);

    expect(res.body.quiz).toMatchObject({
      slug: file.slug,
      title: file.title,
      questionCount: file.questions.length,
      passPercent: file.passPercent,
      best: null,
    });
    expect(res.body.questions).toHaveLength(file.questions.length);
    for (const [index, question] of (res.body.questions as PublicQuestion[]).entries()) {
      expect(Object.keys(question).sort()).toEqual(['id', 'kind', 'options', 'prompt']);
      expect(question.prompt).toBe(file.questions[index]?.prompt);
    }
    expect(JSON.stringify(res.body)).not.toContain('correctOptionIds');

    const lesson = await t.request.get(`/api/v1/lessons/${file.slug}`).expect(200);
    expect(lesson.body.quiz).toMatchObject({ slug: file.slug, questionCount: file.questions.length, best: null });
  });

  it('grades on the server, explains every answer and keeps the best score', async () => {
    const file = requireQuiz();
    const questions = await loadQuestions(file.slug);
    const url = `/api/v1/quizzes/${file.slug}/attempts`;

    // Wrong first: pick an option that is not correct, or nothing at all.
    const wrong = Object.fromEntries(
      questions.map((question, index) => {
        const correct = file.questions[index]?.correctOptionIds ?? [];
        const other = question.options.find((option) => !correct.includes(option.id));
        return [String(question.id), other ? [other.id] : []];
      }),
    );
    const first = await t.request.post(url).send({ answers: wrong, durationSeconds: 30 }).expect(201);
    expect(first.body.attempt.score).toBe(0);
    expect(first.body.attempt.passed).toBe(false);
    expect(first.body.results.every((result: { correct: boolean }) => !result.correct)).toBe(true);
    expect(first.body.quiz.best).toEqual({ percent: 0, passed: false, attempts: 1 });

    // Then everything right.
    const right = Object.fromEntries(
      questions.map((question, index) => [String(question.id), file.questions[index]?.correctOptionIds ?? []]),
    );
    const second = await t.request.post(url).send({ answers: right }).expect(201);
    expect(second.body.attempt).toMatchObject({ score: file.questions.length, maxScore: file.questions.length, percent: 100, passed: true });
    for (const [index, result] of (second.body.results as Array<{ questionId: number; correct: boolean; explanation: string; correctOptionIds: string[] }>).entries()) {
      expect(result.correct).toBe(true);
      expect(result.explanation).toBe(file.questions[index]?.explanation);
      expect(result.correctOptionIds).toEqual(file.questions[index]?.correctOptionIds);
    }
    expect(second.body.quiz.best).toEqual({ percent: 100, passed: true, attempts: 2 });

    // A bad attempt later never lowers the best score.
    const third = await t.request.post(url).send({ answers: {} }).expect(201);
    expect(third.body.attempt.score).toBe(0);
    expect(third.body.quiz.best).toEqual({ percent: 100, passed: true, attempts: 3 });
  });

  it('treats a partly right multiple-choice answer as wrong', async () => {
    const quiz = quizFiles.find((candidate) => candidate.questions.some((question) => question.kind === 'multiple'));
    const multiple = quiz?.questions.find((question) => question.kind === 'multiple');
    if (!quiz || !multiple) throw new Error('Expected at least one multiple-choice question.');

    const questions = await loadQuestions(quiz.slug);
    const position = quiz.questions.indexOf(multiple);
    const target = questions[position];
    if (!target) throw new Error('Question not found.');

    const partial = { [String(target.id)]: [multiple.correctOptionIds[0] ?? 'a'] };
    const res = await t.request.post(`/api/v1/quizzes/${quiz.slug}/attempts`).send({ answers: partial }).expect(201);
    expect(res.body.results[position].correct).toBe(false);
  });

  it('rejects unknown quizzes, questions and options', async () => {
    const file = requireQuiz();
    const [question] = await loadQuestions(file.slug);
    if (!question) throw new Error('Expected a question.');
    const url = `/api/v1/quizzes/${file.slug}/attempts`;

    await t.request.get('/api/v1/quizzes/no-such-quiz').expect(404);
    await t.request.post('/api/v1/quizzes/no-such-quiz/attempts').send({ answers: {} }).expect(404);
    await t.request.post(url).send({ answers: { '999999': ['a'] } }).expect(422);
    await t.request.post(url).send({ answers: { [String(question.id)]: ['zzz'] } }).expect(422);
    await t.request.post(url).send({ answers: {}, extra: true }).expect(400);
    await t.request.post(url).send({}).expect(400);
  });

  it('allows only one option for single-choice and true-false questions', async () => {
    const quiz = quizFiles.find((candidate) => candidate.questions.some((question) => question.kind !== 'multiple'));
    const single = quiz?.questions.find((question) => question.kind !== 'multiple');
    if (!quiz || !single) throw new Error('Expected a single-choice question.');
    const questions = await loadQuestions(quiz.slug);
    const target = questions[quiz.questions.indexOf(single)];
    if (!target) throw new Error('Question not found.');

    const res = await t.request
      .post(`/api/v1/quizzes/${quiz.slug}/attempts`)
      .send({ answers: { [String(target.id)]: target.options.slice(0, 2).map((option) => option.id) } })
      .expect(422);
    expect(res.body.error.code).toBe('validation_error');
  });
});
