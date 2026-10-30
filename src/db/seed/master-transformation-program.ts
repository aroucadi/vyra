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
// 4. THE 28 CATALOGUE EXERCISE BLUEPRINT (16-WEEK PROTOCOL)
// ==========================================
// 4. THE 28 CATALOGUE EXERCISE BLUEPRINT (16-WEEK PROTOCOL)
// ==========================================
// 4. THE 28 CATALOGUE EXERCISE BLUEPRINT (16-WEEK PROTOCOL)
// ==========================================

export function createBlueprintDays(weekId: string, weekIndex: number = 1): ProgramDay[] {
  // Volume periodization:
  // Weeks 1-2: 2 working sets (Acclimation Ramp)
  // Weeks 3-6: 3 working sets (Accumulation Block 1)
  // Week 7: 2 working sets, deload (-10% load, 3-4 RIR)
  // Weeks 8-11: 3 working sets (Accumulation Block 2)
  // Week 12: 2 working sets, checkpoint & deload
  // Weeks 13-15: 3 working sets (Peak Block)
  // Week 16: 2 working sets, final deload & testing
  const isRamp = weekIndex <= 2;
  const isDeload = weekIndex === 7 || weekIndex === 12 || weekIndex === 16;
  const standardSets = (isRamp || isDeload) ? 2 : 3;

  return [
    // ----------------------------------------------------
    // MONDAY (DAY 1): 100% SEATED/BRACED UPPER BODY
    // Leaves lower body 100% fresh for 480 daily stairs + 19:15 football match. Zero Abs/Leg Load.
    // ----------------------------------------------------
    {
      id: `${weekId}_d0`,
      weekId,
      dayOfWeek: 0,
      label: 'Monday: 100% Seated/Braced Upper Body (Chest, Supported Row, Dual Side/Rear Delts & Triceps - Zero Abs/Leg Load)',
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
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 90,
              loadGuidance: 'Warm-up: 2 sets (50% x 8, 75% x 4). Keep lower back and ribs pressed flat into pad (zero lumbar arch). Double progression at 20kg.',
              formCueText: 'Keep lower back and ribs pressed flat into pad (zero lumbar arch). Align handles with upper chest; 3s eccentric return.',
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
              warmupSets: 0,
              targetWeightKg: 20,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 90,
              loadGuidance: 'Hold 20kg until hitting 10,10,10 smoothly before moving to 25kg. 0 warm-up sets (chest warmed up from #1).',
              formCueText: 'Hold 20kg until hitting 10,10,10 smoothly before moving to 25kg. Keep upper back flat against pad; 3s lowering phase.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20chest%20press%20proper%20form',
              targetMuscleGroups: ['Chest', 'Pectorals', 'Triceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever chest press',
                  formCue: 'Keep upper back flat against pad; drive through sternum; 3s eccentric return.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20chest%20press%20proper%20form',
                  targetFocus: 'Mid-Sternal Pectoral Mass',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'flat dumbbell bench press',
                  formCue: 'Plant feet flat; retract scapulae; press in gentle inward arc.',
                  videoUrl: 'https://www.youtube.com/results?search_query=flat%20dumbbell%20bench%20press%20proper%20form',
                  targetFocus: 'Sternal Pec Activation',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable seated chest press',
                  formCue: 'Sit upright against pad; press cable handles forward converging at mid-chest.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20seated%20chest%20press%20proper%20form',
                  targetFocus: 'Direct Sternal Contraction',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'standard push-ups',
                  formCue: 'Hands shoulder-width; core braced; full lockout with serratus protraction.',
                  videoUrl: 'https://www.youtube.com/results?search_query=push%20ups%20proper%20form%20proper%20form',
                  targetFocus: 'Horizontal Push Baseline',
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
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 75,
              loadGuidance: 'Chest glued to front pad (saves legs & lower back for Monday stairs + evening football). 30kg target.',
              formCueText: 'Chest glued to front pad. Pull elbows back low toward hips; 1s contraction squeeze, 3s eccentric release.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20row%20proper%20form',
              targetMuscleGroups: ['Upper Back', 'Lats', 'Rhomboids', 'Mid Traps', 'Biceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated row',
                  formCue: 'Chest glued to pad; drive elbows back low toward hips; 1s peak squeeze.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20row%20proper%20form',
                  targetFocus: 'Thoracic Extension & Upper Back Thickness',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'chest-supported dumbbell row',
                  formCue: 'Incline bench at 30°; row dumbbells with elbows driving backward.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest%20supported%20dumbbell%20row%20proper%20form',
                  targetFocus: 'Bilateral Upper Back Retraction',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable straight back seated row',
                  formCue: 'Neutral spine sitting tall; pull attachment into upper abdomen.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20seated%20row%20proper%20form',
                  targetFocus: 'Horizontal Cable Pull',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'inverted row (on smith or bar)',
                  formCue: 'Body straight; pull chest up to bar pausing 1s at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=inverted%20row%20proper%20form',
                  targetFocus: 'Horizontal Bodyweight Pull',
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
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 60,
              loadGuidance: 'Seat 1 notch high; chest braced against pad. 40kg target for 12-15 reps.',
              formCueText: 'Seat 1 notch high; chest braced against pad. Sweep arms out wide; lead with elbows; 1s contraction hold.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20reverse%20fly%20proper%20form',
              targetMuscleGroups: ['Rear Deltoids', 'Infraspinatus', 'Rhomboids'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated reverse fly',
                  formCue: 'Seat high; chest braced; push arms wide; do not shrug traps.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20reverse%20fly%20proper%20form',
                  targetFocus: 'Posterior Deltoid Isolation',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'prone dumbbell rear delt fly',
                  formCue: 'Chest against incline bench; sweep dumbbells outward with pinkies up.',
                  videoUrl: 'https://www.youtube.com/results?search_query=prone%20dumbbell%20rear%20delt%20fly%20proper%20form',
                  targetFocus: 'Free Weight Rear Delt Extension',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable standing rear delt row (with rope)',
                  formCue: 'Set pulley at eye height; pull rope ends toward ears with elbows elevated.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20face%20pull%20rear%20delt%20proper%20form',
                  targetFocus: 'Dynamic Scapular Retraction',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'prone floor rear delt raise',
                  formCue: 'Lie face down; raise arms in wide Y/T shape focusing on rear shoulders.',
                  videoUrl: 'https://www.youtube.com/results?search_query=prone%20floor%20rear%20delt%20raise%20proper%20form',
                  targetFocus: 'Prone Scapular Elevation',
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
              rirScheme: isDeload ? [3, 4] : [2, 2],
              restSeconds: 60,
              loadGuidance: 'Keep at 5kg! Hold frame, tuck pelvis under, Left Arm first in 30-deg forward plane. Progress reps 8 -> 15.',
              formCueText: 'LEFT ARM FIRST! Hold frame, tuck pelvis under, raise arm in 30-degree scapular plane to shoulder height.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20one%20arm%20lateral%20raise%20proper%20form',
              targetMuscleGroups: ['Lateral Deltoids'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable one arm lateral raise',
                  formCue: 'Stand tall with cable behind or in front; lead with elbow in scapular plane.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20one%20arm%20lateral%20raise%20proper%20form',
                  targetFocus: 'Constant Tension Lateral Head',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever lateral raise',
                  formCue: 'Elbows pressed against pads; back flat against backrest; 1s top hold.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20lateral%20raise%20machine%20proper%20form',
                  targetFocus: 'Peak Contraction Lateral Head',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell seated lateral raise',
                  formCue: 'Sit with chest slightly angled; raise dumbbells wide with pinkies slightly elevated.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20dumbbell%20lateral%20raise%20proper%20form',
                  targetFocus: 'Seated Deltoid Cap',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'side-lying lateral deltoid raise',
                  formCue: 'Lie on side; raise arm smoothly to 80 degrees with controlled tempo.',
                  videoUrl: 'https://www.youtube.com/results?search_query=side%20lying%20lateral%20raise%20proper%20form',
                  targetFocus: 'Unloaded Scapular Plane Activation',
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
              rirScheme: isDeload ? [3, 4] : [2, 2],
              restSeconds: 60,
              loadGuidance: 'Seated elbow-pad machine on Pin 1 (10kg); back flat against pad. Progress reps 12 -> 15.',
              formCueText: 'Seated elbow-pad machine on Pin 1 (10kg); back flat against pad. Drive elbows outward into pads; 1s pause at top.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20lateral%20raise%20machine%20proper%20form',
              targetMuscleGroups: ['Lateral Deltoids', 'Upper Deltoids'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever lateral raise',
                  formCue: 'Elbows pressed against pads; back flat against backrest; 1s top hold.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20lateral%20raise%20machine%20proper%20form',
                  targetFocus: 'Peak Contraction Lateral Head',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'standing dumbbell lateral raise',
                  formCue: 'Soft knees, neutral spine; raise dumbbells wide in scapular plane.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20lateral%20raise%20proper%20form',
                  targetFocus: 'Free Weight Deltoid Overload',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable lateral raise',
                  formCue: 'Low pulley, raise handle across body to shoulder level.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20lateral%20raise%20proper%20form',
                  targetFocus: 'Continuous Cable Resistance',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'wall-supported arm raise',
                  formCue: 'Lean side against wall; raise arm into isometric hold against resistance.',
                  videoUrl: 'https://www.youtube.com/results?search_query=wall%20lateral%20raise%20isometric%20proper%20form',
                  targetFocus: 'Postural Deltoid Endurance',
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
              loadGuidance: 'Squeeze glutes & keep ribs down; elbows pinned to sides. 20kg target.',
              formCueText: 'Squeeze glutes & keep ribs down; elbows pinned to sides. Spread rope at bottom lockout; 1s squeeze.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20rope%20tricep%20pushdown%20proper%20form',
              targetMuscleGroups: ['Triceps', 'Triceps Lateral Head', 'Triceps Medial Head'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pushdown (with rope attachment)',
                  formCue: 'Elbows glued to ribs; spread rope tips wide at bottom contraction.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20rope%20tricep%20pushdown%20proper%20form',
                  targetFocus: 'Lateral & Medial Triceps Head',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever triceps dip',
                  formCue: 'Keep shoulders depressed down; push handles down with control.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20machine%20dip%20triceps%20proper%20form',
                  targetFocus: 'Compound Triceps Overload',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'overhead dumbbell triceps extension',
                  formCue: 'Hold dumbbell overhead with two hands; lower behind head and press upward.',
                  videoUrl: 'https://www.youtube.com/results?search_query=overhead%20dumbbell%20triceps%20extension%20proper%20form',
                  targetFocus: 'Long Head Triceps Stretch',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'bench dips',
                  formCue: 'Hands on bench edge; lower hips under control; press to full elbow extension.',
                  videoUrl: 'https://www.youtube.com/results?search_query=bench%20dips%20proper%20form',
                  targetFocus: 'Bodyweight Triceps Baseline',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // TUESDAY (DAY 2): 100% SEATED PULL, CUFF STABILITY, BICEPS & FOREARMS
    // ----------------------------------------------------
    {
      id: `${weekId}_d1`,
      weekId,
      dayOfWeek: 1,
      label: 'Tuesday: 100% Seated Pull, Cuff Stability, Biceps & Forearms',
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
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 90,
              loadGuidance: 'Neutral grip; torso vertical and ribs down. Warmup: 2 sets. Double progression at 40kg.',
              formCueText: 'Neutral grip; torso vertical and ribs down. Drive elbows straight down toward ribs; 1s contraction pause.',
              videoUrl: 'https://www.youtube.com/results?search_query=lat%20pulldown%20proper%20form%20proper%20form',
              targetMuscleGroups: ['Lats', 'Upper Back', 'Biceps'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pulldown',
                  formCue: 'Neutral grip; keep chest elevated and pull bar down to clavicle.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lat%20pulldown%20proper%20form%20proper%20form',
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
              warmupSets: 0,
              targetWeightKg: 30,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 90,
              loadGuidance: 'Chest-supported row at 30kg; build to 3 x 12 before 35kg. 0 warm-up sets.',
              formCueText: 'Chest-supported row at 30kg; build to 3 x 12 before 35kg. Chest glued to pad; drive elbows back low.',
              videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20row%20proper%20form',
              targetMuscleGroups: ['Upper Back', 'Lats', 'Rhomboids', 'Mid Traps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated row',
                  formCue: 'Chest glued to pad; drive elbows back low toward hips.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20row%20proper%20form',
                  targetFocus: 'Upper Back Density',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'chest-supported dumbbell row',
                  formCue: 'Chest pressed into incline bench; row dumbbells with neutral grip.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest%20supported%20dumbbell%20row%20proper%20form',
                  targetFocus: 'Bilateral Upper Back Retraction',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable straight back seated row',
                  formCue: 'Neutral spine; pull cable handles to lower ribs.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20seated%20row%20proper%20form',
                  targetFocus: 'Continuous Tension Cable Row',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'inverted row (on smith or bar)',
                  formCue: 'Heels on floor; pull sternum to bar; hold 1s at peak.',
                  videoUrl: 'https://www.youtube.com/results?search_query=inverted%20row%20proper%20form',
                  targetFocus: 'Horizontal Bodyweight Retraction',
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
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 75,
              loadGuidance: 'Sit tall with neutral flat lower back; shoulders depressed down. 25kg target.',
              formCueText: 'Sit tall with neutral flat lower back; shoulders depressed down. Pull handles into navel.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20straight%20back%20seated%20row%20proper%20form',
              targetMuscleGroups: ['Lats', 'Rhomboids', 'Mid Traps', 'Lower Back Stability'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable straight back seated row',
                  formCue: 'Sit tall, keep lower back neutral; pull to lower ribs.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20straight%20back%20seated%20row%20proper%20form',
                  targetFocus: 'Horizontal Mid-Back Retraction',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated row',
                  formCue: 'Chest supported against pad; pull handles back smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20row%20proper%20form',
                  targetFocus: 'Supported Mid-Back Hypertrophy',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'single-arm dumbbell row',
                  formCue: 'One knee on bench; row dumbbell up towards hip pocket.',
                  videoUrl: 'https://www.youtube.com/results?search_query=single%20arm%20dumbbell%20row%20proper%20form',
                  targetFocus: 'Unilateral Free Weight Row',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'inverted row with pause',
                  formCue: 'Pull chest to bar; pause 2s; lower under control.',
                  videoUrl: 'https://www.youtube.com/results?search_query=inverted%20row%20proper%20form',
                  targetFocus: 'Bodyweight Back Tension',
                },
              ],
            },
            // Exercise 4: cable standing rear delt row (with rope) (0220)
            {
              id: `${weekId}_d1_ep4`,
              exerciseId: 'ex_0220',
              exerciseName: 'cable standing rear delt row (with rope)',
              sets: standardSets,
              warmupSets: 0,
              targetWeightKg: 30,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 1]),
              restSeconds: 60,
              loadGuidance: 'Stagger feet (or perform seated/kneeling) and tuck pelvis under. 30kg target for 12-15 reps.',
              formCueText: 'Stagger feet (or perform seated/kneeling) and tuck pelvis under. Pull rope to eye height; flare elbows out high.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20standing%20rear%20delt%20row%20with%20rope%20proper%20form',
              targetMuscleGroups: ['Rear Deltoids', 'Rotator Cuff', 'Infraspinatus', 'Upper Back'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable standing rear delt row (with rope)',
                  formCue: 'Pull rope ends toward forehead; hold 1s at full contraction.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20standing%20rear%20delt%20row%20with%20rope%20proper%20form',
                  targetFocus: 'Scapular Stability & Posterior Cuff',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated reverse fly',
                  formCue: 'Reverse fly machine with high seat; sweep pads back wide.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20seated%20reverse%20fly%20proper%20form',
                  targetFocus: 'Supported Rear Deltoid Squeeze',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell face pull on incline bench',
                  formCue: 'Face down on incline bench; pull dumbbells towards ears with high elbows.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20face%20pull%20proper%20form',
                  targetFocus: 'Free Weight Posterior Deltoid Row',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'prone y-raise on floor',
                  formCue: 'Lie prone; raise arms in Y formation thumbs pointing up.',
                  videoUrl: 'https://www.youtube.com/results?search_query=prone%20y%20raise%20proper%20form',
                  targetFocus: 'Lower Trap & Rotator Activation',
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
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 1]),
              restSeconds: 60,
              loadGuidance: 'Upper arms supported on pad; 3s slow lowering. 20kg target.',
              formCueText: 'Upper arms supported on pad; 3s slow lowering. Keep wrists straight; do not let elbows flare or lift.',
              videoUrl: 'https://www.youtube.com/results?search_query=preacher%20curl%20machine%20proper%20form%20proper%20form',
              targetMuscleGroups: ['Biceps', 'Biceps Brachii Short Head', 'Brachialis'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever preacher curl',
                  formCue: 'Arms flush with pad; curl upward smoothly; 3s slow eccentric lower.',
                  videoUrl: 'https://www.youtube.com/results?search_query=preacher%20curl%20machine%20proper%20form%20proper%20form',
                  targetFocus: 'Strict Biceps Isolation',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'incline dumbbell bicep curl',
                  formCue: 'Sit on incline bench; curl dumbbells keeping upper arms pinned back.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline%20dumbbell%20bicep%20curl%20proper%20form',
                  targetFocus: 'Long Head Biceps Stretch',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable preacher curl',
                  formCue: 'Set bench in front of low pulley; maintain constant cable tension.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20preacher%20curl%20form%20proper%20form',
                  targetFocus: 'Continuous Biceps Tension',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'underhand chin-up hold',
                  formCue: 'Hold top of chin-up position with biceps flexed for time.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chin%20up%20isometric%20hold%20proper%20form',
                  targetFocus: 'Bodyweight Biceps Tension',
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
              loadGuidance: '20kg for clean 12,12 reps. Brachialis overload for arm thickness.',
              formCueText: 'Neutral grip on rope tips; tuck pelvis; squeeze brachialis at top; 3s eccentric.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20rope%20hammer%20curl%20proper%20form',
              targetMuscleGroups: ['Brachialis', 'Brachioradialis', 'Biceps'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable hammer curl (with rope)',
                  formCue: 'Palms face each other; curl upward keeping elbows pinned to sides.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20rope%20hammer%20curl%20proper%20form',
                  targetFocus: 'Brachialis & Forearm Thickness',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever bicep curl',
                  formCue: 'Curl handles upward with elbows supported; slow 3s eccentric.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20bicep%20curl%20machine%20proper%20form',
                  targetFocus: 'Machine Biceps Overload',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated dumbbell hammer curl',
                  formCue: 'Sit tall against backrest; curl dumbbells with neutral grip.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20hammer%20curl%20form%20proper%20form',
                  targetFocus: 'Neutral Grip Arm Thickness',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'neutral grip body row',
                  formCue: 'Grasp parallel bars; pull sternum to handles with neutral wrists.',
                  videoUrl: 'https://www.youtube.com/results?search_query=neutral%20grip%20inverted%20row%20proper%20form',
                  targetFocus: 'Functional Arm & Back Pull',
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
              loadGuidance: 'Seated with forearms on thighs. 10kg target for 15-20 reps.',
              formCueText: 'Seated with forearms on thighs. Curl bar up with wrists; pause 1s; lower smoothly.',
              videoUrl: 'https://www.youtube.com/results?search_query=wrist%20curl%20proper%20form%20proper%20form',
              targetMuscleGroups: ['Forearm Flexors', 'Wrist Flexors'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable wrist curl',
                  formCue: 'Kneeling or seated; curl cable attachment with wrist flexors.',
                  videoUrl: 'https://www.youtube.com/results?search_query=wrist%20curl%20proper%20form%20proper%20form',
                  targetFocus: 'Forearm & Grip Density',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever wrist curl',
                  formCue: 'Forearms rested on pad; flex wrists upward against lever.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20wrist%20curl%20proper%20form',
                  targetFocus: 'Supported Wrist Flexion',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated dumbbell wrist curl',
                  formCue: 'Forearms on bench; curl dumbbells with wrists.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20wrist%20curl%20proper%20form',
                  targetFocus: 'Free Weight Forearm Flexion',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'fingertip plank hold',
                  formCue: 'Plank on fingertips for time to build tensile finger and forearm strength.',
                  videoUrl: 'https://www.youtube.com/results?search_query=fingertip%20plank%20hold%20proper%20form',
                  targetFocus: 'Isometric Grip Endurance',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // WEDNESDAY (DAY 3): GLUTE-BIASED LEGS, HAMSTRINGS, HIP ABDUCTION, LAT PULLOVER & PELVIC CORE
    // ----------------------------------------------------
    {
      id: `${weekId}_d2`,
      weekId,
      dayOfWeek: 2,
      label: 'Wednesday: Glute-Biased Legs, Hamstrings, Hip Abduction, Lat Pullover & Pelvic Core',
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
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 90,
              loadGuidance: 'Place feet HIGH & WIDE on platform and push through heels to shift work onto glutes/hamstrings. 60kg baseline.',
              formCueText: 'Place feet HIGH & WIDE on platform and push through heels to shift work onto glutes/hamstrings. Never lock knees.',
              videoUrl: 'https://www.youtube.com/results?search_query=45%20degree%20leg%20press%20proper%20form%20proper%20form',
              targetMuscleGroups: ['Glutes', 'Hamstrings', 'Quadriceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'sled 45° leg press',
                  formCue: 'Feet high and shoulder-width; push through heels to recruit glutes.',
                  videoUrl: 'https://www.youtube.com/results?search_query=45%20degree%20leg%20press%20proper%20form%20proper%20form',
                  targetFocus: 'Glute-Biased Leg Press',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell goblet squat',
                  formCue: 'Hold dumbbell high against chest; squat to parallel with knees tracking toes.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20goblet%20squat%20form%20proper%20form',
                  targetFocus: 'Functional Squat Pattern',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pull-through (with rope)',
                  formCue: 'Stand facing away from low pulley; hinge hips back; pull through glutes.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20pull%20through%20with%20rope%20proper%20form',
                  targetFocus: 'Posterior Chain Hinge',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'bodyweight squat with 3s pause',
                  formCue: 'Squat deep, pause 3s at parallel; drive through heels to stand.',
                  videoUrl: 'https://www.youtube.com/results?search_query=pause%20squat%20bodyweight%20proper%20form',
                  targetFocus: 'Bodyweight Glute & Quad Mobility',
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
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 1]),
              restSeconds: 75,
              loadGuidance: 'Opposes daily stair hip-flexor loading; pause 1s at full curl. 25kg target.',
              formCueText: 'Opposes daily stair hip-flexor loading; pause 1s at full curl. Keep thighs firmly pressed under pad.',
              videoUrl: 'https://www.youtube.com/results?search_query=seated%20leg%20curl%20machine%20form%20proper%20form',
              targetMuscleGroups: ['Hamstrings', 'Biceps Femoris', 'Semitendinosus'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated leg curl',
                  formCue: 'Thigh pad secure; curl heels under seat; hold 1s at full contraction.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20leg%20curl%20machine%20form%20proper%20form',
                  targetFocus: 'Hamstring Knee Flexion',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell romanian deadlift',
                  formCue: 'Hinge hips back softly; keep dumbbells close to shins.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20romanian%20deadlift%20form%20proper%20form',
                  targetFocus: 'Lengthened Hamstring Stretch',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable standing leg curl',
                  formCue: 'Ankle strapped to low pulley; curl heel towards glute.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20leg%20curl%20proper%20form',
                  targetFocus: 'Unilateral Hamstring Flexion',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'single-leg glute bridge',
                  formCue: 'Lie on back; drive single heel into floor; extend hips squeezing glute and hamstrings.',
                  videoUrl: 'https://www.youtube.com/results?search_query=single%20leg%20glute%20bridge%20proper%20form',
                  targetFocus: 'Unilateral Posterior Chain Activation',
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
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 1]),
              restSeconds: 60,
              loadGuidance: 'Single weekly direct quad isolation; 1s top hold, 3s slow eccentric. 25kg target.',
              formCueText: 'Single weekly direct quad isolation; 1s top hold, 3s slow eccentric. Do not kick or swing.',
              videoUrl: 'https://www.youtube.com/results?search_query=leg%20extension%20proper%20form%20proper%20form',
              targetMuscleGroups: ['Quadriceps', 'Rectus Femoris', 'Vastus Medialis'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever leg extension',
                  formCue: 'Sit back against pad; extend knees to full contraction; 1s top hold.',
                  videoUrl: 'https://www.youtube.com/results?search_query=leg%20extension%20proper%20form%20proper%20form',
                  targetFocus: 'Direct Terminal Quad Hypertrophy',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell step-up',
                  formCue: 'Step onto box or bench; drive through lead heel without bouncing off back leg.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20step%20up%20form%20proper%20form',
                  targetFocus: 'Unilateral Quad & Knee Stability',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable leg extension',
                  formCue: 'Strap ankle to low pulley; extend knee against continuous cable resistance.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20leg%20extension%20form%20proper%20form',
                  targetFocus: 'Constant Cable Quad Tension',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'bodyweight sissy squat',
                  formCue: 'Lean torso back on toes; bend knees with control to load quads.',
                  videoUrl: 'https://www.youtube.com/results?search_query=sissy%20squat%20proper%20form%20proper%20form',
                  targetFocus: 'Bodyweight Terminal Quad Loading',
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
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 1]),
              restSeconds: 60,
              loadGuidance: 'Exhale ribs down and tuck pelvis while sweeping rope to thighs. 20kg target.',
              formCueText: 'Exhale ribs down and tuck pelvis while sweeping rope to thighs. Keep elbows softly locked; sweep lats.',
              videoUrl: 'https://www.youtube.com/results?search_query=straight%20arm%20lat%20pulldown%20form%20proper%20form',
              targetMuscleGroups: ['Lats', 'Teres Major', 'Abdominals', 'Serratus Anterior'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable straight arm pulldown',
                  formCue: 'Hips hinged slightly; sweep attachment to thighs while exhaling fully.',
                  videoUrl: 'https://www.youtube.com/results?search_query=straight%20arm%20lat%20pulldown%20form%20proper%20form',
                  targetFocus: 'Lengthened Lat Pullover',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever pullover',
                  formCue: 'Sit tall in machine; draw elbow pads down in wide arc.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20pullover%20form%20proper%20form',
                  targetFocus: 'Machine Lat Pullover Isolation',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell pullover',
                  formCue: 'Lie perpendicular to bench; lower dumbbell overhead with soft elbows.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20pullover%20form%20proper%20form',
                  targetFocus: 'Free Weight Serratus & Lat Stretch',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'dolphin push-up',
                  formCue: 'Forearm plank; walk feet in raising hips to engage lats and serratus.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dolphin%20push%20up%20form%20proper%20form',
                  targetFocus: 'Bodyweight Shoulder & Serratus Alignment',
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
              loadGuidance: 'Targets Gluteus Medius (side glutes) to stabilize pelvis and knees for stairs & football. Pause 1s at wide open position. 35kg target.',
              formCueText: 'Targets Gluteus Medius (side glutes) to stabilize pelvis and knees for stairs & football. Sit tall, push knees wide against pads, pause 1s at full extension.',
              videoUrl: 'https://www.youtube.com/results?search_query=seated%20hip%20abductor%20machine%20form%20proper%20form',
              targetMuscleGroups: ['Gluteus Medius', 'Gluteus Minimus', 'Tensor Fasciae Latae', 'Outer Hips'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated hip abduction',
                  formCue: 'Sit tall with hips deep in seat; push pads wide; pause 1s at peak.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20hip%20abductor%20machine%20form%20proper%20form',
                  targetFocus: 'Gluteus Medius Lateral Pelvic Stability',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'standing dumbbell hip abduction',
                  formCue: 'Hold dumbbell against outer thigh; raise leg outward with toes forward.',
                  videoUrl: 'https://www.youtube.com/results?search_query=standing%20dumbbell%20hip%20abduction%20proper%20form',
                  targetFocus: 'Free Weight Lateral Hip Abduction',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable standing hip abduction',
                  formCue: 'Strap ankle to low cable; sweep leg outward at 45 degrees without tilting torso.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20hip%20abduction%20form%20proper%20form',
                  targetFocus: 'Standing Glute Medius Overload',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'side-lying clam shell',
                  formCue: 'Lie on side with knees bent 90°; rotate top knee open keeping heels together.',
                  videoUrl: 'https://www.youtube.com/results?search_query=side%20lying%20clamshell%20exercise%20proper%20form',
                  targetFocus: 'Deep Lateral Hip Rotator Activation',
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
              loadGuidance: 'Curl tailbone/hips UP off bench toward ribs to counteract tight hip flexors from stairs. Bodyweight.',
              formCueText: 'Curl tailbone/hips UP off bench toward ribs to counteract tight hip flexors from stairs. Avoid kicking legs.',
              videoUrl: 'https://www.youtube.com/results?search_query=reverse%20crunch%20proper%20form%20proper%20form',
              targetMuscleGroups: ['Lower Abdominals', 'Rectus Abdominis', 'Pelvic Floor'],
              selectedEquipment: 'bodyweight',
              equipmentVariations: [
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'reverse crunch',
                  formCue: 'Anchor hands behind head on bench; curl pelvis toward sternum with control.',
                  videoUrl: 'https://www.youtube.com/results?search_query=reverse%20crunch%20proper%20form%20proper%20form',
                  targetFocus: 'Posterior Pelvic Core Engagement',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated crunch',
                  formCue: 'Curl torso down into abdominal contraction; 1s bottom hold.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20crunch%20proper%20form%20proper%20form',
                  targetFocus: 'Supported Abdominal Crunch',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable reverse crunch',
                  formCue: 'Attach ankles to low pulley; curl pelvis toward chest against cable tension.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20reverse%20crunch%20proper%20form',
                  targetFocus: 'Loaded Lower Abdominal Flexion',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'lying leg raise with light dumbbell',
                  formCue: 'Grip light dumbbell between feet; raise legs curling hips up off bench.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lying%20leg%20raise%20with%20dumbbell%20proper%20form',
                  targetFocus: 'Loaded Core Flexion',
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
              loadGuidance: 'Exhale fully to pull lower ribs down into abs. 20kg target.',
              formCueText: 'Exhale fully to pull lower ribs down into abs. Brace core; curl torso down smoothly; 1s bottom pause.',
              videoUrl: 'https://www.youtube.com/results?search_query=machine%20crunch%20proper%20form%20proper%20form',
              targetMuscleGroups: ['Rectus Abdominis', 'Upper Abdominals', 'Core'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated crunch',
                  formCue: 'Exhale fully on curl; pull rib cage toward pelvis.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20crunch%20proper%20form%20proper%20form',
                  targetFocus: 'Direct Abdominal Hypertrophy',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable kneeling crunch',
                  formCue: 'Kneel in front of cable tower; pull rope handles down while curling torso.',
                  videoUrl: 'https://www.youtube.com/results?search_query=kneeling%20cable%20crunch%20form%20proper%20form',
                  targetFocus: 'Constant Tension Abdominal Curl',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'weighted sit-up',
                  formCue: 'Hold light dumbbell on chest; curl up vertebra by vertebra.',
                  videoUrl: 'https://www.youtube.com/results?search_query=weighted%20sit%20up%20form%20proper%20form',
                  targetFocus: 'Free Weight Rectus Abdominis Overload',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'floor dead bug with exhale',
                  formCue: 'Press lumbar flat into floor; extend opposite limbs while exhaling for 5 full seconds.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dead%20bug%20exercise%20proper%20form%20proper%20form',
                  targetFocus: 'Deep Transverse Abdominis Bracing',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------
    // THURSDAY (DAY 4): POSTERIOR CHAIN (DUMBBELL RDL & GLUTE BRIDGE MACHINE), PRIORITY SHOULDERS, SEATED FLY & BICEPS
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
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 90,
              loadGuidance: '12.5kg per DB (25kg total). Hinge hips straight back to mid-shin; squeeze glutes to stand tall without arching lower spine.',
              formCueText: '12.5kg per DB (25kg total). Hinge hips straight back to mid-shin; keep lats tight and dumbbells scraping shins; stand tall squeezing glutes.',
              videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20romanian%20deadlift%20proper%20form%20proper%20form',
              targetMuscleGroups: ['Hamstrings', 'Glutes', 'Erector Spinae'],
              selectedEquipment: 'dumbbell',
              equipmentVariations: [
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell romanian deadlift',
                  formCue: 'Push hips backward towards wall; dumbbells track close to shins; soft knees.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20romanian%20deadlift%20proper%20form%20proper%20form',
                  targetFocus: 'Lengthened Hamstring & Glute Hinge',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'smith deadlift',
                  formCue: 'Set bar at knee height; hinge back and drive through heels.',
                  videoUrl: 'https://www.youtube.com/results?search_query=smith%20machine%20romanian%20deadlift%20form%20proper%20form',
                  targetFocus: 'Guided Hinge Overload',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pull through (with rope)',
                  formCue: 'Straddle low cable; hinge hips backward; stand tall and squeeze glutes.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20pull%20through%20form%20proper%20form',
                  targetFocus: 'Continuous Tension Posterior Chain',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'single-leg hip hinge (drinking bird)',
                  formCue: 'Stand on one foot; hinge torso forward keeping back straight; return under control.',
                  videoUrl: 'https://www.youtube.com/results?search_query=single%20leg%20deadlift%20bodyweight%20proper%20form',
                  targetFocus: 'Unilateral Posterior Chain & Pelvic Balance',
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
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 90,
              loadGuidance: 'Neutral grip at 10kg (Pin 1-2). Keep lower back and ribs glued flat to backrest. Progress reps 10 -> 15.',
              formCueText: 'Neutral grip at 10kg (Pin 1-2). Keep lower back and ribs glued flat to backrest. Press smoothly; 3s lowering.',
              videoUrl: 'https://www.youtube.com/results?search_query=machine%20shoulder%20press%20proper%20form%20proper%20form',
              targetMuscleGroups: ['Front Deltoids', 'Lateral Deltoids', 'Triceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever shoulder press',
                  formCue: 'Neutral grip handles; back flat against backrest; press up without arching lumbar spine.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20shoulder%20press%20proper%20form%20proper%20form',
                  targetFocus: 'Overhead Pressing Without Lumbar Arch',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'seated dumbbell shoulder press',
                  formCue: 'Sit with back supported; press dumbbells upward in gentle arc.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20dumbbell%20shoulder%20press%20form%20proper%20form',
                  targetFocus: 'Free Weight Deltoid Overload',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable kneeling overhead press',
                  formCue: 'Tall kneeling on mat; press cable handles overhead maintaining locked core.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20kneeling%20shoulder%20press%20proper%20form',
                  targetFocus: 'Anti-Extension Shoulder Pressing',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'pike push-up',
                  formCue: 'Hips elevated in V shape; lower crown of head toward floor; press up.',
                  videoUrl: 'https://www.youtube.com/results?search_query=pike%20push%20up%20form%20proper%20form',
                  targetFocus: 'Bodyweight Vertical Push',
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
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [1, 1] : [1, 1, 1]),
              restSeconds: 75,
              loadGuidance: 'Shoulders depressed down away from ears; pull elbows back at 45 deg. 30kg target.',
              formCueText: 'Shoulders depressed down away from ears; pull elbows back at 45 deg. Squeeze lower traps and rhomboids.',
              videoUrl: 'https://www.youtube.com/results?search_query=high%20cable%20row%20v%20bar%20proper%20form',
              targetMuscleGroups: ['Upper Back', 'Rear Deltoids', 'Rhomboids', 'Lower Traps'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable seated high row (v-bar)',
                  formCue: 'Set cable pulley above head level; pull to upper chest with scapular depression.',
                  videoUrl: 'https://www.youtube.com/results?search_query=high%20cable%20row%20v%20bar%20proper%20form',
                  targetFocus: 'Upper Back Thickness & Scapular Depression',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever t bar row',
                  formCue: 'Chest against pad; row handles toward lower ribs with elbows tucked.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest%20supported%20t%20bar%20row%20proper%20form',
                  targetFocus: 'Mid-Back Retraction',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'chest-supported high row',
                  formCue: 'Incline bench; flare elbows wide; row dumbbells with high elbows.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest%20supported%20rear%20delt%20row%20proper%20form',
                  targetFocus: 'Upper Lat & Posterior Deltoid Retraction',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'wide-grip inverted row',
                  formCue: 'Grip bar wide; pull chest to bar with flared elbows; hold 1s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=wide%20grip%20inverted%20row%20proper%20form',
                  targetFocus: 'Bodyweight Upper Back Retraction',
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
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 60,
              loadGuidance: 'Replaces assisted chest dip; back flat against pad. 25kg target for 10-12 reps.',
              formCueText: 'Replaces assisted chest dip; back flat against pad. Sweep handles forward converging at chest level; 1s sternal peak squeeze.',
              videoUrl: 'https://www.youtube.com/results?search_query=pec%20deck%20fly%20proper%20form%20proper%20form',
              targetMuscleGroups: ['Chest', 'Pectorals', 'Sternal Head'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever seated fly',
                  formCue: 'Back glued to pad; soft bend in elbows; bring pads together squeezing sternal pecs.',
                  videoUrl: 'https://www.youtube.com/results?search_query=pec%20deck%20fly%20proper%20form%20proper%20form',
                  targetFocus: 'Peak Shortened Chest Fly Contraction',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'flat bench dumbbell fly',
                  formCue: 'Lie on bench; open arms in wide arc; squeeze pecs to bring dumbbells together.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20fly%20form%20proper%20form',
                  targetFocus: 'Free Weight Sternal Pec Stretch',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable seated chest fly',
                  formCue: 'Sit upright; sweep handles together in hugging motion.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20seated%20chest%20fly%20form%20proper%20form',
                  targetFocus: 'Continuous Tension Cable Fly',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'push-up plus',
                  formCue: 'Top of push-up; push floor away protracting scapulae for serratus engagement.',
                  videoUrl: 'https://www.youtube.com/results?search_query=push%20up%20plus%20proper%20form%20proper%20form',
                  targetFocus: 'Scapular Protraction & Chest Integration',
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
              sets: standardSets,
              warmupSets: 0,
              targetWeightKg: 5,
              repRangeLow: 8,
              repRangeHigh: 15,
              rirScheme: isDeload ? [3, 4] : (standardSets === 2 ? [2, 2] : [2, 2, 1]),
              restSeconds: 60,
              loadGuidance: 'LEFT-ARM LEADER RULE: Keep at 5kg! Hold cable column, tuck pelvis under, Left Arm first in 30-deg forward plane. Progress reps 8 -> 15.',
              formCueText: 'LEFT ARM FIRST! Left-Arm Leader Rule: tuck pelvis under; lead with elbow; 1s hold at shoulder level; control descent.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20one%20arm%20lateral%20raise%20proper%20form',
              targetMuscleGroups: ['Lateral Deltoids'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable one arm lateral raise',
                  formCue: 'Left arm first; cable behind legs; raise to 80° shoulder level; match exact reps on right.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20one%20arm%20lateral%20raise%20proper%20form',
                  targetFocus: 'Left-Arm Motor Calibration & Side Delt',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever lateral raise',
                  formCue: 'Pads on elbows; raise smoothly to shoulder height; 1s squeeze at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lever%20lateral%20raise%20machine%20proper%20form',
                  targetFocus: 'Lateral Deltoid Capping',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell seated lateral raise',
                  formCue: 'Sit tall; raise dumbbells in scapular plane with soft elbows.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated%20dumbbell%20lateral%20raise%20proper%20form',
                  targetFocus: 'Seated Lateral Deltoid Overload',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'side-lying lateral deltoid raise',
                  formCue: 'Lie on side; raise arm smoothly to 80 degrees with controlled tempo.',
                  videoUrl: 'https://www.youtube.com/results?search_query=side%20lying%20lateral%20raise%20proper%20form',
                  targetFocus: 'Unloaded Deltoid Motor Pattern',
                },
              ],
            },
            // Exercise 6: barbell glute bridge (1409) [Glute Bridge Machine]
            {
              id: `${weekId}_d3_ep6`,
              exerciseId: 'ex_1409',
              exerciseName: 'barbell glute bridge',
              sets: 2,
              warmupSets: 0,
              targetWeightKg: 30,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: isDeload ? [3, 4] : [1, 1],
              restSeconds: 60,
              loadGuidance: 'Use dedicated Glute Bridge Machine! Keep chin tucked, ribs down, drive through heels, and hold posterior pelvic squeeze for 2s at top. 30kg target.',
              formCueText: 'GLUTE BRIDGE MACHINE: Chin tucked toward chest, ribs locked down flat. Drive through heels until torso is parallel; tilt belt buckle toward chin and squeeze glutes hard for 2 full seconds.',
              videoUrl: 'https://www.youtube.com/results?search_query=machine%20hip%20thrust%20proper%20form%20proper%20form',
              targetMuscleGroups: ['Gluteus Maximus', 'Glutes', 'Hamstrings', 'Pelvic Neutral Alignment'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'barbell glute bridge',
                  formCue: 'Use dedicated Glute Bridge Machine. Chin tucked, drive through heels, 2s peak glute contraction in posterior pelvic tilt.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20hip%20thrust%20proper%20form%20proper%20form',
                  targetFocus: 'Peak Shortened Gluteus Maximus & Anti-Pelvic-Tilt',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'dumbbell hip thrust',
                  formCue: 'Upper back on bench, dumbbell placed across hips; drive through heels.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell%20hip%20thrust%20form%20proper%20form',
                  targetFocus: 'Free Weight Glute Thrust',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable pull-through',
                  formCue: 'Straddle low cable; hinge hips backward; stand tall and squeeze glutes hard.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20pull%20through%20form%20proper%20form',
                  targetFocus: 'Cable Glute Extension',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'feet-elevated single-leg glute bridge',
                  formCue: 'Feet elevated on bench; drive single heel down extending hips fully with 2s squeeze.',
                  videoUrl: 'https://www.youtube.com/results?search_query=single%20leg%20glute%20bridge%20form%20proper%20form',
                  targetFocus: 'Unilateral Bodyweight Pelvic Tilt',
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
              loadGuidance: 'Two-handed EZ-bar at low pulley; squeeze glutes so lower back stays flat. 20kg target.',
              formCueText: 'Two-handed EZ-bar at low pulley; squeeze glutes so lower back stays flat. Curl bar upward; 1s contraction squeeze, 3s eccentric.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable%20bicep%20curl%20proper%20form%20proper%20form',
              targetMuscleGroups: ['Biceps', 'Biceps Brachii', 'Brachialis'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'cable curl',
                  formCue: 'Low pulley with straight bar or EZ-bar; keep elbows locked by sides; curl smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable%20bicep%20curl%20proper%20form%20proper%20form',
                  targetFocus: 'Continuous Biceps Tension',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'lever bicep curl',
                  formCue: 'Sit with upper arms on pad; curl handles upward under strict control.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine%20bicep%20curl%20form%20proper%20form',
                  targetFocus: 'Machine Biceps Isolation',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'standing dumbbell curl',
                  formCue: 'Stand tall with neutral spine; curl dumbbells rotating palms up at peak.',
                  videoUrl: 'https://www.youtube.com/results?search_query=standing%20dumbbell%20curl%20form%20proper%20form',
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
    // SATURDAY (DAY 6): ACTIVE RECOVERY & PRE-MATCH GLYCOGEN LOADING
    // ----------------------------------------------------
    {
      id: `${weekId}_d5`,
      weekId,
      dayOfWeek: 5,
      label: 'Saturday: Active Recovery & Pre-Match Glycogen Loading',
      isRestDay: true,
      morningRoutine: morningAlignmentDrills,
      nutrition: restDayNutrition,
      blocks: [],
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

  const weeks: ProgramWeek[] = [];
  for (let w = 1; w <= 16; w++) {
    const weekId = `prog_master_w${w}`;
    weeks.push({
      id: weekId,
      programId: 'prog_master_16w_final',
      weekIndex: w,
      days: createBlueprintDays(weekId, w),
    });
  }

  return {
    id: 'prog_master_16w_final',
    trainerId: 'trainer_alaa',
    traineeId: 'trainee_alaa',
    title: 'The Master 16-Week Protocol (Shoulder-Priority, Posture & 480 Daily Stairs Compensated)',
    startDate: startStr,
    endDate: endStr,
    durationWeeks: 16,
    status: 'published',
    version: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    weeks,
  };
}

// Backward-compatible alias
export const generateMaster12WeekProgram = generateMaster16WeekProgram;

// ==========================================
// 6. SUPPLEMENTS & HYDRATION
// ==========================================

export const masterSupplementProtocols: SupplementProtocol[] = [
  {
    id: 'sp_creatine_master',
    programId: 'prog_master_16w_final',
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
    programId: 'prog_master_16w_final',
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
  programId: 'prog_master_16w_final',
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
