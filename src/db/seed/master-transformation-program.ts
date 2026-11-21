import {
  User,
  Program,
  ProgramWeek,
  ProgramDay,
  SupplementProtocol,
  HydrationGoal,
  BodyMetricEntry,
  TrainerLink,
  DailyMealSlot,
  MealPlanPrescription,
} from '@/lib/types';
import { toLocalDateString } from '@/lib/utils';

// ==========================================
// 1. ATHLETE & TRAINER PROFILES
// ==========================================

export const userAlaaPro: User = {
  id: 'trainer_alaa',
  role: 'trainer',
  name: 'Alaa Pro',
  email: 'coach.alaa@vyra.fit',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
  injuries: [],
  goals: ['Guide athletes through periodized kinetic transformation'],
};

export const userAlaa: User = {
  id: 'trainee_alaa',
  role: 'both',
  name: 'Alaa',
  email: 'alaaeddineroucadi@gmail.com',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
  heightCm: 172,
  sex: 'male',
  dob: '1989-03-15', // Age 37
  injuries: [
    'Clinically Underweight (52.05 kg morning floor / 52.45 kg fed baseline at 172 cm): Target +0.20 to +0.40 kg/week on 2,710 kcal/day surplus',
    'Supraspinatus & Joint Guardrail: lever lateral raise permanently removed after Nov 5 joint_strain; max 2 overhead/abduction exposures per week',
    'Left-Arm Leader Rule: Start unilateral cable one arm lateral raise with Left Arm first and match reps cleanly on Right',
    'Monday Night Football Deconfliction: 19:15 match mandates zero lower-body loading on Monday and 100% seated/supported pulls on Tuesday',
    'Anterior Pelvic Tilt & Rib Flare: Lock pelvis (glutes engaged, ribs stacked down over hips) on every lift',
  ],
  goals: [
    'Post-Paris 5-Day Master Split Launching Monday 2026-11-23 (Mon/Tue/Wed/Thu/Sat | Fri & Sun Rest)',
    'Baseline 52.05 kg Morning Floor -> Week 12 Target 55.5 kg -> Week 16 Target 57.0 kg (+0.20 to +0.40 kg/week)',
    'Nutrition & Mass Stack: 2,710 kcal/day | 173.6g P / 317.4g C / 72.2g F | 4 scoops Scitec Jumbo Hardcore (2.82g Creatine)',
    'Long-Length Stretch & Unilateral Control: Maeo 2023 overhead triceps, Maeo forward-lean leg curl, and 2-3s eccentrics',
  ],
  hideWeightFromTrainee: false,
  biometrics: {
    age: 37,
    heightCm: 172,
    baselineWeightKg: 52.05,
    skeletalMuscleMassKg: 24.9,
    bodyFatPercent: 10.0,
    week12TargetWeightKg: 55.5,
    week16TargetWeightKg: 57.0,
    longTermAthleteTargetKg: 59.3,
    segmentalSymmetry: {
      leftArmKg: 2.5,
      rightArmKg: 2.5,
      leftLegKg: 7.6,
      rightLegKg: 7.5,
      trunkKg: 12.6,
    },
  },
  biomechanicalTruths: {
    truth1_pelvicMasterSwitch:
      'Anterior pelvic tilt and rib flare slacken the thoracolumbar fascia and overload the lumbar spine. Lock pelvis (glutes squeezed, belt buckle tilted slightly up, ribs stacked down) on every lift.',
    truth2_midlineVsLongLever:
      'Strong midline pulling (40-42.5 kg pulldown) vs long-lever neural braking on abduction/shoulder press. Use 30° scapular plane, 2:1 stack 5 kg flat progression, and 10 kg flat shoulder press on fresh Saturday mornings.',
    truth3_externalSupport:
      'Chest, back, and preacher pads eliminate torso-stabilization guarding and unlock true 1-2 RIR hypertrophy output under the 37-minute lunch clock.',
    truth4_widePullStarterMotor:
      '0 wide pull-ups stem from weak scapular depression initiation. Fix via daily 30s Hollow-Body Scapular Hangs and 1s scapular depression pauses at the top of every pulldown.',
    truth5_pronationInternalRotationBias:
      'Eliminate supraspinatus impingement risk by pairing straight-back underhand rows on Tuesday with strict internal-rotation-free rear delt flyes and fresh Saturday pressing.',
  },
  defaultGymId: 'gym_punch_lissasfa',
  gymLocations: [
    {
      id: 'gym_punch_lissasfa',
      name: 'Punch by Badr Hari Lissasfa',
      address: 'Lissasfa, Casablanca',
      isDefault: true,
      notes: '2:1 cable stacks; no seated ab machine -> replaced by cable kneeling crunch (ex_0175). Full leverage press/row/leg suite.',
      equipmentNotes: [
        'Cable lateral raises (5 kg) must be performed on the 2:1 dual-pulley stack, never the heavy 1:1 stack.',
        'Dedicated Hip Thrust / Glute Bridge Machine is available and locked into Thursday Slot 2.',
        'No seated ab crunch machine exists at Punch; all direct core work uses cable kneeling rope crunches + bench/mat reverse crunches on Saturday.',
      ],
    },
    {
      id: 'gym_home',
      name: 'Home Setup',
      address: 'Home (Casablanca)',
      isDefault: false,
      notes: 'Doorway pull-up bar + color-coded push-up board.',
    },
  ],
  baselineMetrics: {
    weightFloorKg: 52.05,
    fedBaselineWeightKg: 52.45,
    heightM: 1.72,
    ageYears: 37,
    tdeeFormulaKcal: 2006,
    tdeeStairAdjustedKcal: 2180,
    dailyTargetKcal: 2710,
    dailyMacrosTarget: {
      proteinG: 173.6,
      carbsG: 317.4,
      fatG: 72.2,
      creatineElementalG: 2.82,
    },
  },
  healthProfile: {
    labHistorySpan: "2022-04-01 to 2026-post-08-05 (6 panels)",
    labRecordedAge: 37,
    verifiedKeyBiomarkers: {
      renalAndProteinCapacity: {
        dfgCkdEpi_mL_min: { latest: 113, range2022_2026: "112-127", status: "optimal" },
        creatinine_mg_L: {
          latest: 8.2,
          range2022_2026: "6.6-8.6",
          ref: "6.7-11.7",
          note: "Historically low-end reflecting low muscle mass; expect mild benign rise once lifting consistently with creatine.",
        },
        urea_g_L: {
          latest: 0.2,
          range2024_2026: "0.16-0.20",
          ref: "0.17-0.48",
          note: "Historically low/low-normal reflecting low protein turnover; validates high-protein lean bulk.",
        },
      },
      metabolicAndCardiovascular: {
        fastingGlucose_g_L: { latest: 0.85, trend: "0.77 -> 0.85", ref: "0.70-1.10", status: "optimal" },
        hba1c_pct: { latest2022: 5, ref: "<5.6", status: "optimal" },
        triglycerides_g_L: { latest: 0.54, range2022_2026: "0.42-0.76", ref: "<1.50", status: "optimal" },
        ldl_g_L: { latest: 0.65, range2022_2026: "0.53-0.68", ref: "<1.30", status: "optimal_protective" },
        hdl_g_L: {
          latest: 0.64,
          trend: "0.89 -> 0.90 -> 0.79 -> 0.64",
          ref: "0.40-0.80",
          note: "Still healthy, but trending down; favor unsaturated fats (avocado, olive oil, almonds) over refined snacks.",
        },
        crp_mg_L: { latest: 1.7, range2023_2026: "<0.3-2.3", ref: "<5.0", status: "low_inflammation" },
      },
      thyroid: {
        tsh_mUI_L: { latest: 1.95, range2022_2026: "1.19-2.45", ref: "0.40-4.00", status: "euthyroid_optimal" },
        ft4_ng_dL: { latest2022: 1.22, ref: "1.0-1.7", status: "normal" },
      },
      hematologyAndMicronutrients: {
        hemoglobin_g_dL: { latest: 15.3, range2022_2026: "14.9-16.4", status: "optimal" },
        vgm_mcv_fL: {
          latest: 97,
          trend: "106.0 -> 104.0 -> 101.0 -> 100.0 -> 97.0 -> 97.0",
          ref: "80.2-95.0",
          flag: "persistent_mild_macrocytosis_improving",
        },
        tcmh_mch_pg: { latest: 32.5, trend: "35.9 -> 32.5", ref: "27.2-32.8", status: "normalized" },
        folates_b9_ng_mL: { latest: 7, nadir2024: 3.1, ref: "4.4-31.0", flag: "lower_quartile_prior_deficiency_2024" },
        vitaminB12_pg_mL: { latest: 627, trend: "461 -> 427 -> 579 -> 627", ref: "197-771", status: "optimal" },
        vitaminD_25OH_ng_mL: { latest2025: 26.7, prior2023_2024: "10.1-10.2", ref: ">=30.0", flag: "chronic_insufficiency_not_tested_2026" },
        ferritin_ug_L: { latest: 84, trend: "120 -> 108 -> 111 -> 103 -> 84", ref: "30-400", status: "normal_gradual_decline" },
        magnesiumSerum_mg_L: { latest: 24, ref: "16-26", status: "high_normal" },
        potassium_mmol_L: { latest: 4.3, note: "Normal in 2025-2026 (4.0-4.3); historical 5.3 spike in 2023-03 and plasma/serum artifact note in 2024-08." },
      },
      liverPanel: {
        alat_tgp_U_L: { latest: 41, trend: "27 -> 20 -> 26 -> 30 -> 41", ref: "<50", flag: "upward_trend_within_normal_monitor" },
        asat_tgo_U_L: { latest: 28, trend: "21 -> 24 -> 24 -> 21 -> 28", ref: "<50", status: "normal" },
        ggt_U_L: { latest: 18, range2023_2026: "14-21", ref: "<60", status: "optimal" },
        fib4Score: { latest2025: 0.62, ref: "<1.3", status: "optimal" },
      },
      serologies2024: {
        hepatitisB: "Immunized (Anti-HBs 688 UI/L)",
        hepatitisC: "Negative",
        hiv1_2: "Negative",
        syphilis: "Negative",
      },
    },
    medicalFollowUpChecklist: [
      "Re-test 25-OH Vitamin D, ALAT/ASAT/GGT (after 48-72h rest from lifting), Folate (B9), Ferritin, and CBC (VGM) in 8-12 weeks.",
      "Confirm persistent mild VGM elevation (97 fL with normal B12 and RDW) with your physician.",
      "Inform your physician about creatine supplementation (2.82 g/day inside Jumbo Hardcore) before future blood draws so benign creatinine bumps are interpreted accurately (consider Cystatin C if creatinine ever crosses 11.7 mg/L).",
    ],
  },
};

export const linkAlaa: TrainerLink = {
  trainerId: 'trainer_alaa',
  traineeId: 'trainee_alaa',
  status: 'active',
  createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
};

// ==========================================
// 2. DAILY 24-HOUR LIFESTYLE & POSTURAL PROTOCOLS
// ==========================================

export const morningAlignmentDrills: string[] = [
  '07:30 Waking Reset: 5g L-Glutamine in 300 ml lukewarm water on an empty stomach for gut lining recovery (15-20 min before breakfast).',
  'Doorway Pull-Up Bar 30s Hollow-Body Scapular Hang (5 reps x 2s depression pause): Ribs down, glutes tight, pull shoulder blades down without bending elbows.',
  'Supine Windshield Wipers (60s): Gently rock knees 5x left and 5x right with shoulders pinned flat to unwind overnight lumbar torsion.',
  'Standing Glute-Squeeze Hip Extension + Y-Reach (60s): Squeeze glutes 5s, reach arms into a high Y with thumbs back to counter desk/driving posture.',
];

export const workdayErgonomicsRoutines: string[] = [
  'The Car Mirror Biofeedback Anchor (Commute): Adjust rear-view mirror 1 cm higher sitting tall with skull touching headrest; slouching breaks rear visibility.',
  'The Hourly Stand & Squeeze (Office): Stand every 60 min, shift 60% weight to heels, squeeze glutes 5s, 2 nasal breaths, reset seated ribs-over-pelvis.',
  'Post-Lunch Walk (13:45 - 14:00): 10-15 min relaxed walk immediately after lunch to assist gastric emptying and glucose partitioning.',
  'Desk-Drawer Fuel Protocol (09:00-12:00): Electrolytes + 1 Snickers Bar + 2 Ajwa Dates slowly leading into the 12:05 lunch-hour lift.',
];

// ==========================================
// 3. NUTRITION & SUPPLEMENT PROTOCOL (2,710 KCAL)
// ==========================================

export const dailyNutritionAndSupplementProtocol = {
  targetCalories: 2710,
  macros: { proteinG: 173.6, carbsG: 317.4, fatsG: 72.2 },
  creatineDailyFromGainerG: 2.82,
  scitecJumboHardcoreLabelSpec: {
    fullServingWeightG: 153,
    fullServingScoops: 4.25,
    oneLevelScoopWeightG: 36,
    twoLevelScoopsWeightG: 72,
    twoLevelScoopsMacros: {
      caloriesKcal: 273,
      proteinG: 29.6,
      carbsG: 30.6,
      fatG: 3.2,
      creatineElementalG: 1.41,
    },
    fourDailyScoopsTotal: {
      weightG: 144,
      caloriesKcal: 547,
      proteinG: 59.3,
      carbsG: 61.2,
      fatG: 6.5,
      creatineElementalG: 2.82,
      note: 'Covers 100% of daily creatine maintenance for a 52 kg frame; do NOT add extra creatine powder on days you drink 4 scoops.',
    },
  },
  schedule: [
    {
      time: '07:30',
      slot: 'Waking Gut Recovery',
      items: ['5g Micronized L-Glutamine in 250ml room-temp water (on empty stomach, 15-20 min before breakfast)'],
    },
    {
      time: '07:55-08:30',
      slot: 'Morning Gainer + Digestive Enzymes',
      items: [
        '2 level scoops Scitec Jumbo Hardcore (72g in cool water) + 5 tiny 5cm mini pancakes (~55g)',
        '1 Capsule Multi-Enzymes (Protease + Amylase + Lactase) — [Shilajit PAUSED pending ALAT re-check]',
      ],
    },
    {
      time: '09:00-12:00',
      slot: 'Office Hydration & Pre-Gym Fuel',
      items: [
        '10:15: 35–40g raw almonds/walnuts (~230 kcal, preferred for HDL & liver) OR occasional Snickers bar (50g)',
        '11:35 (25m pre-gym): 5–7 Ajwa dates (~55g) for zero-fat fast fuel',
        '1 Sachet max Electrolyte & Vitamin powder in 1L water',
      ],
    },
    {
      time: '12:05-12:42',
      slot: 'Punch Gym Session',
      items: ['300–400 ml plain water sipped between sets'],
    },
    {
      time: '13:00',
      slot: 'Post-Workout Lunch + Fat-Soluble Vitamins (Mandatory)',
      items: [
        'Chicken breast steak (~160g cooked, or lean red meat 1–2x/wk for ferritin) + Rice/Pasta/Potatoes (~180g cooked) + Dark leafy greens/Vegetables (for Folate B9) + 1 Fruit + Olive oil',
        'Vitamin D3 + K2 (Non-negotiable at lunch to reverse 10.1 -> 10.2 -> 26.7 ng/mL insufficiency)',
        'Omega-3 Fish Oil',
      ],
    },
    {
      time: '14:00-18:30',
      slot: 'Afternoon Office',
      items: ['750 ml plain water sipped steadily'],
    },
    {
      time: '19:00',
      slot: 'Evening Bridge Gainer (Completes 4 Scoops = 2.82g Creatine)',
      items: ['2 level scoops Scitec Jumbo Hardcore (72g in plain water) + 1 Capsule Multi-Enzymes'],
    },
    {
      time: '20:30-21:00',
      slot: 'Dinner',
      items: ['Balanced solid dinner (~130g meat/fish/poultry + moderate carbs & vegetables; +300 kcal on Monday football nights)'],
    },
    {
      time: '22:30',
      slot: 'Pre-Sleep Recovery & Caloric Seal',
      items: [
        '1 Big Cup Night Smoothie (Avocado + 500ml milk + Casein blender batch)',
        'Magnesium Glycinate (moderate 200–300 mg dose; serum Mg is already 24 mg/L) — [Ashwagandha PAUSED pending ALAT re-check]',
      ],
    },
  ],
  labDrivenAdaptations: [
    'ADAPTATION 1 (HOLD ASHWAGANDHA & SHILAJIT): Paused until repeat liver panel confirms ALAT (currently 41 U/L, trending up from 20 U/L) remains comfortably low.',
    'ADAPTATION 2 (VITAMIN D3+K2 PRIORITY): Mandatory daily dosing at 13:00 solid lunch to resolve chronic 25-OH Vitamin D insufficiency (10.1 -> 10.2 -> 26.7 ng/mL; target 40-60 ng/mL with physician supervision).',
    'ADAPTATION 3 (FOLATE & IRON-RICH WHOLE FOODS): Add dark leafy greens (spinach/arugula) or lentils to lunch/dinner alongside daily avocado to lift Folate (7.0 ng/mL) and stabilize Ferritin (84 ug/L).',
    'ADAPTATION 4 (CLEANER 10:15 DESK SNACK & GENTLE MAGNESIUM): Swap daily Snickers bar on most days for 35-40g raw almonds/walnuts + 1 banana (protects ALAT and reverses HDL drift from 0.90 to 0.64 g/L); cap bedtime Magnesium Glycinate at 200-300 mg since serum Mg is already 24 mg/L.',
  ],
};

export const standardDailyMeals: DailyMealSlot[] = [
  {
    time: '07:30',
    label: 'Waking Gut Recovery',
    foods: '250 ml room-temperature water',
    supplements: '5g Micronized L-Glutamine (empty stomach, 15-20 min before breakfast)',
    rationale: 'Supports gut mucosal recovery and strengthens intestinal tight junctions upon waking.',
    calories: 0,
    proteinGrams: 5,
  },
  {
    time: '07:55-08:30',
    label: 'Morning Gainer + Mini Pancakes',
    foods: '2 level scoops Scitec Jumbo Hardcore (72g) + 5 tiny 5cm mini pancakes (~55g)',
    supplements: '1 Capsule Multi-Enzymes (Protease + Amylase + Lactase) — [Shilajit PAUSED pending ALAT re-check]',
    rationale: 'High-density AM calorie/carb/protein foundation with targeted digestive enzyme support.',
    calories: 438,
    proteinGrams: 33,
  },
  {
    time: '09:00-12:00',
    label: 'Office Hydration & Pre-Gym Fuel',
    foods: '10:15: 35-40g raw almonds/walnuts (~230 kcal, preferred for HDL & liver) OR occasional Snickers (50g) | 11:35: 5-7 Ajwa dates (~55g)',
    supplements: '1 Sachet max Electrolyte & Vitamin Powder in 1L water',
    rationale: 'Supports HDL cholesterol and clean liver ALAT with healthy fats; Ajwa dates deliver fast zero-fat pre-lift fuel.',
    calories: 423,
    proteinGrams: 5,
  },
  {
    time: '13:00',
    label: 'Post-Workout Lunch',
    foods: 'Chicken breast steak (~160g cooked, or lean red meat 1-2x/wk for ferritin) + Rice/Pasta/Potatoes (~180g cooked) + Dark leafy greens/Vegetables (for Folate B9) + 1 Fruit + Olive oil',
    supplements: 'Vitamin D3 + K2 (Mandatory Daily) + Omega-3 Fish Oil',
    rationale: 'Foundational health window: whole-food post-lift recovery; dietary fats maximize D3+K2 & Omega-3 absorption to fix 26.7 ng/mL insufficiency.',
    calories: 665,
    proteinGrams: 52,
  },
  {
    time: '19:00',
    label: 'Evening Bridge Gainer (Completes 4 Scoops = 2.82g Creatine)',
    foods: '2 level scoops Scitec Jumbo Hardcore (72g) in plain water',
    supplements: '1 Capsule Multi-Enzymes',
    rationale: 'Covers afternoon/stair expenditure and locks in 100% of daily creatine maintenance (2.82g) without gastric lag before dinner.',
    calories: 273,
    proteinGrams: 30,
  },
  {
    time: '20:30-21:00',
    label: 'Evening Dinner',
    foods: 'Balanced solid dinner (~130g meat/fish/poultry + moderate carbs & vegetables; +300 kcal carbs on Monday football nights)',
    supplements: 'None',
    rationale: 'Balanced evening macronutrient replenishment; extra carbs on Monday football nights.',
    calories: 600,
    proteinGrams: 32,
  },
  {
    time: '22:30',
    label: 'Night Smoothie & Sleep Anchor',
    foods: '1 Big Cup Night Smoothie (Avocado + 500ml milk + 1 scoop Casein blender batch)',
    supplements: 'Magnesium Glycinate (moderate 200–300 mg dose) — [Ashwagandha PAUSED pending ALAT re-check]',
    rationale: 'Overnight anti-catabolic amino release, monounsaturated fats for HDL, and gentle neuromuscular calm (serum Mg already 24 mg/L).',
    calories: 310,
    proteinGrams: 21,
  },
];

export const mondayDailyMeals: DailyMealSlot[] = standardDailyMeals.map((slot) =>
  slot.time === '19:00'
    ? {
        ...slot,
        label: 'Pre/Post Football Gainer (19:15 Match)',
        rationale: 'Timed around Monday 19:15 football match for glycogen & rapid recovery.',
      }
    : slot
);

export const restDailyMeals: DailyMealSlot[] = standardDailyMeals;

export const mondayNutrition: MealPlanPrescription = {
  targetKcal: 2710,
  targetProteinGrams: 174,
  preWorkoutTiming: '09:00-12:00 Pre-Workout Hydration & Slow Carbs',
  preWorkoutFoods: '1 Electrolytes Sachet in 1L water + 35-40g almonds/walnuts at 10:15 + 5-7 Ajwa Dates at 11:35',
  supplements: [
    { name: 'Micronized L-Glutamine', dosage: '5g', timing: '07:30 Waking (Empty Stomach)' },
    { name: 'Scitec Jumbo Hardcore (2 scoops + 2 scoops = 4 scoops)', dosage: '2.82g Creatine included', timing: '08:00 AM + 19:00 PM' },
    { name: 'Multi-Enzymes (Shilajit PAUSED pending ALAT check)', dosage: '1 capsule AM + 1 capsule PM', timing: 'With Jumbo Gainer shakes' },
    { name: 'Electrolyte & Vitamin Powder', dosage: '1 sachet max', timing: '09:00-12:00 Morning Water' },
    { name: 'Vitamin D3+K2 + Omega-3', dosage: 'Daily Mandatory Dose', timing: '13:00 Lunch with olive oil' },
    { name: 'Magnesium Glycinate (Ashwagandha PAUSED pending ALAT check)', dosage: '200-300mg moderate dose', timing: '22:30 Bedtime Smoothie' },
  ],
  dailyMeals: mondayDailyMeals,
  notes: 'Monday Match Protocol: 2,710 kcal floor (173.6g P / 317.4g C / 72.2g F) + 300 kcal evening match burn bonus. Lower body stays 100% unloaded at 12:05 for 19:15 football.',
};

export const workoutDayNutrition: MealPlanPrescription = {
  targetKcal: 2710,
  targetProteinGrams: 174,
  preWorkoutTiming: '09:00-12:00 Pre-Workout Hydration & Slow Carbs',
  preWorkoutFoods: '1 Electrolytes Sachet in 1L water + 35-40g almonds/walnuts at 10:15 + 5-7 Ajwa Dates at 11:35',
  supplements: mondayNutrition.supplements,
  dailyMeals: standardDailyMeals,
  notes: 'Training Day Protocol: 2,710 kcal | 173.6g Protein / 317.4g Carbs / 72.2g Fats | 4 scoops Scitec Jumbo = 2.82g Creatine.',
};

export const restDayNutrition: MealPlanPrescription = {
  targetKcal: 2710,
  targetProteinGrams: 174,
  supplements: mondayNutrition.supplements,
  dailyMeals: restDailyMeals,
  notes: 'Friday & Sunday Recovery Protocol: Maintain identical 2,710 kcal & 173.6g protein intake for tissue supercompensation.',
};

// ==========================================
// 4. THE 5-DAY POST-PARIS MASTER BLUEPRINT
//    28 EXERCISE SLOTS / 82 WORKING SETS PER WEEK
// ==========================================

export function createBlueprintDays(weekId: string, weekIndex: number = 1): ProgramDay[] {
  const isDeload = weekIndex === 7 || weekIndex === 12 || weekIndex === 16;
  const stdSets = isDeload ? 2 : 3;
  const rir3Set = isDeload ? [3, 4] : [2, 2, 1];
  const rir3SetSafe = isDeload ? [3, 4] : [2, 2, 2];

  return [
    // ----------------------------------------------------
    // MONDAY (DAY 1): UPPER PUSH, CHEST, MID-BACK & SCAPULAR DELTS (ZERO LEG LOAD)
    // ----------------------------------------------------
    {
      id: `${weekId}_d0`,
      weekId,
      dayOfWeek: 0,
      label: "Monday: 100% Seated/Braced Upper Push, Row, Side Delt & Triceps (Zero Lower-Body Load Before Football)",
      timeWindow: "12:05–12:42",
      warmupDurationSec: 300,
      liftingDurationSec: 1920,
      totalTargetSets: isDeload ? 10 : 15,
      dayBlindBriefing:
        "100% seated or braced upper-body session. Zero axial spinal load and zero leg/core fatigue so your legs are fresh for Monday night football. Add +300 kcal (1 banana + 1 extra scoop Jumbo or extra dinner carbs) on Monday nights to cover football burn.",
      warmupProtocol: [
        {
          step: 1,
          timeSlot: "12:05–12:07",
          drill: "Posture Reset & Cable External Rotations",
          prescription: "2.5 kg x 12 reps per arm",
          cue: "Tuck ribs down, pin elbow to side with a rolled towel/fist, rotate forearm outward smoothly to warm up the infraspinatus and supraspinatus.",
        },
        {
          step: 2,
          timeSlot: "12:07–12:08",
          drill: "Thoracic Bench Extensions & Scapular Slides",
          prescription: "10 slow reps",
          cue: "Open the chest without overarching the lower back.",
        },
        {
          step: 3,
          timeSlot: "12:08–12:10",
          drill: "Exercise #1 Ramp-Up Set (Lever Chest Press)",
          prescription: "20 kg x 12 controlled reps (60s rest before Working Set 1)",
          cue: "Dial in seat height so handles align with mid-to-lower chest.",
        },
      ],
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: mondayNutrition,
      blocks: [
        {
          id: `${weekId}_d0_b1`,
          order: 1,
          type: 'straight',
          bannerText: 'Primary Upper Push (90s Rest | Strictly Controlled Eccentric)',
          exercises: [
            // Exercise 1: lever chest press (0576)
            {
              id: `${weekId}_d0_ep1`,
              order: '1',
              timeSlot: "12:10–12:17",
              exerciseId: 'ex_0576',
              exerciseName: 'lever chest press',
              equipmentTypeLabel: "Plate-Loaded / Selectorized Lever Machine",
              sets: stdSets,
              warmupSets: 1,
              targetWeightKg: 40,
              targetWeightRangeKg: '40 kg flat',
              targetWeightNote: 'Week 2 PR hit 40 kg x 12 optimal; stay at 40 kg to build Sets 1 & 2 to 12 clean reps.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3Set,
              restSeconds: 90,
              tempo: "2-1-1-0 (2s lower, 1s bottom stretch pause, 1s press)",
              loadGuidance:
                'Straight 40 kg across all 3 sets. Push to 10-12 clean reps at 1-2 RIR. Advance only when 3x12 are smooth without asymmetry.',
              formCueText:
                'Set seat so handles align with mid-sternum. Pin shoulder blades down/back; lower over 3s, pause 1s stretched at chest, press smoothly.',
              setupCues: [
                "Set seat height so handles are at mid-to-lower sternum level (never high near the collarbones).",
                "Plant feet firmly, squeeze glutes lightly, and press your lower back flat against the pad.",
              ],
              executionAndStretchCues: [
                "Keep elbows tucked at a ~45° angle below shoulder height.",
                "Lower slowly over 2 seconds until your elbows are even with your torso (never deeper behind the body where the shoulder capsule pinches).",
                "Pause 1 full second in the bottom pectoral stretch, then drive handles forward.",
              ],
              progressionRule:
                "Stay flat at 40 kg across all 3 sets until you hit 12, 12, 12 at RIR 2; then move to 42.5 kg.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 40,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 90,
                  blindNote: "Flat working load. Control the 1s bottom stretch.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 40,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 90,
                  blindNote: "Keep lower back glued to pad; do not flare elbows.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 40,
                        targetRir: 2,
                        restSec: 75,
                        blindNote: "Stop 2 reps shy of failure; transition to Incline Press.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20chest%20press%20proper%20form',
              targetMuscleGroups: ['Chest', 'Pectorals', 'Front Deltoids', 'Triceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever chest press',
                  formCue: 'Mid-sternum handle height; 3s lowering phase; 1s stretch pause; press without shoulder shrug.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20chest%20press%20proper%20form',
                  targetFocus: 'Mid-Pec Sternal Hypertrophy',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'flat dumbbell bench press',
                  formCue: 'Feet flat; shoulder blades pinned; lower dumbbells smoothly beside lower chest.',
                  videoUrl: 'https://www.youtube.com/results?search_query=flat%20dumbbell%20bench%20press%20proper%20form',
                  targetFocus: 'Free Weight Sternal Hypertrophy',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'seated cable chest press',
                  formCue: 'Torso upright; press handles smoothly forward converging at sternum.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20cable%20chest%20press%20proper%20form',
                  targetFocus: 'Continuous Sternal Cable Tension',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'standard push-up (with handles)',
                  formCue: 'Hands slightly wider than shoulders; rigid glute plank; protract at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=push%20ups%20proper%20form',
                  targetFocus: 'Closed-Chain Chest & Core Control',
                },
              ],
            },
            // Exercise 2: lever incline chest press (0579)
            {
              id: `${weekId}_d0_ep2`,
              order: '2',
              timeSlot: "12:17–12:24",
              exerciseId: 'ex_0579',
              exerciseName: 'lever incline chest press',
              equipmentTypeLabel: "Plate-Loaded / Lever Incline Machine",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 20,
              targetWeightRangeKg: '20 kg flat (NO jump to 30 kg)',
              targetWeightNote: 'Week 2 20 kg x 8, 9 (3 RIR) cured balance_issue. Hold 20 kg and add reps across 3 sets.',
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: rir3Set,
              restSeconds: 90,
              tempo: "2-1-1-0",
              loadGuidance:
                'NO JUMP TO 30KG: Stay locked at 20 kg across all 3 sets until 10, 10, 10 reps are balanced with zero left-side wobble.',
              formCueText:
                'Glue lower back and ribs flat into backrest; drive chest up to meet handles with symmetrical left/right force; 3s lowering.',
              setupCues: [
                "Set seat so handles start just below the collarbones.",
                "Drive feet into the floor, depress shoulder blades down and back, and lock lower ribs down.",
              ],
              executionAndStretchCues: [
                "Keep elbows in a 30°–45° scapular plane (never flared 90° out to the sides).",
                "Lower under strict control to a 1-second stretch where hands are just outside the upper chest.",
                "DO NOT jump to 30 kg—stay at 20 kg to maintain 100% stability and zero balance_issue.",
              ],
              progressionRule:
                "Build from 20 kg x 8-9 reps up to 3 x 10 reps before adding 2.5 kg.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "8-10",
                  targetWeightKg: 20,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 90,
                  blindNote: "1 ramp-up set of 10 kg x 8 if needed, then 20 kg working set.",
                },
                {
                  setIndex: 2,
                  targetReps: "8-10",
                  targetWeightKg: 20,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 90,
                  blindNote: "Brace core so torso does not twist.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "8-10",
                        targetWeightKg: 20,
                        targetRir: 2,
                        restSec: 75,
                        blindNote: "Clean lockout without shrugging shoulders.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20incline%20chest%20press%20proper%20form',
              targetMuscleGroups: ['Upper Chest', 'Pectorals', 'Front Deltoids', 'Triceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever incline chest press',
                  formCue: 'Handles aligned with upper chest; 3s descent; zero lower back arch.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20incline%20chest%20press%20proper%20form',
                  targetFocus: 'Clavicular Upper Chest Shelf',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: '30° incline dumbbell press',
                  formCue: 'Bench at 30°; elbows tucked 45°; symmetrical press without clanging.',
                  videoUrl: 'https://www.youtube.com/results?search_query=30%20incline%20dumbbell%20press%20proper%20form',
                  targetFocus: 'Free Weight Clavicular Hypertrophy',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'incline cable chest press',
                  formCue: 'Pulleys low behind 30° bench; press smoothly upward converging at eye level.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline%20cable%20chest%20press%20proper%20form',
                  targetFocus: 'Continuous Tension Upper Chest',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'feet-elevated decline push-ups',
                  formCue: 'Toes elevated on bench; lower upper chest slowly; full serratus push at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=decline%20push%20ups%20proper%20form',
                  targetFocus: 'Bodyweight Clavicular Protraction',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d0_b2`,
          order: 2,
          type: 'straight',
          bannerText: 'Chest-Supported Mid-Back Row (75s Rest | Zero Lower-Back Fatigue)',
          exercises: [
            // Exercise 3: lever seated row (0603)
            {
              id: `${weekId}_d0_ep3`,
              order: '3',
              timeSlot: "12:24–12:31",
              exerciseId: 'ex_0603',
              exerciseName: 'lever seated row',
              equipmentTypeLabel: "Chest-Supported Lever Row Machine",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 35,
              targetWeightRangeKg: '35-40 kg',
              targetWeightNote: 'Week 2 logged 40x8, 35x12 optimal; keep chest glued to pad to save legs/low back for 19:15 football.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3Set,
              restSeconds: 75,
              tempo: "2-1-1-1 (2s return, 1s protraction stretch, 1s pull, 1s squeeze)",
              loadGuidance: '35-40 kg (default 35 kg for clean 10-12 reps). Allow shoulder blades to protract fully on eccentric.',
              formCueText:
                'Keep sternum pressed flat into chest pad. Pull elbows back toward hips, hold 1s squeeze, then stretch shoulder blades forward over 2s.',
              setupCues: [
                "Adjust chest pad so your sternum is firmly supported and feet are planted.",
                "Keep neck neutral and chest glued to the pad throughout all reps.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: At the start of every rep, let the weight gently pull your shoulder blades forward (protraction) for a 1-second upper-back stretch while keeping your chest on the pad.",
                "Initiate the pull by retracting your shoulder blades, then drive elbows back.",
              ],
              progressionRule:
                "Use 35 kg for 3 x 10-12 (or Set 1 at 40 kg x 8-10 and Sets 2-3 at 35 kg x 10-12).",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 35,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "Full 1s scapular stretch at the front of each rep.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 35,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "Do not lift chest off pad to yank the weight.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 35,
                        targetRir: 2,
                        restSec: 60,
                        blindNote: "Walk directly to the 2:1 Cable Tower for Pair 4A + 4B.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20row%20proper%20form',
              targetMuscleGroups: ['Upper Back', 'Lats', 'Rhomboids', 'Mid Traps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated row',
                  formCue: 'Chest glued to pad; pull handles toward ribs; 2s full scapular stretch.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20row%20proper%20form',
                  targetFocus: 'Thoracic Thickness & Rhomboid Control',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'chest-supported dumbbell row',
                  formCue: 'Prone on 30° bench; pull dumbbells back leading with elbows.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest%20supported%20dumbbell%20row%20proper%20form',
                  targetFocus: 'Free Weight Chest-Supported Back Mass',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'seated cable row (neutral grip)',
                  formCue: 'Sit upright, torso rigid; pull neutral attachment to belly button.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20cable%20row%20proper%20form',
                  targetFocus: 'Continuous Cable Mid-Back Tension',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'inverted row (Smith machine bar)',
                  formCue: 'Heels planted; keep plank rigid; pull sternum to bar and pause 1s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=inverted%20row%20proper%20form',
                  targetFocus: 'Bodyweight Scapular Retraction',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d0_b3`,
          order: 3,
          type: 'superset',
          tag: 'Superset 4A/4B',
          bannerText: 'Superset 4A + 4B (45s Rest | Side Delts & Rope Pushdown)',
          rounds: stdSets,
          exercises: [
            // Exercise 4A: cable one arm lateral raise (0178)
            {
              id: `${weekId}_d0_ep4`,
              order: '4A',
              subMovementOrder: '4A',
              supersetGroup: '4',
              supersetTag: 'Superset 4A/4B',
              pairedWithExerciseId: 'ex_0200',
              interSetRestSeconds: 45,
              timeSlot: "12:31–12:42",
              exerciseId: 'ex_0178',
              exerciseName: 'cable one arm lateral raise',
              equipmentTypeLabel: "2:1 Smooth Cable Pulley Stack (Single Handle)",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 5,
              targetWeightRangeKg: '5 kg (lowest pin on 2:1 stack)',
              targetWeightNote: 'LEFT-ARM LEADER RULE: Perform Left Arm first, match cleanly on Right. lever lateral raise permanently removed.',
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: rir3Set,
              restSeconds: 45,
              tempo: "2-1-1-1",
              loadGuidance:
                'LEFT-ARM LEADER RULE @ 5KG: Left arm sets the rep count first; brace free hand on frame, 30° forward scapular plane.',
              formCueText:
                'Left Arm First! Set pulley at wrist height, brace opposite hand on column, raise in 30° forward scapular plane without shrugging.',
              setupCues: [
                "Set the pulley at WRIST HEIGHT (not floor height) on the 2:1 cable column.",
                "Stand sideways to the stack, holding the tower frame with your non-working hand and stepping slightly away.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: Let your working hand cross slightly in front of your hips at the bottom so the cable stretches the side delt before you start lifting.",
                "Sweep your arm outward and slightly forward (30° scapular plane) up to shoulder height—never higher than parallel, and keep pinky ниже/level with thumb (never pour the pitcher).",
                "NOTE: Lever Lateral Raise (ep6 in old program) is permanently deleted to protect your supraspinatus.",
              ],
              progressionRule:
                "Progress reps from 12 to 15 at 5 kg before ever increasing weight.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "12-15",
                  targetWeightKg: 5,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 45,
                  blindNote: "Left + Right arm, then rest 45s and switch to 4B Rope Pushdown on same stack.",
                },
                {
                  setIndex: 2,
                  targetReps: "12-15",
                  targetWeightKg: 5,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 45,
                  blindNote: "30° forward scapular plane; zero shoulder pinching.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "12-15",
                        targetWeightKg: 5,
                        targetRir: 2,
                        restSec: 45,
                        blindNote: "Final lateral raise set; transition to final Rope Pushdown set.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20one%20arm%20lateral%20raise%20proper%20form',
              targetMuscleGroups: ['Lateral Deltoids', 'Side Delts'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable one arm lateral raise',
                  formCue: 'Left arm first; 30° forward scapular plane; soft elbow; 2s lowering.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20one%20arm%20lateral%20raise%20proper%20form',
                  targetFocus: 'Supraspinatus-Safe Lateral Delt Tension',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated dumbbell lateral raise',
                  formCue: 'Seated tall; slight forward torso lean; raise dumbbells in scapular plane.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20dumbbell%20lateral%20raise%20proper%20form',
                  targetFocus: 'Free Weight Side Delt Hypertrophy',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever lateral raise',
                  formCue: 'Fallback only if cable tower occupied: Pin 1 lightest weight, no shrug.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20lateral%20raise%20proper%20form',
                  targetFocus: 'Emergency Cable-Occupied Fallback Only',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'side-plank lateral arm reach',
                  formCue: 'Side plank rigid; raise top arm overhead smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=side%20plank%20arm%20reach%20proper%20form',
                  targetFocus: 'Bodyweight Lateral Shoulder Stability',
                },
              ],
            },
            // Exercise 4B: cable pushdown (with rope attachment) (0200)
            {
              id: `${weekId}_d0_ep5`,
              order: '4B',
              subMovementOrder: '4B',
              supersetGroup: '4',
              supersetTag: 'Superset 4A/4B',
              pairedWithExerciseId: 'ex_0178',
              interSetRestSeconds: 45,
              timeSlot: "12:31–12:42",
              exerciseId: 'ex_0200',
              exerciseName: 'cable pushdown (with rope attachment)',
              equipmentTypeLabel: "High Cable Pulley with Rope Attachment (Same Tower as 4A)",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 25,
              targetWeightRangeKg: '25-30 kg',
              targetWeightNote: 'Week 1 logged 25x10, 30x10; keep elbows locked at ribs with zero torso swing.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3Set,
              restSeconds: 45,
              tempo: "2-0-1-1",
              loadGuidance: '25-30 kg: Start at 25 kg; move to 30 kg only when 3x12 lockouts stay clean without shoulders rounding forward.',
              formCueText:
                'Pin upper arms to sides of ribcage. Extend elbows downward and spread the rope ends outward at bottom for 1s lockout.',
              setupCues: [
                "Attach rope to the high pulley on the same cable station.",
                "Take one small step back, hinge torso forward 15°, tuck ribs down, and pin elbows slightly in front of your ribs.",
              ],
              executionAndStretchCues: [
                "Press the rope down and pull the ends apart at the bottom for a 1-second hard lockout.",
                "Control the eccentric all the way up until forearms touch biceps without letting elbows flare forward.",
              ],
              progressionRule:
                "Use 25 kg flat for 3 x 10-12 (or Set 1 at 30 kg x 10-12 and Sets 2-3 at 25 kg x 10-12 so reps never drop to 6).",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 25,
                  targetRir: isDeload ? 3 : 1,
                  restSec: 45,
                  blindNote: "Full 1s lockout at bottom; rest 45s then return to 4A.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 25,
                  targetRir: isDeload ? 3 : 1,
                  restSec: 45,
                  blindNote: "Keep shoulders depressed away from ears.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 25,
                        targetRir: 1,
                        restSec: 0,
                        blindNote: "Session complete at 12:42! Head to shower and eat post-workout lunch at 13:00.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20rope%20pushdown%20proper%20form',
              targetMuscleGroups: ['Triceps', 'Triceps Lateral Head'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pushdown (with rope attachment)',
                  formCue: 'Elbows pinned to ribs; push down and spread rope apart at lockout.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20rope%20pushdown%20proper%20form',
                  targetFocus: 'Triceps Lateral & Medial Head Sweep',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'lying dumbbell skullcrusher',
                  formCue: 'Lie flat; lower dumbbells beside ears under 3s control; extend cleanly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lying%20dumbbell%20skullcrusher%20proper%20form',
                  targetFocus: 'Free Weight Triceps Overload',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'seated dip machine',
                  formCue: 'Keep chest tall; drive handles down cleanly locking triceps at bottom.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20dip%20machine%20proper%20form',
                  targetFocus: 'Machine Triceps Compound Load',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'close-grip bench triceps push-up',
                  formCue: 'Hands elevated shoulder-width; keep elbows tight to torso.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline%20tricep%20push%20up%20proper%20form',
                  targetFocus: 'Closed-Chain Triceps Press',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // TUESDAY (DAY 2): POST-FOOTBALL UPPER PULL, BICEPS & FOREARMS (ZERO LEG LOAD)
    // ----------------------------------------------------
    {
      id: `${weekId}_d1`,
      weekId,
      dayOfWeek: 1,
      label: "Tuesday: 100% Seated Back Width/Thickness, Biceps & Forearms",
      timeWindow: "12:05–12:42",
      warmupDurationSec: 300,
      liftingDurationSec: 1920,
      totalTargetSets: isDeload ? 11 : 16,
      dayBlindBriefing:
        "Rear Delt Rope Row is moved to Saturday morning, freeing up 6 minutes so Preacher Curl and Rope Hammer Curl both get 3 full sets inside your 35-minute lunch window, plus 1 burnout set of Cable Wrist Curl at the end.",
      warmupProtocol: [
        {
          step: 1,
          timeSlot: "12:05–12:07",
          drill: "Active Scapular Depressions / Lat Pulldown Warm-Up",
          prescription: "20 kg x 12 slow reps",
          cue: "Practice pulling shoulders down away from ears before bending elbows.",
        },
        {
          step: 2,
          timeSlot: "12:07–12:08",
          drill: "Bicep & Elbow Tendon Warm-Up Curls",
          prescription: "10 kg cable curl x 15 easy reps",
          cue: "Pump blood into the distal bicep tendon and forearms.",
        },
        {
          step: 3,
          timeSlot: "12:08–12:10",
          drill: "Exercise #1 Ramp-Up Set (Cable Pulldown)",
          prescription: "30 kg x 8 reps (60s rest before Working Set 1)",
          cue: "Lock thighs tightly under the knee pad.",
        },
      ],
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: workoutDayNutrition,
      blocks: [
        {
          id: `${weekId}_d1_b1`,
          order: 1,
          type: 'straight',
          bannerText: 'Vertical & Horizontal Back Width/Thickness',
          exercises: [
            // Exercise 1: cable pulldown (0198)
            {
              id: `${weekId}_d1_ep1`,
              order: '1',
              timeSlot: "12:10–12:17",
              exerciseId: 'ex_0198',
              exerciseName: 'cable pulldown',
              equipmentTypeLabel: "Lat Pulldown Cable Station",
              sets: stdSets,
              warmupSets: 1,
              targetWeightKg: 40,
              targetWeightRangeKg: '40-42.5 kg',
              targetWeightNote: 'Week 2 PR: 40x10, 40x10, 42.5x8 optimal.',
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: rir3Set,
              restSeconds: 90,
              tempo: "2-1-1-1",
              loadGuidance: 'Sets 1-2 @ 40 kg, Set 3 top set @ 42.5 kg. Move all sets to 42.5 kg once Set 3 hits 10 clean reps.',
              formCueText:
                'Initiate every rep by pulling shoulder blades down out of your ears for 1s, then drive elbows to pockets toward upper chest.',
              setupCues: [
                "Take a medium-wide overhand or neutral grip (1.5x shoulder width).",
                "Anchor thighs firmly under the pad, keep torso nearly upright (~10–15° lean), and pull lower ribs down.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: At the top of every rep, let the bar gently pull your arms and lats upward into a full 1-second overhead stretch without losing your rib-cage tuck.",
                "Drive elbows down and inward toward your front pockets, squeezing lats for 1s at collarbone level.",
              ],
              progressionRule:
                "Run 40 kg for Sets 1-2 (10 reps) and 42.5 kg for Set 3 (8-10 reps), or 40 kg flat across all 3 sets.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "8-10",
                  targetWeightKg: 40,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 90,
                  blindNote: "1s full overhead lat stretch on every rep.",
                },
                {
                  setIndex: 2,
                  targetReps: "8-10",
                  targetWeightKg: 40,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 90,
                  blindNote: "Drive elbows down; do not swing lower back.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "8-10",
                        targetWeightKg: 42.5,
                        targetRir: 2,
                        restSec: 75,
                        blindNote: "Top set at 42.5 kg x 8-10 (or stay at 40 kg x 10).",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20pulldown%20proper%20form',
              targetMuscleGroups: ['Lats', 'Lower Traps', 'Biceps', 'Upper Back'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pulldown',
                  formCue: '1s scapular depression before elbow pull; full overhead lat stretch.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20pulldown%20proper%20form',
                  targetFocus: 'Lat Width & Scapular Control',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever lat pulldown machine',
                  formCue: 'Chest against pad; pull diverging arms down to collarbone level.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20lat%20pulldown%20proper%20form',
                  targetFocus: 'Machine-Guided Vertical Pull',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell pullover (across flat bench)',
                  formCue: 'Rest upper back on bench; stretch dumbbell overhead keeping arms softly bent.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20pullover%20proper%20form',
                  targetFocus: 'Long-Length Lat Stretch',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'close-grip neutral pull-up',
                  formCue: 'Dead hang depression; drive elbows to ribs until chin clears bar.',
                  videoUrl: 'https://www.youtube.com/results?search_query=neutral%20grip%20pull%20up%20proper%20form',
                  targetFocus: 'Bodyweight Vertical Pulling Strength',
                },
              ],
            },
            // Exercise 2: lever seated row (0603)
            {
              id: `${weekId}_d1_ep2`,
              order: '2',
              timeSlot: "12:17–12:24",
              exerciseId: 'ex_0603',
              exerciseName: 'lever seated row',
              equipmentTypeLabel: "Chest-Supported Lever Row Machine",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 35,
              targetWeightRangeKg: '35-40 kg',
              targetWeightNote: 'Week 2 logged 40x8, 35x12 optimal; keep chest glued flat.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3Set,
              restSeconds: 75,
              tempo: "2-1-1-1",
              loadGuidance: '35-40 kg: Keep torso completely supported so Monday match legs rest undisturbed.',
              formCueText:
                'Chest flat against front support pad; let shoulder blades glide forward into full stretch, then squeeze mid-back 1s.',
              setupCues: [
                "Chest firmly against pad, seat height set so pull path targets mid-back.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: Allow full 1-second scapular protraction stretch at the front of every rep.",
                "Row smoothly and squeeze shoulder blades together for 1 second at the back.",
              ],
              progressionRule:
                "Stay flat at 35 kg for 3 x 10-12, or 40 kg Set 1 (8-10 reps) and 35 kg Sets 2-3 (12 reps).",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 35,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "Controlled negative with 1s front stretch.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 35,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "Keep shoulders down away from ears.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 35,
                        targetRir: 2,
                        restSec: 60,
                        blindNote: "Transition to Seated Cable Row.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20row%20proper%20form',
              targetMuscleGroups: ['Upper Back', 'Lats', 'Rhomboids', 'Mid Traps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated row',
                  formCue: 'Chest anchored; pull to ribs; 2s scapular protraction stretch.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20row%20proper%20form',
                  targetFocus: 'Post-Football Supported Back Volume',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'chest-supported dumbbell row',
                  formCue: 'Chest flat on 30° bench; pull elbows back past ribline.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest%20supported%20dumbbell%20row%20proper%20form',
                  targetFocus: 'Free Weight Mid-Back Control',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'seated cable row (wide neutral)',
                  formCue: 'Vertical torso; squeeze rhomboids cleanly without rocking.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20cable%20row%20proper%20form',
                  targetFocus: 'Continuous Cable Horizontal Pull',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'inverted bodyweight row',
                  formCue: 'Body rigid; squeeze mid-back at bar contact.',
                  videoUrl: 'https://www.youtube.com/results?search_query=inverted%20row%20proper%20form',
                  targetFocus: 'Bodyweight Horizontal Pulling',
                },
              ],
            },
            // Exercise 3: cable straight back seated row (0239)
            {
              id: `${weekId}_d1_ep3`,
              order: '3',
              timeSlot: "12:24–12:31",
              exerciseId: 'ex_0239',
              exerciseName: 'cable straight back seated row',
              equipmentTypeLabel: "Seated Cable Row Station (Underhand / Supinated Bar or Close Grip)",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 35,
              targetWeightRangeKg: '35 kg',
              targetWeightNote: 'Week 2 PR hit 35 kg x 10, 11 optimal with underhand grip.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3Set,
              restSeconds: 75,
              tempo: "2-1-1-1",
              loadGuidance: '35 kg across all 3 sets (underhand palms-up bar tucked low toward navel).',
              formCueText:
                'Sit upright with torso vertical (never lean back). Grip straight bar underhand shoulder-width and drag elbows tight past waist.',
              setupCues: [
                "Use an underhand (supinated) shoulder-width grip to recruit lower lats and biceps together.",
                "Brace knees with a slight bend, sit tall with neutral pelvis and ribs stacked.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: Let arms extend fully and lean torso forward ~15° from the hips at the front of each rep for a 1-second lower-lat stretch.",
                "Pull handle into your lower abdomen/belly button while returning torso upright.",
              ],
              progressionRule:
                "Lock in your new 35 kg PR across all 3 sets of 10-12 reps.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 35,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "Elbows grazing sides; pull to lower waist.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 35,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "Pause 1s in the forward lat stretch.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 35,
                        targetRir: 2,
                        restSec: 60,
                        blindNote: "Transition to Preacher Curl + Rope Hammer Curl pair.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=underhand%20seated%20cable%20row%20proper%20form',
              targetMuscleGroups: ['Lats', 'Lower Lats', 'Biceps', 'Mid Back'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable straight back seated row',
                  formCue: 'Palms-up grip; vertical torso; pull bar into lower navel.',
                  videoUrl: 'https://www.youtube.com/results?search_query=underhand%20seated%20cable%20row%20proper%20form',
                  targetFocus: 'Lower Lat Line & Supinated Arm Pull',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'underhand plate-loaded low row',
                  formCue: 'Chest against pad; palms-up handles pulled down toward waist.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20low%20row%20underhand%20proper%20form',
                  targetFocus: 'Low-Lat Machine Isolation',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'underhand incline bench dumbbell row',
                  formCue: 'Chest supported; palms forward at top pulling low toward hips.',
                  videoUrl: 'https://www.youtube.com/results?search_query=underhand%20chest%20supported%20dumbbell%20row',
                  targetFocus: 'Free Weight Supinated Lat Pull',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'supinated inverted row',
                  formCue: 'Underhand grip on low bar; pull lower ribs to bar.',
                  videoUrl: 'https://www.youtube.com/results?search_query=underhand%20inverted%20row%20proper%20form',
                  targetFocus: 'Closed-Chain Supinated Back Pull',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d1_b2`,
          order: 2,
          type: 'superset',
          tag: 'Superset 4A/4B',
          bannerText: 'Superset 4A + 4B (45s Rest | Biceps & Brachialis Stack)',
          rounds: stdSets,
          exercises: [
            // Exercise 4A: lever preacher curl (0591)
            {
              id: `${weekId}_d1_ep4`,
              order: '4A',
              subMovementOrder: '4A',
              supersetGroup: '4',
              supersetTag: 'Superset 4A/4B',
              pairedWithExerciseId: 'ex_0165',
              interSetRestSeconds: 45,
              timeSlot: "12:31–12:41",
              exerciseId: 'ex_0591',
              exerciseName: 'lever preacher curl',
              equipmentTypeLabel: "Preacher Curl Machine",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 20,
              targetWeightRangeKg: '20 kg',
              targetWeightNote: 'Week 2 logged 20x11, 20x11 optimal.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3Set,
              restSeconds: 45,
              tempo: "3-1-1-0",
              loadGuidance: '20 kg flat: Armpits tucked squarely over top edge of pad, full 3s stretch at bottom without hyperextending elbow.',
              formCueText:
                'Plant armpits flat on upper preacher pad. Lower handles slowly over 3s to 95% extension, pause 1s stretched, curl up cleanly.',
              setupCues: [
                "Adjust seat so your armpits rest snugly at the top edge of the preacher pad and upper arms are flat against the pad.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: Preacher curls apply maximum tension in the bottom 30% of the range (lengthened biceps). Lower over 3 seconds until elbows are 95% straight, pause 1 second in the bottom stretch, and curl up smoothly without lifting elbows off the pad.",
              ],
              progressionRule:
                "Stay at 20 kg until you hit 12, 12, 12 across all 3 sets.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 20,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 45,
                  blindNote: "3s slow negative, 1s bottom stretch; rest 45s then do 4B Rope Hammer Curl.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 20,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 45,
                  blindNote: "Keep wrists straight/supinated; do not slam the stack.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 20,
                        targetRir: 1,
                        restSec: 45,
                        blindNote: "Final preacher set; move to final Hammer Curl + Wrist Curl.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20preacher%20curl%20proper%20form',
              targetMuscleGroups: ['Biceps', 'Brachialis'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever preacher curl',
                  formCue: 'Armpits anchored on top edge; 3s lowering; 1s stretch pause at bottom.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20preacher%20curl%20proper%20form',
                  targetFocus: 'Pad-Locked Biceps Short- & Mid-Head Isolation',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'single-arm dumbbell preacher curl',
                  formCue: 'Lean into preacher bench; lower smoothly over 3s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20preacher%20curl%20proper%20form',
                  targetFocus: 'Unilateral Free Weight Symmetry',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable preacher curl (with straight bar)',
                  formCue: 'Place preacher bench in front of low pulley for constant tension.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20preacher%20curl%20proper%20form',
                  targetFocus: 'Constant Cable Peak Contraction',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'underhand close bodyweight curl (TRX/bar)',
                  formCue: 'Keep elbows elevated in front of shoulders; curl body up cleanly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=bodyweight%20bicep%20curl%20proper%20form',
                  targetFocus: 'Closed-Chain Bicep Flexion',
                },
              ],
            },
            // Exercise 4B: cable hammer curl (with rope) (0165)
            {
              id: `${weekId}_d1_ep5`,
              order: '4B',
              subMovementOrder: '4B',
              supersetGroup: '4',
              supersetTag: 'Superset 4A/4B',
              pairedWithExerciseId: 'ex_0591',
              interSetRestSeconds: 45,
              timeSlot: "12:31–12:41",
              exerciseId: 'ex_0165',
              exerciseName: 'cable hammer curl (with rope)',
              equipmentTypeLabel: "Low Cable Pulley with Rope Attachment",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 25,
              targetWeightRangeKg: '25-30 kg',
              targetWeightNote: 'Week 2 PR hit 30 kg x 8, then dropped to 25 kg x 10. Anchor at 25 kg or Set 1 @ 30 kg + Sets 2-3 @ 25 kg.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3Set,
              restSeconds: 45,
              tempo: "2-1-1-1",
              loadGuidance: '25-30 kg: Keep elbows pinned at ribs with thumbs pointed up; zero body English.',
              formCueText:
                'Thumbs up hammer grip on rope; pin elbows quietly beside ribs, curl until forearms touch biceps, hold 1s peak, lower 2s.',
              setupCues: [
                "Attach rope to low pulley, grip with thumbs pointing up (neutral grip), stand 1 step back, and pin elbows to ribs.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: Let arms straighten completely at the bottom of every rep for a 1-second brachialis and brachioradialis stretch, then curl thumbs toward shoulders.",
              ],
              progressionRule:
                "Use 25 kg for 3 x 10-12 (or Set 1 at 30 kg x 8-10 and Sets 2-3 at 25 kg x 10-12).",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 25,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 45,
                  blindNote: "Full elbow extension at bottom; rest 45s then return to 4A Preacher Curl.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 25,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 45,
                  blindNote: "Zero torso swing.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 25,
                        targetRir: 1,
                        restSec: 15,
                        blindNote: "Immediately switch rope for straight handle at same low pulley for 1 burnout set of Wrist Curl.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20hammer%20curl%20rope%20proper%20form',
              targetMuscleGroups: ['Brachialis', 'Biceps', 'Forearms', 'Brachioradialis'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable hammer curl (with rope)',
                  formCue: 'Thumbs pointed up; elbows glued to sides; 2s controlled negative.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20hammer%20curl%20rope%20proper%20form',
                  targetFocus: 'Outer Arm Thickness (Brachialis & Forearm)',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'standing dumbbell hammer curl',
                  formCue: 'Alternating or simultaneous hammer curls; keep shoulders relaxed down.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20hammer%20curl%20proper%20form',
                  targetFocus: 'Free Weight Brachialis Overload',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'neutral-grip preacher curl machine',
                  formCue: 'Use vertical/neutral grip handles; control lowering smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=neutral%20grip%20machine%20curl%20proper%20form',
                  targetFocus: 'Stabilized Hammer Flexion',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'towel neutral bodyweight curl',
                  formCue: 'Loop towel around post/bar; pull chest toward hands with palms facing each other.',
                  videoUrl: 'https://www.youtube.com/results?search_query=towel%20bicep%20curl%20bodyweight',
                  targetFocus: 'Forearm Grip & Brachialis Tension',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d1_b3`,
          order: 3,
          type: 'straight',
          bannerText: 'Forearm Finisher (15s after Hammer Curl Set 3)',
          exercises: [
            // Exercise 5: cable wrist curl (0247)
            {
              id: `${weekId}_d1_ep6`,
              order: '5',
              timeSlot: "12:41–12:42",
              exerciseId: 'ex_0247',
              exerciseName: 'cable wrist curl',
              equipmentTypeLabel: "Low Cable Pulley (Straight Bar Handle)",
              sets: 1,
              warmupSets: 0,
              targetWeightKg: 15,
              targetWeightRangeKg: '15 kg',
              targetWeightNote: 'Week 2 PR hit 15 kg x 20. Single 2-minute burnout set.',
              repRangeLow: 15,
              repRangeHigh: 20,
              rirScheme: isDeload ? [3] : [1],
              restSeconds: 0,
              tempo: "1-1-1-1",
              loadGuidance: '1 burnout set @ 15 kg for 15-20 slow reps immediately after Superset 4.',
              formCueText:
                'Kneel or brace forearms along bench/thighs; allow bar to roll down to fingertips on bottom stretch, then curl cleanly up.',
              setupCues: [
                "Stand facing the low pulley (or brace forearms on thighs/bench) with palms facing up.",
              ],
              executionAndStretchCues: [
                "Let the bar roll down into your fingers for a 1-second forearm flexor stretch, then curl wrists up hard for 15–20 reps.",
              ],
              progressionRule:
                "1 high-rep burnout set at 15 kg x 15-20 reps to finish Tuesday in 60 seconds.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "15-20",
                  targetWeightKg: 15,
                  targetRir: isDeload ? 3 : 1,
                  restSec: 0,
                  blindNote: "1 all-out forearm pump set at 15 kg x 20. Session complete at 12:42!",
                },
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20wrist%20curl%20proper%20form',
              targetMuscleGroups: ['Forearms', 'Wrist Flexors'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable wrist curl',
                  formCue: 'Pin forearms still; let bar roll smoothly toward fingertips and curl up.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20wrist%20curl%20proper%20form',
                  targetFocus: 'Constant Cable Forearm Flexor Burnout',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated dumbbell wrist curl',
                  formCue: 'Rest forearms across bench; curl dumbbells upward smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20dumbbell%20wrist%20curl%20proper%20form',
                  targetFocus: 'Free Weight Wrist Flexor Hypertrophy',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'plate-loaded wrist roller / curl machine',
                  formCue: 'Control full wrist extension without shoulder movement.',
                  videoUrl: 'https://www.youtube.com/results?search_query=wrist%20roller%20forearms%20proper%20form',
                  targetFocus: 'Mechanical Forearm Density',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'dead-hang bar grip hold',
                  formCue: 'Tightly crush pull-up bar with hollow ribs down for 30-45s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dead%20hang%20grip%20strength%20form',
                  targetFocus: 'Isometric Grip Endurance',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // WEDNESDAY (DAY 3): QUAD-DOMINANT LEGS, GLUTE MEDIUS & REAR DELTS (#2)
    // ----------------------------------------------------
    {
      id: `${weekId}_d2`,
      weekId,
      dayOfWeek: 2,
      label: "Wednesday: Long-Length Hamstrings, Glute-Biased Leg Press, Quads, Lateral Hip & Fresh Rear Delts",
      timeWindow: "12:05–12:42",
      warmupDurationSec: 300,
      liftingDurationSec: 1920,
      totalTargetSets: isDeload ? 10 : 15,
      dayBlindBriefing:
        "Starts with Seated Leg Curl (Maeo long-length hamstring protocol) which warms up the knees before 45° Leg Press and Leg Extension. Finishes with Seated Hip Abduction paired with 3 fresh sets of Seated Reverse Fly (Shoulder Hit #2) while your upper body is 100% rested.",
      warmupProtocol: [
        {
          step: 1,
          timeSlot: "12:05–12:07",
          drill: "Bodyweight Hip Hinges & Deep Squat Pry",
          prescription: "10 hinges + 10 deep bodyweight squats holding a frame",
          cue: "Open hips and ankles while keeping lower back neutral.",
        },
        {
          step: 2,
          timeSlot: "12:07–12:10",
          drill: "Exercise #1 Ramp-Up Set (Lever Seated Leg Curl)",
          prescription: "20 kg x 12 controlled reps (60s rest before Working Set 1)",
          cue: "Lock the thigh pad tightly down over your quads just above the knees.",
        },
      ],
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: workoutDayNutrition,
      blocks: [
        {
          id: `${weekId}_d2_b1`,
          order: 1,
          type: 'straight',
          bannerText: 'Hamstring Pre-Warmup + Quad-Dominant Compounds',
          exercises: [
            // Exercise 1: lever seated leg curl (0599)
            {
              id: `${weekId}_d2_ep1`,
              order: '1',
              timeSlot: "12:10–12:17",
              exerciseId: 'ex_0599',
              exerciseName: 'lever seated leg curl',
              equipmentTypeLabel: "Seated Leg Curl Machine",
              sets: stdSets,
              warmupSets: 1,
              targetWeightKg: 40,
              targetWeightRangeKg: '40 kg',
              targetWeightNote: 'Week 2 logged 40x12, 40x13 optimal.',
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: rir3Set,
              restSeconds: 75,
              tempo: "2-1-1-1 (1s squeeze at bottom, 2s return, 1s top stretch)",
              loadGuidance: '40 kg across all 3 sets: Keep slight 15-20° forward torso lean (Maeo 2021) for maximum stretched hamstring growth.',
              formCueText:
                'Lock lap pad tight; hinge forward 15-20° holding side handles so hips stay flexed, curl heels under seat and control a 3s return.',
              setupCues: [
                "Align knee joint with the machine pivot point; set ankle pad just above the Achilles tendon; lock thigh pad down.",
              ],
              executionAndStretchCues: [
                "MAEO LONG-LENGTH HYPERTROPHY CUE: Instead of leaning back against the backrest, hinge your torso slightly forward (~15°–20°) over the thigh pad while keeping your spine straight. This flexes the hip further and places the hamstrings under maximum stretch at the top of every rep (proven to build 1.5x more hamstring mass).",
                "Pause 1 full second in the stretched position with knees straight before curling down.",
              ],
              progressionRule:
                "You hit 40 kg x 16 on Set 2 last week; lock in 40 kg across all 3 sets with the forward-lean stretch.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "12-15",
                  targetWeightKg: 40,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "Lean torso 15° forward over thigh pad; pause 1s in the top stretch.",
                },
                {
                  setIndex: 2,
                  targetReps: "12-15",
                  targetWeightKg: 40,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "Dorsiflex ankles (pull toes toward shins) on every curl.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "12-15",
                        targetWeightKg: 40,
                        targetRir: 2,
                        restSec: 75,
                        blindNote: "Knees are now warm and lubricated for 45° Leg Press.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20leg%20curl%20proper%20form',
              targetMuscleGroups: ['Hamstrings', 'Calves'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated leg curl',
                  formCue: 'Lean 15-20° forward (Maeo); lock lap pad down; 3s return.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20leg%20curl%20proper%20form',
                  targetFocus: 'Maximal Lengthened Hamstring Hypertrophy',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell lying bench leg curl',
                  formCue: 'Pin dumbbell between arches of feet on decline/flat bench; curl smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20leg%20curl%20proper%20form',
                  targetFocus: 'Free Weight Knee Flexion',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'standing cable ankle leg curl',
                  formCue: 'Ankle strap low pulley; hold frame; curl heel up toward glute.',
                  videoUrl: 'https://www.youtube.com/results?search_query=standing%20cable%20leg%20curl%20proper%20form',
                  targetFocus: 'Unilateral Cable Hamstring Isolation',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'nordic curl negative / sliding floor curl',
                  formCue: 'Towel or sliders under heels on floor; bridge hips up and pull heels in.',
                  videoUrl: 'https://www.youtube.com/results?search_query=sliding%20floor%20hamstring%20curl%20proper%20form',
                  targetFocus: 'Bodyweight Hamstring Stretch',
                },
              ],
            },
            // Exercise 2: sled 45° leg press (0739)
            {
              id: `${weekId}_d2_ep2`,
              order: '2',
              timeSlot: "12:17–12:24",
              exerciseId: 'ex_0739',
              exerciseName: 'sled 45° leg press',
              equipmentTypeLabel: "45° Plate-Loaded Leg Press",
              sets: stdSets,
              warmupSets: 1,
              targetWeightKg: 40,
              targetWeightRangeKg: '40-45 kg added',
              targetWeightNote: 'Week 2 logged 40x12, 45x12 optimal.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3SetSafe,
              restSeconds: 90,
              tempo: "3-1-1-0",
              loadGuidance: '40-45 kg added plates: Keep sacrum/tailbone glued flat to seat pad at deepest knee bend.',
              formCueText:
                'Place feet mid-to-low shoulder-width on sled. Lower slowly over 3s until thighs near chest without tailbone lifting off pad; drive through heels.',
              setupCues: [
                "Place feet HIGH and SHOULDER-WIDTH on the platform to bias glutes and hamstrings while protecting knees.",
                "Grip the side handles firmly and pull your pelvis down into the seat.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: Lower the sled over 3 seconds as deep as your hip mobility allows WITHOUT your tailbone/lower back curling up off the pad.",
                "Pause 1 second at the bottom glute/quad stretch, then drive through your heels (never lock knees out 100% at the top).",
              ],
              progressionRule:
                "Stay at 40 kg for 3 x 12 (or bump to 45 kg once 3 x 12 feels easy).",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 40,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 90,
                  blindNote: "High & wide foot placement; drive through heels.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 40,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 90,
                  blindNote: "1s pause at bottom; keep sacrum glued to seat.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 40,
                        targetRir: 2,
                        restSec: 75,
                        blindNote: "Transition to Leg Extension.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=45%20degree%20leg%20press%20proper%20form',
              targetMuscleGroups: ['Quads', 'Glutes', 'Adductors'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'sled 45° leg press',
                  formCue: 'Sacrum glued flat to seat; 3s lowering to deep knee bend; push through full foot.',
                  videoUrl: 'https://www.youtube.com/results?search_query=45%20degree%20leg%20press%20proper%20form',
                  targetFocus: 'Spine-Unloaded Quad Mass Builder',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'heels-elevated goblet squat',
                  formCue: 'Heels on small plates; torso tall; sink between knees slowly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=heels%20elevated%20goblet%20squat%20proper%20form',
                  targetFocus: 'Free Weight Quad-Biased Squat',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable belt squat / goblet cable squat',
                  formCue: 'Low cable pulling between legs; sit straight down smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20goblet%20squat%20proper%20form',
                  targetFocus: 'Constant-Tension Vertical Squat',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'heels-elevated sissy/deep bodyweight squat',
                  formCue: 'Hold upright column lightly; sink knees forward over toes under 3s count.',
                  videoUrl: 'https://www.youtube.com/results?search_query=heels%20elevated%20bodyweight%20squat%20form',
                  targetFocus: 'Deep Quad Knee Flexion',
                },
              ],
            },
            // Exercise 3: lever leg extension (0585)
            {
              id: `${weekId}_d2_ep3`,
              order: '3',
              timeSlot: "12:24–12:31",
              exerciseId: 'ex_0585',
              exerciseName: 'lever leg extension',
              equipmentTypeLabel: "Seated Leg Extension Machine",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 30,
              targetWeightRangeKg: '30-35 kg',
              targetWeightNote: 'Week 2 logged 30x13, 35x14 PR optimal.',
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: rir3Set,
              restSeconds: 75,
              tempo: "2-1-1-1",
              loadGuidance: '30-35 kg: Pull seat slightly back for longer rectus femoris stretch at bottom; hold handles tight.',
              formCueText:
                'Recline backrest slightly to open hip angle (maximal rectus femoris stretch). Hold handles tightly, kick smoothly to full top lockout for 1s.',
              setupCues: [
                "Set the backrest so the back of your knees sits flush against the seat edge.",
                "LONG-LENGTH SETUP: Set the bottom range-of-motion pin as far back under the seat as comfortable so your knees bend past 90°.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: Lower all the way back under the seat and pause 1 second in the deep quad (rectus femoris) stretch on every rep.",
                "Extend to a 1-second peak quad squeeze at the top while pulling yourself down into the seat handles.",
              ],
              progressionRule:
                "3 sets of 12-15 at 30-35 kg (capped at 6 total quad sets/week to account for your ~6,045 weekly stairs).",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "12-15",
                  targetWeightKg: 30,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "Full knee flexion stretch at bottom + 1s top squeeze.",
                },
                {
                  setIndex: 2,
                  targetReps: "12-15",
                  targetWeightKg: 30,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "No kicking or momentum.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "12-15",
                        targetWeightKg: 30,
                        targetRir: 2,
                        restSec: 60,
                        blindNote: "Transition to Pair 4A (Hip Abduction) + 4B (Seated Reverse Fly).",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20leg%20extension%20proper%20form',
              targetMuscleGroups: ['Quads', 'Rectus Femoris'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever leg extension',
                  formCue: 'Recline slightly for hip stretch; pause 1s locked out at top; lower smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20leg%20extension%20proper%20form',
                  targetFocus: 'Full Rectus Femoris Hypertrophy',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated bench dumbbell leg extension',
                  formCue: 'Pin light dumbbell between feet on bench; extend knees slowly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20leg%20extension%20proper%20form',
                  targetFocus: 'Free Weight Quad Lockout',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'reverse nordic / cable quad extension',
                  formCue: 'Facing away from low pulley with ankle cuff; extend knee steadily.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20leg%20extension%20proper%20form',
                  targetFocus: 'Unilateral Quad Tension',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'controlled reverse nordic lean',
                  formCue: 'Kneel upright on pad, ribs tucked, lean torso straight back as unit.',
                  videoUrl: 'https://www.youtube.com/results?search_query=reverse%20nordic%20curl%20proper%20form',
                  targetFocus: 'Longest-Length Bodyweight Quad Stretch',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d2_b2`,
          order: 2,
          type: 'superset',
          tag: 'Superset 4A/4B',
          bannerText: 'Superset 4A + 4B (45s Rest | Hip Abduction + Fresh Rear Delts #2)',
          rounds: stdSets,
          exercises: [
            // Exercise 4A: lever seated hip abduction (0597)
            {
              id: `${weekId}_d2_ep4`,
              order: '4A',
              subMovementOrder: '4A',
              supersetGroup: '4',
              supersetTag: 'Superset 4A/4B',
              pairedWithExerciseId: 'ex_0602',
              interSetRestSeconds: 45,
              timeSlot: "12:31–12:42",
              exerciseId: 'ex_0597',
              exerciseName: 'lever seated hip abduction',
              equipmentTypeLabel: "Seated Hip Abduction Machine",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 40,
              targetWeightRangeKg: '40 kg',
              targetWeightNote: 'Week 2 logged 40x15, 40x15 PR optimal.',
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: rir3Set,
              restSeconds: 45,
              tempo: "2-1-1-1",
              loadGuidance: '40 kg: Lean slightly forward (15-20°) holding side frame or sit tall for max glute medius recruitment.',
              formCueText:
                'Drive outer knees smoothly apart against pads, pause 1s at widest spread, control slow 2s close without stack clanging.',
              setupCues: [
                "Set start pin to a narrow width, sit tall with pelvis neutral (do not slouch).",
              ],
              executionAndStretchCues: [
                "Push knees wide, hold 1 full second at peak abduction to strengthen glute medius/minimus (pelvic lateral stabilizers), and control the return for a 1s inner-hip stretch.",
              ],
              progressionRule:
                "Lock in your 40 kg PR across all 3 sets of 12-15 reps.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "12-15",
                  targetWeightKg: 40,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 45,
                  blindNote: "1s hold at wide position; rest 45s then do 4B Reverse Fly.",
                },
                {
                  setIndex: 2,
                  targetReps: "12-15",
                  targetWeightKg: 40,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 45,
                  blindNote: "Keep spine tall and pelvis neutral.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "12-15",
                        targetWeightKg: 40,
                        targetRir: 2,
                        restSec: 45,
                        blindNote: "Final lower-body set of Wednesday.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=seated%20hip%20abduction%20machine%20proper%20form',
              targetMuscleGroups: ['Glute Medius', 'Glutes', 'Hip Stabilizers'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated hip abduction',
                  formCue: 'Slight forward torso lean; push knees wide, pause 1s, slow return.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20hip%20abduction%20machine%20proper%20form',
                  targetFocus: 'Glute Medius & Football Lateral Hip Stability',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'side-lying dumbbell hip abduction',
                  formCue: 'Rest dumbbell on outer thigh; raise straight top leg slightly behind hip line.',
                  videoUrl: 'https://www.youtube.com/results?search_query=side%20lying%20hip%20abduction%20proper%20form',
                  targetFocus: 'Free Weight Glute Medius Control',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'standing cable hip abduction',
                  formCue: 'Low ankle strap; stand tall bracing frame; sweep leg out at 15° backward angle.',
                  videoUrl: 'https://www.youtube.com/results?search_query=standing%20cable%20hip%20abduction%20proper%20form',
                  targetFocus: 'Standing Unilateral Glute Medius',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'side-plank clamshell raise',
                  formCue: 'Lift hips while driving top knee open with band/bodyweight.',
                  videoUrl: 'https://www.youtube.com/results?search_query=side%20plank%20clamshell%20proper%20form',
                  targetFocus: 'Pelvic Lateral Stability',
                },
              ],
            },
            // Exercise 4B: lever seated reverse fly (0602)
            {
              id: `${weekId}_d2_ep5`,
              order: '4B',
              subMovementOrder: '4B',
              supersetGroup: '4',
              supersetTag: 'Superset 4A/4B',
              pairedWithExerciseId: 'ex_0597',
              interSetRestSeconds: 45,
              timeSlot: "12:31–12:42",
              exerciseId: 'ex_0602',
              exerciseName: 'lever seated reverse fly',
              equipmentTypeLabel: "Rear Delt Pec Deck Machine (Facing Pad)",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 35,
              targetWeightRangeKg: '35-40 kg',
              targetWeightNote: 'Week 2 logged 35x13, 40x13 PR optimal (Shoulder #2 fresh upper body).',
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: rir3Set,
              restSeconds: 45,
              tempo: "2-1-1-1",
              loadGuidance: '35-40 kg: Keep seat 1 notch high so handles sit slightly below shoulder line (anti-shrug).',
              formCueText:
                'Chest pinned flat to pad, arms sweeping wide back toward ears—stop parallel with shoulders (avoid pinching shoulder blades together awkwardly).',
              setupCues: [
                "Set handles all the way forward; adjust seat so handles are at exact shoulder height.",
                "Sit facing the pad with sternum supported and shoulders depressed down.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: Let your arms reach forward for a 1-second rear-delt stretch at the start of every rep without shrugging your upper traps.",
                "Sweep arms wide in a wide arc (pushing the walls apart, not pinching shoulder blades together) until elbows are aligned with torso.",
              ],
              progressionRule:
                "35-40 kg for 3 x 12-15 reps.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "12-15",
                  targetWeightKg: 35,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 45,
                  blindNote: "Upper body is 100% fresh; isolate rear delts with zero trap shrug.",
                },
                {
                  setIndex: 2,
                  targetReps: "12-15",
                  targetWeightKg: 35,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 45,
                  blindNote: "1s front stretch, 1s back hold.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "12-15",
                        targetWeightKg: 35,
                        targetRir: 1,
                        restSec: 0,
                        blindNote: "Wednesday session complete at 12:42!",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20reverse%20fly%20proper%20form',
              targetMuscleGroups: ['Rear Deltoids', 'Rhomboids', 'Infraspinatus'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated reverse fly',
                  formCue: 'Sweep knuckles wide out toward walls; stop in line with torso.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20reverse%20fly%20proper%20form',
                  targetFocus: 'Pure Posterior Deltoid Hypertrophy',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'chest-supported dumbbell reverse fly',
                  formCue: 'Prone on 30° bench; raise dumbbells out with soft elbows.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest%20supported%20dumbbell%20reverse%20fly%20proper%20form',
                  targetFocus: 'Free Weight Rear Delt Rounding Fix',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'crossed-cable reverse fly',
                  formCue: 'Cross bare cables at chest height; sweep arms straight back cleanly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20reverse%20fly%20proper%20form',
                  targetFocus: 'Zero-Resistance-Drop Cable Rear Delt',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'prone floor T-raise (external rotation)',
                  formCue: 'Lie face down; lift arms wide with thumbs up.',
                  videoUrl: 'https://www.youtube.com/results?search_query=prone%20t%20raise%20proper%20form',
                  targetFocus: 'Postural Scapular Rear Delt Endurance',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // THURSDAY (DAY 4): HINGE, GLUTES, HIGH ROW, PEC DECK & ARMS LONG-HEAD (MAEO)
    // ----------------------------------------------------
    {
      id: `${weekId}_d3`,
      weekId,
      dayOfWeek: 3,
      label: "Thursday: Posterior Chain (RDL & Glute Bridge Machine), V-Taper & Long-Length Arm Superset (Option A)",
      timeWindow: "12:05–12:42",
      warmupDurationSec: 300,
      liftingDurationSec: 1920,
      totalTargetSets: isDeload ? 12 : 18,
      dayBlindBriefing:
        "Lever Shoulder Press and Cable Lateral Raise are moved off Thursday (eliminating the Nov 5 joint_strain bottleneck). This unlocks full time for the Glute Bridge Machine (Slot 2) and finishes with Option A: 3 alternating sets of EZ-Bar Cable Curl + 45° Forward-Leaning Overhead Rope Triceps Extension (Maeo 2023 1.5x Long-Head Stretch) on the exact same cable stack.",
      warmupProtocol: [
        {
          step: 1,
          timeSlot: "12:05–12:07",
          drill: "Glute Activation Bridges with Posterior Pelvic Tilt",
          prescription: "10 bodyweight reps with 2s top squeeze",
          cue: "Exhale ribs down, flatten lower back, wake up glutes before RDLs.",
        },
        {
          step: 2,
          timeSlot: "12:07–12:10",
          drill: "Exercise #1 Ramp-Up Set (Dumbbell Romanian Deadlift)",
          prescription: "15 kg total (2 x 7.5 kg) x 10 slow hip-hinge reps",
          cue: "Feel the hamstring stretch at mid-shin with a flat back.",
        },
      ],
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: workoutDayNutrition,
      blocks: [
        {
          id: `${weekId}_d3_b1`,
          order: 1,
          type: 'straight',
          bannerText: 'Posterior Chain Hinge & Glute Bridge + V-Bar High Row + Pec Deck',
          exercises: [
            // Exercise 1: dumbbell romanian deadlift (1459)
            {
              id: `${weekId}_d3_ep1`,
              order: '1',
              timeSlot: "12:10–12:17",
              exerciseId: 'ex_1459',
              exerciseName: 'dumbbell romanian deadlift',
              equipmentTypeLabel: "Dumbbells (Logged as Combined Total Weight: 30 kg = 2 x 15 kg)",
              sets: stdSets,
              warmupSets: 1,
              targetWeightKg: 30,
              targetWeightRangeKg: '30 kg combined (2x15 kg)',
              targetWeightNote: 'Log 30 kg total combined load. Slide dumbbells tight along shins.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3SetSafe,
              restSeconds: 90,
              tempo: "3-1-1-0",
              loadGuidance: '30 kg combined (2x15 kg DBs): Hinge hips straight back like closing a car door with your glutes; stop mid-shin when hips stop moving.',
              formCueText:
                'Lock ribs to pelvis and pull shoulder blades slightly back/down. Push hips backward slowly over 3s keeping dumbbells grazing legs; stop mid-shin and drive hips forward.',
              setupCues: [
                "Stand with feet hip-width apart, soft 15° knee bend locked in place, dumbbells resting against front/sides of thighs.",
                "Brace core, stack ribs over pelvis, and pack lats down.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: Push your hips straight backward (as if closing a car door with your glutes) while shaving the dumbbells down your thighs/shins.",
                "Stop the descent the exact moment your hips stop moving back (around mid-shin), pause 1 full second in the deep hamstring stretch, then drive hips forward to stand (do not hyperextend lower back at the top).",
              ],
              progressionRule:
                "Stay at 30 kg (2 x 15 kg) until you hit 10, 10, 10 -> 12, 12, 12 across all 3 sets.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 30,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 90,
                  blindNote: "3s slow descent, 1s pause in mid-shin hamstring stretch.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 30,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 90,
                  blindNote: "Keep dumbbells glued to legs; zero lower-back rounding.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 30,
                        targetRir: 2,
                        restSec: 75,
                        blindNote: "Walk straight to the Hip Thrust / Glute Bridge Machine.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20romanian%20deadlift%20proper%20form',
              targetMuscleGroups: ['Hamstrings', 'Glutes', 'Lower Back'],
              selectedEquipment: 'dumbbell',
              equipmentVariations: [
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell romanian deadlift',
                  formCue: 'Dumbbells shave front of thighs/shins; push hips straight back; neutral spine.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20romanian%20deadlift%20proper%20form',
                  targetFocus: 'Controlled Lengthened Hamstring Hinge',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'smith machine romanian deadlift',
                  formCue: 'Stand with bar over shoelaces; fixed vertical bar track.',
                  videoUrl: 'https://www.youtube.com/results?search_query=smith%20machine%20romanian%20deadlift%20proper%20form',
                  targetFocus: 'Track-Stabilized Hinge Progression',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pull-through / low cable RDL',
                  formCue: 'Step forward from low pulley; hinge hips backward smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20romanian%20deadlift%20proper%20form',
                  targetFocus: 'Constant Horizontal Hip Extension Load',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'single-leg bodyweight romanian deadlift',
                  formCue: 'Hold wall lightly for balance; hinge hip back keeping pelvis level.',
                  videoUrl: 'https://www.youtube.com/results?search_query=single%20leg%20romanian%20deadlift%20bodyweight',
                  targetFocus: 'Pelvic Anti-Rotation Hamstring Control',
                },
              ],
            },
            // Exercise 2: barbell glute bridge (1409)
            {
              id: `${weekId}_d3_ep2`,
              order: '2',
              timeSlot: "12:17–12:23",
              exerciseId: 'ex_1409',
              exerciseName: 'barbell glute bridge',
              equipmentTypeLabel: "Dedicated Hip Thrust / Glute Bridge Machine at Punch",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 30,
              targetWeightRangeKg: '30-35 kg',
              targetWeightNote: 'Execute on Glute Bridge Machine (zero barbell lap setup delay) keeping ribs tucked down at lockout.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3Set,
              restSeconds: 75,
              tempo: "2-0-1-2 (2s posterior pelvic tilt hold at top)",
              loadGuidance: '30-35 kg: Pause 2 full seconds squeezed at top with ribs tucked toward hips (no lumbar over-extension).',
              formCueText:
                'Buckle belt tightly across hips, tuck chin slightly forward looking at knees, drive through heels, squeeze glutes hard for 2s at horizontal lockout.',
              setupCues: [
                "Position upper back/shoulder blades on the pad so shins are vertical (90° knee angle) at the top of the bridge.",
                "Tuck chin slightly (look forward, not at the ceiling) and keep ribs pulled down.",
              ],
              executionAndStretchCues: [
                "POSTURE CORRECTION CUE: Drive through your heels and lock out at the top with a 2-second Posterior Pelvic Tilt squeeze—glutes maximally shortened while your abs keep your rib cage stacked. Never arch your lumbar spine.",
              ],
              progressionRule:
                "3 sets of 10-12 at 30-35 kg.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 30,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "Hold top glute squeeze for 2 full seconds with ribs down.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 30,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "Shins vertical at top; push through heels.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 30,
                        targetRir: 2,
                        restSec: 60,
                        blindNote: "Transition to Seated High Row (V-Bar).",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=glute%20bridge%20machine%20proper%20form',
              targetMuscleGroups: ['Glutes', 'Hamstrings', 'Core'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'barbell glute bridge',
                  formCue: 'Glute bridge machine belt snug; eyes forward; 2s top posterior pelvic tilt squeeze.',
                  videoUrl: 'https://www.youtube.com/results?search_query=glute%20bridge%20machine%20proper%20form',
                  targetFocus: 'Maximal Gluteus Maximus Pelvic Lock',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'single-leg dumbbell hip thrust',
                  formCue: 'Shoulder blades on bench; dumbbell over working hip; drive through heel.',
                  videoUrl: 'https://www.youtube.com/results?search_query=single%20leg%20hip%20thrust%20proper%20form',
                  targetFocus: 'Unilateral Glute Symmetry',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pull-through (glute squeeze)',
                  formCue: 'Rope between legs; snap hips forward squeezing glutes upright.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20pull%20through%20proper%20form',
                  targetFocus: 'Peak Lockout Hip Extension',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'elevated feet bodyweight glute bridge',
                  formCue: 'Heels on low bench; tuck tailbone up and pause 2s at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=bodyweight%20glute%20bridge%20proper%20form',
                  targetFocus: 'Bodyweight Posterior Pelvic Tilt Activation',
                },
              ],
            },
            // Exercise 3: cable seated high row (v-bar) (0215)
            {
              id: `${weekId}_d3_ep3`,
              order: '3',
              timeSlot: "12:23–12:29",
              exerciseId: 'ex_0215',
              exerciseName: 'cable seated high row (v-bar)',
              equipmentTypeLabel: "Seated Cable Row / High Row with V-Bar",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 35,
              targetWeightRangeKg: '35-40 kg',
              targetWeightNote: 'Week 2 baseline sets 35 / 40 / 35 kg optimal.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3Set,
              restSeconds: 60,
              tempo: "2-1-1-1",
              loadGuidance: '35 / 40 / 35 kg: Pull V-bar slightly upward toward sternum/xiphoid while leaning back ~10° cleanly.',
              formCueText:
                'Sit upright with V-bar; let shoulder blades round forward fully on negative (2s stretch), then pull chest-high with elbows flaring ~45°.',
              setupCues: [
                "Sit tall with pelvis neutral and knees slightly bent.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: Let the V-bar pull your shoulder blades forward into a 1-second upper-back stretch at the front of each rep.",
                "Pull V-bar toward your upper abdomen/sternum while squeezing mid-back for 1s.",
              ],
              progressionRule:
                "Stay flat at 35 kg or 40 kg across all 3 sets (do not jump to 45 kg where reps drop to 6).",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 35,
                  targetRir: isDeload ? 3 : 1,
                  restSec: 60,
                  blindNote: "1s front scapular stretch, 1s back squeeze.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 40,
                  targetRir: isDeload ? 3 : 1,
                  restSec: 60,
                  blindNote: "Keep torso braced and chest proud.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 35,
                        targetRir: 1,
                        restSec: 60,
                        blindNote: "Transition to Seated Pec Deck Fly.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20seated%20high%20row%20v%20bar%20proper%20form',
              targetMuscleGroups: ['Upper Back', 'Mid Traps', 'Rhomboids', 'Lats', 'Biceps'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable seated high row (v-bar)',
                  formCue: 'Pull V-bar toward mid/lower sternum; 2s full shoulder-blade stretch.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20seated%20high%20row%20v%20bar%20proper%20form',
                  targetFocus: 'Upper/Mid Back Thickness & Scapular Glide',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'high-pulley lever seated row',
                  formCue: 'Chest against pad; pull high handles diagonally down toward chest.',
                  videoUrl: 'https://www.youtube.com/results?search_query=high%20row%20machine%20proper%20form',
                  targetFocus: 'Supported Thoracic Row',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'chest-supported flared-elbow dumbbell row',
                  formCue: 'Prone on 30° bench; elbows flared 45° pulling up toward upper back.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest%20supported%20dumbbell%20row%20proper%20form',
                  targetFocus: 'Free Weight Mid-Trap Development',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'wide-elbow inverted ring/bar row',
                  formCue: 'Pull chest toward bar with elbows 45° out; squeeze upper back.',
                  videoUrl: 'https://www.youtube.com/results?search_query=wide%20inverted%20row%20proper%20form',
                  targetFocus: 'Bodyweight Rhomboid Control',
                },
              ],
            },
            // Exercise 4: lever seated fly (0596)
            {
              id: `${weekId}_d3_ep4`,
              order: '4',
              timeSlot: "12:29–12:34",
              exerciseId: 'ex_0596',
              exerciseName: 'lever seated fly',
              equipmentTypeLabel: "Seated Pec Deck Fly Machine",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 30,
              targetWeightRangeKg: '30 kg',
              targetWeightNote: 'Week 1 logged 30x12 optimal.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3Set,
              restSeconds: 60,
              tempo: "2-1-1-1",
              loadGuidance: '30 kg across all 3 sets: Focus purely on stretched chest tension without letting shoulders roll forward.',
              formCueText:
                'Set arms 1 notch ahead of plane so shoulders never over-stretch behind torso; sweep elbows together hugging a wide tree, 3s lowering.',
              setupCues: [
                "SHOULDER SAFETY PIN: Set the range-of-motion start pin 1–2 holes forward so the handles start in the 30° scapular plane (elbows slightly in front of torso, never wrenched behind your back).",
                "Adjust seat so hands are slightly below shoulder height.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: Open arms slowly over 2 seconds until you feel a deep stretch across the chest while elbows remain slightly in front of the shoulder socket; pause 1 second in the stretch, then bring hands together for a 1-second squeeze.",
              ],
              progressionRule:
                "Stay flat at 30 kg across all 3 sets (do not jump to 35 kg) until you hit 12, 12, 12.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 30,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 60,
                  blindNote: "1s stretch pause in safe scapular plane.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 30,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 60,
                  blindNote: "Keep shoulder blades pinned back against pad.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 30,
                        targetRir: 2,
                        restSec: 45,
                        blindNote: "Walk to Cable Column for Option A Arm Superset (5A + 5B).",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=pec%20deck%20machine%20fly%20proper%20form',
              targetMuscleGroups: ['Chest', 'Pectorals', 'Front Deltoids'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated fly',
                  formCue: 'Chest tall; open arms over 3s to crisp pec stretch; sweep hands together.',
                  videoUrl: 'https://www.youtube.com/results?search_query=pec%20deck%20machine%20fly%20proper%20form',
                  targetFocus: 'Zero-Stability Sternal Chest Stretch',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'incline dumbbell chest fly',
                  formCue: '30° bench; slight bend in elbows; open wide smoothly and hug back up.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline%20dumbbell%20fly%20proper%20form',
                  targetFocus: 'Free Weight Deep Pec Stretch',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'seated cable chest fly',
                  formCue: 'Pulleys at shoulder height behind bench; bring handles cleanly together.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20cable%20chest%20fly%20proper%20form',
                  targetFocus: 'Constant Cable Sternal Tension',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'wide push-up with floor slider / slow eccentric',
                  formCue: 'Hands slightly wide on handles; descend 3s to deep chest stretch.',
                  videoUrl: 'https://www.youtube.com/results?search_query=wide%20push%20up%20proper%20form',
                  targetFocus: 'Closed-Chain Chest Stretch',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d3_b2`,
          order: 2,
          type: 'superset',
          tag: 'Superset 5A/5B',
          bannerText: 'Superset 5A + 5B (45s Rest | EZ-Bar Cable Curl + Maeo 2023 Overhead Extension)',
          rounds: stdSets,
          exercises: [
            // Exercise 5A: cable curl (0155)
            {
              id: `${weekId}_d3_ep5`,
              order: '5A',
              subMovementOrder: '5A',
              supersetGroup: '5',
              supersetTag: 'Superset 5A/5B',
              pairedWithExerciseId: 'ex_0194',
              interSetRestSeconds: 45,
              timeSlot: "12:34–12:42",
              exerciseId: 'ex_0155',
              exerciseName: 'cable curl',
              equipmentTypeLabel: "Low Cable Pulley with EZ-Bar Attachment",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 30,
              targetWeightRangeKg: '30 kg',
              targetWeightNote: 'Week 1 logged 30x12 optimal.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3Set,
              restSeconds: 45,
              tempo: "2-1-1-1",
              loadGuidance: '30 kg with EZ-bar attachment: Pin elbows right beside ribs and curl smoothly with zero lower-back sway.',
              formCueText:
                'Take 1 small step back from low pulley so cable stays taut at the bottom. Pin elbows quietly to ribs; curl up and hold 1s peak.',
              setupCues: [
                "Set pulley near bottom, attach EZ-bar, and step 1–2 feet forward (or face away if using single handle) so the cable pulls slightly backward at the bottom.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: Let arms extend 95% at the bottom with elbows pinned at your sides for a 1-second bicep stretch, then curl to a hard squeeze.",
              ],
              progressionRule:
                "You crushed 30 kg x 12, 12 (optimal); now lock in 3 sets of 10-12 at 30 kg paired with 5B.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 30,
                  targetRir: isDeload ? 3 : 1,
                  restSec: 45,
                  blindNote: "Perform Set 1, rest 45s while raising pulley to mid-chest for 5B Overhead Rope Extension.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 30,
                  targetRir: isDeload ? 3 : 1,
                  restSec: 45,
                  blindNote: "Zero lower-back lean; rest 45s then do Set 2 of 5B.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 30,
                        targetRir: 1,
                        restSec: 45,
                        blindNote: "Final bicep set of the week; rest 45s then finish with Set 3 of 5B.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=ez%20bar%20cable%20curl%20proper%20form',
              targetMuscleGroups: ['Biceps', 'Forearms'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable curl',
                  formCue: '1 step back for continuous tension; elbows quiet; curl EZ-bar cleanly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=ez%20bar%20cable%20curl%20proper%20form',
                  targetFocus: 'Continuous Biceps Tension Curve',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'incline dumbbell bicep curl',
                  formCue: '45° bench; hang arms straight behind torso for deep bicep stretch.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline%20dumbbell%20curl%20proper%20form',
                  targetFocus: 'Stretched Long-Head Biceps Hypertrophy',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'seated biceps curl machine',
                  formCue: 'Braced upper arms on pad; curl cleanly to chin.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20biceps%20curl%20machine%20proper%20form',
                  targetFocus: 'Zero-Swing Machine Biceps Overload',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'supinated bodyweight bar curl',
                  formCue: 'Body inclined under fixed bar; keep elbows pointed forward and curl head toward bar.',
                  videoUrl: 'https://www.youtube.com/results?search_query=bodyweight%20pelican%20curl%20proper%20form',
                  targetFocus: 'Bodyweight Biceps Flexion',
                },
              ],
            },
            // Exercise 5B: cable overhead triceps extension (0194)
            {
              id: `${weekId}_d3_ep6`,
              order: '5B',
              subMovementOrder: '5B',
              supersetGroup: '5',
              supersetTag: 'Superset 5A/5B',
              pairedWithExerciseId: 'ex_0155',
              interSetRestSeconds: 45,
              timeSlot: "12:34–12:42",
              exerciseId: 'ex_0194',
              exerciseName: 'cable overhead triceps extension',
              equipmentTypeLabel: "Mid-Chest Cable Pulley with Rope Attachment (Same Tower as 5A)",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 17.5,
              targetWeightRangeKg: '15-20 kg',
              targetWeightNote: 'Maeo 2023 proved overhead position drives ~40% greater long-head triceps hypertrophy than neutral pushdowns.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3Set,
              restSeconds: 45,
              tempo: "2-1-1-1 (2s lower behind head, 1s deep stretch pause, 1s extend)",
              loadGuidance: '15-20 kg (17.5 kg default): Lean forward 45° away from stack, upper arms overhead framing ears.',
              formCueText:
                'Pulley at chest height; face away, lean torso 45° forward in split stance with elbows pointing high overhead. Bend elbows deeply behind head (3s), pause 1s stretched, press forward.',
              setupCues: [
                "SHOULDER-SAFE PULLEY HEIGHT: Set the pulley at MID-CHEST HEIGHT (never at the floor).",
                "Grab the rope, turn away from the stack, step into a staggered split stance, hinge your torso forward 45°, squeeze your back glute, and pull your lower ribs down so your lower back cannot arch.",
                "Position your elbows forward and slightly outward (~30° scapular plane) at a comfortable 120°–135° angle—never cranked 180° straight up behind your ears.",
              ],
              executionAndStretchCues: [
                "MAEO (2023) 1.5x LONG-HEAD STRETCH CUE: Using ~35% lighter weight than your 30 kg pushdown (15–20 kg), let the rope travel back behind your head until your forearms touch your biceps. Pause 1 full second in that deep long-head stretch, then extend your arms forward to full lockout.",
              ],
              progressionRule:
                "Start at 15–20 kg for 3 x 10-12; prioritize deep elbow bend and 0 shoulder strain over heavy load.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 17.5,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 45,
                  blindNote: "45° torso lean, ribs down, 1s deep stretch behind head; rest 45s then return to 5A.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 17.5,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 45,
                  blindNote: "Keep elbows in 30° scapular plane.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 17.5,
                        targetRir: 1,
                        restSec: 0,
                        blindNote: "Thursday session complete at 12:42 with a massive Bicep + Tricep pump!",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20overhead%20triceps%20extension%20rope%20proper%20form',
              targetMuscleGroups: ['Triceps', 'Triceps (Long Head)'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable overhead triceps extension',
                  formCue: '45° forward lean; elbows pinned overhead; 3s descent into full stretch behind head.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20overhead%20triceps%20extension%20rope%20proper%20form',
                  targetFocus: 'Maeo 2023 Triceps Long-Head Hypertrophy',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated overhead dumbbell triceps extension',
                  formCue: 'Sit upright on back-supported bench; lower one dumbbell slowly behind neck.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20overhead%20dumbbell%20triceps%20extension',
                  targetFocus: 'Free Weight Overhead Triceps Stretch',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'machine overhead triceps extension',
                  formCue: 'Elbows on pad overhead; extend smoothly to lockout.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20overhead%20triceps%20extension',
                  targetFocus: 'Pad-Guided Long Head Triceps',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'bodyweight overhead bar triceps extension',
                  formCue: 'Hands on waist-high bar; duck head beneath arms stretching triceps cleanly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=bodyweight%20tricep%20extension%20bar',
                  targetFocus: 'Closed-Chain Long Head Triceps Stretch',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // FRIDAY (DAY 5): REST & RECOVERY DAY
    // ----------------------------------------------------
    {
      id: `${weekId}_d4`,
      weekId,
      dayOfWeek: 4,
      label: 'Friday: Rest & Active Recovery (Daily Office Stairs)',
      isRestDay: true,
      morningRoutine: morningAlignmentDrills,
      nutrition: restDayNutrition,
      blocks: [],
    },

    // ----------------------------------------------------
    // SATURDAY (DAY 6): SHOULDERS, LAT SWEEP & DIRECT ABS (MORNING UNRUSHED)
    // ----------------------------------------------------
    {
      id: `${weekId}_d5`,
      weekId,
      dayOfWeek: 5,
      label: "Saturday: Unrushed 3D Shoulder Precision, Lat-to-Pelvis Bridge & Anti-Arch Pelvic Core",
      timeWindow: "Saturday Morning Unrushed (~45 Mins)",
      warmupDurationSec: 300,
      liftingDurationSec: 2520,
      totalTargetSets: isDeload ? 12 : 18,
      dayBlindBriefing:
        "Zero lunch-clock pressure. Because you have not done any heavy chest pressing or rows beforehand, your rotator cuff is 100% fresh for all 3 shoulder heads (Front, Rear, Side), followed by your Lat-to-Pelvis Bridge and Cable/Bench Abs before your 15:00 Hammam.",
      warmupProtocol: [
        {
          step: 1,
          timeSlot: "Warm-Up 1 (2m)",
          drill: "Cable External Rotations & Light Rope Face-Pulls",
          prescription: "2.5 kg external rotations x 12/side + 10 kg rope face-pulls x 15",
          cue: "Center the humeral head in the shoulder socket before pressing.",
        },
        {
          step: 2,
          timeSlot: "Warm-Up 2 (3m)",
          drill: "Scapular Wall Slides & Lever Shoulder Press Ramp-Up",
          prescription: "12 wall slides + 5 kg x 12 on Lever Shoulder Press",
          cue: "Keep lower back flat against the pad and ribs tucked.",
        },
      ],
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: workoutDayNutrition,
      blocks: [
        {
          id: `${weekId}_d5_b1`,
          order: 1,
          type: 'straight',
          bannerText: 'Fresh Deltoid Framework & Long-Length Lat Sweep',
          exercises: [
            // Exercise 1: lever shoulder press (0605)
            {
              id: `${weekId}_d5_ep1`,
              order: '1',
              timeSlot: "Station 1 (8m)",
              exerciseId: 'ex_0605',
              exerciseName: 'lever shoulder press',
              equipmentTypeLabel: "Seated Lever Shoulder Press Machine",
              sets: stdSets,
              warmupSets: 1,
              targetWeightKg: 10,
              targetWeightRangeKg: '10 kg flat (zero shoulder pinch)',
              targetWeightNote: 'Week 1 Nov 5 hit joint_strain when placed after 20 min fatigue; fresh on Saturday @ 10 kg flat.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3SetSafe,
              restSeconds: 90,
              tempo: "2-1-1-0",
              loadGuidance: '10 kg flat: Neutral handles preferred. Keep elbows slightly in front of ears (scapular plane) with lower back glued flat.',
              formCueText:
                'Use neutral grip if available. Keep elbows tucked ~30° forward of shoulder line, press overhead smoothly without shrugging traps, lower slowly over 3s.',
              setupCues: [
                "Use the neutral/converging grip handles (palms facing each other or 45° angle) if available to keep elbows in the scapular plane.",
                "Set seat height so handles start at chin/ear level; press lower back flat into the backrest.",
              ],
              executionAndStretchCues: [
                "STRICT LOAD RULE: Stay flat at 10 kg across all 3 sets (10 kg x 11 was your verified sweet spot; do NOT jump to 15 kg).",
                "Lower over 2 seconds to chin level, pause 1 second under tension, and press smoothly without arching your lower back.",
              ],
              progressionRule:
                "Stay at 10 kg until you hit 12, 12, 12 with 2 RIR and zero heavy/joint_strain tags.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 10,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 90,
                  blindNote: "10 kg flat load; ribs down, lower back glued to pad.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 10,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 90,
                  blindNote: "Full 90s unrushed rest between sets.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 10,
                        targetRir: 2,
                        restSec: 90,
                        blindNote: "Transition to Cable Column for Rear Delt Rope Row.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20shoulder%20press%20proper%20form',
              targetMuscleGroups: ['Front Deltoids', 'Lateral Deltoids', 'Triceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever shoulder press',
                  formCue: 'Neutral grip; elbows 30° forward in scapular plane; 3s lowering; zero lumbar arch.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20shoulder%20press%20proper%20form',
                  targetFocus: 'Fresh Scapular-Plane Overhead Strength',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated neutral-grip dumbbell press',
                  formCue: 'Back supported on 75-80° bench; palms facing each other pressing vertically.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20neutral%20dumbbell%20shoulder%20press',
                  targetFocus: 'Joint-Friendly Free Weight Pressing',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'seated dual cable shoulder press',
                  formCue: 'Pulleys low behind upright bench; press comfortably in natural arc.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20shoulder%20press%20proper%20form',
                  targetFocus: 'Continuous Cable Deltoid Press',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'pike / elevated shoulder push-up',
                  formCue: 'Hands on floor or handles; lower forehead softly toward thumbs.',
                  videoUrl: 'https://www.youtube.com/results?search_query=pike%20push%20up%20proper%20form',
                  targetFocus: 'Closed-Chain Shoulder Strength',
                },
              ],
            },
            // Exercise 2: cable standing rear delt row (with rope) (0220)
            {
              id: `${weekId}_d5_ep2`,
              order: '2',
              timeSlot: "Station 2 (7m)",
              exerciseId: 'ex_0220',
              exerciseName: 'cable standing rear delt row (with rope)',
              equipmentTypeLabel: "High/Eye-Level Cable Pulley with Rope Attachment",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 30,
              targetWeightRangeKg: '25-30 kg',
              targetWeightNote: 'Week 2 PR hit 30 kg x 12 optimal (moved from crowded Tuesday to fresh Saturday).',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3Set,
              restSeconds: 75,
              tempo: "2-1-1-1",
              loadGuidance: '25-30 kg (30 kg default): Pull rope wide toward forehead/cheekbones keeping elbows high and parallel to floor.',
              formCueText:
                'Pulley at chin/chest height; stagger stance softly, pull rope handles wide apart toward ears with thumbs turning back, squeeze 1s.',
              setupCues: [
                "Set pulley at upper-chest/eye height, grab the rope ends with thumbs pointing backward, and step back into a staggered stance.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: Let your arms reach forward for a 1-second rear-delt and upper-back stretch at the start of every rep.",
                "Pull the rope apart toward your forehead/ears with elbows high and externally rotate your wrists so thumbs finish behind your ears; hold 1 second.",
              ],
              progressionRule:
                "Lock in your 30 kg x 12 PR (or 25 kg if you want an extra strict 2-second peak hold).",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 30,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "1s front stretch, 1s externally rotated rear-delt squeeze.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 30,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "Keep ribs down; do not lean backward with momentum.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 30,
                        targetRir: 2,
                        restSec: 75,
                        blindNote: "Stay at the same 2:1 Cable Tower and lower pulley to wrist height.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20standing%20rear%20delt%20row%20rope%20proper%20form',
              targetMuscleGroups: ['Rear Deltoids', 'Rhomboids', 'Mid Traps', 'External Rotators'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable standing rear delt row (with rope)',
                  formCue: 'Pull rope toward nose/forehead keeping elbows high; squeeze rear delts 1s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20standing%20rear%20delt%20row%20rope%20proper%20form',
                  targetFocus: 'Postural Upper Back & Rear Delt Thickness',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'incline high-elbow dumbbell row',
                  formCue: 'Prone on 30° bench; row dumbbells out wide toward upper chest.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20rear%20delt%20row%20proper%20form',
                  targetFocus: 'Free Weight Rear Delt Row',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'chest-supported high-elbow row machine',
                  formCue: 'Chest against pad; use wide horizontal handles flaring elbows high.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20rear%20delt%20row%20proper%20form',
                  targetFocus: 'Braced Rear Delt Pull',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'high-elbow inverted face-pull row',
                  formCue: 'Pull body toward fixed bar aiming chin/nose toward bar line.',
                  videoUrl: 'https://www.youtube.com/results?search_query=bodyweight%20face%20pull%20proper%20form',
                  targetFocus: 'Bodyweight Scapular Balance',
                },
              ],
            },
            // Exercise 3: cable one arm lateral raise (0178)
            {
              id: `${weekId}_d5_ep3`,
              order: '3',
              timeSlot: "Station 3 (7m)",
              exerciseId: 'ex_0178',
              exerciseName: 'cable one arm lateral raise',
              equipmentTypeLabel: "2:1 Smooth Cable Pulley Stack (Wrist Height)",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 5,
              targetWeightRangeKg: '5 kg (on 2:1 stack)',
              targetWeightNote: '2nd weekly exposure (~36 hours post-Mon/Thu rest). LEFT-ARM LEADER RULE.',
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: rir3Set,
              restSeconds: 60,
              tempo: "2-1-1-2 (1s bottom stretch + 2s top hold)",
              loadGuidance: '5 kg Left Arm first! Keep ribcage down and sweep smoothly in 30° forward scapular plane.',
              formCueText:
                'Left Arm First: Brace opposite hand firmly on cable upright; sweep outward in 30° forward plane stopping at shoulder height; 2s lowering.',
              setupCues: [
                "Wrist-height pulley on the 2:1 stack; cable crossing in front of hips.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH + PRECISION HOLD: Start from the cross-body stretched position, sweep arm out in the 30° scapular plane to shoulder height, and hold for 1–2 seconds at the top of every rep before lowering slowly.",
              ],
              progressionRule:
                "5 kg on the 2:1 stack for 3 x 12-15 with strict top pause.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "12-15",
                  targetWeightKg: 5,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 60,
                  blindNote: "Left + Right arm with 1s bottom stretch and 1-2s top pause.",
                },
                {
                  setIndex: 2,
                  targetReps: "12-15",
                  targetWeightKg: 5,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 60,
                  blindNote: "Zero trap shrugging.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "12-15",
                        targetWeightKg: 5,
                        targetRir: 2,
                        restSec: 60,
                        blindNote: "Raise pulley to the top of the same tower for Straight-Arm Pulldown.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20one%20arm%20lateral%20raise%20proper%20form',
              targetMuscleGroups: ['Lateral Deltoids', 'Side Delts'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable one arm lateral raise',
                  formCue: 'Left arm first; 30° forward plane; soft elbow; control lowering.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20one%20arm%20lateral%20raise%20proper%20form',
                  targetFocus: 'Deltoid Cap Symmetry (Exposure #2)',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated dumbbell lateral raise',
                  formCue: 'Sit tall; lead with elbows out to sides without shrugging.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20dumbbell%20lateral%20raise%20proper%20form',
                  targetFocus: 'Free Weight Side Delt Control',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever lateral raise',
                  formCue: 'Emergency fallback only (Pin 1 light weight if cable unavailable).',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20lateral%20raise%20proper%20form',
                  targetFocus: 'Fallback Machine Abduction',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'side-plank lateral raise reach',
                  formCue: 'Side plank stable; raise top arm toward ceiling smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=side%20plank%20arm%20reach%20proper%20form',
                  targetFocus: 'Core & Lateral Shoulder Control',
                },
              ],
            },
            // Exercise 4: cable straight arm pulldown (0237)
            {
              id: `${weekId}_d5_ep4`,
              order: '4',
              timeSlot: "Station 4 (7m)",
              exerciseId: 'ex_0237',
              exerciseName: 'cable straight arm pulldown',
              equipmentTypeLabel: "High Cable Pulley (Rope or Straight Bar)",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 30,
              targetWeightRangeKg: '30-35 kg',
              targetWeightNote: 'Week 2 logged 30 / 35 / 35 kg optimal.',
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: rir3Set,
              restSeconds: 75,
              tempo: "2-1-1-1",
              loadGuidance: '30 / 35 / 35 kg: Soft fixed elbows; stretch lats long overhead (3s eccentric), then sweep bar down to thighs.',
              formCueText:
                'Take 2 steps back from top pulley with slight 25° hip hinge. Keep elbows soft but locked; let lats stretch overhead over 3s, then sweep hands back to front of thighs.',
              setupCues: [
                "Step back from the high pulley, hinge torso forward ~30°, keep elbows unlocked with a fixed 15° bend, and exhale ribs down.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH CUE: Let your arms rise overhead in front of you until you feel a deep 1-second stretch through your lats and serratus (without letting your lower back arch).",
                "Sweep the bar/rope down in a wide arc to your thighs and squeeze lats + abs together for 1 second.",
              ],
              progressionRule:
                "Lock in your verified 30–35 kg working load for 3 x 10-12.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "10-12",
                  targetWeightKg: 30,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "1s overhead lat stretch with ribs locked down.",
                },
                {
                  setIndex: 2,
                  targetReps: "10-12",
                  targetWeightKg: 35,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 75,
                  blindNote: "Sweep down with lats, do not bend/extend elbows like a pushdown.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "10-12",
                        targetWeightKg: 35,
                        targetRir: 2,
                        restSec: 60,
                        blindNote: "Stay at the same cable tower with the rope attachment for Core Pair 5A + 5B.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20straight%20arm%20pulldown%20proper%20form',
              targetMuscleGroups: ['Lats', 'Serratus Anterior', 'Triceps Long Head'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable straight arm pulldown',
                  formCue: 'Slight hinge; fixed soft elbows; 3s overhead lat stretch; sweep bar to thighs.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20straight%20arm%20pulldown%20proper%20form',
                  targetFocus: 'Pure Isolated Lat Width Stretch',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'bench-supported dumbbell pullover',
                  formCue: 'Keep hips dropped slightly as dumbbell reaches behind head for crisp lat stretch.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20pullover%20proper%20form',
                  targetFocus: 'Free Weight Overhead Lat Stretch',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'nautilus / lever pullover machine',
                  formCue: 'Elbows on pads; drive elbows down toward waist slowly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20pullover%20proper%20form',
                  targetFocus: 'Machine-Guided Isolated Lat Arc',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'hollow-body bar straight-arm pressdown',
                  formCue: 'Active hang depressing scapulae hard while driving bar downward mentally.',
                  videoUrl: 'https://www.youtube.com/results?search_query=scapular%20depression%20hang%20proper%20form',
                  targetFocus: 'Bodyweight Lower-Trap & Lat Connection',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d5_b2`,
          order: 2,
          type: 'superset',
          tag: 'Superset 5A/5B',
          bannerText: 'Superset 5A + 5B (45s Rest | Cable Kneeling Crunch + Reverse Crunch)',
          rounds: stdSets,
          exercises: [
            // Exercise 5A: cable kneeling crunch (0175)
            {
              id: `${weekId}_d5_ep5`,
              order: '5A',
              subMovementOrder: '5A',
              supersetGroup: '5',
              supersetTag: 'Superset 5A/5B',
              pairedWithExerciseId: 'ex_0872',
              interSetRestSeconds: 45,
              timeSlot: "Station 5A + 5B (10m)",
              exerciseId: 'ex_0175',
              exerciseName: 'cable kneeling crunch',
              equipmentTypeLabel: "High Cable Pulley with Rope Attachment (Kneeling on Mat)",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 25,
              targetWeightRangeKg: '25-30 kg',
              targetWeightNote: 'Week 2 logged 25 / 25 / 30 kg optimal; permanently replaces missing seated ab crunch machine.',
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: rir3Set,
              restSeconds: 45,
              tempo: "2-1-1-2",
              loadGuidance: '25 / 25 / 30 kg: Keep hips locked directly over knees—flex spine by curling ribs toward pelvis, NOT sitting hips backward.',
              formCueText:
                'Kneel 1m back holding rope beside temples/ears. Pin hips still (glutes lightly squeezed) and curl ribcage downward toward belly button over 1s exhale; 2s slow return.',
              setupCues: [
                "Kneel on a mat 2 feet in front of the cable stack, hold the rope ends beside your temples/forehead, and lock your hips still.",
              ],
              executionAndStretchCues: [
                "LONG-LENGTH + SPINAL FLEXION CUE: At the top of each rep, let the cable gently extend your upper spine for a 1-second abdominal stretch.",
                "Exhale all air out while curling your sternum/ribs down toward your pelvis (round your spine like a shrimp—do NOT sit your hips back onto your heels or bow with a flat back). Hold the bottom crunch for 2 seconds.",
              ],
              progressionRule:
                "25–30 kg for 3 x 12-15 reps.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "12-15",
                  targetWeightKg: 25,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 45,
                  blindNote: "Curl ribs to pelvis, 2s exhale hold; rest 45s then do 5B Reverse Crunch.",
                },
                {
                  setIndex: 2,
                  targetReps: "12-15",
                  targetWeightKg: 25,
                  targetRir: isDeload ? 3 : 2,
                  restSec: 45,
                  blindNote: "1s top ab stretch without arching lumbar spine.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "12-15",
                        targetWeightKg: 30,
                        targetRir: 1,
                        restSec: 45,
                        blindNote: "Final kneeling rope crunch set; move to final Reverse Crunch.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20kneeling%20crunch%20rope%20proper%20form',
              targetMuscleGroups: ['Rectus Abdominis', 'Core', 'Upper Abs'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable kneeling crunch',
                  formCue: 'Rope at temples; hips frozen vertical; curl ribs toward hips on full exhale.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20kneeling%20crunch%20rope%20proper%20form',
                  targetFocus: 'Loaded Upper-to-Mid Rectus Abdominis',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated crunch machine',
                  formCue: 'If traveling to a gym with ab machine, curl ribcage downward smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20ab%20crunch%20machine%20proper%20form',
                  targetFocus: 'Alternate Gym Machine Crunch',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'weighted decline / floor sit-up crunch',
                  formCue: 'Dumbbell held on upper chest; curl upper back up off floor cleanly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=weighted%20crunch%20proper%20form',
                  targetFocus: 'Free Weight Ab Overload',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'hollow-body crunch hold',
                  formCue: 'Press lower back flat into floor; curl shoulders upward holding 2s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=hollow%20body%20crunch%20proper%20form',
                  targetFocus: 'Zero-Equipment Spinal Flexion',
                },
              ],
            },
            // Exercise 5B: reverse crunch (0872)
            {
              id: `${weekId}_d5_ep6`,
              order: '5B',
              subMovementOrder: '5B',
              supersetGroup: '5',
              supersetTag: 'Superset 5A/5B',
              pairedWithExerciseId: 'ex_0175',
              interSetRestSeconds: 45,
              timeSlot: "Station 5A + 5B (10m)",
              exerciseId: 'ex_0872',
              exerciseName: 'reverse crunch',
              equipmentTypeLabel: "Flat Bench or Floor Mat (Bodyweight)",
              sets: stdSets,
              warmupSets: 0,
              targetWeightKg: 0,
              targetWeightRangeKg: '0 kg (Bodyweight)',
              targetWeightNote: 'Prioritize posterior pelvic curl lifting tailbone off bench—zero leg swinging.',
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: rir3Set,
              restSeconds: 45,
              tempo: "3-0-1-1 (3s slow eccentric lowering)",
              loadGuidance: 'Bodyweight 3x12-15: Roll tailbone cleanly off bench toward chest; lower over 3s without lumbar arch.',
              formCueText:
                'Lie flat gripping bench behind head. Keep knees bent ~90° and curl pelvis upward so lower back peels off bench; lower over 3s without dropping feet.',
              setupCues: [
                "Lie on your back on a flat bench or mat, grip the bench edge or heavy dumbbell behind your head, bend knees 90°.",
              ],
              executionAndStretchCues: [
                "ANTI-APT CUE: Exhale and curl your tailbone and pelvis up off the bench/mat toward your rib cage (peeling your lower spine off the pad).",
                "Lower your pelvis back down slowly over 3 seconds while keeping your lower back pressed flat—stop when thighs are vertical so your hip flexors never pull your lower back into an arch.",
              ],
              progressionRule:
                "3 sets of 12-15 slow, controlled reps.",
              setPrescriptions: [
                {
                  setIndex: 1,
                  targetReps: "12-15",
                  targetWeightKg: 0,
                  targetRir: isDeload ? 3 : 1,
                  restSec: 45,
                  blindNote: "Peel tailbone off bench, 3s slow negative; rest 45s then return to 5A.",
                },
                {
                  setIndex: 2,
                  targetReps: "12-15",
                  targetWeightKg: 0,
                  targetRir: isDeload ? 3 : 1,
                  restSec: 45,
                  blindNote: "Keep knees bent at 90°; zero leg swinging.",
                },
                ...(!isDeload
                  ? [
                      {
                        setIndex: 3,
                        targetReps: "12-15",
                        targetWeightKg: 0,
                        targetRir: 1,
                        restSec: 0,
                        blindNote: "Full 5-day training week complete! Enjoy your Saturday afternoon Hammam.",
                      },
                    ]
                  : []),
              ],
              videoUrl: 'https://www.youtube.com/results?search_query=reverse%20crunch%20proper%20form',
              targetMuscleGroups: ['Lower Abs', 'Core', 'Pelvic Tilt Control'],
              selectedEquipment: 'bodyweight',
              equipmentVariations: [
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'reverse crunch',
                  formCue: 'Curl pelvis and tailbone upward off bench; 3s controlled return.',
                  videoUrl: 'https://www.youtube.com/results?search_query=reverse%20crunch%20proper%20form',
                  targetFocus: 'Lower Ab & Posterior Pelvic Tilt Correction',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable ankle reverse crunch',
                  formCue: 'Light low-pulley ankle cuffs; roll knees smoothly toward chest.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20reverse%20crunch%20proper%20form',
                  targetFocus: 'Loaded Lower-Ab Pelvic Curl',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'captains chair vertical knee raise',
                  formCue: 'Press back firmly against pad; roll tailbone forward lifting knees above hips.',
                  videoUrl: 'https://www.youtube.com/results?search_query=captains%20chair%20knee%20raise%20proper%20form',
                  targetFocus: 'Supported Lower Ab Flexion',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell-pinched reverse crunch',
                  formCue: 'Pin light 2-4 kg dumbbell between ankles; roll pelvis steadily.',
                  videoUrl: 'https://www.youtube.com/results?search_query=weighted%20reverse%20crunch%20proper%20form',
                  targetFocus: 'Weighted Pelvic Curl',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // SUNDAY (DAY 7): FULL REST & MEAL PREP
    // ----------------------------------------------------
    {
      id: `${weekId}_d6`,
      weekId,
      dayOfWeek: 6,
      label: 'Sunday: Full Rest & Weekly Meal Prep',
      isRestDay: true,
      morningRoutine: morningAlignmentDrills,
      nutrition: restDayNutrition,
      blocks: [],
    },
  ];
}

// ==========================================
// 5. MASTER 16-WEEK PROGRAM FACTORY (LAUNCHING NOV 23, 2026)
// ==========================================

export function generateMaster16WeekProgram(): Program {
  const launchDate = '2026-11-23'; // Monday, Nov 23, 2026 (Post-Paris Launch)
  const [y, m, d] = launchDate.split('-').map(Number);
  const endObj = new Date(y, m - 1, d + 16 * 7 - 1, 0, 0, 0, 0);
  const endStr = toLocalDateString(endObj);

  const programId = 'prog_master_5day_v2';

  const weeks: ProgramWeek[] = [];
  for (let w = 1; w <= 16; w++) {
    const weekId = `prog_master_w${w}`;
    weeks.push({
      id: weekId,
      programId,
      weekIndex: w,
      days: createBlueprintDays(weekId, w),
    });
  }

  return {
    id: programId,
    trainerId: 'trainer_alaa',
    traineeId: 'trainee_alaa',
    title: 'The Definitive 5-Day Custom 360° Hypertrophy, Long-Length Stretch & Posture Protocol',
    launchDate,
    startDate: launchDate,
    endDate: endStr,
    durationWeeks: 16,
    status: 'published',
    version: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scheduleOverview: {
      daysPerWeek: 5,
      trainingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
      restDays: ['Friday', 'Sunday'],
      mondayToThursdayWindow: '12:05–12:42 (5 min Warm-Up + 32 min Lifting = 37 min flat)',
      friday: 'Rest / Active Recovery (Daily Office Stairs)',
      saturdayWindow: 'Morning Unrushed (~5 min Warm-Up + 40–45 min Lifting before 15:00 Hammam)',
      sunday: 'Full Rest & Meal Prep (2-Cup Avocado-Milk-Casein Batch)',
    },
    blindExecutionRules: [
      'RULE 1 (FLAT WORKING LOADS — NO EGO PYRAMIDS): Use the exact prescribed working weight across all 3 sets. Only increase load by the smallest increment (+2.5 kg or +1 plate pin) AFTER you hit the top of the prescribed rep range on all 3 sets with clean form and 0 joint strain.',
      'RULE 2 (LONG-LENGTH STRETCH PAUSE): Pause for 1 full second (one-one-thousand) in the lengthened/stretched position of every single rep. Never bounce out of the bottom.',
      'RULE 3 (SHOULDER SAFETY GUARDRAIL): Keep elbows in the 30°–45° scapular plane (slightly in front of the torso) on all presses, flies, lateral raises, and overhead extensions. If any set triggers joint_strain, abort the set immediately (log 0 kg x 1) and do not push through tendon pain.',
      'RULE 4 (ANTI-APT PELVIC & RIB LOCK): Before every standing, kneeling, or inclined set, exhale to pull your lower ribs down and gently tuck your tailbone (posterior pelvic tilt) so your lower back never arches.',
      'RULE 5 (WEEKDAY 4A/4B & 5A/5B CLOCK LOCK): The final two exercises on Mon–Thu are paired on the same cable tower or adjacent machines. Perform Set 1 of A -> rest 45s -> Set 1 of B -> rest 45s -> repeat for 3 rounds to finish 6 sets in 10–11 minutes flat.',
    ],
    dailyNutritionAndSupplementProtocol,
    daily24HourRhythm: {
      wakeUp0730:
        '5g L-Glutamine in lukewarm water + 30s Hollow-Body Scapular Hang + 60s Supine Windshield Wipers + Standing Glute Squeeze & Y-Reach',
      commuteDriving:
        'Car Mirror Biofeedback Anchor (1 cm higher upright) + 2.5h total daily commute with lumbar/sacral support',
      officeStairs:
        '24 floors/day Mon-Fri (480 steps/day up, elevator down): whole foot flat, ribs stacked over pelvis, drive through heel',
      preSleep2245:
        '22:30 Magnesium Glycinate (moderate 200-300mg) [Ashwagandha PAUSED pending ALAT re-check] + Avocado-Milk-Casein Night Smoothie',
    },
    weeks,
  };
}

// Backward-compatible exports
export const generateMaster12WeekProgram = generateMaster16WeekProgram;
export const masterTransformationProgram = generateMaster16WeekProgram();

// ==========================================
// 6. SUPPLEMENTS & HYDRATION PROTOCOLS
// ==========================================

export const masterSupplementProtocols: SupplementProtocol[] = [
  {
    id: 'sp_gut_waking_master',
    programId: 'prog_master_5day_v2',
    name: '07:30 L-Glutamine Gut Recovery',
    category: 'recovery',
    phases: [
      {
        phaseIndex: 1,
        name: 'Waking Empty-Stomach Protocol',
        startDay: 1,
        endDay: 112,
        doses: [
          {
            id: 'sp_glut_d1',
            doseOrder: 1,
            amount: 5.0,
            unit: 'g',
            timingType: 'standalone',
            standaloneTiming: 'on_waking',
            targetTime: '07:30',
            notes: '5g L-Glutamine in lukewarm water on an empty stomach, 15-20 min before breakfast.',
          },
        ],
      },
    ],
  },
  {
    id: 'sp_creatine_master',
    programId: 'prog_master_5day_v2',
    name: 'Scitec Jumbo Hardcore + Creatine (4 Scoops = 2.82g Creatine) & Morning Support',
    category: 'performance',
    phases: [
      {
        phaseIndex: 1,
        name: 'Split Mass Gainer & Digestive Stack (2+2 Scoops)',
        startDay: 1,
        endDay: 112,
        doses: [
          {
            id: 'sp_jumbo_am_d1',
            doseOrder: 1,
            amount: 2,
            unit: 'scoop',
            timingType: 'meal_linked',
            mealLabel: '07:55-08:30 Morning Gainer + Multi-Enzymes [Shilajit PAUSED]',
            targetTime: '08:00',
            notes: '2 level scoops Scitec Jumbo Hardcore + 1 Capsule Multi-Enzymes + 5 mini pancakes. Shilajit is PAUSED pending ALAT re-check.',
          },
          {
            id: 'sp_cr_main_d1',
            doseOrder: 2,
            amount: 2.82,
            unit: 'g',
            timingType: 'meal_linked',
            mealLabel: '19:00 Afternoon Gainer (Completes 4 Scoops = 2.82g Creatine)',
            targetTime: '19:00',
            notes: '2 scoops Scitec Jumbo Hardcore + Multi-Enzymes. Total 4 scoops/day provides 2.82g Creatine cleanly.',
          },
        ],
      },
    ],
  },
  {
    id: 'sp_daytime_electrolytes_lunch',
    programId: 'prog_master_5day_v2',
    name: 'Pre-Workout Electrolytes & 13:00 Lunch Stack (D3+K2, Omega-3)',
    category: 'health',
    phases: [
      {
        phaseIndex: 1,
        name: 'Daytime Performance & Lipid-Soluble Stack',
        startDay: 1,
        endDay: 112,
        doses: [
          {
            id: 'sp_elec_d1',
            doseOrder: 1,
            amount: 1,
            unit: 'capsules',
            timingType: 'standalone',
            standaloneTiming: 'pre_workout',
            targetTime: '10:30',
            notes: '1 Electrolytes sachet in 1L water slowly between 09:00-12:00 with 35-40g raw almonds/walnuts at 10:15 + 5-7 Ajwa Dates at 11:35.',
          },
          {
            id: 'sp_d3_d1',
            doseOrder: 2,
            amount: 2000,
            unit: 'IU',
            timingType: 'meal_linked',
            mealLabel: '13:00 Post-Workout Lunch',
            targetTime: '13:00',
            notes: 'Vitamin D3+K2 (Mandatory Daily) taken with 13:00 whole-food lunch & olive oil to resolve 26.7 ng/mL insufficiency.',
          },
          {
            id: 'sp_omega3_d1',
            doseOrder: 3,
            amount: 1250,
            unit: 'mg',
            timingType: 'meal_linked',
            mealLabel: '13:00 Post-Workout Lunch',
            targetTime: '13:00',
            notes: 'Omega-3 Fish Oil with 13:00 post-workout meal.',
          },
        ],
      },
    ],
  },
  {
    id: 'sp_dinner_foundation',
    programId: 'prog_master_5day_v2',
    name: '22:30 Pre-Sleep Stack (Magnesium Glycinate moderate 200-300mg)',
    category: 'sleep',
    phases: [
      {
        phaseIndex: 1,
        name: 'Nighttime Neuromuscular Calm',
        startDay: 1,
        endDay: 112,
        doses: [
          {
            id: 'sp_mag_d1',
            doseOrder: 1,
            amount: 250,
            unit: 'mg',
            timingType: 'standalone',
            standaloneTiming: 'pre_bed',
            targetTime: '22:30',
            notes: 'Magnesium Glycinate (moderate 200–300 mg dose; serum Mg 24 mg/L) + Avocado-Milk-Casein Night Smoothie. Ashwagandha is PAUSED pending ALAT re-check.',
          },
        ],
      },
    ],
  },
];

// Hydration Architecture: 3.5 Liters base + 500ml workout bonus
export const masterHydrationGoal: HydrationGoal = {
  id: 'hg_trainee_alaa',
  programId: 'prog_master_5day_v2',
  traineeId: 'trainee_alaa',
  dailyTargetMl: 3500,
  workoutDayBonusMl: 500,
};

// Seed 14-day weight milestones climbing smoothly to Alaa's Nov 2026 morning floor (52.05 kg)
export const seedMetricsAlaa: BodyMetricEntry[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  const baseWeight = 51.75;
  const gain = i * (0.3 / 13); // Climbs cleanly from 51.75 kg to 52.05 kg morning floor
  return {
    id: `m_alaa_${i + 1}`,
    traineeId: 'trainee_alaa',
    date: d.toISOString().split('T')[0],
    weightKg: Math.round((baseWeight + gain) * 100) / 100,
    source: 'manual',
  };
});
