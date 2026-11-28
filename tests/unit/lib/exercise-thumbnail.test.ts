import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ExerciseThumbnail,
  inferApparatusFromExercise,
} from '../../../src/components/trainee/ExerciseThumbnail';
import {
  getOpenGymStillUrl,
  normalizeOpenGymId,
} from '../../../src/lib/utils';

describe('ExerciseThumbnail Component & OpenGym Visual Media Suite', () => {
  describe('OpenGym Still URL Derivation & ID Normalization', () => {
    it('normalizes raw IDs and derives valid WebP OpenGym CDN URLs', () => {
      assert.equal(normalizeOpenGymId('0025'), '0025');
      assert.equal(normalizeOpenGymId('ex_0576'), '0576');
      assert.equal(normalizeOpenGymId('ex_25'), '0025');
      assert.equal(normalizeOpenGymId('7'), '0007');

      assert.equal(
        getOpenGymStillUrl('0025'),
        'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/still/0025.webp'
      );
      assert.equal(
        getOpenGymStillUrl('ex_0576'),
        'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/still/0576.webp'
      );
    });

    it('safely handles non-numeric and empty exercise IDs without throwing', () => {
      assert.equal(normalizeOpenGymId(''), '0000');
      assert.equal(normalizeOpenGymId(undefined), '0000');
      assert.equal(normalizeOpenGymId('custom'), '0000');
    });
  });

  describe('Apparatus Fallback Inference', () => {
    it('correctly maps exercise names and equipment cues to apparatus categories', () => {
      assert.equal(inferApparatusFromExercise('Incline Dumbbell Press'), 'dumbbell');
      assert.equal(inferApparatusFromExercise('Flat DB Press'), 'dumbbell');
      assert.equal(inferApparatusFromExercise('Barbell Squat'), 'barbell');
      assert.equal(inferApparatusFromExercise('Deadlift BB'), 'barbell');
      assert.equal(inferApparatusFromExercise('Cable Triceps Pushdown'), 'cable');
      assert.equal(inferApparatusFromExercise('Lat Pulldown'), 'cable');
      assert.equal(inferApparatusFromExercise('Ankle Cuff Lateral Raise'), 'cable');
      assert.equal(inferApparatusFromExercise('Hack Squat Machine'), 'machine');
      assert.equal(inferApparatusFromExercise('Lever Seated Row'), 'machine');
      assert.equal(inferApparatusFromExercise('Pec Deck Fly'), 'machine');
      assert.equal(inferApparatusFromExercise('Weighted Pull-Up'), 'bodyweight');
      assert.equal(inferApparatusFromExercise('Chin-up'), 'bodyweight');
      assert.equal(inferApparatusFromExercise('Dips'), 'bodyweight');
      assert.equal(inferApparatusFromExercise('Diamond Push-Up'), 'bodyweight');
    });

    it('defaults unknown/fantasy movements gracefully to dumbbell apparatus', () => {
      assert.equal(inferApparatusFromExercise('Kinetic Mind Overload Protocol'), 'dumbbell');
      assert.equal(inferApparatusFromExercise(''), 'dumbbell');
    });
  });

  describe('ExerciseThumbnail Component Static Markup Rendering', () => {
    it('renders <img> tag pointing to OpenGym CDN still when valid exerciseId is provided', () => {
      const html = renderToStaticMarkup(
        React.createElement(ExerciseThumbnail, {
          exerciseId: '0025',
          exerciseName: 'Barbell Bench Press',
          size: 'sm',
        })
      );

      assert.ok(html.includes('<img'), 'Must render img tag');
      assert.ok(
        html.includes(
          'https://cdn.jsdelivr.net/gh/DuarteSantos8/openGym@main/catalogue/media/still/0025.webp'
        ),
        'Must point to OpenGym CDN still URL'
      );
      assert.ok(html.includes('alt="Barbell Bench Press"'));
      assert.ok(html.includes('w-8 h-8'));
    });

    it('prioritizes explicit stillUrl over exerciseId derivation', () => {
      const customUrl = 'https://custom-cdn.com/stills/special.webp';
      const html = renderToStaticMarkup(
        React.createElement(ExerciseThumbnail, {
          exerciseId: '0025',
          exerciseName: 'Special Press',
          stillUrl: customUrl,
          size: 'md',
        })
      );

      assert.ok(html.includes(customUrl), 'Must use custom stillUrl');
      assert.ok(html.includes('w-12 h-12'));
    });

    it('renders apparatus icon fallback when exerciseId is undefined and no image URL is provided', () => {
      const html = renderToStaticMarkup(
        React.createElement(ExerciseThumbnail, {
          exerciseName: 'Cable Lateral Raise',
          size: 'sm',
        })
      );

      assert.ok(!html.includes('<img'), 'Must not render img tag when no image URL exists');
      assert.ok(html.includes('aria-label="Cable Lateral Raise (cable)"'));
      assert.ok(html.includes('w-8 h-8'));
    });

    it('renders custom fallback element when provided and no image URL is available', () => {
      const fallbackNode = React.createElement(
        'div',
        { className: 'test-custom-spotlight' },
        'CustomSpotlight'
      );

      const html = renderToStaticMarkup(
        React.createElement(ExerciseThumbnail, {
          exerciseName: 'Mystery Move',
          size: 'lg',
          fallback: fallbackNode,
        })
      );

      assert.ok(!html.includes('<img'));
      assert.ok(html.includes('test-custom-spotlight'));
      assert.ok(html.includes('CustomSpotlight'));
    });

    it('applies all size variant tokens (xs, sm, md, lg)', () => {
      const sizes: Array<{ size: 'xs' | 'sm' | 'md' | 'lg'; expectedClass: string }> = [
        { size: 'xs', expectedClass: 'w-5 h-5' },
        { size: 'sm', expectedClass: 'w-8 h-8' },
        { size: 'md', expectedClass: 'w-12 h-12' },
        { size: 'lg', expectedClass: 'w-16 h-16' },
      ];

      for (const { size, expectedClass } of sizes) {
        const html = renderToStaticMarkup(
          React.createElement(ExerciseThumbnail, {
            exerciseId: '0025',
            exerciseName: 'Bench Press',
            size,
          })
        );
        assert.ok(html.includes(expectedClass), `Must include ${expectedClass} for size ${size}`);
      }
    });

    it('merges custom className overrides cleanly with twMerge', () => {
      const html = renderToStaticMarkup(
        React.createElement(ExerciseThumbnail, {
          exerciseId: '0025',
          exerciseName: 'Bench Press',
          size: 'lg',
          className: 'w-16 h-18 rounded-2xl custom-test-class',
        })
      );

      assert.ok(html.includes('w-16'));
      assert.ok(html.includes('h-18'));
      assert.ok(html.includes('rounded-2xl'));
      assert.ok(html.includes('custom-test-class'));
    });
  });
});
