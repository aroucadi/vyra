import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AnatomicalTensionSpotlight } from '@/components/trainee/AnatomicalTensionSpotlight';

describe('Spec 016: Anatomical Tension Spotlight & Kinetic Cues Suite', () => {
  it('renders SVG markup with accessible role and aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnatomicalTensionSpotlight, {
        primaryMuscle: 'Pectoralis Major',
        secondaryMuscles: ['Triceps Brachii', 'Anterior Deltoid'],
      })
    );

    assert.ok(html.includes('role="img"'), 'Must contain role="img"');
    assert.ok(
      html.includes('aria-label="Anatomical tension spotlight showing Pectoralis Major"'),
      'Must contain accurate aria-label'
    );
    assert.ok(html.includes('<svg'), 'Must render SVG element');
    assert.ok(html.includes('viewBox="0 0 100 130"'), 'Must use 0 0 100 130 viewBox');
  });

  it('illuminates primary target in emerald (#10B981) and synergist in cyan (#06B6D4)', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnatomicalTensionSpotlight, {
        primaryMuscle: 'Chest',
        secondaryMuscles: ['Shoulders', 'Biceps'],
      })
    );

    // Primary emerald fill
    assert.ok(
      html.includes('#10B981') || html.includes('16, 185, 129'),
      'Primary muscle must be filled with Emerald (#10B981)'
    );

    // Synergist cyan fill
    assert.ok(
      html.includes('#06B6D4') || html.includes('6, 182, 212'),
      'Synergist muscle must be filled with Cyan (#06B6D4)'
    );

    // Target legend
    assert.ok(html.includes('Target'), 'Legend must include Target');
    assert.ok(html.includes('Synergist'), 'Legend must include Synergist');
  });

  it('automatically selects posterior view for back-dominant exercises', () => {
    const htmlLats = renderToStaticMarkup(
      React.createElement(AnatomicalTensionSpotlight, {
        primaryMuscle: 'Latissimus Dorsi',
        secondaryMuscles: ['Biceps Brachii'],
      })
    );

    assert.ok(
      htmlLats.includes('id="posterior-muscles"'),
      'Lats target must default to posterior view'
    );
    assert.ok(
      htmlLats.includes('Posterior'),
      'Button or label must reflect Posterior state'
    );
  });

  it('automatically selects anterior view for chest-dominant exercises', () => {
    const htmlChest = renderToStaticMarkup(
      React.createElement(AnatomicalTensionSpotlight, {
        primaryMuscle: 'Barbell Bench Press',
        secondaryMuscles: ['Triceps'],
      })
    );

    // Bench press / chest defaults to front
    assert.ok(
      htmlChest.includes('id="anterior-muscles"'),
      'Chest target must default to anterior view'
    );
    assert.ok(
      htmlChest.includes('Anterior'),
      'Button or label must reflect Anterior state'
    );
  });

  it('handles unknown or empty muscle names gracefully without runtime exception', () => {
    assert.doesNotThrow(() => {
      const html = renderToStaticMarkup(
        React.createElement(AnatomicalTensionSpotlight, {
          primaryMuscle: '',
          secondaryMuscles: [],
        })
      );
      assert.ok(html.includes('<svg'));
    });
  });
});
