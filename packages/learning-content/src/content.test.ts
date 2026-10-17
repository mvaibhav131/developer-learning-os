import { CORE_DAYS_PER_WEEK, ROADMAP_WEEK_COUNT } from '@dlos/shared';
import { describe, expect, it } from 'vitest';
import {
  curriculum,
  expandRoadmap,
  getContentStats,
  loadLessonFiles,
  loadProblemFiles,
  validateContent,
} from './index';

describe('learning content integrity', () => {
  it('has no validation problems', () => {
    expect(validateContent()).toEqual([]);
  });

  it('defines six tracks and a complete 24-week roadmap', () => {
    const stats = getContentStats();
    expect(stats.tracks).toBe(6);
    expect(stats.roadmapWeeks).toBe(ROADMAP_WEEK_COUNT);
    expect(stats.projects).toBe(10);
  });

  it('marks a lesson complete exactly when it has authored content', () => {
    const stats = getContentStats();
    expect(stats.lessonsByStatus.complete).toBe(loadLessonFiles().length);
    expect(stats.lessonsByStatus.complete + stats.lessonsByStatus.planned).toBe(stats.lessons);
  });

  it('ships coding problems with unique slugs', () => {
    const slugs = loadProblemFiles().map((problem) => problem.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('plans 120 core study minutes for every study day', () => {
    const tasks = expandRoadmap();
    for (let week = 1; week <= ROADMAP_WEEK_COUNT; week += 1) {
      for (let day = 0; day < CORE_DAYS_PER_WEEK; day += 1) {
        const minutes = tasks
          .filter((task) => task.weekNumber === week && task.dayOffset === day)
          .reduce((sum, task) => sum + task.plannedMinutes, 0);
        expect(minutes, `week ${week} day ${day + 1}`).toBe(120);
      }
    }
  });

  it('marks only weekend sessions as optional', () => {
    for (const task of expandRoadmap()) {
      expect(task.isOptional).toBe(task.dayOffset >= CORE_DAYS_PER_WEEK);
    }
  });

  it('keeps every lesson inside exactly one course module', () => {
    const slugs = curriculum.flatMap((track) =>
      track.courses.flatMap((course) =>
        course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.slug)),
      ),
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
