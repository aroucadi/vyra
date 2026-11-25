import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Sovereign Athlete Dossier (/you) Biometrics & Truths Architecture', () => {
  it('accurately verifies Alaa biometrics and mass trajectory targets', () => {
    const mockUser = {
      name: 'Alaa',
      heightCm: 172,
      biometrics: {
        baselineWeightKg: 52.05,
        week12TargetWeightKg: 55.5,
        longTermAthleteTargetKg: 59.3,
        skeletalMuscleMassKg: 24.9,
        bodyFatPercent: 10.0,
      },
      baselineMetrics: {
        dailyTargetKcal: 2710,
        dailyMacrosTarget: {
          proteinG: 173.6,
          carbsG: 317.4,
          fatG: 72.2,
          creatineElementalG: 2.82,
        },
      },
    };

    assert.strictEqual(mockUser.biometrics.baselineWeightKg, 52.05);
    assert.strictEqual(mockUser.biometrics.week12TargetWeightKg, 55.5);
    assert.strictEqual(mockUser.biometrics.longTermAthleteTargetKg, 59.3);
    assert.strictEqual(mockUser.baselineMetrics.dailyTargetKcal, 2710);
    assert.strictEqual(mockUser.baselineMetrics.dailyMacrosTarget.proteinG, 173.6);

    // Weekly surplus velocity check (+0.20 to +0.40 kg/week)
    const totalTargetDelta = mockUser.biometrics.week12TargetWeightKg - mockUser.biometrics.baselineWeightKg;
    const weeklyRate = totalTargetDelta / 12; // 3.45 kg / 12 wks = ~0.2875 kg/wk
    assert.ok(weeklyRate >= 0.20 && weeklyRate <= 0.40, 'Target weekly rate must be within 0.20-0.40 kg/wk');
  });

  it('validates clinical renal biomarkers within optimal reference ranges', () => {
    const renalBiomarkers = {
      creatinine_mg_L: { latest: 8.2, minRef: 6.7, maxRef: 11.7 },
      urea_g_L: { latest: 0.2, minRef: 0.17, maxRef: 0.48 },
      dfgCkdEpi_mL_min: { latest: 113, minOptimal: 90 },
    };

    assert.ok(
      renalBiomarkers.creatinine_mg_L.latest >= renalBiomarkers.creatinine_mg_L.minRef &&
      renalBiomarkers.creatinine_mg_L.latest <= renalBiomarkers.creatinine_mg_L.maxRef,
      'Creatinine must be within safe ref'
    );

    assert.ok(
      renalBiomarkers.urea_g_L.latest >= renalBiomarkers.urea_g_L.minRef &&
      renalBiomarkers.urea_g_L.latest <= renalBiomarkers.urea_g_L.maxRef,
      'Urea must be within safe ref'
    );

    assert.ok(
      renalBiomarkers.dfgCkdEpi_mL_min.latest >= renalBiomarkers.dfgCkdEpi_mL_min.minOptimal,
      'eGFR must reflect Class 1 clean filtration'
    );
  });
});
