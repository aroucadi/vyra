import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  MedicalVectorAtlas,
  mapExerciseToSubdivisions,
  type AnatomicalSubdivisionId,
} from '@/components/trainee/anatomy/MedicalVectorAtlas';
import {
  MindMuscleBiofeedbackCard,
  getBiofeedbackDiagnostic,
} from '@/components/trainee/anatomy/MindMuscleBiofeedbackCard';
import { AnatomicalTensionSpotlight } from '@/components/trainee/AnatomicalTensionSpotlight';

describe('Science-Grade Anatomical Atlas & Mind-Muscle Biofeedback Suite', () => {
  describe('Biomechanical Mapping Engine (mapExerciseToSubdivisions)', () => {
    it('accurately maps Incline Press to pec_clavicular with converging_press vector', () => {
      const mapping = mapExerciseToSubdivisions('Incline Dumbbell Press', 'Upper Chest');
      assert.equal(mapping.primary, 'pec_clavicular');
      assert.ok(mapping.secondaries.includes('delt_anterior'));
      assert.ok(mapping.secondaries.includes('triceps_lateral_head'));
      assert.equal(mapping.view, 'front');
      assert.equal(mapping.vectorDirection, 'converging_press');
    });

    it('accurately maps Lat Pulldown to lats_iliac with diverging_pull vector and dorsal view', () => {
      const mapping = mapExerciseToSubdivisions('Cable Lat Pulldown', 'Lats');
      assert.equal(mapping.primary, 'lats_iliac');
      assert.ok(mapping.secondaries.includes('biceps_brachii'));
      assert.equal(mapping.view, 'back');
      assert.equal(mapping.vectorDirection, 'diverging_pull');
    });

    it('accurately maps Lateral Raise to delt_lateral with lateral_arc vector', () => {
      const mapping = mapExerciseToSubdivisions('Dumbbell Lateral Raise', 'Shoulders');
      assert.equal(mapping.primary, 'delt_lateral');
      assert.ok(mapping.secondaries.includes('traps_upper'));
      assert.equal(mapping.view, 'front');
      assert.equal(mapping.vectorDirection, 'lateral_arc');
    });

    it('accurately maps Romanian Deadlift to hamstrings with hip_hinge vector', () => {
      const mapping = mapExerciseToSubdivisions('Barbell Romanian Deadlift', 'Hamstrings');
      assert.equal(mapping.primary, 'hamstrings');
      assert.ok(mapping.secondaries.includes('glute_maximus'));
      assert.equal(mapping.view, 'back');
      assert.equal(mapping.vectorDirection, 'hip_hinge');
    });

    it('accurately maps Squat to quad_vastus_medialis', () => {
      const mapping = mapExerciseToSubdivisions('Barbell Back Squat', 'Quads');
      assert.equal(mapping.primary, 'quad_vastus_medialis');
      assert.ok(mapping.secondaries.includes('quad_rectus_femoris'));
      assert.equal(mapping.view, 'front');
    });
  });

  describe('Mind-Muscle Biofeedback Sensory Diagnostic Engine', () => {
    it('provides chest compensation diagnostics for Incline Press', () => {
      const diag = getBiofeedbackDiagnostic('Incline Dumbbell Press', 'Chest');
      assert.ok(diag.options.length >= 3);
      
      const shoulderTheft = diag.options.find(
        (o) => o.compensatingSubdivision === 'delt_anterior'
      );
      assert.ok(shoulderTheft, 'Must detect front delt stealing load on incline press');
      assert.equal(shoulderTheft?.isOptimal, false);
      assert.ok(
        shoulderTheft?.correctionCue.toLowerCase().includes('bench angle') ||
        shoulderTheft?.correctionCue.toLowerCase().includes('elbows') ||
        shoulderTheft?.correctionCue.toLowerCase().includes('scapulae'),
        'Must provide physical correction cue'
      );

      const targetOptimal = diag.options.find((o) => o.isOptimal === true);
      assert.ok(targetOptimal, 'Must have target locked in option');
      assert.equal(targetOptimal?.compensatingSubdivision, null);
    });

    it('provides back pull diagnostics for Lat Pulldown', () => {
      const diag = getBiofeedbackDiagnostic('Cable Lat Pulldown', 'Lats');
      const bicepTheft = diag.options.find(
        (o) => o.compensatingSubdivision === 'biceps_brachii'
      );
      assert.ok(bicepTheft, 'Must detect biceps pulling instead of back');
      assert.ok(
        bicepTheft?.correctionCue.toLowerCase().includes('hook') ||
        bicepTheft?.correctionCue.toLowerCase().includes('elbow') ||
        bicepTheft?.correctionCue.toLowerCase().includes('strap'),
        'Must cue driving with elbows'
      );
    });

    it('renders MindMuscleBiofeedbackCard cleanly without throwing', () => {
      const html = renderToStaticMarkup(
        React.createElement(MindMuscleBiofeedbackCard, {
          movementName: 'Incline Bench Press',
          targetMuscle: 'Upper Chest',
        })
      );
      assert.ok(html.includes('Mind-Muscle Target'), 'Must include header title');
      assert.ok(html.includes('Sensorimotor Sensation Check'), 'Must have sensory prompt');
    });
  });

  describe('MedicalVectorAtlas Component Render', () => {
    it('renders science-grade vector atlas with striations and force vectors', () => {
      const html = renderToStaticMarkup(
        React.createElement(MedicalVectorAtlas, {
          primarySubdivision: 'pec_clavicular',
          secondarySubdivisions: ['delt_anterior', 'triceps_lateral_head'],
          forceVectorDirection: 'converging_press',
          showToggle: true,
        })
      );

      assert.ok(html.includes('ANTERIOR // FRONTAL'), 'Must show anatomical view header');
      assert.ok(html.includes('prime-striation-gradient'), 'Must contain muscle striation gradient def');
      assert.ok(html.includes('synergist-gradient'), 'Must contain synergist gradient def');
      assert.ok(html.includes('kinetic-arrow'), 'Must define kinetic force vector arrow marker');
      assert.ok(html.includes('marker-end="url(#kinetic-arrow)"'), 'Must render line of drive vector');
    });

    it('renders hazard stripes when compensation is active', () => {
      const html = renderToStaticMarkup(
        React.createElement(MedicalVectorAtlas, {
          primarySubdivision: 'pec_clavicular',
          secondarySubdivisions: ['triceps_lateral_head'],
          compensatingSubdivision: 'delt_anterior',
        })
      );

      assert.ok(html.includes('compensation-hazard-pattern'), 'Must include hazard pattern');
      assert.ok(html.includes('COMPENSATION'), 'Legend must indicate compensation alert');
    });
  });

  describe('AnatomicalTensionSpotlight Integration', () => {
    it('supports compensatingMuscle hazard styling in compact mode', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnatomicalTensionSpotlight, {
          primaryMuscle: 'Chest',
          secondaryMuscles: ['Triceps'],
          compensatingMuscle: 'Shoulders',
        })
      );

      assert.ok(html.includes('#EF4444'), 'Must highlight compensating muscle with hazard red (#EF4444)');
    });

    it('delegates to MedicalVectorAtlas when variant="medical-atlas" is selected', () => {
      const html = renderToStaticMarkup(
        React.createElement(AnatomicalTensionSpotlight, {
          primaryMuscle: 'Incline Dumbbell Press',
          variant: 'medical-atlas',
        })
      );

      assert.ok(html.includes('ANTERIOR // FRONTAL'), 'Must render medical atlas view header');
      assert.ok(html.includes('prime-striation-gradient'), 'Must include striations');
    });
  });
});
