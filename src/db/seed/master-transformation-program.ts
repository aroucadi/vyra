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

// Trainer: Alaa Pro
export const userAlaaPro: User = {
  id: 'trainer_alaa',
  role: 'trainer',
  name: 'Alaa Pro',
  email: 'coach.alaa@vyra.fit',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
  injuries: [],
  goals: ['Guide athletes through periodized kinetic transformation'],
};

// Trainee: Alaa (Baseline Weight 51.8 kg | BMI 17.3 | Height 173 cm)
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
  ],
  goals: [
    '12-Week Hypertrophy Surplus: Baseline 51.8 kg -> Week 12 Target 55.0 kg (+0.20 to +0.40 kg/week)',
    'Universal Double Progression on All 24 openGym Catalogue-Locked Exercises',
    'The 45–50 Minute Midday Clock Guardrail (12:00–13:30 block)',
    'Long-Term Transformation Target: 63.5 kg lean mass milestone',
  ],
  hideWeightFromTrainee: false,
};

export const linkAlaa: TrainerLink = {
  trainerId: 'trainer_alaa',
  traineeId: 'trainee_alaa',
  status: 'active',
  createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
};

// ==========================================
// 2. DAILY 8-MINUTE WARM-UP & ERGONOMICS
// ==========================================

export const morningAlignmentDrills: string[] = [
  'Wall Slides with Chin Tuck (2 mins — 2 x 10 reps): Back and head against wall, keep shoulders depressed down away from ears, slide forearms smoothly up and down.',
  'Incline Bench Push-Up Plus (2 mins — 2 x 10 reps): Hands on bench backrest, elbows straight; push torso away at the top for 2 seconds to move the shoulder blades through full protraction.',
  'Glute Bridge (2 mins — 2 x 12 reps): Lie on mat with knees bent; brace abs, squeeze glutes for 2 seconds at the top.',
  '5-Second Exhale Dead Bug (2 mins — 2 x 6 reps/side): Press lower back flat into mat; extend opposite arm and leg slowly while exhaling fully for 5 seconds to engage the abdominal wall.',
];

export const workdayErgonomicsRoutines: string[] = [
  'The Car Mirror Biofeedback Anchor (65-min Commute): Adjust rear-view mirror 1 cm higher sitting upright with skull touching headrest. Slouching causes loss of rear visibility as biofeedback.',
  'The Hourly Stand & Squeeze (Office): Stand up every 60 min, unlock knees, shift 60% weight to heels, squeeze glutes 5s, 2 diaphragmatic breaths, sit on sit bones.',
  'Post-Lunch Walk (14:00 – 14:15): 10–15 minutes relaxed outdoor walk to aid gastric emptying and glucose partitioning.',
  'The Desk-Drawer Fuel Protocol (11:45): 35g dates (~3 medium) or 1 small banana + 250ml water for rapid low-fat glycogen without gut fullness.',
];

// ==========================================
// 3. NUTRITION: 2-WEEK RAMP & WEEKS 3-12 SURPLUS
// ==========================================

// Monday Schedule (Gym + 19:15 Football Match Add-On: 3,000 kcal | 164g P [Wk 1-2: 2,750 kcal | 151g P])
export const mondayDailyMeals: DailyMealSlot[] = [
  {
    time: '08:00',
    label: 'Commute Snack',
    foods: '50g dates (~5 medium Ajwa/Deglet Nour) [140 kcal] + 25g raw almonds [160 kcal]',
    supplements: 'None',
    rationale: 'Friction-free commute fuel; potassium & clean low-GI carbohydrates.',
    calories: 300,
    proteinGrams: 7,
  },
  {
    time: '10:30',
    label: 'Homemade Shake — Serving 1',
    foods: 'Half of daily blender batch: 175 ml lactose-free whole milk [110 kcal], 30g oats [115 kcal], 15g Whey Isolate [58 kcal], 15g peanut butter [90 kcal], 60g banana [52 kcal]',
    supplements: 'None',
    rationale: 'Low-osmolarity liquid meal for easy digestion and sustained amino acid delivery.',
    calories: 425,
    proteinGrams: 27,
  },
  {
    time: '11:45',
    label: 'Pre-Gym Desk Snack',
    foods: '35g dates (~3 medium) or 1 small banana + 250 ml water',
    supplements: 'None',
    rationale: 'Rapid low-fat carbohydrates 15 minutes before 12:00 training session.',
    calories: 100,
    proteinGrams: 1,
  },
  {
    time: '13:35',
    label: 'Post-Gym Lunch',
    foods: '220g cooked white rice/pasta [290 kcal] + 150g raw (115g cooked) chicken breast/fish [250 kcal] + 150g cooked vegetables [50 kcal] + 15g (1 tbsp) olive oil [160 kcal]',
    supplements: 'None',
    rationale: 'Post-workout solid whole-food anabolic recovery meal followed by relaxed walking.',
    calories: 750,
    proteinGrams: 42,
  },
  {
    time: '16:30',
    label: 'Homemade Shake — Serving 2',
    foods: 'Second half of daily blender batch (175ml milk, 30g oats, 15g whey isolate, 15g peanut butter, 60g banana)',
    supplements: 'None',
    rationale: 'Second shake serving ensures caloric density without digestive fatigue.',
    calories: 425,
    proteinGrams: 27,
  },
  {
    time: '16:30',
    label: 'Monday Football Pre-Match Add-On (+200 kcal)',
    foods: '50g (2 slices) white toast [135 kcal] + 20g (1 tbsp) honey [65 kcal]',
    supplements: 'None',
    rationale: 'High glycemic index carbohydrate top-off 2.75 hours before 19:15 kickoff.',
    calories: 200,
    proteinGrams: 4,
  },
  {
    time: '19:15',
    label: 'Indoor 5-a-Side Football Match (60 Mins)',
    foods: '750 ml water sipped during match',
    supplements: 'None',
    rationale: 'Match burns ~500–600 kcal. Lower body preserved from midday gym session.',
    calories: 0,
    proteinGrams: 0,
  },
  {
    time: '20:30',
    label: 'Monday Football Post-Match Recovery (+200 kcal)',
    foods: '25g Whey Isolate [95 kcal, 21g P] + 30g dextrose or 35g honey [105 kcal] in water',
    supplements: 'None',
    rationale: 'Halts exercise-induced muscle protein breakdown and rapidly initiates muscle glycogen resynthesis.',
    calories: 200,
    proteinGrams: 21,
  },
  {
    time: '21:30',
    label: 'Evening Dinner + THE UNIFIED DINNER STACK',
    foods: '180g cooked rice/potatoes [230 kcal] + 130g raw lean beef/poultry/fish [240 kcal] + vegetables with 10g (2 tsp) olive oil [130 kcal]',
    supplements: 'Creatine Monohydrate (5g) + Vitamin D3 (2,000 IU) + Magnesium Bisglycinate (300mg) + Omega-3 (1,250mg)',
    rationale: '100% of supplements beside dinner plate. Zero daytime remembering. Creatine at night completely out of pre-match window.',
    calories: 600,
    proteinGrams: 35,
  },
  {
    time: '23:30',
    label: 'Sleep (8 Hours)',
    foods: 'Plain water as needed',
    supplements: 'None (Taken with dinner)',
    rationale: 'Deep parasympathetic sleep recovery supported by dinner magnesium bisglycinate.',
    calories: 0,
    proteinGrams: 0,
  },
];

// Standard Training Days (Tuesday – Thursday: 2,600 kcal | 139g P [Wk 1-2: 2,350 kcal | 130g P])
export const standardDailyMeals: DailyMealSlot[] = [
  {
    time: '08:00',
    label: 'Commute Snack',
    foods: '50g dates [140 kcal] + 25g raw almonds [160 kcal]',
    supplements: 'None',
    rationale: 'Clean energy on morning commute.',
    calories: 300,
    proteinGrams: 7,
  },
  {
    time: '10:30',
    label: 'Homemade Shake — Serving 1',
    foods: 'Half of daily blender batch (175ml lactose-free milk, 30g oats, 15g whey isolate, 15g peanut butter, 60g banana)',
    supplements: 'None',
    rationale: 'Mid-morning liquid calories for steady anabolic support.',
    calories: 425,
    proteinGrams: 27,
  },
  {
    time: '11:45',
    label: 'Pre-Gym Desk Snack',
    foods: '35g dates (~3 medium) or 1 small banana + 250 ml water',
    supplements: 'None',
    rationale: 'Pre-gym fast-digesting carbohydrates for midday lifting energy.',
    calories: 100,
    proteinGrams: 1,
  },
  {
    time: '13:35',
    label: 'Post-Gym Lunch',
    foods: '220g cooked rice/pasta [290 kcal] + 150g raw (115g cooked) chicken/fish [250 kcal] + vegetables [50 kcal] + 15g olive oil [160 kcal]',
    supplements: 'None',
    rationale: 'Post-workout anabolic foundation.',
    calories: 750,
    proteinGrams: 42,
  },
  {
    time: '16:30',
    label: 'Homemade Shake — Serving 2',
    foods: 'Second half of daily blender batch',
    supplements: 'None',
    rationale: 'Afternoon shake closes caloric gap efficiently.',
    calories: 425,
    proteinGrams: 27,
  },
  {
    time: '21:30',
    label: 'Evening Dinner + THE UNIFIED DINNER STACK',
    foods: '180g cooked rice/potatoes [230 kcal] + 130g raw lean meat/fish [240 kcal] + vegetables with 10g olive oil [130 kcal]',
    supplements: 'Creatine Monohydrate (5g) + Vitamin D3 (2,000 IU) + Magnesium Bisglycinate (300mg) + Omega-3 (1,250mg)',
    rationale: 'Unified dinner stack beside dinner plate; fat-soluble vitamins absorbed with evening olive oil.',
    calories: 600,
    proteinGrams: 35,
  },
  {
    time: '23:30',
    label: 'Sleep (8 Hours)',
    foods: 'Plain water as needed',
    supplements: 'None',
    rationale: 'Neuromuscular sleep recovery.',
    calories: 0,
    proteinGrams: 0,
  },
];

// Friday – Sunday Schedule (The Weekend Anchor Protocol: 2,600 kcal | 139g P)
export const weekendDailyMeals: DailyMealSlot[] = [
  {
    time: '09:00',
    label: 'Wake Up + Hydration',
    foods: '500 ml plain water',
    supplements: 'None',
    rationale: 'Weekend morning hydration.',
    calories: 0,
    proteinGrams: 0,
  },
  {
    time: '10:00',
    label: 'Weekend Brunch',
    foods: '3 Whole Eggs + 2 Slices Toasted Bread + 1 Avocado / Butter [550 kcal, 25g P]',
    supplements: 'None',
    rationale: 'High-quality fats and bioavailable protein.',
    calories: 550,
    proteinGrams: 25,
  },
  {
    time: '13:30',
    label: 'Solid Lunch',
    foods: 'Rice/Pasta + Ground Beef/Chicken/Fish + Vegetables + Olive Oil [750 kcal, 42g P]',
    supplements: 'None',
    rationale: 'Whole-food weekend nutrition.',
    calories: 750,
    proteinGrams: 42,
  },
  {
    time: '16:30',
    label: 'Weekend Anchor Shake',
    foods: 'Full-batch digestive shake consumed across afternoon [700 kcal, 37g P]',
    supplements: 'None',
    rationale: 'Mandatory weekend anchor shake so total weekly caloric surplus never drops into a deficit.',
    calories: 700,
    proteinGrams: 37,
  },
  {
    time: '21:00',
    label: 'Family Dinner + UNIFIED PILL STACK',
    foods: 'Balanced solid meal + salad with 1–2 tbsp Olive Oil [600 kcal, 35g P]',
    supplements: 'Creatine Monohydrate (5g) + Vitamin D3 (2,000 IU) + Magnesium Bisglycinate (300mg) + Omega-3 (1,250mg)',
    rationale: 'Unified dinner stack beside dinner plate.',
    calories: 600,
    proteinGrams: 35,
  },
  {
    time: '23:30',
    label: 'Sleep',
    foods: 'Plain water as needed',
    supplements: 'None',
    rationale: 'Restorative tissue rebuilding.',
    calories: 0,
    proteinGrams: 0,
  },
];

export const restDayDailyMeals: DailyMealSlot[] = weekendDailyMeals;
export const masterDailyMeals = standardDailyMeals;

// Monday Match Day Nutrition Prescription (3,000 kcal | 164g Protein)
export const mondayNutrition: MealPlanPrescription = {
  targetKcal: 3000,
  targetProteinGrams: 160,
  preWorkoutTiming: '11:45 Desk Snack & 16:30 Pre-Football Toast/Honey',
  preWorkoutFoods: '11:45: 35g dates or banana | 16:30: 50g toast + 20g honey (+200 kcal)',
  supplements: [
    {
      name: 'Unified Dinner Stack',
      dosage: 'Creatine 5g, Vitamin D3 2,000 IU, Magnesium Bisglycinate 300mg, Omega-3 1,250mg',
      timing: '21:30 Dinner (completely outside pre-football window)',
    },
  ],
  dailyMeals: mondayDailyMeals,
  notes: 'Monday Match Day Caloric Compensation: 3,000 kcal / 164g Protein (Wk 1-2 Ramp: 2,750 kcal). Post-match 20:30 Whey + Dextrose halts catabolism.',
};

// Standard Training Day Nutrition Prescription (2,600 kcal | 139g Protein)
export const workoutDayNutrition: MealPlanPrescription = {
  targetKcal: 2600,
  targetProteinGrams: 139,
  preWorkoutTiming: '11:45 Pre-Gym Desk Snack (15 min prior to gym)',
  preWorkoutFoods: '35g dates (~3 medium) or 1 small banana (100 kcal)',
  supplements: [
    {
      name: 'Unified Dinner Stack',
      dosage: 'Creatine 5g, Vitamin D3 2,000 IU, Magnesium Bisglycinate 300mg, Omega-3 1,250mg',
      timing: '21:30 Dinner',
    },
  ],
  dailyMeals: standardDailyMeals,
  notes: 'Standard Training Days (Tue–Thu): 2,600 kcal / 139g Protein (Wk 1-2 Ramp: 2,350 kcal). Low-osmolarity digestive shake prevents bloating.',
};

export const restDayNutrition: MealPlanPrescription = {
  targetKcal: 2600,
  targetProteinGrams: 139,
  preWorkoutTiming: 'Weekend Recovery Anchor (Fri–Sun)',
  preWorkoutFoods: 'Whole-food meals + Afternoon Digestive Shake',
  supplements: [
    {
      name: 'Unified Dinner Stack',
      dosage: 'Creatine 5g, Vitamin D3 2,000 IU, Magnesium Bisglycinate 300mg, Omega-3 1,250mg',
      timing: '21:00 Dinner',
    },
  ],
  dailyMeals: weekendDailyMeals,
  notes: 'Weekend Anchor Protocol: Mandatory afternoon digestive shake protects the weekly caloric surplus from dropping into a deficit.',
};

// ==========================================
// 4. THE 24 CATALOGUE EXERCISE BLUEPRINT
// ==========================================

export function createBlueprintDays(weekId: string, weekIndex: number = 1): ProgramDay[] {
  // Volume periodization:
  // Weeks 1-2: 2 working sets (Acclimation Ramp)
  // Weeks 3-6: 3 working sets (Accumulation Block 1)
  // Week 7: 2 working sets, deload (-10% load, 3-4 RIR)
  // Weeks 8-11: 3 working sets (Accumulation Block 2)
  // Week 12: 2 working sets, checkpoint & deload
  const isRamp = weekIndex <= 2;
  const isDeload = weekIndex === 7 || weekIndex === 12;
  const standardSets = (isRamp || isDeload) ? 2 : 3;

  return [
    // ----------------------------------------------------
    // MONDAY (DAY 1): PUSH, REAR DELT, TRICEPS & ABS
    // Leaves lower body 100% fresh for 19:15 football match.
    // ----------------------------------------------------
    {
      id: `${weekId}_d0`,
      weekId,
      dayOfWeek: 0,
      label: 'Monday: Push, Rear Delt, Triceps & Abs',
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
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 90,
              loadGuidance: 'Warm-up: 2 sets (50% x 8, 75% x 4). Double progression: advance load (+1 pin or +1.25-2.5kg) only when all sets hit 10 reps.',
              formCueText: 'Align handles with upper chest. Keep shoulders down away from ears; lower over 3s.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever+incline+chest+press+form',
              targetMuscleGroups: ['Upper Chest', 'Pectorals', 'Front Deltoids', 'Triceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever incline chest press',
                  formCue: 'Align handles with upper chest; 3s lowering phase; full stretch without shoulder shrug.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+incline+chest+press+form',
                  targetFocus: 'Clavicular Upper Chest Shelf',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'incline cable chest press',
                  formCue: 'Set pulleys low behind bench; press handles up in natural arc converging at eye level.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline+cable+chest+press+form',
                  targetFocus: 'Continuous Tension Upper Chest',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: '30° incline dumbbell press',
                  formCue: 'Set bench to 30°; wrists over elbows; press dumbbells smoothly without clanging.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline+dumbbell+press+proper+form',
                  targetFocus: 'Free Weight Clavicular Hypertrophy',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'feet-elevated decline push-ups',
                  formCue: 'Feet elevated on bench; lower upper chest smoothly; protract shoulder blades at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=decline+push+ups+proper+form',
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
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 90,
              loadGuidance: '0 warm-up sets (chest warmed up from #1). Double progression across all working sets.',
              formCueText: 'Use neutral/vertical handles if available. Keep upper back flat against pad; 3s lowering phase.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever+chest+press+machine+form',
              targetMuscleGroups: ['Chest', 'Pectorals', 'Triceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever chest press',
                  formCue: 'Keep upper back flat against pad; drive through sternum; 3s eccentric return.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+chest+press+machine+form',
                  targetFocus: 'Mid-Sternal Pectoral Mass',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable seated chest press',
                  formCue: 'Sit upright against pad; press cable handles forward converging at mid-chest.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+seated+chest+press+form',
                  targetFocus: 'Direct Sternal Contraction',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'flat dumbbell bench press',
                  formCue: 'Plant feet flat; retract scapulae; press in gentle inward arc.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+bench+press+form',
                  targetFocus: 'Sternal Pec Activation',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'standard push-ups',
                  formCue: 'Hands shoulder-width; core braced; full lockout with serratus protraction.',
                  videoUrl: 'https://www.youtube.com/results?search_query=push+ups+proper+form',
                  targetFocus: 'Horizontal Push Baseline',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d0_b2`,
          order: 2,
          type: 'superset',
          tag: 'Superset A',
          bannerText: 'Superset A: Rear Delts & Triceps (0s Inter-Exercise / 60s Inter-Set)',
          exercises: [
            // Exercise 3: lever seated reverse fly (0602) [Superset A1]
            {
              id: `${weekId}_d0_ep3`,
              exerciseId: 'ex_0602',
              exerciseName: 'lever seated reverse fly',
              sets: standardSets,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 0,
              subMovementOrder: '3A',
              supersetTag: 'A',
              interSetRestSeconds: 0,
              loadGuidance: '0 warm-up sets. Double progression: 12–15 reps. Go immediately to #4 cable pushdown without resting.',
              formCueText: 'Sit facing pad with seat 1 notch high so shoulders stay depressed. Sweep arms back smoothly.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever+seated+reverse+fly+form',
              targetMuscleGroups: ['Rear Delts', 'Upper Back', 'Rhomboids'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated reverse fly',
                  formCue: 'Depress shoulders down; sweep handles back keeping elbows soft; 1s peak contraction.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+seated+reverse+fly+form',
                  targetFocus: 'Rear Deltoid & Posture Reset',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable standing rear delt row (with rope)',
                  formCue: 'Rope at chin height; pull rope ends apart toward forehead.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+rear+delt+row+rope+form',
                  targetFocus: 'Rear Delts & Rhomboids',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'prone dumbbell rear delt fly',
                  formCue: 'Chest against 30° incline bench; raise dumbbells out in wide T-arc.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline+rear+delt+fly+form',
                  targetFocus: 'Posterior Shoulder Head Isolation',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'prone floor rear delt raise',
                  formCue: 'Lie prone; thumbs up; sweep arms back squeezing posterior deltoids.',
                  videoUrl: 'https://www.youtube.com/results?search_query=prone+t+raises+form',
                  targetFocus: 'Scapular Retraction & Rear Delt Burn',
                },
              ],
            },
            // Exercise 4: cable pushdown (with rope attachment) (0200) [Superset A2]
            {
              id: `${weekId}_d0_ep4`,
              exerciseId: 'ex_0200',
              exerciseName: 'cable pushdown (with rope attachment)',
              sets: standardSets,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 60,
              subMovementOrder: '3B',
              supersetTag: 'A',
              interSetRestSeconds: 60,
              loadGuidance: 'Double progression: 10–12 reps. Rest 60s after each superset round.',
              formCueText: 'Pin elbows tightly against ribs. Push rope down and spread ends apart at lockout.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable+rope+pushdown+form',
              targetMuscleGroups: ['Triceps', 'Triceps Lateral Head'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pushdown (with rope attachment)',
                  formCue: 'Elbows pinned to ribs; spread rope ends apart at bottom for peak triceps contraction.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+rope+pushdown+form',
                  targetFocus: 'Triceps Lateral & Medial Head',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever triceps dip',
                  formCue: 'Sit with back flat; press handles down smoothly until arms extend without shrugging.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine+triceps+dip+form',
                  targetFocus: 'Machine Triceps Lockout',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'overhead dumbbell triceps extension',
                  formCue: 'Hold dumbbell cup with both hands; keep elbows pointing upward; extend overhead.',
                  videoUrl: 'https://www.youtube.com/results?search_query=overhead+dumbbell+tricep+extension+form',
                  targetFocus: 'Triceps Long Head Stretch',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'bench dips',
                  formCue: 'Hands on bench edge; lower torso until elbows reach 90°; press up through palms.',
                  videoUrl: 'https://www.youtube.com/results?search_query=bench+dips+proper+form',
                  targetFocus: 'Bodyweight Triceps Lockout',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d0_b3`,
          order: 3,
          type: 'superset',
          tag: 'Superset B',
          bannerText: 'Superset B: Lateral Delts & Abs (0s Inter-Exercise / 60s Inter-Set)',
          exercises: [
            // Exercise 5: lever lateral raise (0584) [Superset B1]
            {
              id: `${weekId}_d0_ep5`,
              exerciseId: 'ex_0584',
              exerciseName: 'lever lateral raise',
              sets: standardSets,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 0,
              subMovementOrder: '4A',
              supersetTag: 'B',
              interSetRestSeconds: 0,
              loadGuidance: 'Pads resting on forearms eliminates left-arm motor wobble. Go straight to #6 lever seated crunch.',
              formCueText: 'Pads resting on elbows/forearms. Raise to shoulder level, 1s hold at peak.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever+lateral+raise+machine+form',
              targetMuscleGroups: ['Lateral Deltoids', 'Shoulders'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever lateral raise',
                  formCue: 'Pads on elbows; raise smoothly to shoulder height; 1s squeeze at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+lateral+raise+machine+form',
                  targetFocus: 'Lateral Deltoid Capping',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable lateral raise',
                  formCue: 'Low pulley behind hips; raise arm out to 80° keeping wrist relaxed.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+lateral+raise+form',
                  targetFocus: 'Continuous Lateral Tension',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell seated lateral raise',
                  formCue: 'Sit tall; raise dumbbells in scapular plane with thumbs slightly higher than pinkies.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated+dumbbell+lateral+raise+form',
                  targetFocus: 'Strict Lateral Head Overload',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'side-lying lateral deltoid raise',
                  formCue: 'Lie on side on mat; raise top arm against gravity with slow 3s eccentric.',
                  videoUrl: 'https://www.youtube.com/results?search_query=side+lying+lateral+raise+form',
                  targetFocus: 'Side Delt Isometric Control',
                },
              ],
            },
            // Exercise 6: lever seated crunch (0595) [Superset B2]
            {
              id: `${weekId}_d0_ep6`,
              exerciseId: 'ex_0595',
              exerciseName: 'lever seated crunch',
              sets: standardSets,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 60,
              subMovementOrder: '4B',
              supersetTag: 'B',
              interSetRestSeconds: 60,
              loadGuidance: 'Double progression: 12–15 reps. Rest 60s after each superset round.',
              formCueText: 'Exhale fully as you flex your ribcage down toward your pelvis. Control return for 3s.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever+seated+crunch+machine+form',
              targetMuscleGroups: ['Abs', 'Rectus Abdominis', 'Core'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated crunch',
                  formCue: 'Exhale and curl ribcage down toward pelvis; avoid pulling with arms; 3s eccentric return.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+seated+crunch+machine+form',
                  targetFocus: 'Rectus Abdominis Flexion',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable kneeling crunch',
                  formCue: 'Kneel holding rope beside ears; crunch ribcage into hips with full exhalation.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+kneeling+crunch+form',
                  targetFocus: 'Loaded Abdominal Flexion',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'weighted sit-up',
                  formCue: 'Hold small plate or dumbbell across chest; roll spine off floor vertebrae by vertebrae.',
                  videoUrl: 'https://www.youtube.com/results?search_query=weighted+sit+up+proper+form',
                  targetFocus: 'Loaded Core Flexion',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'floor dead bug with exhale',
                  formCue: 'Lower back glued to mat; extend opposite arm and leg while exhaling for 5 seconds.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dead+bug+proper+form',
                  targetFocus: 'Deep Anterior Core Stability',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // TUESDAY (DAY 2): PULL, BICEPS & FOREARMS (100% Seated / Supported)
    // 17 hours after Monday football. Zero lower-body or spinal loading.
    // ----------------------------------------------------
    {
      id: `${weekId}_d1`,
      weekId,
      dayOfWeek: 1,
      label: 'Tuesday: Pull, Biceps & Forearms (100% Seated / Supported)',
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
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 90,
              loadGuidance: 'Warm-up: 2 sets (50% x 8, 75% x 4). Double progression: advance load when hitting 10 reps across all sets.',
              formCueText: 'Use neutral/parallel grip handle. Depress shoulders down first, then pull elbows to ribs.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable+lat+pulldown+form',
              targetMuscleGroups: ['Lats', 'Upper Back', 'Biceps'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pulldown',
                  formCue: 'Neutral grip; depress scapulae down first; pull elbows toward lower ribs; 3s eccentric.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+lat+pulldown+form',
                  targetFocus: 'Lat Width & Scapular Depression',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever front pulldown',
                  formCue: 'Sit with thighs locked; pull handles down toward upper chest with 1s peak squeeze.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+front+pulldown+form',
                  targetFocus: 'Guided Lat Contraction',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'cross-bench dumbbell pullover',
                  formCue: 'Upper back across flat bench; lower dumbbell over head for deep lat stretch.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+pullover+form',
                  targetFocus: 'Lengthened Lat Hypertrophy',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'pull-up (or band-assisted)',
                  formCue: 'Full hang; depress shoulders down away from ears; pull chest to bar.',
                  videoUrl: 'https://www.youtube.com/results?search_query=pull+ups+proper+form',
                  targetFocus: 'Vertical Pulling Strength',
                },
              ],
            },
            // Exercise 2: lever seated row (0603)
            {
              id: `${weekId}_d1_ep2`,
              exerciseId: 'ex_0603',
              exerciseName: 'lever seated row',
              sets: standardSets,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 90,
              loadGuidance: '0 warm-up sets (back already warm from #1). Chest supported against pad eliminates lower-back strain.',
              formCueText: 'Chest supported against pad. Pull handles toward lower ribs and pause 1s at peak contraction.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever+seated+row+form',
              targetMuscleGroups: ['Upper Back', 'Rhomboids', 'Lats', 'Biceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated row',
                  formCue: 'Chest pressed to pad; pull elbows back; squeeze shoulder blades together for 1s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+seated+row+form',
                  targetFocus: 'Upper Back Density & Posture',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable straight back seated row',
                  formCue: 'Sit tall with knees soft; pull handle to lower stomach keeping spine neutral.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated+cable+row+form',
                  targetFocus: 'Horizontal Cable Row Retraction',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'chest-supported dumbbell row',
                  formCue: 'Prone on 45° incline bench; pull dumbbells up toward hips with elbows flared 45°.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest+supported+dumbbell+row+form',
                  targetFocus: 'Zero-Spine Scapular Retraction',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'inverted row (on smith or bar)',
                  formCue: 'Heels on floor, body straight; pull chest to bar squeezing rhomboids.',
                  videoUrl: 'https://www.youtube.com/results?search_query=inverted+row+form',
                  targetFocus: 'Horizontal Bodyweight Pulling',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d1_b2`,
          order: 2,
          type: 'superset',
          tag: 'Superset A',
          bannerText: 'Superset A: Rear Delts & Biceps (0s Inter-Exercise / 60s Inter-Set)',
          exercises: [
            // Exercise 3: cable standing rear delt row (with rope) (0220) [Superset A1]
            {
              id: `${weekId}_d1_ep3`,
              exerciseId: 'ex_0220',
              exerciseName: 'cable standing rear delt row (with rope)',
              sets: standardSets,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 0,
              subMovementOrder: '3A',
              supersetTag: 'A',
              interSetRestSeconds: 0,
              loadGuidance: '0 warm-up sets. Double progression: 12–15 reps. Go immediately to #4 lever preacher curl.',
              formCueText: 'Rope at chin height; pull toward forehead with thumbs rotating back. Go straight to #4.',
              videoUrl: 'https://www.youtube.com/results?search_query=standing+face+pull+rear+delt+row+rope+form',
              targetMuscleGroups: ['Rear Delts', 'Deltoids', 'Rotator Cuff'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable standing rear delt row (with rope)',
                  formCue: 'Set pulley at chin level; pull rope toward forehead rotating thumbs backward.',
                  videoUrl: 'https://www.youtube.com/results?search_query=standing+face+pull+rear+delt+row+rope+form',
                  targetFocus: 'External Rotation & Rear Delts',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated reverse fly',
                  formCue: 'Chest against pad; sweep arms back in wide horizontal plane.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+seated+reverse+fly+form',
                  targetFocus: 'Posterior Deltoid Isolation',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell face pull on incline bench',
                  formCue: 'Lie on incline bench; row dumbbells high toward ears rotating thumbs up.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+face+pull+form',
                  targetFocus: 'Rear Delts & Lower Traps',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'prone y-raise on floor',
                  formCue: 'Lie face down; thumbs to ceiling at 45° angle; lift arms off mat 2s hold.',
                  videoUrl: 'https://www.youtube.com/results?search_query=prone+y+raise+form',
                  targetFocus: 'Lower Trap & Shoulder Health',
                },
              ],
            },
            // Exercise 4: lever preacher curl (0591) [Superset A2]
            {
              id: `${weekId}_d1_ep4`,
              exerciseId: 'ex_0591',
              exerciseName: 'lever preacher curl',
              sets: standardSets,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 60,
              subMovementOrder: '3B',
              supersetTag: 'A',
              interSetRestSeconds: 60,
              loadGuidance: 'Upper arms resting flat on preacher pad eliminates left-arm motor wobble. Rest 60s.',
              formCueText: 'Upper arms resting flat on preacher pad for 100% left-arm stability. Lower over 3s.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever+preacher+curl+form',
              targetMuscleGroups: ['Biceps', 'Biceps Brachii'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever preacher curl',
                  formCue: 'Upper arms glued to pad; curl handle smoothly; 3s lowering phase to full stretch.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+preacher+curl+form',
                  targetFocus: 'Strict Biceps Isolation',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable preacher curl',
                  formCue: 'Preacher bench in front of low cable pulley; curl bar toward chin with constant tension.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+preacher+curl+form',
                  targetFocus: 'Peak Shortened Biceps Contraction',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'incline dumbbell bicep curl',
                  formCue: 'Sit on 60° incline bench; arms hanging back; curl dumbbells with palms supinated.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline+dumbbell+bicep+curl+form',
                  targetFocus: 'Long Head Biceps Stretch',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'underhand chin-up hold',
                  formCue: 'Hold top of chin-up position with palms facing you for 20–30s isometric hold.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chin+up+isometric+hold+form',
                  targetFocus: 'Isometric Biceps Overload',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d1_b3`,
          order: 3,
          type: 'superset',
          tag: 'Superset B',
          bannerText: 'Superset B: Brachialis & Forearms (0s Inter-Exercise / 60s Inter-Set)',
          exercises: [
            // Exercise 5: cable hammer curl (with rope) (0165) [Superset B1]
            {
              id: `${weekId}_d1_ep5`,
              exerciseId: 'ex_0165',
              exerciseName: 'cable hammer curl (with rope)',
              sets: standardSets,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 0,
              subMovementOrder: '4A',
              supersetTag: 'B',
              interSetRestSeconds: 0,
              loadGuidance: 'Low pulley with rope, thumbs pointing up. Go straight to #6 cable wrist curl.',
              formCueText: 'Low pulley with rope, thumbs pointing up, elbows pinned to sides. Switch handle for #6.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable+rope+hammer+curl+form',
              targetMuscleGroups: ['Biceps', 'Brachialis', 'Forearms'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable hammer curl (with rope)',
                  formCue: 'Neutral grip with thumbs up; elbows pinned to sides; curl rope toward shoulders.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+rope+hammer+curl+form',
                  targetFocus: 'Brachialis & Brachioradialis Thickness',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever bicep curl',
                  formCue: 'Sit with upper arms on pad; curl handles upward with smooth controlled cadence.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine+bicep+curl+form',
                  targetFocus: 'Machine Arm Flexion',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated dumbbell hammer curl',
                  formCue: 'Sit upright; palms facing each other; curl dumbbells simultaneously without swinging.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated+dumbbell+hammer+curl+form',
                  targetFocus: 'Brachialis & Forearm Overload',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'neutral grip body row',
                  formCue: 'Hold parallel bars or rings; curl body toward hands with neutral wrist alignment.',
                  videoUrl: 'https://www.youtube.com/results?search_query=neutral+grip+inverted+row+form',
                  targetFocus: 'Bodyweight Arm Flexion',
                },
              ],
            },
            // Exercise 6: cable wrist curl (0247) [Superset B2]
            {
              id: `${weekId}_d1_ep6`,
              exerciseId: 'ex_0247',
              exerciseName: 'cable wrist curl',
              sets: standardSets,
              repRangeLow: 15,
              repRangeHigh: 20,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 60,
              subMovementOrder: '4B',
              supersetTag: 'B',
              interSetRestSeconds: 60,
              loadGuidance: 'High-rep forearm hypertrophy (15–20 reps). Builds grip and wrist density for desk lifters.',
              formCueText: 'Sit facing low pulley with forearms flat on thighs, palms up; curl handle using wrists only.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable+wrist+curl+form',
              targetMuscleGroups: ['Forearms', 'Wrist Flexors'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable wrist curl',
                  formCue: 'Forearms flat on thighs; palms facing up; curl cable straight bar using wrist flexion only.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+wrist+curl+form',
                  targetFocus: 'Forearm Flexor Hypertrophy',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever wrist curl',
                  formCue: 'Forearms supported on machine pad; curl handles using wrist flexors with 1s squeeze.',
                  videoUrl: 'https://www.youtube.com/results?search_query=wrist+curl+machine+form',
                  targetFocus: 'Guided Forearm Flexion',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated dumbbell wrist curl',
                  formCue: 'Forearms resting on flat bench; allow dumbbells to roll into fingertips then curl up.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+wrist+curl+form',
                  targetFocus: 'Deep Wrist Flexor Stretch',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'fingertip plank hold',
                  formCue: 'Kneeling or standard plank on fingertips to build intrinsic hand and forearm strength.',
                  videoUrl: 'https://www.youtube.com/results?search_query=fingertip+plank+form',
                  targetFocus: 'Isometric Grip & Forearm Endurance',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // WEDNESDAY (DAY 3): LEGS A (QUADS, HAMS, CALVES), LAT PULLOVER & ABS
    // 40 hours after Monday football. Primary quad, hamstring, glute, and calf session.
    // ----------------------------------------------------
    {
      id: `${weekId}_d2`,
      weekId,
      dayOfWeek: 2,
      label: 'Wednesday: Legs A (Quads, Hams, Calves), Lat Pullover & Abs',
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: workoutDayNutrition,
      blocks: [
        {
          id: `${weekId}_d2_b1`,
          order: 1,
          type: 'straight',
          bannerText: 'Primary Lower Compounds (40h Post-Football: 90s/75s Rest)',
          exercises: [
            // Exercise 1: sled 45° leg press (0739)
            {
              id: `${weekId}_d2_ep1`,
              exerciseId: 'ex_0739',
              exerciseName: 'sled 45° leg press',
              sets: standardSets,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 90,
              loadGuidance: 'Warm-up: 2 sets (50% x 8, 75% x 4). Lower back glued flat to pad; 3s lowering phase to 90°. Double progression.',
              formCueText: 'Feet mid-to-high, shoulder width. Keep lower back flat against seat pad; lower to 90° over 3s.',
              videoUrl: 'https://www.youtube.com/results?search_query=45+degree+leg+press+proper+form',
              targetMuscleGroups: ['Glutes', 'Quadriceps', 'Quads'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'sled 45° leg press',
                  formCue: 'Feet mid-height on platform; lower smoothly to 90° without butt lifting off pad.',
                  videoUrl: 'https://www.youtube.com/results?search_query=45+degree+leg+press+proper+form',
                  targetFocus: 'Primary Quad & Glute Hypertrophy',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pull-through (with rope)',
                  formCue: 'Stand facing away from low pulley; hinge hips back; snap hips forward squeezing glutes.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+pull+through+form',
                  targetFocus: 'Glute & Hip Extension Overload',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell goblet squat',
                  formCue: 'Hold dumbbell vertical at sternum; squat between knees with tall upright torso.',
                  videoUrl: 'https://www.youtube.com/results?search_query=goblet+squat+proper+form',
                  targetFocus: 'Quad & Core Squat Pattern',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'bodyweight squat with 3s pause',
                  formCue: 'Feet shoulder-width; lower to parallel; pause 3 seconds at bottom for tension.',
                  videoUrl: 'https://www.youtube.com/results?search_query=bodyweight+squat+form',
                  targetFocus: 'Tension & Knee Mechanics',
                },
              ],
            },
            // Exercise 2: lever seated leg curl (0599)
            {
              id: `${weekId}_d2_ep2`,
              exerciseId: 'ex_0599',
              exerciseName: 'lever seated leg curl',
              sets: standardSets,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 75,
              loadGuidance: 'Warm-up: 1 feeler set (60% x 6). Lock thigh pad snugly over knees; dorsiflex ankles; 1s hold.',
              formCueText: 'Lock thigh pad snugly over knees; dorsiflex ankles; curl heels back and pause 1s.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever+seated+leg+curl+form',
              targetMuscleGroups: ['Hamstrings', 'Posterior Chain'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated leg curl',
                  formCue: 'Thigh pad tight; curl heels down and back under seat; pause 1s at peak knee flexion.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+seated+leg+curl+form',
                  targetFocus: 'Lengthened Hamstring Knee Flexion',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable standing leg curl',
                  formCue: 'Ankle cuff attached to low pulley; curl heel toward glute keeping torso stable.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+standing+leg+curl+form',
                  targetFocus: 'Unilateral Hamstring Tension',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell romanian deadlift',
                  formCue: 'Soft knees; push hips back into wall; lower dumbbells to mid-shin feeling deep ham stretch.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+romanian+deadlift+form',
                  targetFocus: 'Hip Hinge Hamstring Stretch',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'single-leg glute bridge',
                  formCue: 'Drive heel into floor; squeeze glute and hamstring at top for 2s hold.',
                  videoUrl: 'https://www.youtube.com/results?search_query=single+leg+glute+bridge+form',
                  targetFocus: 'Unilateral Hamstring & Glute Activation',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d2_b2`,
          order: 2,
          type: 'superset',
          tag: 'Superset A',
          bannerText: 'Superset A: Quad Extension & Lat Pullover (0s Inter-Exercise / 60s Inter-Set)',
          exercises: [
            // Exercise 3: lever leg extension (0585) [Superset A1]
            {
              id: `${weekId}_d2_ep3`,
              exerciseId: 'ex_0585',
              exerciseName: 'lever leg extension',
              sets: standardSets,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 0,
              subMovementOrder: '3A',
              supersetTag: 'A',
              interSetRestSeconds: 0,
              loadGuidance: '0 warm-up sets. Double progression: 10–12 reps. Go straight to #4 cable straight arm pulldown.',
              formCueText: 'Align knees with machine pivot; pause 1s at top, lower over 3s. Go straight to #4.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever+leg+extension+form',
              targetMuscleGroups: ['Quadriceps', 'Quads', 'Rectus Femoris'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever leg extension',
                  formCue: 'Align knee joints with pivot point; extend legs fully; pause 1s at top; lower over 3s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+leg+extension+form',
                  targetFocus: 'Rectus Femoris & Quad Burn',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable leg extension',
                  formCue: 'Ankle cuff to low pulley on bench; extend leg against smooth cable tension.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+leg+extension+form',
                  targetFocus: 'Constant Tension Quad Extension',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell step-up',
                  formCue: 'Step onto low box or bench; drive through front heel; control 3s step-down.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+step+ups+proper+form',
                  targetFocus: 'Unilateral Quad Hypertrophy',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'bodyweight sissy squat',
                  formCue: 'Hold rack for balance; lean torso back as knees travel forward; push through balls of feet.',
                  videoUrl: 'https://www.youtube.com/results?search_query=sissy+squat+form',
                  targetFocus: 'Terminal Knee Extension Quad Stretch',
                },
              ],
            },
            // Exercise 4: cable straight arm pulldown (0237) [Superset A2]
            {
              id: `${weekId}_d2_ep4`,
              exerciseId: 'ex_0237',
              exerciseName: 'cable straight arm pulldown',
              sets: standardSets,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 60,
              subMovementOrder: '3B',
              supersetTag: 'A',
              interSetRestSeconds: 60,
              loadGuidance: 'High pulley with rope; sweeps straight arms down to thighs. Rest 60s.',
              formCueText: 'High pulley with rope; brace abs; sweep straight arms down to thighs. Rest 60s.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable+straight+arm+pulldown+rope+form',
              targetMuscleGroups: ['Lats', 'Upper Back'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable straight arm pulldown',
                  formCue: 'Slight hinge at hips; arms nearly straight; sweep bar down to thighs in wide arc.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+straight+arm+pulldown+rope+form',
                  targetFocus: 'Direct Lat Hypertrophy Without Bicep Fatigue',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever pullover',
                  formCue: 'Elbows on pads; drive elbows down in circular sweep; full lat stretch at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine+pullover+form',
                  targetFocus: 'Nautilus-Style Lat Arc Isolation',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell pullover',
                  formCue: 'Lie on flat bench; lower dumbbell behind head keeping elbows slightly bent.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+pullover+form',
                  targetFocus: 'Lengthened Lat Stretch',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'dolphin push-up',
                  formCue: 'Forearm plank position; push hips up and back into inverted V engaging lats and serratus.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dolphin+push+up+form',
                  targetFocus: 'Bodyweight Serratus & Lat Integration',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d2_b3`,
          order: 3,
          type: 'superset',
          tag: 'Superset B',
          bannerText: 'Superset B: Calves & Abs (0s Inter-Exercise / 60s Inter-Set)',
          exercises: [
            // Exercise 5: sled 45° calf press (0738) [Superset B1]
            {
              id: `${weekId}_d2_ep5`,
              exerciseId: 'ex_0738',
              exerciseName: 'sled 45° calf press',
              sets: standardSets,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 0,
              subMovementOrder: '4A',
              supersetTag: 'B',
              interSetRestSeconds: 0,
              loadGuidance: 'Balls of feet on bottom sled edge. 2s heel stretch at bottom, 1s squeeze. Go to #6.',
              formCueText: 'Balls of feet on bottom edge of sled platform; 2s heel stretch at bottom, 1s squeeze at top.',
              videoUrl: 'https://www.youtube.com/results?search_query=leg+press+calf+press+form',
              targetMuscleGroups: ['Calves', 'Gastrocnemius', 'Soleus'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'sled 45° calf press',
                  formCue: 'Balls of feet on sled platform; drop heels into deep stretch; press through big toes 1s squeeze.',
                  videoUrl: 'https://www.youtube.com/results?search_query=leg+press+calf+press+form',
                  targetFocus: 'Gastrocnemius Peak Contraction',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable standing calf raise',
                  formCue: 'Stand on board holding low pulley; press up onto balls of feet.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+calf+raise+form',
                  targetFocus: 'Smooth Cable Calf Tension',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'standing dumbbell single-leg calf raise',
                  formCue: 'Hold dumbbell in hand of working side; drop heel low off edge of plate or step; press tall.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+calf+raise+form',
                  targetFocus: 'Unilateral Calf Density',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'single-leg stair calf raise',
                  formCue: 'Ball of foot on stair edge; full 2s stretch at bottom; push up tall for 1s squeeze.',
                  videoUrl: 'https://www.youtube.com/results?search_query=single+leg+calf+raise+form',
                  targetFocus: 'Full Ankle Mobility & Soleus Burn',
                },
              ],
            },
            // Exercise 6: reverse crunch (0872) [Superset B2]
            {
              id: `${weekId}_d2_ep6`,
              exerciseId: 'ex_0872',
              exerciseName: 'reverse crunch',
              sets: standardSets,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 60,
              subMovementOrder: '4B',
              supersetTag: 'B',
              interSetRestSeconds: 60,
              loadGuidance: 'Posterior core tilt eliminates anterior pelvic tilt sway. Rest 60s.',
              formCueText: 'Lie on bench holding pad behind head; exhale and curl hips/tailbone up off bench, 3s lower.',
              videoUrl: 'https://www.youtube.com/results?search_query=reverse+crunch+proper+form',
              targetMuscleGroups: ['Abs', 'Lower Abs', 'Core'],
              selectedEquipment: 'bodyweight',
              equipmentVariations: [
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'reverse crunch',
                  formCue: 'Lie flat; curl pelvis off bench toward ribcage; lower slowly with 3s eccentric.',
                  videoUrl: 'https://www.youtube.com/results?search_query=reverse+crunch+proper+form',
                  targetFocus: 'Posterior Pelvic Core Engagement',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated crunch',
                  formCue: 'Flex ribcage toward hips; hold peak contraction 1s; return under control.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+seated+crunch+machine+form',
                  targetFocus: 'Machine Abdominal Flexion',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable reverse crunch',
                  formCue: 'Ankles strapped to low cable pulley; curl knees toward chest against cable tension.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+reverse+crunch+form',
                  targetFocus: 'Loaded Posterior Pelvic Tilt',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'lying leg raise with light dumbbell',
                  formCue: 'Grip dumbbell securely between feet; lift legs to 75° without arching lower back.',
                  videoUrl: 'https://www.youtube.com/results?search_query=weighted+leg+raise+form',
                  targetFocus: 'Progressive Lower Core Resistance',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // THURSDAY (DAY 4): LEGS B (HINGE & QUADS HIT 2), SHOULDERS, CHEST/TRICEPS DIP & UPPER BACK
    // 72 hours after Monday football (96 hours before next match).
    // Gives posterior chain and quads 2nd weekly stimulus.
    // ----------------------------------------------------
    {
      id: `${weekId}_d3`,
      weekId,
      dayOfWeek: 3,
      label: 'Thursday: Legs B (Hinge & Quads Hit 2), Shoulders, Chest/Triceps Dip & Upper Back',
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: workoutDayNutrition,
      blocks: [
        {
          id: `${weekId}_d3_b1`,
          order: 1,
          type: 'straight',
          bannerText: 'Primary Hinge & Overhead Press (90s Rest)',
          exercises: [
            // Exercise 1: smith deadlift (0752)
            {
              id: `${weekId}_d3_ep1`,
              exerciseId: 'ex_0752',
              exerciseName: 'smith deadlift',
              sets: standardSets,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 90,
              loadGuidance: 'Guided Smith RDL: eliminates balance/grip wobble. Soft knees, flat spine, hinge hips back to mid-shin. Warmup: 2 sets (50% x 8, 75% x 4).',
              formCueText: 'Guided Smith RDL: eliminates balance/grip wobble. Soft knees, flat spine, hinge hips back to mid-shin.',
              videoUrl: 'https://www.youtube.com/results?search_query=smith+machine+rdl+deadlift+form',
              targetMuscleGroups: ['Glutes', 'Hamstrings', 'Posterior Chain'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'smith deadlift',
                  formCue: 'Feet under bar; soft knees; hinge hips back until bar reaches mid-shin; flat back.',
                  videoUrl: 'https://www.youtube.com/results?search_query=smith+machine+rdl+deadlift+form',
                  targetFocus: 'Posterior Chain & Glute Overload',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pull through (with rope)',
                  formCue: 'Straddle low pulley with rope; hinge hips back; snap through hips to full lockout.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+pull+through+form',
                  targetFocus: 'Horizontal Glute Extension',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell romanian deadlift',
                  formCue: 'Dumbbells skimming shins; push hips straight back into wall; squeeze glutes at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+romanian+deadlift+form',
                  targetFocus: 'Hamstring & Glute Hinge',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'single-leg hip hinge (drinking bird)',
                  formCue: 'Hinge forward on one soft leg; reach back heel to rear wall; return with glute squeeze.',
                  videoUrl: 'https://www.youtube.com/results?search_query=single+leg+rdl+bodyweight+form',
                  targetFocus: 'Unilateral Pelvic Balance',
                },
              ],
            },
            // Exercise 2: lever shoulder press (0605)
            {
              id: `${weekId}_d3_ep2`,
              exerciseId: 'ex_0605',
              exerciseName: 'lever shoulder press',
              sets: standardSets,
              repRangeLow: 10,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 90,
              loadGuidance: 'Warm-up: 1 quick feeler set (60% x 6). Neutral grip, back flat against pad. Double progression: 10–15 reps.',
              formCueText: 'Start at Pin 1. Neutral grip, back flat against pad. Press upward smoothly along guide track.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever+shoulder+press+form',
              targetMuscleGroups: ['Anterior Deltoids', 'Delts', 'Triceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever shoulder press',
                  formCue: 'Neutral grip; press upward without shrugging shoulders; lower under 3s control.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+shoulder+press+form',
                  targetFocus: 'Guided Overhead Shoulder Hypertrophy',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable kneeling overhead press',
                  formCue: 'Kneel between low pulleys; press handles overhead in natural convergence.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+overhead+shoulder+press+form',
                  targetFocus: 'Continuous Overhead Tension',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated dumbbell shoulder press',
                  formCue: 'Bench set to 75° notch; press dumbbells up in gentle arc over crown of head.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated+dumbbell+shoulder+press+form',
                  targetFocus: 'Deltoid Free Weight Mass',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'pike push-up',
                  formCue: 'Hips high in pike position; lower head between hands; press floor away.',
                  videoUrl: 'https://www.youtube.com/results?search_query=pike+push+up+form',
                  targetFocus: 'Bodyweight Vertical Pressing',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d3_b2`,
          order: 2,
          type: 'superset',
          tag: 'Superset A',
          bannerText: 'Superset A: Upper Back & Assisted Dip (0s Inter-Exercise / 60s Inter-Set)',
          exercises: [
            // Exercise 3: cable seated high row (v-bar) (0215) [Superset A1]
            {
              id: `${weekId}_d3_ep3`,
              exerciseId: 'ex_0215',
              exerciseName: 'cable seated high row (v-bar)',
              sets: standardSets,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 0,
              subMovementOrder: '3A',
              supersetTag: 'A',
              interSetRestSeconds: 0,
              loadGuidance: '0 warm-up sets. Double progression: 12–15 reps. Go straight to #4 assisted chest dip.',
              formCueText: 'Wide overhand grip; keep shoulders depressed down; pull elbows back at 45°–60° and pause 1s.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable+seated+high+row+v+bar+form',
              targetMuscleGroups: ['Lats', 'Upper Back', 'Rear Delts'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable seated high row (v-bar)',
                  formCue: 'Pull handles back toward sternum; elbows flared 45°; 1s scapular squeeze.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+seated+high+row+v+bar+form',
                  targetFocus: 'Upper Lat & Scapular Retraction',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever t bar row',
                  formCue: 'Chest against pad; pull handles toward upper abdomen with neutral wrists.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+t+bar+row+form',
                  targetFocus: 'Mid-Back Thickness',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'chest-supported high row',
                  formCue: 'Chest on incline bench; row dumbbells high with elbows out to hit rear delts and rhomboids.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest+supported+high+row+form',
                  targetFocus: 'Scapular Retractor Hypertrophy',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'wide-grip inverted row',
                  formCue: 'Grip bar wide; pull upper chest to bar squeezing shoulder blades.',
                  videoUrl: 'https://www.youtube.com/results?search_query=wide+grip+inverted+row+form',
                  targetFocus: 'Bodyweight Scapular Retraction',
                },
              ],
            },
            // Exercise 4: assisted chest dip (kneeling) (0009) [Superset A2]
            {
              id: `${weekId}_d3_ep4`,
              exerciseId: 'ex_0009',
              exerciseName: 'assisted chest dip (kneeling)',
              sets: standardSets,
              repRangeLow: 8,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 60,
              subMovementOrder: '3B',
              supersetTag: 'A',
              interSetRestSeconds: 60,
              loadGuidance: 'Set counterweight so you hit 8–12 smooth reps. Lean torso forward. Rest 60s.',
              formCueText: 'Set counterweight so you hit 8–12 smooth reps. Lean torso slightly forward; lower to comfortable depth.',
              videoUrl: 'https://www.youtube.com/results?search_query=assisted+chest+dip+kneeling+form',
              targetMuscleGroups: ['Pectorals', 'Lower Chest', 'Triceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'assisted chest dip (kneeling)',
                  formCue: 'Knees on counterweight pad; lean slightly forward; lower to 90° elbow bend; press up.',
                  videoUrl: 'https://www.youtube.com/results?search_query=assisted+chest+dip+kneeling+form',
                  targetFocus: 'Lower Chest & Triceps Overload',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable dip press',
                  formCue: 'High cable pulleys; press handles down past hips leaning slightly forward.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+dip+press+form',
                  targetFocus: 'Costal Pec & Triceps Extension',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell bench dip',
                  formCue: 'Hands on bench; dumbbell on lap; lower hips close to bench; press to lockout.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+weighted+bench+dip+form',
                  targetFocus: 'Loaded Triceps & Pec Burn',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'parallel bar dips',
                  formCue: 'Full bodyweight dip; torso leaned 15° forward; press up through palms.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest+dips+proper+form',
                  targetFocus: 'Compound Upper Pushing Strength',
                },
              ],
            },
          ],
        },
        {
          id: `${weekId}_d3_b3`,
          order: 3,
          type: 'superset',
          tag: 'Superset B',
          bannerText: 'Superset B: Left-Arm Lateral Raise & Quads Hit 2 (0s Inter-Exercise / 60s Inter-Set)',
          exercises: [
            // Exercise 5: cable one arm lateral raise (0178) [Superset B1]
            {
              id: `${weekId}_d3_ep5`,
              exerciseId: 'ex_0178',
              exerciseName: 'cable one arm lateral raise',
              sets: standardSets,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 0,
              subMovementOrder: '4A',
              supersetTag: 'B',
              interSetRestSeconds: 0,
              loadGuidance: 'LEFT-ARM LEADER RULE: Always perform Left Arm first! Match exact same weight and reps on Right Arm. Go to #6.',
              formCueText: 'Hold cable frame with free hand for stability. Left Arm First, match exact reps on Right Arm!',
              videoUrl: 'https://www.youtube.com/results?search_query=cable+one+arm+lateral+raise+form',
              targetMuscleGroups: ['Lateral Deltoids', 'Delts', 'Shoulders'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable one arm lateral raise',
                  formCue: 'Left arm first; cable behind legs; raise to 80° shoulder level; match exact reps on right.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+one+arm+lateral+raise+form',
                  targetFocus: 'Left-Arm Motor Calibration & Side Delt',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever lateral raise',
                  formCue: 'Forearm pads on machine; raise both arms smoothly to shoulder height.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+lateral+raise+machine+form',
                  targetFocus: 'Guided Side Delt Isolation',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell seated lateral raise',
                  formCue: 'Sit tall; lead with elbows; raise dumbbells to parallel with 1s peak hold.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated+dumbbell+lateral+raise+form',
                  targetFocus: 'Free Weight Lateral Head Cap',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'side-lying lateral deltoid raise',
                  formCue: 'Lie on side; raise arm up with controlled cadence against gravity.',
                  videoUrl: 'https://www.youtube.com/results?search_query=side+lying+lateral+raise+form',
                  targetFocus: 'Unilateral Lateral Delt Control',
                },
              ],
            },
            // Exercise 6: lever leg extension (0585) [Superset B2]
            {
              id: `${weekId}_d3_ep6`,
              exerciseId: 'ex_0585',
              exerciseName: 'lever leg extension',
              sets: standardSets,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 0]),
              restSeconds: 60,
              subMovementOrder: '4B',
              supersetTag: 'B',
              interSetRestSeconds: 60,
              loadGuidance: 'Second weekly quad exposure (zero spinal fatigue). 1s hold at top, 3s slow lowering phase. Rest 60s.',
              formCueText: 'Second weekly quad exposure (zero spinal fatigue). 1s hold at top, 3s slow lowering phase. Rest 60s.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever+leg+extension+form',
              targetMuscleGroups: ['Quadriceps', 'Quads'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever leg extension',
                  formCue: 'Extend legs to top; squeeze quads hard for 1 full second; 3-second descent.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever+leg+extension+form',
                  targetFocus: 'Second Weekly Quad Stimulus',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable leg extension',
                  formCue: 'Ankle cuff with low pulley; extend knee against continuous cable resistance.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+leg+extension+form',
                  targetFocus: 'Smooth Tension Quad Extension',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell goblet squat',
                  formCue: 'Hold dumbbell at chest; squat smooth and controlled without bouncing at bottom.',
                  videoUrl: 'https://www.youtube.com/results?search_query=goblet+squat+form',
                  targetFocus: 'Quad Hypertrophy & Stability',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'wall sit with 45s hold',
                  formCue: 'Back flat against wall; thighs parallel to floor; hold 45s for deep quad burn.',
                  videoUrl: 'https://www.youtube.com/results?search_query=wall+sit+form',
                  targetFocus: 'Isometric Quad Endurance',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // FRIDAY (DAY 5): REST & RECOVERY
    // ----------------------------------------------------
    {
      id: `${weekId}_d4`,
      weekId,
      dayOfWeek: 4,
      label: 'Friday: Rest & Recovery (Fasted Scale Milestone)',
      isRestDay: true,
      morningRoutine: [
        'Friday Scale Milestone: Step on scale fasted upon waking (Baseline: 51.8 kg -> Target: +0.20 to +0.40 kg/wk)',
        'The Weekend Anchor: Prepare and consume afternoon digestive shake to protect surplus',
      ],
      nutrition: restDayNutrition,
      blocks: [],
    },

    // ----------------------------------------------------
    // SATURDAY (DAY 6): REST & RECOVERY
    // ----------------------------------------------------
    {
      id: `${weekId}_d5`,
      weekId,
      dayOfWeek: 5,
      label: 'Saturday: Rest & Recovery',
      isRestDay: true,
      morningRoutine: [
        'Weekend Morning Hydration: 500ml water upon waking',
        'The Weekend Anchor: Mandatory afternoon digestive shake between meals',
      ],
      nutrition: restDayNutrition,
      blocks: [],
    },

    // ----------------------------------------------------
    // SUNDAY (DAY 7): WEEKLY REVIEW & MEAL/SHAKER PREP
    // ----------------------------------------------------
    {
      id: `${weekId}_d6`,
      weekId,
      dayOfWeek: 6,
      label: 'Sunday: Weekly Review & Meal/Shaker Prep',
      isRestDay: true,
      morningRoutine: [
        'Sunday 7-Day Rolling Average Review: Evaluate weight trend against +0.20 to +0.40 kg/wk target',
        'Prep shaker ingredients and desk-drawer low-fat carbs for Monday kickoff',
      ],
      nutrition: restDayNutrition,
      blocks: [],
    },
  ];
}

// ==========================================
// 5. MASTER 12-WEEK PROGRAM FACTORY
// ==========================================

export function generateMaster12WeekProgram(): Program {
  const startDate = new Date();
  // Start on Monday of current week
  const day = startDate.getDay();
  const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
  startDate.setDate(diff);
  const startStr = toLocalDateString(startDate);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 12 * 7 - 1);
  const endStr = toLocalDateString(endDate);

  const weeks: ProgramWeek[] = [];
  for (let w = 1; w <= 12; w++) {
    const weekId = `prog_master_w${w}`;
    weeks.push({
      id: weekId,
      programId: 'prog_master_transformation_12w',
      weekIndex: w,
      days: createBlueprintDays(weekId, w),
    });
  }

  return {
    id: 'prog_master_transformation_12w',
    trainerId: 'trainer_alaa',
    traineeId: 'trainee_alaa',
    title: 'The Master 12-Week Hypertrophy Transformation Protocol',
    startDate: startStr,
    endDate: endStr,
    durationWeeks: 12,
    status: 'published',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    weeks,
  };
}

// Backward-compatible alias
export const generateMaster16WeekProgram = generateMaster12WeekProgram;

// ==========================================
// 6. SUPPLEMENTS & HYDRATION
// ==========================================

export const masterSupplementProtocols: SupplementProtocol[] = [
  {
    id: 'sp_creatine_master',
    programId: 'prog_master_transformation_12w',
    name: 'Creatine Monohydrate',
    category: 'performance',
    phases: [
      {
        phaseIndex: 1,
        name: 'Nightly Maintenance (5g/day with dinner)',
        startDay: 1,
        endDay: 84,
        doses: [
          {
            id: 'sp_cr_main_d1',
            doseOrder: 1,
            amount: 5.0,
            unit: 'g',
            timingType: 'meal_linked',
            mealLabel: '21:30 Unified Dinner Stack',
            targetTime: '21:30',
            notes: 'Taken beside dinner plate; no loading phase to prevent BIA scale water inflation confound. Keeps creatine outside pre-match window.',
          },
        ],
      },
    ],
  },
  {
    id: 'sp_dinner_foundation',
    programId: 'prog_master_transformation_12w',
    name: 'The Unified Dinner Stack (D3, Magnesium Bisglycinate, Omega-3)',
    category: 'health',
    phases: [
      {
        phaseIndex: 1,
        name: 'Nightly Recovery Baseline Foundation',
        startDay: 1,
        endDay: 84,
        doses: [
          {
            id: 'sp_d3_d1',
            doseOrder: 1,
            amount: 2000,
            unit: 'IU',
            timingType: 'meal_linked',
            mealLabel: '21:30 Unified Dinner Stack',
            targetTime: '21:30',
            notes: 'Vitamin D3 (2,000 IU/day): Delay starting until after Week 1 baseline blood draw to avoid contaminating lab results. Absorbed with dinner olive oil.',
          },
          {
            id: 'sp_omega3_d1',
            doseOrder: 2,
            amount: 1250,
            unit: 'mg',
            timingType: 'meal_linked',
            mealLabel: '21:30 Unified Dinner Stack',
            targetTime: '21:30',
            notes: 'Omega-3 Fish Oil (1,250mg EPA/DHA) for systemic recovery and joint health.',
          },
          {
            id: 'sp_mag_d1',
            doseOrder: 3,
            amount: 300,
            unit: 'mg',
            timingType: 'meal_linked',
            mealLabel: '21:30 Unified Dinner Stack',
            targetTime: '21:30',
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
  programId: 'prog_master_transformation_12w',
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
