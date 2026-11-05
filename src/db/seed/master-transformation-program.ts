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
  EquipmentOption,
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
  role: 'trainee',
  name: 'Alaa',
  email: 'alaa@vyra.fit',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
  heightCm: 173,
  sex: 'male',
  dob: '1989-03-15', // Age 37
  injuries: [
    'Clinically Underweight (BMI 17.3 at 51.8 kg / 173 cm): Week 1 Medical, GI & Baseline Bloodwork Gate before caloric surplus and volume increase',
    'Joint Pain & Symptom Gate: Confirm neck, shoulders, lower back, and knees free of sharp pain; substitute openGym catalogue alternative if needed',
    'Left-Arm Coordination Asymmetry: Lower motor coordination despite equal 2.5 kg baseline segmental mass; Left-Arm Leader Rule on 0178 cable one arm lateral raise',
    'Monday Night Football Deconfliction: 19:15 match mandates zero lower body loading on Monday; 100% seated/supported pulls on Tuesday 17h post-match',
    'Anterior Pelvic Tilt & Rib Flare: Master Pelvic Switch (lock pelvis, glutes squeezed, ribs down) on all movements',
  ],
  goals: [
    '16-Week Custom 360° Surplus: Baseline 51.8 kg -> Week 12 Target 55.5 kg -> Week 16 Target 57.0 kg (+0.20 to +0.40 kg/week)',
    'Universal Straight-Set Double Progression on All 32 openGym Catalogue-Locked Exercises',
    'Daily 24-Hour Rhythm: 30s Hollow-Body Hangs + 480 Office Stairs Heel Drive + Sleep Anchor Nest',
    'Long-Term Transformation Target: 59.3 kg (63.5 kg milestone)',
  ],
  hideWeightFromTrainee: false,
  biometrics: {
    age: 37,
    heightCm: 173,
    baselineWeightKg: 51.8,
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
    truth1_pelvicMasterSwitch: "Anterior pelvic tilt and rib flare slacken the thoracolumbar fascia (lat attachment) and drive compensatory shoulder rounding. Lock pelvis (glutes squeezed, belt buckle tilted up, ribs down) on every lift.",
    truth2_midlineVsLongLever: "High midline sagittal strength (40kg pulldown, 3-4 close hammer pull-ups) vs long-lever neural braking on lateral raises/dips. Use 30-deg scapular plane, frame bracing, and 5kg step-ladder rep progression.",
    truth3_externalSupport: "Chest, back, and preacher pads eliminate torso-stabilization guarding and unlock true 1-2 RIR output.",
    truth4_widePullStarterMotor: "0 wide overhand pull-ups caused by dead-hang lower-trap scapular depression deficit. Fixed via daily 30s Hollow-Body Scapular Hangs (5 depressions x 2s), 1s depression pauses on cable pulldowns, and Saturday 5s wide negatives.",
    truth5_pronationInternalRotationBias: "1-2 supinated chin-ups vs 3-4 neutral hammer pull-ups and 20kg press vs 40kg pull. Fixed via Tuesday underhand seated cable rows (25kg) and Saturday closed-chain push-up board work.",
  },
  defaultGymId: "gym_punch_lissasfa",
  gymLocations: [
    {
      id: "gym_punch_lissasfa",
      name: "Punch by Badr Hari Lissasfa",
      address: "Lissasfa, Casablanca",
      isDefault: true,
      notes: "Commercial gym with full leverage machines, Smith, 45° leg press, Glute Bridge Machine, and Seated Hip Abductor.",
    },
    {
      id: "gym_home",
      name: "Home Setup",
      address: "Home (Casablanca)",
      isDefault: false,
      notes: "Doorway pull-up bar + color-coded push-up board.",
    },
  ],
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
  'Doorway Pull-Up Bar 30s Hollow-Body Scapular Hang (5 reps x 2s depression pause): Feet slightly forward, squeeze glutes, ribs down, pull shoulder blades down without bending elbows.',
  'Supine Windshield Wipers (60s): Lie on back, knees bent, feet wide; gently rock knees 5x left and 5x right with shoulders pinned flat to unwind overnight lumbar torsion.',
  'Standing Glute-Squeeze Hip Extension + Y-Reach (60s): Step back, squeeze both glutes hard for 5s (stretch front hip capsule), reach arms back into a Y with thumbs pointing behind.',
  'Incline Bench Push-Up Plus (60s): Hands elevated, push torso away at top for 2s to move shoulder blades through full protraction.',
];

export const workdayErgonomicsRoutines: string[] = [
  'The Car Mirror Biofeedback Anchor (65-min Commute): Adjust rear-view mirror 1 cm higher sitting upright with skull touching headrest. Slouching causes loss of rear visibility as biofeedback.',
  'The Hourly Stand & Squeeze (Office): Stand up every 60 min, unlock knees, shift 60% weight to heels, squeeze glutes 5s, 2 diaphragmatic breaths, sit on sit bones.',
  'Post-Lunch Walk (14:00 – 14:15): 10–15 minutes relaxed outdoor walk to aid gastric emptying and glucose partitioning.',
  'The Desk-Drawer Fuel Protocol (11:45): 35g dates (~3 medium) or 1 small banana + 250ml water for rapid low-fat glycogen without gut fullness.',
];

// ==========================================
// 3. NUTRITION: WEEKS 1-2 RAMP & WEEKS 3-16 SURPLUS
// ==========================================

export const mondayDailyMeals: DailyMealSlot[] = [
  {
    time: '08:00',
    label: 'AM Drive Fuel',
    foods: '50g dates (~5 medium Ajwa/Deglet Nour) [140 kcal] + 25g raw almonds [160 kcal]',
    supplements: 'None',
    rationale: 'Friction-free commute fuel; potassium & clean low-GI carbohydrates.',
    calories: 300,
    proteinGrams: 7,
  },
  {
    time: '10:30',
    label: 'Morning Shake — Serving 1',
    foods: 'Half of daily blender batch: 175 ml lactose-free whole milk [110 kcal], 30g oats [115 kcal], 15g Whey Isolate [58 kcal], 15g peanut butter [90 kcal], 60g banana [52 kcal]',
    supplements: 'None',
    rationale: 'Low-osmolarity liquid meal for easy digestion and sustained amino acid delivery.',
    calories: 425,
    proteinGrams: 27,
  },
  {
    time: '11:45',
    label: 'Pre-Gym Desk Snack',
    foods: '35g dates (~3 medium) or 1 small banana + 400 ml water',
    supplements: 'None',
    rationale: 'Rapid low-fat carbohydrates 15 minutes before 12:00 training session.',
    calories: 100,
    proteinGrams: 1,
  },
  {
    time: '13:35',
    label: 'Post-Gym Lunch',
    foods: '220g cooked white rice/pasta [290 kcal] + 150g raw (115g cooked) chicken breast/fish [250 kcal] + 150g cooked vegetables [50 kcal] + 15g (1 tbsp) extra-virgin olive oil [160 kcal]',
    supplements: 'None',
    rationale: 'Post-workout solid whole-food anabolic recovery meal followed by relaxed walking.',
    calories: 750,
    proteinGrams: 42,
  },
  {
    time: '16:30',
    label: 'Afternoon Shake — Serving 2 + Stair Fuel + Match Pre-Load',
    foods: 'Second half of blender batch [425 kcal] + 35g dates [100 kcal covers 480 daily stairs] + 50g white toast with 20g honey [200 kcal match pre-load]',
    supplements: 'None',
    rationale: 'Afternoon caloric density covering stair energy expenditure and pre-loading glycogen for 19:15 football.',
    calories: 725,
    proteinGrams: 28,
  },
  {
    time: '20:30',
    label: 'Post-Match Glycogen & Anabolic Re-feed',
    foods: '25g Whey Isolate [95 kcal, 21g P] + 35g honey / dextrose [105 kcal] in 500 ml water',
    supplements: 'None',
    rationale: 'Immediate post-match recovery window; rapid glycogen resynthesis.',
    calories: 200,
    proteinGrams: 21,
  },
  {
    time: '21:00',
    label: 'Evening Dinner (Unified Foundation Stack)',
    foods: '180g cooked rice/potatoes [230 kcal] + 130g lean beef/poultry/fish [240 kcal] + cooked vegetables with 10g olive oil [130 kcal]',
    supplements: 'Creatine Monohydrate 5g + Vitamin D3 2,000 IU + Magnesium Bisglycinate 300mg + Omega-3 1,250mg',
    rationale: 'Dinner anchored with healthy fats for fat-soluble vitamin absorption and overnight repair.',
    calories: 600,
    proteinGrams: 35,
  },
];

export const standardDailyMeals: DailyMealSlot[] = [
  {
    time: '08:00',
    label: 'AM Drive Fuel',
    foods: '50g dates (~5 medium Ajwa/Deglet Nour) [140 kcal] + 25g raw almonds [160 kcal]',
    supplements: 'None',
    rationale: 'Commute energy buffer.',
    calories: 300,
    proteinGrams: 7,
  },
  {
    time: '10:30',
    label: 'Morning Shake — Serving 1',
    foods: 'Half of blender batch: 175 ml milk [110 kcal], 30g oats [115 kcal], 15g Whey [58 kcal], 15g peanut butter [90 kcal], 60g banana [52 kcal]',
    supplements: 'None',
    rationale: 'Mid-morning liquid fuel.',
    calories: 425,
    proteinGrams: 27,
  },
  {
    time: '11:45',
    label: 'Pre-Gym Desk Snack',
    foods: '35g dates (~3 medium) or 1 small banana + 400 ml water',
    supplements: 'None',
    rationale: 'Clean easily digested intra-cellular carbohydrate availability.',
    calories: 100,
    proteinGrams: 1,
  },
  {
    time: '13:35',
    label: 'Post-Gym Lunch',
    foods: '220g cooked rice/pasta [290 kcal] + 150g raw (115g cooked) chicken/fish/beef [250 kcal] + 150g vegetables [50 kcal] + 15g olive oil [160 kcal]',
    supplements: 'None',
    rationale: 'Solid post-lift anabolic stimulus.',
    calories: 750,
    proteinGrams: 42,
  },
  {
    time: '16:30',
    label: 'Afternoon Shake — Serving 2 + Stair Fuel',
    foods: 'Second half of blender batch [425 kcal] + 35g dates [100 kcal covers 480 daily stairs]',
    supplements: 'None',
    rationale: 'Sustained anabolic window; permanently compensates for 480 daily stairs.',
    calories: 525,
    proteinGrams: 28,
  },
  {
    time: '21:00',
    label: 'Evening Dinner (Unified Foundation Stack)',
    foods: '180g cooked rice/potatoes [230 kcal] + 130g lean beef/poultry/fish [240 kcal] + cooked veg with 10g olive oil [130 kcal]',
    supplements: 'Creatine Monohydrate 5g + Vitamin D3 2,000 IU + Magnesium Bisglycinate 300mg + Omega-3 1,250mg',
    rationale: 'Dinner recovery stack.',
    calories: 600,
    proteinGrams: 35,
  },
];

export const restDailyMeals: DailyMealSlot[] = standardDailyMeals;

export const mondayNutrition: MealPlanPrescription = {
  targetKcal: 3100,
  targetProteinGrams: 165,
  preWorkoutTiming: '11:45 Desk Fuel (15m before 12:00 lift)',
  preWorkoutFoods: '35g dates or 1 small banana + 400ml water',
  supplements: [
    { name: 'Creatine Monohydrate', dosage: '5g', timing: '21:00 Dinner' },
    { name: 'Vitamin D3', dosage: '2,000 IU', timing: '21:00 Dinner' },
    { name: 'Magnesium Bisglycinate', dosage: '300mg', timing: '21:00 Dinner' },
    { name: 'Omega-3 Fish Oil', dosage: '1,250mg', timing: '21:00 Dinner' },
  ],
  dailyMeals: mondayDailyMeals,
  notes: 'Monday Protocol: 3,100 kcal total (covers 480 stairs + 12:15 Gym + 19:15 Football Match with +400 kcal pre/post match re-feed).',
};

export const workoutDayNutrition: MealPlanPrescription = {
  targetKcal: 2700,
  targetProteinGrams: 140,
  preWorkoutTiming: '11:45 Desk Fuel (15m before 12:00 lift)',
  preWorkoutFoods: '35g dates or 1 small banana + 400ml water',
  supplements: [
    { name: 'Creatine Monohydrate', dosage: '5g', timing: '21:00 Dinner' },
    { name: 'Vitamin D3', dosage: '2,000 IU', timing: '21:00 Dinner' },
    { name: 'Magnesium Bisglycinate', dosage: '300mg', timing: '21:00 Dinner' },
    { name: 'Omega-3 Fish Oil', dosage: '1,250mg', timing: '21:00 Dinner' },
  ],
  dailyMeals: standardDailyMeals,
  notes: 'Standard Training Day Protocol: 2,700 kcal | 140g+ Protein. The 16:30 dates (+100 kcal) permanently balance the 480 office stairs.',
};

export const restDayNutrition: MealPlanPrescription = {
  targetKcal: 2700,
  targetProteinGrams: 140,
  supplements: [
    { name: 'Creatine Monohydrate', dosage: '5g', timing: '21:00 Dinner' },
    { name: 'Vitamin D3', dosage: '2,000 IU', timing: '21:00 Dinner' },
    { name: 'Magnesium Bisglycinate', dosage: '300mg', timing: '21:00 Dinner' },
    { name: 'Omega-3 Fish Oil', dosage: '1,250mg', timing: '21:00 Dinner' },
  ],
  dailyMeals: restDailyMeals,
  notes: 'Rest & Saturday Protocol: 2,700 kcal | 140g+ Protein maintains consistent surplus for tissue repair.',
};


// ==========================================
// 4. THE 32 CATALOGUE EXERCISE BLUEPRINT (16-WEEK PROTOCOL)
// ==========================================

export function createBlueprintDays(weekId: string, weekIndex: number = 1): ProgramDay[] {
  // Volume periodization:
  // Weeks 1-3: 18-19 sets/day Mon-Thu, 10 sets Sat
  // Weeks 4-7: 19-20 sets/day Mon-Thu, 10-12 sets Sat
  // Week 8: Deload 1 (2 working sets, -10% load, 3-4 RIR)
  // Weeks 9-12: 19-20 sets/day Mon-Thu, 12 sets Sat
  // Weeks 13-15: 20 sets/day Mon-Thu, 12 sets Sat
  // Week 16: Final deload & testing (2 working sets)
  const isRamp = weekIndex <= 2;
  const isDeload = weekIndex === 7 || weekIndex === 8 || weekIndex === 12 || weekIndex === 16;
  const standardSets = (isRamp || isDeload) ? 2 : 3;

  return [
    // ----------------------------------------------------
    // MONDAY (DAY 1): 100% SEATED/BRACED UPPER BODY
    // Zero abdominal, hip-flexor, or lower-back loading (leaves body 100% fresh for stairs + 19:15 football match)
    // ----------------------------------------------------
    {
      id: `${weekId}_d0`,
      weekId,
      dayOfWeek: 0,
      label: 'Monday: 100% Seated/Braced Upper Body (Chest, Supported Row, Dual Side/Rear Delts & Triceps - Zero Abs/Leg Load Before Football)',
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: mondayNutrition,
      blocks: [
        {
          id: `${weekId}_d0_b1`,
          order: 1,
          type: 'straight',
          bannerText: 'Primary Push Compounds (Midday Clock: 90s Rest)',
          exercises: [
            // Exercise 1: lever incline chest press (0579)
            {
              id: `${weekId}_d0_ep1`,
              exerciseId: 'ex_0579',
              exerciseName: 'lever incline chest press',
              sets: standardSets,
              warmupSets: 2,
              targetWeightKg: 20,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: isDeload ? [3, 4] : [2, 2, 2],
              restSeconds: 90,
              loadGuidance: 'Anti-Arch Lock: Glue lower back and lower ribs flat into pad (zero lumbar arch). Depress shoulders down; lower over 3s. Starting weight 20kg.',
              formCueText: 'Anti-Arch Lock: Glue lower back and lower ribs flat into the backrest (do not arch your lower spine to push the weight). Depress shoulders down; lower over 3s.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20incline%20chest%20press%20proper%20form',
              targetMuscleGroups: ['Upper Chest', 'Pectorals', 'Front Deltoids', 'Triceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever incline chest press',
                  formCue: 'Align handles with upper chest; 3s lowering phase; full stretch without shoulder shrug.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20incline%20chest%20press%20proper%20form',
                  targetFocus: 'Clavicular Upper Chest Shelf',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: '30° incline dumbbell press',
                  formCue: 'Set bench to 30°; wrists over elbows; press dumbbells smoothly without clanging.',
                  videoUrl: 'https://www.youtube.com/results?search_query=30%20incline%20dumbbell%20press%20proper%20form',
                  targetFocus: 'Free Weight Clavicular Hypertrophy',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'incline cable chest press',
                  formCue: 'Set pulleys low behind bench; press handles up in natural arc converging at eye level.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline%20cable%20chest%20press%20proper%20form',
                  targetFocus: 'Continuous Tension Upper Chest',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'feet-elevated decline push-ups',
                  formCue: 'Feet elevated on bench; lower upper chest smoothly; protract shoulder blades at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=decline%20push%20ups%20proper%20form',
                  targetFocus: 'Bodyweight Clavicular Protraction',
                },
              ],
            },
            // Exercise 2: lever chest press (0576)
            {
              id: `${weekId}_d0_ep2`,
              exerciseId: 'ex_0576',
              exerciseName: 'lever chest press',
              sets: standardSets,
              warmupSets: 1,
              targetWeightKg: 20,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: isDeload ? [3, 4] : [2, 2, 2],
              restSeconds: 90,
              loadGuidance: 'Use neutral/vertical handles if available. Hold 20kg across all 3 sets until hitting 10, 10, 10 smoothly at 2 RIR before moving to 25kg.',
              formCueText: 'Use neutral/vertical handles if available. Hold 20kg across all 3 sets until hitting 10, 10, 10 smoothly at 2 RIR before moving to 25 kg.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20chest%20press%20proper%20form',
              targetMuscleGroups: ['Chest', 'Pectorals', 'Front Deltoids', 'Triceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever chest press',
                  formCue: 'Neutral grip; elbows tucked 45°; press until 95% lockout.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20chest%20press%20proper%20form',
                  targetFocus: 'Mid-Pec Sternal Hypertrophy',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'flat dumbbell bench press',
                  formCue: 'Feet flat; squeeze glutes; retract shoulder blades flat on bench.',
                  videoUrl: 'https://www.youtube.com/results?search_query=flat%20dumbbell%20bench%20press%20proper%20form',
                  targetFocus: 'Free Weight Sternal Hypertrophy',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'seated cable chest press',
                  formCue: 'Seated upright; press handles forward converging slightly in front of sternum.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20cable%20chest%20press%20proper%20form',
                  targetFocus: 'Continuous Sternal Tension',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'standard push-up (with handles)',
                  formCue: 'Hands slightly wider than shoulders; body in rigid plank; full protraction at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=push%20ups%20proper%20form',
                  targetFocus: 'Closed-Chain Chest & Core Stability',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d0_b2`,
          order: 2,
          type: 'straight',
          bannerText: 'Chest-Supported Row (75s Rest | Saves Lower Back)',
          exercises: [
            // Exercise 3: lever seated row (0603)
            {
              id: `${weekId}_d0_ep3`,
              exerciseId: 'ex_0603',
              exerciseName: 'lever seated row',
              sets: standardSets,
              warmupSets: 1,
              targetWeightKg: 30,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : [2, 2, 2],
              restSeconds: 75,
              loadGuidance: 'Chest glued firmly to front pad (saves 100% of leg and lower-back energy for Monday stairs + 19:15 football). Pause 1s at contraction. 30kg starting weight.',
              formCueText: 'Chest glued firmly to front pad (100% leg and lower-back conservation before football). Pull handles to lower ribs and pause 1s.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20row%20proper%20form',
              targetMuscleGroups: ['Upper Back', 'Lats', 'Rhomboids', 'Mid Traps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated row',
                  formCue: 'Chest glued to pad; pull handles to lower ribs; squeeze shoulder blades.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20row%20proper%20form',
                  targetFocus: 'Thoracic Extension & Rhomboid Density',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'chest-supported dumbbell row',
                  formCue: 'Chest supported on 30° incline bench; pull dumbbells back leading with elbows.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest%20supported%20dumbbell%20row%20proper%20form',
                  targetFocus: 'Isolated Upper Back Hypertrophy',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'seated cable row (neutral grip)',
                  formCue: 'Torso vertical; chest proud; drive elbows straight back without leaning.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20cable%20row%20proper%20form',
                  targetFocus: 'Continuous Mid-Back Tension',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'inverted row (Smith machine bar at waist)',
                  formCue: 'Heels on floor, body straight; pull chest to bar; hold 1s at peak.',
                  videoUrl: 'https://www.youtube.com/results?search_query=inverted%20row%20proper%20form',
                  targetFocus: 'Bodyweight Upper Back Retraction',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d0_b3`,
          order: 3,
          type: 'straight',
          bannerText: 'Rear Delts & Dual Lateral Delts (60s Rest | Left Arm Leader)',
          exercises: [
            // Exercise 4: lever seated reverse fly (0602)
            {
              id: `${weekId}_d0_ep4`,
              exerciseId: 'ex_0602',
              exerciseName: 'lever seated reverse fly',
              sets: standardSets,
              warmupSets: 0,
              targetWeightKg: 40,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : [2, 2, 1],
              restSeconds: 60,
              loadGuidance: 'Set seat 1 notch high so handles sit slightly below shoulder height (prevents upper-trap shrugging). Keep stomach braced against pad. 40kg.',
              formCueText: 'Set seat 1 notch high so handles sit slightly below shoulder height (prevents upper-trap shrugging). Keep stomach braced against pad.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20reverse%20fly%20proper%20form',
              targetMuscleGroups: ['Rear Deltoids', 'Rhomboids', 'Infraspinatus'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated reverse fly',
                  formCue: 'Chest against pad; lead outward with back of hands; stop in line with shoulders.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20reverse%20fly%20proper%20form',
                  targetFocus: 'Posterior Deltoid Isolation',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'chest-supported dumbbell reverse fly',
                  formCue: 'Lie prone on 30° incline bench; raise dumbbells out to sides with pinkies high.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest%20supported%20dumbbell%20reverse%20fly%20proper%20form',
                  targetFocus: 'Free Weight Rear Delt Thickness',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'standing cable face pull (with rope)',
                  formCue: 'Set pulley at nose height; pull rope to temples separating hands at finish.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20face%20pull%20proper%20form',
                  targetFocus: 'External Rotator & Rear Delt Alignment',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'prone floor Y-T-W raises',
                  formCue: 'Lie face down on floor; raise arms in Y, T, and W shapes; hold 2s at peak.',
                  videoUrl: 'https://www.youtube.com/results?search_query=prone%20ytw%20raises%20proper%20form',
                  targetFocus: 'Postural Scapular Stabilizer Endurance',
                },
              ],
            },
            // Exercise 5: cable one arm lateral raise (0178)
            {
              id: `${weekId}_d0_ep5`,
              exerciseId: 'ex_0178',
              exerciseName: 'cable one arm lateral raise',
              sets: 2,
              warmupSets: 0,
              targetWeightKg: 5,
              repRangeLow: 8,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : [2, 1],
              restSeconds: 60,
              loadGuidance: 'LOCK AT 5KG: Left Arm First! Hold cable frame, squeeze glutes & tuck pelvis under (zero lower-back arch), raise in 30-deg forward scapular plane with soft elbow. Add +1 rep/week.',
              formCueText: 'LOCK AT 5KG: Left Arm First! Hold cable column, squeeze glutes & tuck pelvis under (zero lower-back arch), raise in 30° forward scapular plane with soft elbow.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20one%20arm%20lateral%20raise%20proper%20form',
              targetMuscleGroups: ['Lateral Deltoids', 'Side Delts'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable one arm lateral raise',
                  formCue: 'Left arm first! Raise handle in 30° scapular plane; soft elbow; lower over 3s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20one%20arm%20lateral%20raise%20proper%20form',
                  targetFocus: 'Continuous Lateral Deltoid Tension',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated dumbbell lateral raise',
                  formCue: 'Sit tall with chest proud; raise dumbbells in slight forward arc to shoulder height.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20dumbbell%20lateral%20raise%20proper%20form',
                  targetFocus: 'Free Weight Lateral Deltoid Hypertrophy',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever lateral raise',
                  formCue: 'Elbows on pads; drive upward with side of deltoids; avoid shrugging traps.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20lateral%20raise%20proper%20form',
                  targetFocus: 'Machine Lateral Deltoid Isolation',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'side-plank lateral arm reach',
                  formCue: 'Hold rigid side plank; raise top arm straight up reaching for ceiling.',
                  videoUrl: 'https://www.youtube.com/results?search_query=side%20plank%20arm%20reach%20proper%20form',
                  targetFocus: 'Bodyweight Lateral Core & Shoulder Stability',
                },
              ],
            },
            // Exercise 6: lever lateral raise (0584)
            {
              id: `${weekId}_d0_ep6`,
              exerciseId: 'ex_0584',
              exerciseName: 'lever lateral raise',
              sets: 2,
              warmupSets: 0,
              targetWeightKg: 10,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : [2, 1],
              restSeconds: 60,
              loadGuidance: 'Seated elbow-pad machine on Pin 1 (10kg); short lever removes neural braking. Keep lower back glued flat to backrest.',
              formCueText: 'Sit with lower back pressed flat against backrest; elbow pads cut lever length in half, removing long-lever neural braking.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20lateral%20raise%20proper%20form',
              targetMuscleGroups: ['Lateral Deltoids', 'Side Delts'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever lateral raise',
                  formCue: 'Elbow pads take leverage off hands; drive elbows out and up smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20lateral%20raise%20proper%20form',
                  targetFocus: 'Stabilized Short-Lever Lateral Deltoid Mass',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'chest-supported incline lateral raise',
                  formCue: 'Chest against 45° incline bench; raise dumbbells laterally without swinging.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline%20lateral%20raise%20proper%20form',
                  targetFocus: 'Cheat-Proof Free Weight Deltoid Hypertrophy',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'dual cable cross lateral raise',
                  formCue: 'Set pulleys at knees; cross cables in front; raise both arms simultaneously.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dual%20cable%20lateral%20raise%20proper%20form',
                  targetFocus: 'Bilateral Continuous Shoulder Tension',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'wall lateral slide',
                  formCue: 'Forearms on wall with light band; slide arms upward keeping contact.',
                  videoUrl: 'https://www.youtube.com/results?search_query=wall%20slides%20deltoids%20proper%20form',
                  targetFocus: 'Scapular Upward Rotation Control',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d0_b4`,
          order: 4,
          type: 'straight',
          bannerText: 'Triceps Isolation (60s Rest)',
          exercises: [
            // Exercise 7: cable pushdown (with rope attachment) (0200)
            {
              id: `${weekId}_d0_ep7`,
              exerciseId: 'ex_0200',
              exerciseName: 'cable pushdown (with rope attachment)',
              sets: 2,
              warmupSets: 0,
              targetWeightKg: 20,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : [1, 1],
              restSeconds: 60,
              loadGuidance: 'Stand with soft knees, glutes squeezed, and ribs locked down; pin elbows tightly to sides and spread rope ends at bottom. 20kg target.',
              formCueText: 'Stand with soft knees, glutes squeezed, and ribs locked down; pin elbows tightly to sides and spread rope ends at bottom.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20rope%20pushdown%20proper%20form',
              targetMuscleGroups: ['Triceps', 'Triceps Brachii', 'Lateral Head Triceps'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pushdown (with rope attachment)',
                  formCue: 'Pin elbows to sides; push rope down and flare outward at bottom lockout.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20rope%20pushdown%20proper%20form',
                  targetFocus: 'Lateral & Medial Triceps Head Flare',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever triceps extension',
                  formCue: 'Sit with back flat against pad; push handles down locking out smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20triceps%20extension%20proper%20form',
                  targetFocus: 'Seated Triceps Lockout Hypertrophy',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'overhead dumbbell triceps extension',
                  formCue: 'Hold single dumbbell overhead with both hands; lower behind head, press up.',
                  videoUrl: 'https://www.youtube.com/results?search_query=overhead%20dumbbell%20tricep%20extension%20proper%20form',
                  targetFocus: 'Long Head Triceps Stretch',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'bench dips (feet flat on floor)',
                  formCue: 'Hands on bench behind hips; lower pelvis close to bench; press to lockout.',
                  videoUrl: 'https://www.youtube.com/results?search_query=bench%20dips%20proper%20form',
                  targetFocus: 'Bodyweight Triceps Extension',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // TUESDAY (DAY 2): 100% SEATED PULL (WIDE-PULL STARTER MOTOR & SUPINATION FOCUS)
    // Zero lower-body load the day after Monday football
    // ----------------------------------------------------
    {
      id: `${weekId}_d1`,
      weekId,
      dayOfWeek: 1,
      label: 'Tuesday: 100% Seated Pull (Wide-Pull Starter Motor & Supination Focus), Biceps & Forearms',
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: workoutDayNutrition,
      blocks: [
        {
          id: `${weekId}_d1_b1`,
          order: 1,
          type: 'straight',
          bannerText: 'Primary Seated Pull Compounds (90s Rest | Zero Spinal Axial Loading)',
          exercises: [
            // Exercise 1: cable pulldown (0198)
            {
              id: `${weekId}_d1_ep1`,
              exerciseId: 'ex_0198',
              exerciseName: 'cable pulldown',
              sets: standardSets,
              warmupSets: 2,
              targetWeightKg: 40,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: isDeload ? [3, 4] : [2, 2, 2],
              restSeconds: 90,
              loadGuidance: 'WIDE-PULL STARTER MOTOR: Use medium-wide grip. Start every rep by pulling shoulder blades DOWN with straight arms (1s pause) before bending elbows! Keep torso vertical and ribs down. 40kg target.',
              formCueText: 'WIDE-PULL STARTER MOTOR: Use a medium-wide grip. At the start of every rep with straight arms, pull your shoulder blades DOWN away from your ears and pause 1s before bending your elbows! Keep torso vertical and ribs down.',
              videoUrl: 'https://www.youtube.com/results?search_query=lat%20pulldown%20proper%20form',
              targetMuscleGroups: ['Lats', 'Upper Back', 'Biceps', 'Lower Traps'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pulldown',
                  formCue: 'Medium-wide grip; depress shoulder blades 1s before bending elbows; torso vertical.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lat%20pulldown%20proper%20form',
                  targetFocus: 'Lat Width & Scapular Depression',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever front pulldown',
                  formCue: 'Thighs locked under pads; draw handles down in continuous arc.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20pulldown%20form%20proper%20form',
                  targetFocus: 'Supported Lat Hypertrophy',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'cross-bench dumbbell pullover',
                  formCue: 'Upper back on bench; lower dumbbell across arc overhead; pull with lats.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20pullover%20form%20proper%20form',
                  targetFocus: 'Lengthened Lat Stretch',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'pull-up (or band-assisted)',
                  formCue: 'Full hang; depress shoulder blades and pull chin over bar.',
                  videoUrl: 'https://www.youtube.com/results?search_query=pull%20up%20form%20proper%20form',
                  targetFocus: 'Vertical Bodyweight Pull',
                },
              ],
            },
            // Exercise 2: lever seated row (0603)
            {
              id: `${weekId}_d1_ep2`,
              exerciseId: 'ex_0603',
              exerciseName: 'lever seated row',
              sets: standardSets,
              warmupSets: 1,
              targetWeightKg: 30,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : [2, 2, 2],
              restSeconds: 90,
              loadGuidance: 'Chest-supported row at 30kg; build to 3 clean sets of 12 before moving to 35kg.',
              formCueText: 'Chest-supported row at 30kg; build to 3 clean sets of 12 before moving to 35kg. Chest glued to pad; drive elbows back low.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20row%20proper%20form',
              targetMuscleGroups: ['Upper Back', 'Lats', 'Rhomboids', 'Mid Traps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated row',
                  formCue: 'Chest against pad; pull low to hips; 1s contraction pause.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20row%20proper%20form',
                  targetFocus: 'Chest-Supported Lat & Mid-Back Mass',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'two-arm dumbbell row (chest supported)',
                  formCue: 'Prone on 30° bench; pull dumbbells back keeping wrists straight.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest%20supported%20dumbbell%20row%20proper%20form',
                  targetFocus: 'Free Weight Thoracic Retraction',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'low cable row (close neutral grip)',
                  formCue: 'Sit upright, knees soft; pull V-handle into abdomen; release over 3s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20row%20proper%20form',
                  targetFocus: 'Constant Cable Tension Mid-Back',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'horizontal bar pull-up (feet on bench)',
                  formCue: 'Grip bar shoulder-width; pull sternum to bar with body in straight line.',
                  videoUrl: 'https://www.youtube.com/results?search_query=horizontal%20bar%20pull%20up%20proper%20form',
                  targetFocus: 'Closed-Chain Back & Grip Synergy',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d1_b2`,
          order: 2,
          type: 'straight',
          bannerText: 'Mid-Back & Rotator Stability (75s / 60s Rest)',
          exercises: [
            // Exercise 3: cable straight back seated row (0239)
            {
              id: `${weekId}_d1_ep3`,
              exerciseId: 'ex_0239',
              exerciseName: 'cable straight back seated row',
              sets: standardSets,
              warmupSets: 0,
              targetWeightKg: 25,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : [2, 2, 2],
              restSeconds: 75,
              loadGuidance: 'CHIN-UP SUPINATION BUILDER: Use a shoulder-width underhand (palms-up) bar. Sit tall with a flat neutral lower back (no arch), depress shoulders down, and pull bar to lower stomach. 25kg.',
              formCueText: 'CHIN-UP SUPINATION BUILDER: Use a shoulder-width underhand (palms-up) bar. Sit tall with a flat neutral lower back (no arch), depress shoulders down, and pull bar to lower stomach.',
              videoUrl: 'https://www.youtube.com/results?search_query=underhand%20cable%20row%20proper%20form',
              targetMuscleGroups: ['Lats', 'Biceps', 'Rhomboids', 'Forearms'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable straight back seated row',
                  formCue: 'Underhand palms-up grip; sit tall with flat lower back; pull bar to navel.',
                  videoUrl: 'https://www.youtube.com/results?search_query=underhand%20cable%20row%20proper%20form',
                  targetFocus: 'Supinated Lat & Biceps Strength',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever underhand row',
                  formCue: 'Underhand grip on machine handles; chest against pad; squeeze lats.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20underhand%20row%20proper%20form',
                  targetFocus: 'Machine Underhand Lat Mass',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'supinated dumbbell row (on incline bench)',
                  formCue: 'Palms facing forward; pull dumbbells back grazing lower ribs.',
                  videoUrl: 'https://www.youtube.com/results?search_query=supinated%20dumbbell%20row%20proper%20form',
                  targetFocus: 'Free Weight Supinated Hypertrophy',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'supinated inverted row (Smith bar)',
                  formCue: 'Underhand chin-up grip on bar; pull chest to bar with glutes locked.',
                  videoUrl: 'https://www.youtube.com/results?search_query=inverted%20row%20underhand%20proper%20form',
                  targetFocus: 'Closed-Chain Chin-Up Transition',
                },
              ],
            },
            // Exercise 4: cable standing rear delt row (with rope) (0220)
            {
              id: `${weekId}_d1_ep4`,
              exerciseId: 'ex_0220',
              exerciseName: 'cable standing rear delt row (with rope)',
              sets: standardSets,
              warmupSets: 1,
              targetWeightKg: 30,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : [1, 1, 1],
              restSeconds: 60,
              loadGuidance: 'Stagger feet (or perform seated/kneeling) and tuck pelvis under so 30kg never pulls your lower back into an arch. Pull to forehead, rotating thumbs backward.',
              formCueText: 'Stagger feet (or perform seated/kneeling) and tuck pelvis under so 30kg never pulls lower back into an arch. Pull to forehead with thumbs rotating back.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20rear%20delt%20row%20rope%20proper%20form',
              targetMuscleGroups: ['Rear Deltoids', 'Rotator Cuff', 'Upper Back'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable standing rear delt row (with rope)',
                  formCue: 'Pulley at collarbone; pull rope to bridge of nose; flare elbows wide.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20rear%20delt%20row%20rope%20proper%20form',
                  targetFocus: 'Rear Deltoid & External Cuff Rotation',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever rear delt fly',
                  formCue: 'Sit facing pad; handles at shoulder level; sweep outward with straight arms.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20rear%20delt%20fly%20proper%20form',
                  targetFocus: 'Guided Machine Rear Delt Thickness',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'prone dumbbell face pull (on incline bench)',
                  formCue: 'Lie chest down on 45° bench; pull dumbbells toward ears with elbows high.',
                  videoUrl: 'https://www.youtube.com/results?search_query=prone%20dumbbell%20face%20pull%20proper%20form',
                  targetFocus: 'Supported Rotator Stability',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'band pull-aparts (with pause)',
                  formCue: 'Hold resistance band at chest height; pull apart until band touches sternum.',
                  videoUrl: 'https://www.youtube.com/results?search_query=band%20pull%20aparts%20proper%20form',
                  targetFocus: 'Scapular Posterior Chain Endurance',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d1_b3`,
          order: 3,
          type: 'straight',
          bannerText: 'Arm Hypertrophy & Forearm Mechanics (60s Rest)',
          exercises: [
            // Exercise 5: lever preacher curl (0591)
            {
              id: `${weekId}_d1_ep5`,
              exerciseId: 'ex_0591',
              exerciseName: 'lever preacher curl',
              sets: standardSets,
              warmupSets: 0,
              targetWeightKg: 20,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : [1, 1, 1],
              restSeconds: 60,
              loadGuidance: 'Upper arms flat on preacher pad (100% left-arm stability). Actively twist/supinate pinkies upward at the top; lower over 3s. 20kg.',
              formCueText: 'Back of upper arms flat on preacher pad (100% left-arm stability). Actively twist/supinate pinkies upward at the top; lower over 3s.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20preacher%20curl%20proper%20form',
              targetMuscleGroups: ['Biceps', 'Biceps Brachii', 'Brachialis'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever preacher curl',
                  formCue: 'Armpits over pad; keep wrists straight; 3s lowering phase.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20preacher%20curl%20proper%20form',
                  targetFocus: 'Isolated Short Head Biceps Peak',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'single-arm dumbbell preacher curl',
                  formCue: 'Left arm first! Rest arm flat on pad; curl dumbbell smoothly without swinging.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20preacher%20curl%20proper%20form',
                  targetFocus: 'Unilateral Biceps Symmetry',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable preacher curl (with straight bar)',
                  formCue: 'Attach straight bar to low pulley; arms over preacher bench; curl to forehead.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20preacher%20curl%20proper%20form',
                  targetFocus: 'Constant Tension Biceps Hypertrophy',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'underhand inverted bicep curls (Smith bar)',
                  formCue: 'Close underhand grip on bar at waist; curl forehead toward bar with elbows high.',
                  videoUrl: 'https://www.youtube.com/results?search_query=bodyweight%20bicep%20curls%20proper%20form',
                  targetFocus: 'Closed-Chain Biceps Overload',
                },
              ],
            },
            // Exercise 6: cable hammer curl (with rope) (0165)
            {
              id: `${weekId}_d1_ep6`,
              exerciseId: 'ex_0165',
              exerciseName: 'cable hammer curl (with rope)',
              sets: 2,
              warmupSets: 0,
              targetWeightKg: 20,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : [1, 1],
              restSeconds: 60,
              loadGuidance: 'Set at 20kg (adjusted from 25kg) for consistent 12, 12 reps without forearm fatigue drop-off.',
              formCueText: 'Set at 20kg (adjusted from Week 1\'s 25kg) so both sets hit 12, 12 cleanly without forearm drop-off.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20rope%20hammer%20curl%20proper%20form',
              targetMuscleGroups: ['Brachialis', 'Brachioradialis', 'Biceps'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable hammer curl (with rope)',
                  formCue: 'Neutral thumbs-up grip; pin elbows to ribs; curl rope ends toward shoulders.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20rope%20hammer%20curl%20proper%20form',
                  targetFocus: 'Brachialis & Brachioradialis Thickness',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated dumbbell hammer curl',
                  formCue: 'Sit tall with dumbbells hanging; curl keeping thumbs pointed upward.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20dumbbell%20hammer%20curl%20proper%20form',
                  targetFocus: 'Free Weight Forearm & Arm Cross-Section',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'machine hammer curl',
                  formCue: 'Use neutral handles on preacher or curl machine; squeeze at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20hammer%20curl%20proper%20form',
                  targetFocus: 'Guided Brachialis Isolation',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'neutral-grip chin-up hold (thumbs toward face)',
                  formCue: 'Hold top position of parallel pull-up bar for 15-20s; squeeze arms.',
                  videoUrl: 'https://www.youtube.com/results?search_query=neutral%20grip%20chin%20up%20proper%20form',
                  targetFocus: 'Isometric Forearm & Bicep Bracing',
                },
              ],
            },
            // Exercise 7: cable wrist curl (0247)
            {
              id: `${weekId}_d1_ep7`,
              exerciseId: 'ex_0247',
              exerciseName: 'cable wrist curl',
              sets: 2,
              warmupSets: 0,
              targetWeightKg: 10,
              repRangeLow: 15,
              repRangeHigh: 20,
              rirScheme: isDeload ? [3, 4] : [1, 1],
              restSeconds: 60,
              loadGuidance: 'Seated with forearms resting flat on thighs, palms up; curl handle using wrists only. 10kg.',
              formCueText: 'Seated with forearms resting flat on thighs, palms up; curl handle using wrists only.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20wrist%20curl%20proper%20form',
              targetMuscleGroups: ['Forearms', 'Wrist Flexors'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable wrist curl',
                  formCue: 'Forearms flat on bench/thighs; curl bar upward with wrists; lower slowly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20wrist%20curl%20proper%20form',
                  targetFocus: 'Forearm Flexor Hypertrophy & Grip Support',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated dumbbell wrist curl',
                  formCue: 'Forearms on knees, palms up; unroll dumbbell to fingertips, curl up.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20dumbbell%20wrist%20curl%20proper%20form',
                  targetFocus: 'Grip Strength & Flexor Tendon Resilience',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'wrist roller on rack/machine',
                  formCue: 'Roll weight up and down using controlled alternating wrist flexion.',
                  videoUrl: 'https://www.youtube.com/results?search_query=wrist%20roller%20proper%20form',
                  targetFocus: 'Continuous Forearm Occlusion',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'fingertip plank hold (on knees)',
                  formCue: 'Plank on knees with weight on fingertips; engage forearm flexors 30s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=fingertip%20plank%20proper%20form',
                  targetFocus: 'Tendon Density & Finger Flexor Endurance',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // WEDNESDAY (DAY 3): GLUTE-BIASED LEGS, HAMSTRINGS, LATERAL HIP, LAT-TO-PELVIS BRIDGE & ANTI-ARCH PELVIC CORE
    // ----------------------------------------------------
    {
      id: `${weekId}_d2`,
      weekId,
      dayOfWeek: 2,
      label: 'Wednesday: Glute-Biased Legs, Hamstrings, Lateral Hip, Lat-to-Pelvis Bridge & Anti-Arch Pelvic Core',
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: workoutDayNutrition,
      blocks: [
        {
          id: `${weekId}_d2_b1`,
          order: 1,
          type: 'straight',
          bannerText: 'Primary Lower Compounds (40h Post-Football: 90s / 75s Rest)',
          exercises: [
            // Exercise 1: sled 45° leg press (0739)
            {
              id: `${weekId}_d2_ep1`,
              exerciseId: 'ex_0739',
              exerciseName: 'sled 45° leg press',
              sets: standardSets,
              warmupSets: 2,
              targetWeightKg: 60,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: isDeload ? [3, 4] : [2, 2, 2],
              restSeconds: 90,
              loadGuidance: 'STAIR COMPENSATION: Place feet HIGH & WIDE on platform and push through heels to bias glutes/hamstrings over stair-worked quads. Keep sacrum glued flat to pad. 60kg starting weight.',
              formCueText: 'STAIR COMPENSATION: Place feet high and shoulder-width on platform and push through your heels to bias glutes/hamstrings over stair-worked quads. Keep sacrum flat on pad.',
              videoUrl: 'https://www.youtube.com/results?search_query=sled%2045%20leg%20press%20proper%20form',
              targetMuscleGroups: ['Glutes', 'Hamstrings', 'Quadriceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'sled 45° leg press',
                  formCue: 'Feet high on plate; push through heels to bias glutes; sacrum glued to pad.',
                  videoUrl: 'https://www.youtube.com/results?search_query=sled%2045%20leg%20press%20proper%20form',
                  targetFocus: 'Glute & Posterior-Biased Compound Press',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell goblet squat (heels on wedge)',
                  formCue: 'Hold dumbbell at chest; sit between hips; drive through mid-foot to stand.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20goblet%20squat%20proper%20form',
                  targetFocus: 'Free Weight Deep Knee Flexion Hypertrophy',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pull-through',
                  formCue: 'Rope between legs; hinge hips back; snap hips forward into glute contraction.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20pull%20through%20proper%20form',
                  targetFocus: 'Horizontal Glute Extension Mechanics',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'bulgarian split squat (bodyweight)',
                  formCue: 'Rear foot on bench; drop back knee toward floor; drive front heel into ground.',
                  videoUrl: 'https://www.youtube.com/results?search_query=bulgarian%20split%20squat%20proper%20form',
                  targetFocus: 'Unilateral Hip & Pelvic Stability',
                },
              ],
            },
            // Exercise 2: lever seated leg curl (0599)
            {
              id: `${weekId}_d2_ep2`,
              exerciseId: 'ex_0599',
              exerciseName: 'lever seated leg curl',
              sets: standardSets,
              warmupSets: 1,
              targetWeightKg: 25,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : [2, 2, 1],
              restSeconds: 75,
              loadGuidance: 'Anchors posterior pelvis downward to counteract anterior pelvic tilt from stairs and driving. Pause 1s at full curl. 25kg.',
              formCueText: 'Reverses hamstring compression from 2.5h driving and pulls the back of your pelvis downward to fix anterior pelvic tilt. Pause 1s at full curl.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20leg%20curl%20proper%20form',
              targetMuscleGroups: ['Hamstrings', 'Biceps Femoris', 'Semitendinosus'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated leg curl',
                  formCue: 'Thigh pad locked firm; toes pulled up; curl heels under seat with 1s pause.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20leg%20curl%20proper%20form',
                  targetFocus: 'Seated Hamstring Knee Flexion in Hip Stretch',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'lying dumbbell hamstring curl',
                  formCue: 'Lie face down; squeeze dumbbell between feet; curl heels toward glutes.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lying%20dumbbell%20leg%20curl%20proper%20form',
                  targetFocus: 'Free Weight Hamstring Hypertrophy',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'standing single-leg cable hamstring curl',
                  formCue: 'Ankle strap on low pulley; curl heel straight up toward glute; lower over 3s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20leg%20curl%20proper%20form',
                  targetFocus: 'Unilateral Hamstring Balance',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'swiss ball hamstring curl (or sliding towel)',
                  formCue: 'Bridge hips up; curl heels in toward buttocks; keep hips high throughout.',
                  videoUrl: 'https://www.youtube.com/results?search_query=swiss%20ball%20hamstring%20curl%20proper%20form',
                  targetFocus: 'Pelvic-Anchor Hamstring & Glute Synergy',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d2_b2`,
          order: 2,
          type: 'straight',
          bannerText: 'Quad Isolation & Lat Pullover (60s Rest)',
          exercises: [
            // Exercise 3: lever leg extension (0585)
            {
              id: `${weekId}_d2_ep3`,
              exerciseId: 'ex_0585',
              exerciseName: 'lever leg extension',
              sets: standardSets,
              warmupSets: 0,
              targetWeightKg: 25,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : [2, 2, 1],
              restSeconds: 60,
              loadGuidance: 'Single weekly direct quad isolation; 1s top hold, 3s slow eccentric. 25kg.',
              formCueText: 'Your only direct quad isolation of the week. Pause 1s at top, lower over 3 slow seconds.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20leg%20extension%20proper%20form',
              targetMuscleGroups: ['Quadriceps', 'Rectus Femoris', 'Vastus Lateralis'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever leg extension',
                  formCue: 'Back flat on pad; extend knees fully; hold 1s at top; lower over 3s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20leg%20extension%20proper%20form',
                  targetFocus: 'Terminal Knee Extension Quad Peak',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell sissy squat (or heel elevated)',
                  formCue: 'Hold light dumbbell; lean torso back slightly as knees push forward.',
                  videoUrl: 'https://www.youtube.com/results?search_query=sissy%20squat%20proper%20form',
                  targetFocus: 'Lengthened Rectus Femoris Quad Tension',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable reverse squat (seated knee flexion)',
                  formCue: 'Ankle straps on low cable; pull knees to chest in seated position.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20reverse%20squat%20proper%20form',
                  targetFocus: 'Hip Flexor & Quad Integration',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'wall sit (90° knee angle)',
                  formCue: 'Back flat against wall; thighs parallel to floor; hold for 45s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=wall%20sit%20proper%20form',
                  targetFocus: 'Isometric Patellar Tendon Resilience',
                },
              ],
            },
            // Exercise 4: cable straight arm pulldown (0237)
            {
              id: `${weekId}_d2_ep4`,
              exerciseId: 'ex_0237',
              exerciseName: 'cable straight arm pulldown',
              sets: standardSets,
              warmupSets: 0,
              targetWeightKg: 20,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : [1, 1, 1],
              restSeconds: 60,
              loadGuidance: 'PULL-UP CORE BRIDGE: Squeeze glutes, tilt belt buckle UP (posterior pelvic tilt), and exhale ribs down while sweeping rope to thighs. 20kg.',
              formCueText: 'STANDING PULL-UP CORE BRIDGE: Squeeze glutes, tilt belt buckle UP (posterior pelvic tilt), and exhale ribs down as you sweep straight arms to thighs. Teaches your lats to fire off a locked pelvis!',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20straight%20arm%20pulldown%20proper%20form',
              targetMuscleGroups: ['Lats', 'Serratus Anterior', 'Core', 'Posterior Pelvis'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable straight arm pulldown',
                  formCue: 'Straight arms; sweep bar down to thighs; exhale ribs down at bottom.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20straight%20arm%20pulldown%20proper%20form',
                  targetFocus: 'Lat-Pelvic Kinetic Fascial Lock',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever lat pullover',
                  formCue: 'Sit with back against pad; drive elbows down in arc to ribs.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20pullover%20proper%20form',
                  targetFocus: 'Full-Arc Lat Hypertrophy Without Biceps',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'straight-arm dumbbell pullover (on flat bench)',
                  formCue: 'Lie on flat bench; lower dumbbell overhead in arc; pull with lats.',
                  videoUrl: 'https://www.youtube.com/results?search_query=straight%20arm%20dumbbell%20pullover%20proper%20form',
                  targetFocus: 'Free Weight Serratus & Lat Stretch',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'ab-wheel rollout (from knees)',
                  formCue: 'Tuck tailbone; roll wheel forward extending lats; pull back with lats.',
                  videoUrl: 'https://www.youtube.com/results?search_query=ab%20wheel%20rollout%20proper%20form',
                  targetFocus: 'Anti-Extension Lat & Anterior Core Integration',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d2_b3`,
          order: 3,
          type: 'straight',
          bannerText: 'Pelvic Lateral Stability & Anti-Tilt Core (60s Rest)',
          exercises: [
            // Exercise 5: lever seated hip abduction (0597)
            {
              id: `${weekId}_d2_ep5`,
              exerciseId: 'ex_0597',
              exerciseName: 'lever seated hip abduction',
              sets: 2,
              warmupSets: 0,
              targetWeightKg: 35,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : [1, 1],
              restSeconds: 60,
              loadGuidance: 'Targets Gluteus Medius to stabilize pelvis laterally against sleep twist, stairs, and football cuts. Sit tall (back against pad) and pause 1s at wide open position. 35kg.',
              formCueText: 'Targets Gluteus Medius to stabilize pelvis laterally against right-leg sleep hiking, stairs, and football cuts. Sit tall (back against pad) and pause 1s at wide open position.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20hip%20abduction%20proper%20form',
              targetMuscleGroups: ['Gluteus Medius', 'Gluteus Minimus', 'Lateral Pelvis'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated hip abduction',
                  formCue: 'Sit tall with back firmly against pad; push knees wide outward; 1s contraction hold.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20hip%20abduction%20proper%20form',
                  targetFocus: 'Gluteus Medius & Minimus Pelvic Lateral Stability',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'standing cable hip abduction',
                  formCue: 'Ankle cuff on low pulley; kick working leg out to side keeping pelvis level.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20hip%20abduction%20proper%20form',
                  targetFocus: 'Unilateral Pelvic Lateral Bracing',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'side-lying dumbbell hip abduction',
                  formCue: 'Lie on side, dumbbell resting on outer thigh; raise leg straight up 45°.',
                  videoUrl: 'https://www.youtube.com/results?search_query=side%20lying%20hip%20abduction%20proper%20form',
                  targetFocus: 'Free Weight Gluteus Medius Abduction',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'side plank with clamshell / abduction',
                  formCue: 'Side plank on forearm; lift top knee/leg keeping feet aligned; hold 2s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=side%20plank%20clamshell%20proper%20form',
                  targetFocus: 'Integrated Lateral Pelvis & Quadratus Lumborum Anchor',
                },
              ],
            },
            // Exercise 6: reverse crunch (0872)
            {
              id: `${weekId}_d2_ep6`,
              exerciseId: 'ex_0872',
              exerciseName: 'reverse crunch',
              sets: 2,
              warmupSets: 0,
              targetWeightKg: 0,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : [1, 1],
              restSeconds: 60,
              loadGuidance: 'PRIMARY PELVIC TILT FIX: Exhale and curl tailbone/hips UP off bench toward ribs; lower only halfway so lower back stays flat on bench.',
              formCueText: 'PRIMARY PELVIC TILT FIX: Lie on bench holding pad behind head. Exhale and curl your tailbone/hips UP off the bench toward your ribs; lower only halfway so lower back stays flat!',
              videoUrl: 'https://www.youtube.com/results?search_query=reverse%20crunch%20proper%20form',
              targetMuscleGroups: ['Abs', 'Lower Abdominals', 'Rectus Abdominis'],
              selectedEquipment: 'bodyweight',
              equipmentVariations: [
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'reverse crunch',
                  formCue: 'Lie on bench; hold pad behind head; curl hips up toward ribs without swinging.',
                  videoUrl: 'https://www.youtube.com/results?search_query=reverse%20crunch%20proper%20form',
                  targetFocus: 'Posterior Pelvic Tilt & Lower Abdominal Flattening',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'kneeling cable crunch (anti-anterior-tilt)',
                  formCue: 'Kneel holding rope at ears; curl torso down toward thighs rounding spine.',
                  videoUrl: 'https://www.youtube.com/results?search_query=kneeling%20cable%20crunch%20proper%20form',
                  targetFocus: 'Loaded Rectus Abdominis Flexion',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated crunch',
                  formCue: 'Sit tall in machine; blow all air out as chest curls forward toward pelvis.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20crunch%20proper%20form',
                  targetFocus: 'Machine Abdominal Compression',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'weighted dead bug (holding light DB overhead)',
                  formCue: 'Lie on back, lower back pressed to mat; extend legs alternating sides.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dead%20bug%20proper%20form',
                  targetFocus: 'Anti-Extension Lumbar Flattening',
                },
              ],
            },
            // Exercise 7: lever seated crunch (0595)
            {
              id: `${weekId}_d2_ep7`,
              exerciseId: 'ex_0595',
              exerciseName: 'lever seated crunch',
              sets: 2,
              warmupSets: 0,
              targetWeightKg: 20,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : [1, 1],
              restSeconds: 60,
              loadGuidance: 'Exhale 100% of air at peak crunch to pull flared lower ribs down into abs. 20kg.',
              formCueText: 'Blow 100% of your air out at peak contraction to pull flared lower ribs down into your abdominal wall.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20crunch%20proper%20form',
              targetMuscleGroups: ['Abs', 'Upper Abdominals', 'Internal Obliques'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated crunch',
                  formCue: 'Grip handles firmly; blow out all air at peak contraction; 3s eccentric return.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20crunch%20proper%20form',
                  targetFocus: 'Rib Cage Depression & Sternal-Pelvic Wall Flattening',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'standing high-to-low cable crunch',
                  formCue: 'High pulley rope; tuck chin and round upper back pulling ribcage toward hips.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20rope%20crunch%20proper%20form',
                  targetFocus: 'Standing Thoraco-Lumbar Flexion Strength',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'decline bench dumbbell crunch',
                  formCue: 'Lie on decline bench with light dumbbell on chest; crunch up holding 1s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=decline%20crunch%20dumbbell%20proper%20form',
                  targetFocus: 'Free Weight Core Hypertrophy',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'hollow-body rock / hold',
                  formCue: 'Arms overhead, feet off floor, lower back pressed flat into floor; hold 30s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=hollow%20body%20hold%20proper%20form',
                  targetFocus: 'Gymnastic Pelvic-Rib Cage Anti-Extension Anchor',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // THURSDAY (DAY 4): POSTERIOR CHAIN, PRIORITY SHOULDERS, SEATED FLY & BICEPS
    // ----------------------------------------------------
    {
      id: `${weekId}_d3`,
      weekId,
      dayOfWeek: 3,
      label: 'Thursday: Posterior Chain (Dumbbell RDL & Glute Bridge Machine), Priority Shoulders, Seated Fly & Biceps',
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: workoutDayNutrition,
      blocks: [
        {
          id: `${weekId}_d3_b1`,
          order: 1,
          type: 'straight',
          bannerText: 'Posterior Chain Hinge & Overhead Press (90s Rest)',
          exercises: [
            // Exercise 1: dumbbell romanian deadlift (1459)
            {
              id: `${weekId}_d3_ep1`,
              exerciseId: 'ex_1459',
              exerciseName: 'dumbbell romanian deadlift',
              sets: standardSets,
              warmupSets: 2,
              targetWeightKg: 12.5,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: isDeload ? [3, 4] : [2, 2, 2],
              restSeconds: 90,
              loadGuidance: '12.5kg per DB (25kg total). Hinge hips straight back to mid-shin; squeeze glutes to stand tall (NEVER lean back or arch lower spine at top).',
              formCueText: 'Keep dumbbells grazing the sides of your thighs. Brace abs flat, push hips straight back to mid-shin, and squeeze glutes to stand tall (NEVER lean back or arch your lower spine at lockout!).',
              videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20romanian%20deadlift%20proper%20form',
              targetMuscleGroups: ['Hamstrings', 'Glutes', 'Erector Spinae'],
              selectedEquipment: 'dumbbell',
              equipmentVariations: [
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell romanian deadlift',
                  formCue: 'Push hips straight back to wall behind you; dumbbells graze shins; squeeze glutes at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20romanian%20deadlift%20proper%20form',
                  targetFocus: 'Dumbbell Posterior Chain Lengthening',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'smith machine romanian deadlift',
                  formCue: 'Bar on fixed track; hinge hips backward; stop at mid-shin; drive through heels.',
                  videoUrl: 'https://www.youtube.com/results?search_query=smith%20machine%20romanian%20deadlift%20proper%20form',
                  targetFocus: 'Guided Posterior Chain Hypertrophy',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable romanian deadlift (from low pulley)',
                  formCue: 'Face pulley with straight bar; hinge hips back against tension; stand tall.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20romanian%20deadlift%20proper%20form',
                  targetFocus: 'Continuous Tension Posterior Chain',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'single-leg romanian deadlift (bodyweight)',
                  formCue: 'Stand on one leg, soft knee; hinge torso forward reaching back leg high.',
                  videoUrl: 'https://www.youtube.com/results?search_query=single%20leg%20romanian%20deadlift%20proper%20form',
                  targetFocus: 'Unilateral Hamstring & Hip Balance',
                },
              ],
            },
            // Exercise 2: lever shoulder press (0605)
            {
              id: `${weekId}_d3_ep2`,
              exerciseId: 'ex_0605',
              exerciseName: 'lever shoulder press',
              sets: standardSets,
              warmupSets: 1,
              targetWeightKg: 10,
              repRangeLow: 10,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : [2, 2, 2],
              restSeconds: 90,
              loadGuidance: 'ANTI-ARCH SHOULDER RULE: Neutral grip at 10kg (Pin 1-2). Glue lower back and ribs flat into backrest (zero lumbar arch). Progress reps 10 -> 15 before adding weight.',
              formCueText: 'ANTI-ARCH SHOULDER RULE: Use neutral handles (palms facing in). Glue your lower back and lower ribs flat into the backrest—if your lower back arches off the pad, the weight is too heavy! Progress from 10 to 15 reps at 10 kg.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20shoulder%20press%20proper%20form',
              targetMuscleGroups: ['Shoulders', 'Anterior Deltoids', 'Triceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever shoulder press',
                  formCue: 'Back firmly against pad; neutral handles; press overhead without rib flare.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20shoulder%20press%20proper%20form',
                  targetFocus: 'Seated Shoulder Hypertrophy & Anti-Rib-Flare',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated neutral-grip dumbbell shoulder press',
                  formCue: 'Palms facing each other; elbows 30° forward; press dumbbells up in natural arc.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20dumbbell%20shoulder%20press%20proper%20form',
                  targetFocus: 'Free Weight Deltoid Hypertrophy in Scapular Plane',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'kneeling cable shoulder press',
                  formCue: 'Kneel with pelvis tucked; press handles overhead from shoulder level.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20shoulder%20press%20proper%20form',
                  targetFocus: 'Core-Stabilized Deltoid Press',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'pike push-up (hands on floor)',
                  formCue: 'Hips high in pike position; lower head toward hands; press through shoulders.',
                  videoUrl: 'https://www.youtube.com/results?search_query=pike%20push%20up%20proper%20form',
                  targetFocus: 'Closed-Chain Overhead Pushing Strength',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d3_b2`,
          order: 2,
          type: 'straight',
          bannerText: 'Upper Back & Sternal Pec Isolation (75s / 60s Rest)',
          exercises: [
            // Exercise 3: cable seated high row (v-bar) (0215)
            {
              id: `${weekId}_d3_ep3`,
              exerciseId: 'ex_0215',
              exerciseName: 'cable seated high row (v-bar)',
              sets: standardSets,
              warmupSets: 0,
              targetWeightKg: 30,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : [1, 1, 1],
              restSeconds: 75,
              loadGuidance: 'Keep shoulders depressed down away from ears; pull elbows back at 45 deg and pause 1s. 30kg.',
              formCueText: 'Keep torso vertical, ribs down, and shoulders depressed down away from ears; pull elbows back at 45° and squeeze 1s.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20high%20row%20v%20bar%20proper%20form',
              targetMuscleGroups: ['Upper Back', 'Mid Traps', 'Lower Traps', 'Rhomboids'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable seated high row (v-bar)',
                  formCue: 'Pulley at eye level; pull V-bar to upper chest; flare elbows 45° outward.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20high%20row%20v%20bar%20proper%20form',
                  targetFocus: 'Mid-Trap, Rhomboid & Postural Retraction',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever high row',
                  formCue: 'Chest against pad; pull handles downward and back toward ribs.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20high%20row%20proper%20form',
                  targetFocus: 'Machine Scapular Retraction & Depression',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'chest-supported 45° dumbbell row',
                  formCue: 'Lie on 45° incline bench; pull dumbbells wide with elbows at 45°.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline%20dumbbell%20row%20proper%20form',
                  targetFocus: 'Supported Upper Back Thickness',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'face-height inverted row',
                  formCue: 'Bar at chest height; pull forehead toward bar keeping body straight.',
                  videoUrl: 'https://www.youtube.com/results?search_query=inverted%20row%20high%20proper%20form',
                  targetFocus: 'Bodyweight Scapular Retraction Power',
                },
              ],
            },
            // Exercise 4: lever seated fly (0596)
            {
              id: `${weekId}_d3_ep4`,
              exerciseId: 'ex_0596',
              exerciseName: 'lever seated fly',
              sets: standardSets,
              warmupSets: 0,
              targetWeightKg: 25,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : [2, 2, 2],
              restSeconds: 60,
              loadGuidance: '100% STABLE CHEST BUILDER (Replaces Dips): Back and pelvis glued flat to seat pad (zero balance wobble). Stop arms in line with chest so front shoulder capsule never over-stretches. 25kg.',
              formCueText: '100% STABLE CHEST BUILDER (Replaces Dips): Back and pelvis glued flat to seat pad (zero balance wobble). Stop arms in line with chest so front shoulder capsule never over-stretches. (Optional weekly alternation with 0009: assisted chest dip in Weeks 9–16).',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20fly%20proper%20form',
              targetMuscleGroups: ['Chest', 'Pectorals', 'Sternal Pecs'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated fly',
                  formCue: 'Back flat against pad; arms wide with soft elbows; bring handles together in front of chest.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20fly%20proper%20form',
                  targetFocus: 'Peak Shortened Sternal Pec Squeeze',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'flat dumbbell flye',
                  formCue: 'Lie on flat bench; lower dumbbells in wide arc with soft elbows; squeeze together at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20fly%20proper%20form',
                  targetFocus: 'Lengthened Chest Stretch',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable standing chest flye',
                  formCue: 'Staggered stance with abs braced; bring cable handles together in front of sternum.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20crossover%20chest%20proper%20form',
                  targetFocus: 'Continuous Tension Pec Hypertrophy',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'assisted chest dip (0009)',
                  formCue: 'Rest knees on pad; lower until elbows reach 90°; press up to lockout.',
                  videoUrl: 'https://www.youtube.com/results?search_query=assisted%20chest%20dip%20proper%20form',
                  targetFocus: 'Compound Lower Chest & Triceps (Alternate Weeks 9-16)',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d3_b3`,
          order: 3,
          type: 'straight',
          bannerText: 'Priority Shoulders, Glute Bridge Machine & Biceps (60s Rest)',
          exercises: [
            // Exercise 5: cable one arm lateral raise (0178)
            {
              id: `${weekId}_d3_ep5`,
              exerciseId: 'ex_0178',
              exerciseName: 'cable one arm lateral raise',
              sets: 3,
              warmupSets: 0,
              targetWeightKg: 5,
              repRangeLow: 8,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : [2, 2, 1],
              restSeconds: 60,
              loadGuidance: 'LEFT-ARM LEADER RULE: Start with left arm at 5kg, match right reps. Raise in 30° scapular plane with soft elbow. Add +1 rep/week at 5kg.',
              formCueText: 'LOCK AT 5KG: Left Arm First! Hold cable column, tuck pelvis under (flat lower back), raise in 30° forward scapular plane. Add +1 rep/week at 5 kg.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20one%20arm%20lateral%20raise%20proper%20form',
              targetMuscleGroups: ['Lateral Deltoids', 'Side Delts'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable one arm lateral raise',
                  formCue: 'Left arm first! Scapular plane arc; soft elbow; control lowering.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20one%20arm%20lateral%20raise%20proper%20form',
                  targetFocus: 'Left-Arm Coordination & Lateral Head Hypertrophy',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'chest-supported incline lateral raise',
                  formCue: 'Prone on 45° bench; raise dumbbells out without momentum.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline%20lateral%20raise%20proper%20form',
                  targetFocus: 'Strict Isolated Side Delt Work',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever lateral raise',
                  formCue: 'Elbows on pads; drive upward with side of deltoids; 1s top squeeze.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20lateral%20raise%20proper%20form',
                  targetFocus: 'Machine Side Delt Isolation',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'side-lying isometric arm raise',
                  formCue: 'Lie on side; raise arm 45° and hold for 20-30s per side.',
                  videoUrl: 'https://www.youtube.com/results?search_query=side%20lying%20isometric%20shoulder%20proper%20form',
                  targetFocus: 'Endurance & Joint Stability',
                },
              ],
            },
            // Exercise 6: barbell glute bridge (1409) / Glute Bridge Machine
            {
              id: `${weekId}_d3_ep6`,
              exerciseId: 'ex_1409',
              exerciseName: 'barbell glute bridge',
              sets: 2,
              warmupSets: 1,
              targetWeightKg: 30,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : [2, 1],
              restSeconds: 60,
              loadGuidance: 'DEDICATED GLUTE BRIDGE MACHINE: Directly counteracts 480 daily stairs and 2.5h driving! Keep chin tucked, ribs down, drive through heels to full 180° hip extension, and hold a posterior pelvic tilt squeeze for 2s at the top. 30kg starting weight.',
              formCueText: 'DEDICATED GLUTE BRIDGE MACHINE: Directly counteracts 480 daily stairs and 2.5h driving! Keep chin tucked, ribs down, drive through heels to full 180° hip extension, and hold a posterior pelvic tilt squeeze for 2s at the top.',
              videoUrl: 'https://www.youtube.com/results?search_query=glute%20bridge%20machine%20proper%20form',
              targetMuscleGroups: ['Glutes', 'Gluteus Maximus', 'Hip Extensors'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'barbell glute bridge',
                  formCue: 'Padded lap belt; drive hips up through heels into 180° extension; tuck chin; hold 2s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=glute%20bridge%20machine%20proper%20form',
                  targetFocus: 'Peak Shortened Gluteus Maximus Hypertrophy & Pelvic Tilt Reversal',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell hip thrust (upper back on bench)',
                  formCue: 'Dumbbell on hips; drive through heels to full extension; squeeze glutes at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20hip%20thrust%20proper%20form',
                  targetFocus: 'Free Weight Glute Extension Hypertrophy',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable glute pull-through',
                  formCue: 'Rope from low pulley; hinge hips back; snap hips forward into full extension.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20pull%20through%20proper%20form',
                  targetFocus: 'Continuous Tension Glute Extension',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'single-leg floor glute bridge',
                  formCue: 'One knee to chest, other foot flat; drive through heel lifting hips; hold 2s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=single%20leg%20glute%20bridge%20proper%20form',
                  targetFocus: 'Unilateral Glute Activation & Pelvic Leveling',
                },
              ],
            },
            // Exercise 7: cable curl (0155)
            {
              id: `${weekId}_d3_ep7`,
              exerciseId: 'ex_0155',
              exerciseName: 'cable curl',
              sets: 2,
              warmupSets: 0,
              targetWeightKg: 20,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : [1, 1],
              restSeconds: 60,
              loadGuidance: 'Two-handed EZ-bar attachment at low pulley (both hands on one bar keeps left arm 100% stable); squeeze glutes so lower back never arches. 20kg.',
              formCueText: 'Two-handed EZ-bar attachment at low pulley (both hands on one bar keeps left arm 100% stable); squeeze glutes so lower back never arches.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20bicep%20curl%20proper%20form',
              targetMuscleGroups: ['Biceps', 'Biceps Brachii', 'Brachialis'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable curl',
                  formCue: 'Low pulley with straight bar or EZ-bar; keep elbows locked by sides; curl smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20bicep%20curl%20proper%20form',
                  targetFocus: 'Continuous Biceps Tension',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever bicep curl',
                  formCue: 'Sit with upper arms on pad; curl handles upward under strict control.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20bicep%20curl%20proper%20form',
                  targetFocus: 'Machine Biceps Isolation',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'standing dumbbell curl',
                  formCue: 'Stand tall with neutral spine; curl dumbbells rotating palms up at peak.',
                  videoUrl: 'https://www.youtube.com/results?search_query=standing%20dumbbell%20curl%20proper%20form',
                  targetFocus: 'Free Weight Biceps Hypertrophy',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'underhand chin-up hold',
                  formCue: 'Supinated grip; hold top position with chin over bar for maximum biceps recruitment.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chin%20up%20isometric%20hold%20proper%20form',
                  targetFocus: 'Bodyweight Biceps Overload',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // FRIDAY (DAY 5): SYSTEMIC RECOVERY, MOBILITY & GASTRIC RESET
    // ----------------------------------------------------
    {
      id: `${weekId}_d4`,
      weekId,
      dayOfWeek: 4,
      label: 'Friday: Systemic Recovery, Mobility & Gastric Reset',
      isRestDay: true,
      morningRoutine: morningAlignmentDrills,
      nutrition: restDayNutrition,
      blocks: [],
    },

    // ----------------------------------------------------
    // SATURDAY (DAY 6 — HOME): 15-MINUTE "WEAK-LINK BRIDGE" (Pull-Up Bar & Color-Coded Push-Up Board)
    // ----------------------------------------------------
    {
      id: `${weekId}_d5`,
      weekId,
      dayOfWeek: 5,
      label: 'Saturday (Home 15-Min Weak-Link Bridge): Pull-Up Bar & Color-Coded Push-Up Board',
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: restDayNutrition,
      blocks: [
        {
          id: `${weekId}_d5_b1`,
          order: 1,
          type: 'straight',
          bannerText: 'Home Doorway Pull-Up Bar & Board (15 Mins Active Lifting)',
          exercises: [
            // Exercise 1: close grip chin-up (0253)
            {
              id: `${weekId}_d5_ep1`,
              exerciseId: 'ex_0253',
              exerciseName: 'close grip chin-up',
              sets: standardSets,
              warmupSets: 0,
              targetWeightKg: 0,
              repRangeLow: 2,
              repRangeHigh: 3,
              rirScheme: isDeload ? [3, 4] : [1, 2, 2],
              restSeconds: 90,
              loadGuidance: 'HOME PULL-UP BAR (CLOSE HAMMER/NEUTRAL GRIP): Hold feet slightly in front of hips with glutes squeezed and ribs down (hollow body, zero lower-back arch). Stop 1 rep shy of failure.',
              formCueText: 'HOME PULL-UP BAR (CLOSE HAMMER/NEUTRAL GRIP): Hold feet slightly in front of hips with glutes squeezed and ribs down (hollow body, zero lower-back arch). Stop 1 rep shy of failure.',
              videoUrl: 'https://www.youtube.com/results?search_query=close%20grip%20chin%20up%20proper%20form',
              targetMuscleGroups: ['Lats', 'Biceps', 'Brachialis', 'Upper Back'],
              selectedEquipment: 'bodyweight',
              equipmentVariations: [
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'close grip chin-up',
                  formCue: 'Doorway pull-up bar; close hammer/neutral grip; hollow body pelvis lock; pull chin over bar.',
                  videoUrl: 'https://www.youtube.com/results?search_query=close%20grip%20chin%20up%20proper%20form',
                  targetFocus: 'Neutral-Grip Vertical Pull Strength & Biceps Synergist',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable neutral-grip pulldown',
                  formCue: 'Attach V-bar to high pulley; pull to upper chest keeping ribs exhaled down.',
                  videoUrl: 'https://www.youtube.com/results?search_query=v%20bar%20lat%20pulldown%20proper%20form',
                  targetFocus: 'Continuous Tension Close-Grip Lat Pull',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'assisted close-grip pull-up',
                  formCue: 'Knees on counterweight pad; pull chin over handles with 1s pause at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=assisted%20pull%20up%20neutral%20grip%20proper%20form',
                  targetFocus: 'Counterbalanced Vertical Pull Mechanics',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'incline dumbbell hammer curl',
                  formCue: 'Bench at 60°; arms hanging straight down; curl with thumbs pointed up.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline%20dumbbell%20hammer%20curl%20proper%20form',
                  targetFocus: 'Brachialis & Biceps Long Head Recruitment',
                },
              ],
            },
            // Exercise 2: pull-up (0651) - 5s negatives
            {
              id: `${weekId}_d5_ep2`,
              exerciseId: 'ex_0651',
              exerciseName: 'pull-up',
              sets: standardSets,
              warmupSets: 0,
              targetWeightKg: 0,
              repRangeLow: 2,
              repRangeHigh: 2,
              rirScheme: isDeload ? [3, 4] : [2, 2, 2],
              restSeconds: 60,
              loadGuidance: 'WIDE-GRIP 5-SECOND NEGATIVES: Step onto chair into top of wide overhand pull-up, depress shoulders down away from ears, tuck pelvis flat, and lower over 5 slow seconds.',
              formCueText: 'WIDE-GRIP 5-SECOND NEGATIVES: Step onto chair into top of wide overhand pull-up, depress shoulders down away from ears, tuck pelvis flat, and lower over 5 slow seconds.',
              videoUrl: 'https://www.youtube.com/results?search_query=pull%20up%20negatives%20proper%20form',
              targetMuscleGroups: ['Lats', 'Lower Traps', 'Upper Back'],
              selectedEquipment: 'bodyweight',
              equipmentVariations: [
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'pull-up (5s eccentric negatives)',
                  formCue: 'Step off chair with chin above bar in wide overhand grip; lower over 5 slow seconds.',
                  videoUrl: 'https://www.youtube.com/results?search_query=pull%20up%20negatives%20proper%20form',
                  targetFocus: 'Unlocks 0-Rep Wide Grip via Lower-Trap Eccentric Overload',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'wide-grip lat pulldown',
                  formCue: 'Overhand wide grip; 1s scapular depression pause before elbow bend.',
                  videoUrl: 'https://www.youtube.com/results?search_query=wide%20grip%20lat%20pulldown%20proper%20form',
                  targetFocus: 'Wide-Grip Scapular Depression Mechanics',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'assisted wide-grip pull-up',
                  formCue: 'Counterbalanced platform; wide grip; pull until chin clears bar smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=assisted%20wide%20grip%20pull%20up%20proper%20form',
                  targetFocus: 'Machine-Assisted Wide Pull Progression',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'chest-supported dumbbell wide row',
                  formCue: 'Prone on 30° bench; pull dumbbells wide with overhand grip leading with elbows.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest%20supported%20wide%20dumbbell%20row%20proper%20form',
                  targetFocus: 'Lower Trap & Rhomboid Scapular Retraction',
                },
              ],
            },
            // Exercise 3: push-up (0662) - Blue Slots
            {
              id: `${weekId}_d5_ep3`,
              exerciseId: 'ex_0662',
              exerciseName: 'push-up',
              sets: 2,
              warmupSets: 0,
              targetWeightKg: 0,
              repRangeLow: 8,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : [2, 2],
              restSeconds: 60,
              loadGuidance: 'COLOR BOARD (BLUE CHEST SLOTS + SERRATUS PLUS): Squeeze glutes and tuck tailbone under (anti-arch plank); push +2cm extra at top to protract shoulder blades.',
              formCueText: 'COLOR BOARD (BLUE CHEST SLOTS + SERRATUS PLUS): Squeeze glutes and tuck tailbone under (anti-arch plank); push +2cm extra at top to protract shoulder blades.',
              videoUrl: 'https://www.youtube.com/results?search_query=push%20up%20board%20proper%20form',
              targetMuscleGroups: ['Chest', 'Serratus Anterior', 'Triceps', 'Core'],
              selectedEquipment: 'bodyweight',
              equipmentVariations: [
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'push-up (blue chest slots + serratus plus)',
                  formCue: 'Hands locked in blue slots; rigid glute/pelvic plank; extra protraction push at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=push%20up%20board%20chest%20proper%20form',
                  targetFocus: 'Closed-Chain Sternal Chest & Serratus Anterior Activation',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever chest press',
                  formCue: 'Seated neutral chest press; lower under 3s control; full extension.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20chest%20press%20proper%20form',
                  targetFocus: 'Machine Chest Hypertrophy',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'flat dumbbell floor press',
                  formCue: 'Lie on floor; press dumbbells up; floor stops elbow hyperextension.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20floor%20press%20proper%20form',
                  targetFocus: 'Shoulder-Safe Free Weight Pushing',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable standing chest press',
                  formCue: 'Handles at chest level; press forward in locked athletic stance.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20chest%20press%20proper%20form',
                  targetFocus: 'Continuous Cable Chest Tension',
                },
              ],
            },
            // Exercise 4: push-up (0662) - Red/Green Slots
            {
              id: `${weekId}_d5_ep4`,
              exerciseId: 'ex_0662',
              exerciseName: 'push-up',
              sets: 2,
              warmupSets: 0,
              targetWeightKg: 0,
              repRangeLow: 8,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : [2, 2],
              restSeconds: 60,
              loadGuidance: 'COLOR BOARD (RED SHOULDER OR GREEN TRICEPS SLOTS): Closed-chain floor stability removes all left-arm wobble while building pressing strength.',
              formCueText: 'COLOR BOARD (RED SHOULDER OR GREEN TRICEPS SLOTS): Closed-chain floor stability removes all left-arm wobble while building pressing strength.',
              videoUrl: 'https://www.youtube.com/results?search_query=push%20up%20board%20shoulders%20triceps%20proper%20form',
              targetMuscleGroups: ['Shoulders', 'Triceps', 'Front Delts', 'Core'],
              selectedEquipment: 'bodyweight',
              equipmentVariations: [
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'push-up (red shoulder / green triceps slots)',
                  formCue: 'Hands in red shoulder or green triceps slots; rigid anti-arch plank; elbows tracking board angle.',
                  videoUrl: 'https://www.youtube.com/results?search_query=push%20up%20board%20shoulders%20triceps%20proper%20form',
                  targetFocus: 'Floor Closed-Chain Shoulder & Tricep Stability',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever incline chest press',
                  formCue: 'Sit with back flat; press upward along machine track.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20incline%20chest%20press%20proper%20form',
                  targetFocus: 'Upper Chest & Front Delt Pushing',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated dumbbell overhead press',
                  formCue: 'Sit tall with back supported; press dumbbells overhead in neutral grip.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20dumbbell%20overhead%20press%20proper%20form',
                  targetFocus: 'Free Weight Deltoid Mass',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable overhead triceps extension',
                  formCue: 'Rope from high/mid pulley; extend overhead keeping elbows pinned close.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20overhead%20tricep%20extension%20proper%20form',
                  targetFocus: 'Long-Head Triceps Overload',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // SUNDAY (DAY 7): REST & WEEKLY ADHERENCE CHECKPOINT
    // ----------------------------------------------------
    {
      id: `${weekId}_d6`,
      weekId,
      dayOfWeek: 6,
      label: 'Sunday: Rest & Weekly Adherence Checkpoint',
      isRestDay: true,
      morningRoutine: morningAlignmentDrills,
      nutrition: restDayNutrition,
      blocks: [],
    },
  ];
}

// ==========================================
// 5. MASTER 16-WEEK PROGRAM FACTORY
// ==========================================

export function generateMaster16WeekProgram(): Program {
  const startDate = new Date();
  // Start on Monday of current week
  const day = startDate.getDay();
  const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
  startDate.setDate(diff);
  const startStr = toLocalDateString(startDate);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 16 * 7 - 1);
  const endStr = toLocalDateString(endDate);

  const programId = 'prog_master_16w_custom_360_vfinal';

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
    title: 'The Definitive 16-Week Custom 360° Protocol (Gym + Home Bar/Board + 480 Daily Stairs + Sleep/Drive Ergonomics)',
    startDate: startStr,
    endDate: endStr,
    durationWeeks: 16,
    status: 'published',
    version: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    daily24HourRhythm: {
      wakeUp0730: "300ml water + 30s Hollow-Body Scapular Hang on Home Pull-Up Bar (5 straight-arm depressions x 2s) + 60s Supine Windshield Wipers + 60s Standing Glute Squeeze & Y-Reach",
      commuteDriving: "2.5h/day (75m AM + 75m PM): Seat reclined 105 deg, hips level/above knees, rolled towel at sacrum, hands at 4 & 8 o'clock, left foot on dead pedal, 20s Standing Hip Extension upon exiting car",
      officeStairs: "24 floors/day Mon-Fri (3+3+3+5+5+5 up = 480 steps/day, elevator down): Plant whole foot flat, keep ribs stacked over pelvis, drive through heel and squeeze glutes",
      preSleep2245: "45s/side Bed-Edge Hip-Flexor Release + 5/side Open-Book Thoracic Rotations + 3-Point Anchor Nest (bottom scapula tucked back, heavy front body pillow supporting top arm & top knee/shin)"
    },
    weeks,
  };
}

// Backward-compatible aliases
export const generateMaster12WeekProgram = generateMaster16WeekProgram;
export const masterTransformationProgram = generateMaster16WeekProgram();

// ==========================================
// 6. SUPPLEMENTS & HYDRATION
// ==========================================

export const masterSupplementProtocols: SupplementProtocol[] = [
  {
    id: 'sp_creatine_master',
    programId: 'prog_master_16w_custom_360_vfinal',
    name: 'Creatine Monohydrate',
    category: 'performance',
    phases: [
      {
        phaseIndex: 1,
        name: 'Nightly Maintenance (5g/day with dinner)',
        startDay: 1,
        endDay: 112,
        doses: [
          {
            id: 'sp_cr_main_d1',
            doseOrder: 1,
            amount: 5.0,
            unit: 'g',
            timingType: 'meal_linked',
            mealLabel: '21:00 Evening Dinner',
            targetTime: '21:00',
            notes: 'Taken beside dinner plate; no loading phase to prevent BIA scale water inflation confound.',
          },
        ],
      },
    ],
  },
  {
    id: 'sp_dinner_foundation',
    programId: 'prog_master_16w_custom_360_vfinal',
    name: 'The Unified Dinner Stack (D3, Magnesium Bisglycinate, Omega-3)',
    category: 'health',
    phases: [
      {
        phaseIndex: 1,
        name: 'Nightly Recovery Baseline Foundation',
        startDay: 1,
        endDay: 112,
        doses: [
          {
            id: 'sp_d3_d1',
            doseOrder: 1,
            amount: 2000,
            unit: 'IU',
            timingType: 'meal_linked',
            mealLabel: '21:00 Evening Dinner',
            targetTime: '21:00',
            notes: 'Vitamin D3 (2,000 IU/day): Delay starting until after Week 1 baseline blood draw. Absorbed with dinner olive oil.',
          },
          {
            id: 'sp_omega3_d1',
            doseOrder: 2,
            amount: 1250,
            unit: 'mg',
            timingType: 'meal_linked',
            mealLabel: '21:00 Evening Dinner',
            targetTime: '21:00',
            notes: 'Omega-3 Fish Oil (1,250mg EPA/DHA) for systemic recovery and joint health.',
          },
          {
            id: 'sp_mag_d1',
            doseOrder: 3,
            amount: 300,
            unit: 'mg',
            timingType: 'meal_linked',
            mealLabel: '21:00 Evening Dinner',
            targetTime: '21:00',
            notes: 'Magnesium Bisglycinate (300mg) for neuromuscular relaxation and deep sleep architecture.',
          },
        ],
      },
    ],
  },
];

// Hydration Architecture: 3.5 Liters base + 500ml workout bonus
export const masterHydrationGoal: HydrationGoal = {
  id: 'hg_trainee_alaa',
  programId: 'prog_master_16w_custom_360_vfinal',
  traineeId: 'trainee_alaa',
  dailyTargetMl: 3500,
  workoutDayBonusMl: 500,
};

// Seed 14-day weight milestones for Alaa baseline at 51.8 kg
export const seedMetricsAlaa: BodyMetricEntry[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  const baseWeight = 51.5;
  const gain = (i * (0.3 / 13)); // Climbs smoothly to exactly 51.8 kg baseline
  return {
    id: `m_alaa_${i + 1}`,
    traineeId: 'trainee_alaa',
    date: d.toISOString().split('T')[0],
    weightKg: Math.round((baseWeight + gain) * 10) / 10,
    source: 'manual',
  };
});
