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

// Trainee: Alaa
export const userAlaa: User = {
  id: 'trainee_alaa',
  role: 'trainee',
  name: 'Alaa',
  email: 'alaa@vyra.fit',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
  heightCm: 173,
  sex: 'male',
  dob: '1987-03-15',
  injuries: [
    'Clinically Underweight (BMI 16.4 / 49 kg at 173 cm: consult physician or registered dietitian before starting to rule out underlying medical issues and ensure safe weight gain)',
    'Detrained Lifter (11-month layoff: muscle memory allows strength and volume to return rapidly; Weeks 1–3 conservative baseline loading)',
    'Anterior Pelvic Tilt (APT) & Forward Pelvic Sway (load glutes, hamstrings, and anterior core; avoid lumbar hyperextension; frequent position changes every 45–60 min)',
    'Shoulder Internal Rotation (mandates strict 2:1 pull-to-push volume, strengthening retractors, rear delts, and lower traps)',
    'Monday Night Football Management (high-velocity sprinting & cutting: Tuesday maintenance load vs Thursday primary overload)',
  ],
  goals: [
    'Rebuild Clavicular Upper Chest Shelf (30° upward pressing path with full serratus protraction)',
    'V-Taper Lat Width & Scapular Retraction (2:1 pull-to-push volume balance opposing desk internal rotation)',
    'Deconflicted Football & Lower-Body Recovery: Lower loading Wed (40h post-match) & Thu (72h post-match RDL)',
    'Gain +0.25 to +0.40 kg/week lean mass on 7-day rolling average via phased 3-tier caloric architecture',
    'Upper-Frame Widening: 3x/Week Side Delt Matrix (Mon Hit 1, Wed Hit 2, Thu Hit 3 drop set finish)',
    'Strict 3-Slot Workout Ceiling (34 mins lifting time: fits 45-min lunch break with zero rush)',
  ],
  hideWeightFromTrainee: false,
};

export const linkAlaa: TrainerLink = {
  trainerId: 'trainer_alaa',
  traineeId: 'trainee_alaa',
  status: 'active',
  createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
};

// Embedded Gym Warm-Up & Alignment Drills (12:15 – 12:18 PM | 3 Minutes Total - Zero Morning Friction)
export const morningAlignmentDrills: string[] = [
  'Standing Hip Flexor / Glute Drive (60s total): Staggered stance, rear glute squeezed hard, pelvis tucked under to lengthen psoas. 30s per side',
  'Wall Slides with Chin Tuck (60s): Back and head against wall, chin tucked. Slide arms from W to Y for 10 slow reps to engage lower traps, serratus, deep neck flexors',
  'High-Angle Doorway Pec Minor Stretch (60s): Forearm on doorframe with elbow at eye level (120° angle). Step through gently 30s per side to eliminate forward coracoid pull',
];

// Daily Ergonomics, Commute & Biofeedback Anchors
export const workdayErgonomicsRoutines: string[] = [
  'The Car Mirror Biofeedback Anchor (65-min Commute): Adjust rear-view mirror 1 cm higher sitting upright with skull touching headrest. Slouching causes loss of rear visibility as biofeedback',
  'The Hourly Stand & Squeeze (Office): Stand up every 60 min, unlock knees, shift 60% weight to heels, squeeze glutes 5s, 2 diaphragmatic breaths, sit on sit bones',
  'Post-Lunch Walk (14:00 – 14:15): 10–15 minutes relaxed outdoor walk to aid gastric emptying and glucose partitioning',
  'The Desk-Drawer Fuel Protocol (11:50): 1 Rice Krispies Treat OR 30g gummy bears OR 3 Ajwa dates + 250ml water for rapid low-fat glycogen without gut fullness',
];

// Monday Schedule (Upper A Gym Session + 19:00 Football Match: ~3,150 kcal / ~155g P)
export const mondayDailyMeals: DailyMealSlot[] = [
  {
    time: '07:30',
    label: 'Wake Up & Hydration (Zero morning physical tasks)',
    foods: '500 ml plain water',
    supplements: 'None',
    rationale: 'Friction-free morning. Zero floor drills; morning posture work embedded directly into gym warm-up.',
    calories: 0,
    proteinGrams: 0,
  },
  {
    time: '08:00',
    label: 'Car Commute: Dates + Rear-View Mirror Posture Cue',
    foods: '7 Ajwa Dates (~75g) + 300 ml water',
    supplements: 'None (Daytime supplement remembering eliminated; unified evening dinner stack)',
    rationale: 'Car mirror biofeedback: adjust mirror 1 cm higher sitting tall with head against headrest.',
    calories: 200,
    proteinGrams: 2,
  },
  {
    time: '10:30',
    label: 'Desk Shake Serving 1 (Phase 2/3 Only)',
    foods: 'Half-Batch Low-Osmolarity Digestive Shake (175ml lactose-free milk, 30g oats, 15g whey isolate, 15g peanut butter, 1/2 banana)',
    supplements: 'None',
    rationale: 'Phase 1 skips this. Phase 2/3 adds ~425 kcal whole-food shake to adapt digestive enzymes smoothly.',
    calories: 425,
    proteinGrams: 27,
  },
  {
    time: '11:50',
    label: 'Desk-Drawer Fuel (Pre-Gym 11:50)',
    foods: '1 Rice Krispies Treat (~23g carbs, 2g fat) OR 30g Haribo Gummy Bears OR 3 Ajwa Dates + 250 ml water',
    supplements: 'None',
    rationale: 'Rapid low-fat carbohydrates when meetings run until noon. Zero gastric delay or fullness.',
    calories: 120,
    proteinGrams: 1,
  },
  {
    time: '12:15',
    label: 'Embedded Warm-Up & Upper A Working Sets (34 Mins Max)',
    foods: '500 ml water sipped during session',
    supplements: 'None',
    rationale: 'Strict 3-slot ceiling (Incline Press, Overhead Triceps, Lateral Delts Hit 1). Legs 100% fresh for football.',
    calories: 0,
    proteinGrams: 0,
  },
  {
    time: '13:30',
    label: 'Office Restaurant Lunch + 15-Min Walk',
    foods: '200–250g cooked rice or pasta, 130–150g chicken/beef/fish, cooked greens, 1 tbsp olive oil drizzled on carbs',
    supplements: 'None',
    rationale: 'Solid whole-food post-workout meal. Followed by 15-minute outdoor walk to aid gastric emptying.',
    calories: 700,
    proteinGrams: 38,
  },
  {
    time: '16:00',
    label: 'Low-Osmolarity Shake (Serving 2 / Phase 1 Staple)',
    foods: 'Low-Osmolarity Digestive Shake (~425 kcal: oats, whey isolate, nut butter, banana, lactose-free milk)',
    supplements: 'None',
    rationale: 'Phase 1: Only shake of the day (~425 kcal). Phase 2/3: Serving 2 of daily batch (~425 kcal).',
    calories: 425,
    proteinGrams: 27,
  },
  {
    time: '18:15',
    label: 'Pre-Match Fuel (Zero Gut Slosh)',
    foods: '3 Ajwa Dates + 300 ml water with 1/4 tsp salt',
    supplements: 'Sodium (1/4 tsp table salt)',
    rationale: 'Zero fats or heavy proteins. Eliminates gut sloshing during sprints at 19:00 kickoff.',
    calories: 85,
    proteinGrams: 1,
  },
  {
    time: '19:00',
    label: 'Indoor 5-a-Side Football Match (60 Mins)',
    foods: '750 ml water sipped during match',
    supplements: 'None',
    rationale: 'High-velocity eccentric cutting and sprinting (burns ~500–600 kcal).',
    calories: 0,
    proteinGrams: 0,
  },
  {
    time: '20:15',
    label: 'Post-Match Glycogen & Tissue Recovery Drink',
    foods: '1 scoop Whey Protein Isolate + 30g Dextrose powder (or 1.5 tbsp honey) in 400 ml water',
    supplements: 'None',
    rationale: 'Halts muscle breakdown and rapidly initiates glycogen resynthesis without digestive stress.',
    calories: 235,
    proteinGrams: 26,
  },
  {
    time: '21:30',
    label: 'Family Dinner + UNIFIED PILL STACK',
    foods: 'Starchy carbs (rice/potatoes/bread), meat/fish, fresh salad with 1–2 tbsp Extra Virgin Olive Oil',
    supplements: 'Creatine Monohydrate (5g) + Vitamin D3/K2 + Omega-3 Fish Oil (1,000–1,500mg) + Magnesium Bisglycinate (300mg)',
    rationale: '100% of supplements beside dinner plate. Zero daytime remembering. Creatine at night completely out of pre-match window.',
    calories: 800,
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

// Standard Training Days (Tuesday – Thursday: Upper B, Lower A, Lower B)
export const standardDailyMeals: DailyMealSlot[] = [
  {
    time: '07:30',
    label: 'Wake Up & Hydration (Zero morning physical tasks)',
    foods: '500 ml plain water',
    supplements: 'None',
    rationale: 'Friction-free morning. Zero morning floor drills.',
    calories: 0,
    proteinGrams: 0,
  },
  {
    time: '08:00',
    label: 'Car Commute: Dates, Nuts & Mirror Posture Cue',
    foods: '7 Ajwa Dates (~75g) + 30g raw nuts + 300 ml water',
    supplements: 'None (Unified dinner stack)',
    rationale: 'Rear-view mirror biofeedback cue: slouching loses rear visibility.',
    calories: 380,
    proteinGrams: 6,
  },
  {
    time: '10:30',
    label: 'Desk Shake Serving 1 (Phase 2/3 Only)',
    foods: 'Half-Batch Low-Osmolarity Digestive Shake (~425 kcal)',
    supplements: 'None',
    rationale: 'Phase 2/3: Serving 1 at desk. Phase 1 skips this.',
    calories: 425,
    proteinGrams: 27,
  },
  {
    time: '11:50',
    label: 'Desk-Drawer Fuel (Pre-Gym 11:50)',
    foods: '1 Rice Krispies Treat OR 30g Haribo Gummy Bears OR 3 Ajwa Dates + 250 ml water',
    supplements: 'None',
    rationale: 'Desk-drawer protocol for rapid low-fat energy when meetings run until 12:00.',
    calories: 120,
    proteinGrams: 1,
  },
  {
    time: '12:15',
    label: 'Embedded Warm-Up & Gym Working Sets (34 Mins Max)',
    foods: '500 ml water sipped during session',
    supplements: 'None',
    rationale: 'Strict 3-slot ceiling (9 sets total). Leaves time to wipe down and change clothes.',
    calories: 0,
    proteinGrams: 0,
  },
  {
    time: '13:30',
    label: 'Office Restaurant Lunch + 15-Min Walk',
    foods: '200–250g cooked rice or pasta, 130–150g chicken/beef/fish, cooked greens, 1 tbsp olive oil',
    supplements: 'None',
    rationale: 'Whole-food nutrition. 15-min walk breaks hip flexion and accelerates glucose partitioning.',
    calories: 700,
    proteinGrams: 38,
  },
  {
    time: '16:00',
    label: 'Low-Osmolarity Shake (Serving 2 / Phase 1 Staple)',
    foods: 'Low-Osmolarity Digestive Shake (~425 kcal: oats, whey isolate, nut butter, banana, lactose-free milk)',
    supplements: 'None',
    rationale: 'Phase 1: Only shake of day. Phase 2/3: Serving 2.',
    calories: 425,
    proteinGrams: 27,
  },
  {
    time: '21:30',
    label: 'Family Dinner + UNIFIED PILL STACK',
    foods: 'Balanced home-cooked meal + salad with 1–2 tbsp Extra Virgin Olive Oil',
    supplements: 'Creatine Monohydrate (5g) + Vitamin D3/K2 + Omega-3 Fish Oil + Magnesium Bisglycinate (300mg)',
    rationale: 'Unified dinner stack beside dinner plate. Fat-soluble D3/K2 absorbed with dietary fats.',
    calories: 800,
    proteinGrams: 35,
  },
  {
    time: '23:30',
    label: 'Sleep (8 Hours)',
    foods: 'Plain water as needed',
    supplements: 'None (Taken with dinner)',
    rationale: 'Neuromuscular sleep recovery.',
    calories: 0,
    proteinGrams: 0,
  },
];

// Friday – Sunday Schedule (The Weekend Anchor Protocol)
export const weekendDailyMeals: DailyMealSlot[] = [
  {
    time: '09:00',
    label: 'Wake Up + Hydration',
    foods: '500 ml plain water',
    supplements: 'None',
    rationale: 'Weekend rhythm.',
    calories: 0,
    proteinGrams: 0,
  },
  {
    time: '10:00',
    label: 'Weekend Brunch',
    foods: '3 Whole Eggs + 2 Slices Toasted Bread + 1 Avocado / Butter',
    supplements: 'None',
    rationale: 'High-quality fats and bioavailable protein.',
    calories: 550,
    proteinGrams: 24,
  },
  {
    time: '13:30',
    label: 'Solid Lunch',
    foods: 'Rice/Pasta + Ground Beef/Chicken/Fish + Vegetables + Olive Oil',
    supplements: 'None',
    rationale: 'Whole-food weekend nutrition.',
    calories: 700,
    proteinGrams: 38,
  },
  {
    time: '16:00',
    label: 'THE WEEKEND ANCHOR SHAKE',
    foods: 'Phase 1: Half-Batch Shake (~425 kcal) | Phase 2/3: Full-Batch Shake (~850 kcal consumed across afternoon)',
    supplements: 'None',
    rationale: 'Mandatory weekend anchor shake so total weekly caloric surplus never drops into a deficit.',
    calories: 600,
    proteinGrams: 35,
  },
  {
    time: '21:00',
    label: 'Family Dinner + UNIFIED PILL STACK',
    foods: 'Balanced solid meal + salad with 1–2 tbsp Olive Oil',
    supplements: 'Creatine Monohydrate (5g) + Vitamin D3/K2 + Omega-3 Fish Oil + Magnesium Bisglycinate (300mg)',
    rationale: 'Unified dinner stack beside dinner plate.',
    calories: 800,
    proteinGrams: 35,
  },
  {
    time: '23:30',
    label: 'Sleep',
    foods: 'Plain water as needed',
    supplements: 'None',
    rationale: 'Parasympathetic tissue rebuilding.',
    calories: 0,
    proteinGrams: 0,
  },
];

export const restDayDailyMeals: DailyMealSlot[] = weekendDailyMeals;

// Backward-compatible alias
export const masterDailyMeals = standardDailyMeals;

// Monday Match Day Nutrition Prescription (~3,150 kcal | ~155g Protein)
export const mondayNutrition: MealPlanPrescription = {
  targetKcal: 3150,
  targetProteinGrams: 155,
  preWorkoutTiming: '11:50 Desk-Drawer Fuel & 18:15 Pre-Football Fast Carbs',
  preWorkoutFoods: '11:50: Rice Krispies Treat or Haribo or 3 Dates | 18:15: 3 Dates + 300ml water with 1/4 tsp salt',
  supplements: [
    { name: 'Unified Dinner Stack', dosage: 'Creatine 5g, D3/K2, Omega-3, Magnesium 300mg', timing: '21:30 Dinner (completely outside pre-football window)' },
  ],
  dailyMeals: mondayDailyMeals,
  notes: 'Monday Match Day Caloric Compensation: ~3,150 kcal / ~155g Protein. Offsets match expenditure. Post-match 20:15 whey isolate + dextrose shake halts catabolism.',
};

// Standard Training Day Nutrition Prescription (~2,750 kcal | ~125g Protein)
export const workoutDayNutrition: MealPlanPrescription = {
  targetKcal: 2750,
  targetProteinGrams: 125,
  preWorkoutTiming: '11:50 Desk-Drawer Fuel (10 min prior to gym)',
  preWorkoutFoods: '1 Rice Krispies Treat OR 30g Gummy Bears OR 3 Dates + 250 ml water',
  supplements: [
    { name: 'Unified Dinner Stack', dosage: 'Creatine 5g, D3/K2, Omega-3, Magnesium 300mg', timing: '21:30 Dinner' },
  ],
  dailyMeals: standardDailyMeals,
  notes: 'Standard Training Days (Tue–Thu): ~2,750 kcal / ~125g Protein. Low-osmolarity digestive shake prevents osmotic bloating. 1–2 tbsp olive oil on dinner adds clean density.',
};

export const restDayNutrition: MealPlanPrescription = {
  targetKcal: 2600,
  targetProteinGrams: 120,
  preWorkoutTiming: 'The Weekend Anchor Protocol (Fri–Sun)',
  preWorkoutFoods: 'Whole-food meals + Mandatory Weekend Anchor Shake at 16:00',
  supplements: [
    { name: 'Unified Dinner Stack', dosage: 'Creatine 5g, D3/K2, Omega-3, Magnesium 300mg', timing: '21:00 Dinner' },
  ],
  dailyMeals: weekendDailyMeals,
  notes: 'Weekend Anchor Protocol: Mandatory afternoon digestive shake protects the weekly caloric surplus from dropping into a deficit when office routines disappear.',
};

// Program Days Factory for 16-Week Blueprint (Strict 3-Slot Ceiling | 34 Mins Max)
export function createBlueprintDays(weekId: string, _weekIndex?: number): ProgramDay[] {
  return [
    // MONDAY: Upper Body A (Chest, Triceps, Lateral Delt Hit 1) — Legs 100% fresh for 19:00 match
    {
      id: `${weekId}_d0`,
      weekId,
      dayOfWeek: 0,
      label: 'Monday: Upper Body A (Chest, Triceps, Lateral Delt Hit 1)',
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: mondayNutrition,
      blocks: [
        {
          id: `${weekId}_d0_b1`,
          order: 1,
          type: 'straight',
          exercises: [
            // Slot 1: Clavicular Upper Chest Press
            {
              id: `${weekId}_d0_ep1`,
              exerciseId: 'ex_incline_machine_press',
              exerciseName: 'Incline Machine Chest Press',
              sets: 3,
              repRangeLow: 6,
              repRangeHigh: 8,
              rirScheme: [2, 2, 1],
              restSeconds: 90,
              loadGuidance: 'Adjust seat so handles align with upper clavicles; press upward along 30° incline. Cap at 1–2 RIR. 3-second eccentric lower.',
              formCueText: 'Cap compound presses at 1–2 RIR max. Natural protraction at lockout.',
              videoUrl: 'https://www.youtube.com/results?search_query=incline+chest+press+machine+form',
              targetMuscleGroups: ['Upper Chest', 'Front Deltoids', 'Triceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'Incline Machine Chest Press',
                  formCue: 'Adjust seat so handles align with clavicles; drive along 30° incline path.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline+chest+press+machine+form',
                  targetFocus: 'Clavicular Upper Chest',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: '30° Incline Dumbbell Press',
                  formCue: 'Set bench to 30°; lower under control; press inward without banging dumbbells.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline+dumbbell+press+proper+form',
                  targetFocus: 'Clavicular Upper Chest',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'Incline Cable Chest Press',
                  formCue: 'Incline bench between low pulleys; press handles up and together smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline+cable+chest+press+form',
                  targetFocus: 'Clavicular Upper Chest',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'Feet-Elevated Decline Push-ups',
                  formCue: 'Toes on flat bench; lower upper chest to floor; full scapular protraction at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=decline+push+ups+proper+form',
                  targetFocus: 'Clavicular Upper Chest',
                },
              ],
            },
            // Slot 2: Triceps Long Head
            {
              id: `${weekId}_d0_ep2`,
              exerciseId: 'ex_cable_triceps_ext',
              exerciseName: 'Overhead Cable Rope Extension',
              sets: 3,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: [1, 1, 0],
              restSeconds: 60,
              loadGuidance: 'Upper arms locked vertical beside ears. Hinge strictly at elbow. Set 1: 1 RIR, Set 2: 1 RIR, Set 3: 0 RIR technical failure.',
              formCueText: 'Elbows pinned beside ears; stretch triceps long head. Set 3 to 0 RIR.',
              videoUrl: 'https://www.youtube.com/results?search_query=overhead+cable+rope+triceps+extension+form',
              targetMuscleGroups: ['Triceps (Long Head)'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'Seated Overhead Triceps Machine',
                  formCue: 'Seat adjusted so elbow joints align directly with machine pivot axis.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated+overhead+triceps+machine+form',
                  targetFocus: 'Triceps Long Head',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'Seated Two-Arm Overhead DB Extension',
                  formCue: 'Cup top inner plate of dumbbell; lower behind skull; keep elbows narrow.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated+dumbbell+overhead+triceps+extension+form',
                  targetFocus: 'Triceps Long Head',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'Overhead Cable Rope Extension',
                  formCue: 'Low pulley rope; hinge slightly forward; extend elbows overhead spreading rope ends.',
                  videoUrl: 'https://www.youtube.com/results?search_query=overhead+cable+rope+triceps+extension+form',
                  targetFocus: 'Triceps Long Head',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'Bodyweight Triceps Extension (Bench)',
                  formCue: 'Hands on bench; incline plank; dip head under hands and press back up.',
                  videoUrl: 'https://www.youtube.com/results?search_query=bodyweight+tricep+extension+form',
                  targetFocus: 'Triceps Long Head',
                },
              ],
            },
            // Slot 3: Lateral Delts (Hit 1)
            {
              id: `${weekId}_d0_ep3`,
              exerciseId: 'ex_cable_lateral_raise_mon',
              exerciseName: 'Behind-the-Back Cable Lateral Raise',
              sets: 3,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: [1, 1, 0],
              restSeconds: 60,
              loadGuidance: 'Sweep hands wide toward walls. Depress shoulder blades away from ears. Set 1: 1 RIR, Set 2: 1 RIR, Set 3: 0 RIR technical failure.',
              formCueText: 'Sweep wide in scapular plane; Set 3 to 0 RIR technical failure.',
              videoUrl: 'https://www.youtube.com/results?search_query=behind+the+back+cable+lateral+raise+form',
              targetMuscleGroups: ['Side Deltoids'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'Seated Lateral Raise Machine',
                  formCue: 'Seat adjusted so machine pivot aligns with lateral delt; pause 1s at top.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated+lateral+raise+machine+form',
                  targetFocus: 'Lateral Deltoids',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'Seated Dumbbell Lateral Raise',
                  formCue: 'Sit upright; sweep outward with pinkies slightly higher than thumbs.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated+dumbbell+lateral+raise+form',
                  targetFocus: 'Lateral Deltoids',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'Behind-the-Back Cable Lateral Raise',
                  formCue: 'Pulley at wrist height; reach behind back; sweep outward along scapular plane.',
                  videoUrl: 'https://www.youtube.com/results?search_query=behind+the+back+cable+lateral+raise+form',
                  targetFocus: 'Lateral Deltoids',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'Side-Plank Deltoid Isometric Hold',
                  formCue: 'Full side-plank; raise top arm vertically toward ceiling under tension for 30s/side.',
                  videoUrl: 'https://www.youtube.com/results?search_query=side+plank+deltoid+isometric+hold',
                  targetFocus: 'Lateral Deltoids',
                },
              ],
            },
          ],
        },
      ],
    },

    // TUESDAY: Upper Body B (Lats, Upper Back Retraction, Biceps) — Legs rest 100% post-football
    {
      id: `${weekId}_d1`,
      weekId,
      dayOfWeek: 1,
      label: 'Tuesday: Upper Body B (Lats, Upper Back Retraction, Biceps)',
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: workoutDayNutrition,
      blocks: [
        {
          id: `${weekId}_d1_b1`,
          order: 1,
          type: 'straight',
          exercises: [
            // Slot 1: Vertical Pull (Lat Width)
            {
              id: `${weekId}_d1_ep1`,
              exerciseId: 'ex_neutral_lat_pulldown',
              exerciseName: 'Neutral-Grip Lat Pulldown',
              sets: 3,
              repRangeLow: 6,
              repRangeHigh: 8,
              rirScheme: [2, 2, 1],
              restSeconds: 90,
              loadGuidance: 'Mandatory lifting straps. Initiate by depressing scapulae; pull elbows down to pockets. Cap at 1–2 RIR.',
              formCueText: 'Use straps. Drive elbows down toward back pockets; tall chest.',
              videoUrl: 'https://www.youtube.com/results?search_query=neutral+grip+lat+pulldown+form',
              targetMuscleGroups: ['Lats', 'Upper Back'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'Neutral-Grip Lat Pulldown',
                  formCue: 'Use straps. Close/parallel grip; depress scapulae; pull attachment to upper chest.',
                  videoUrl: 'https://www.youtube.com/results?search_query=neutral+grip+lat+pulldown+form',
                  targetFocus: 'Lat Width & Scapular Depression',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'Single-Arm Dumbbell Lat Row (Tucked)',
                  formCue: 'Knee and hand on bench; elbow tucked tight; pull dumbbell in arc toward hip crest.',
                  videoUrl: 'https://www.youtube.com/results?search_query=single+arm+dumbbell+lat+row+form',
                  targetFocus: 'Lat Width & Scapular Depression',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'Kneeling Dual-Cable Lat Pulldown',
                  formCue: 'Kneel between two high pulleys; pull both elbows straight down into sides.',
                  videoUrl: 'https://www.youtube.com/results?search_query=kneeling+dual+cable+lat+pulldown+form',
                  targetFocus: 'Lat Width & Scapular Depression',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'Assisted Neutral-Grip Pull-Up',
                  formCue: 'Parallel-grip pull-up bar (or band under knees); pull chest to bar; pause.',
                  videoUrl: 'https://www.youtube.com/results?search_query=neutral+grip+pull+up+proper+form',
                  targetFocus: 'Lat Width & Scapular Depression',
                },
              ],
            },
            // Slot 2: Upper Back Row & Scapular Retraction
            {
              id: `${weekId}_d1_ep2`,
              exerciseId: 'ex_seated_cable_row',
              exerciseName: 'Chest-Supported Machine Row',
              sets: 3,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: [2, 2, 1],
              restSeconds: 90,
              loadGuidance: 'Mandatory lifting straps. Chest glued to pad. Full protraction at stretch; retract and pause 1s at contraction.',
              formCueText: 'Chest glued to pad. Retract shoulder blades, pause 1 second at top.',
              videoUrl: 'https://www.youtube.com/results?search_query=chest+supported+machine+row+form',
              targetMuscleGroups: ['Rhomboids', 'Mid Back', 'Rear Deltoids'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'Chest-Supported Machine Row',
                  formCue: 'Wide horizontal handles; fully protract at stretch; drive elbows back and squeeze 1s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest+supported+machine+row+form',
                  targetFocus: 'Upper Back Retraction',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'Chest-Supported Incline DB Row',
                  formCue: 'Prone on 45° incline bench; pronated or semi-pronated grip; lead with elbows; pause.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest+supported+incline+dumbbell+row+form',
                  targetFocus: 'Upper Back Retraction',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'Seated Cable Row (Neutral V-Bar)',
                  formCue: 'Upright torso; pull V-handle to navel without rocking; squeeze mid-back tightly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated+cable+row+proper+form',
                  targetFocus: 'Upper Back Retraction',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'Inverted Bodyweight Row (Bar/TRX)',
                  formCue: 'Hang beneath fixed barbell at waist height; heels on floor; pull sternum to bar.',
                  videoUrl: 'https://www.youtube.com/results?search_query=inverted+row+proper+form',
                  targetFocus: 'Upper Back Retraction',
                },
              ],
            },
            // Slot 3: Brachialis & Arm Thickness
            {
              id: `${weekId}_d1_ep3`,
              exerciseId: 'ex_hammer_curl',
              exerciseName: 'Incline DB Hammer Curl',
              sets: 3,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: [1, 1, 0],
              restSeconds: 60,
              loadGuidance: 'Thumbs pointing upward (neutral wrist). Pin elbows to sides. Set 1: 1 RIR, Set 2: 1 RIR, Set 3: 0 RIR technical failure.',
              formCueText: 'Thumbs pointing up; strict elbows pinned to ribs. Set 3 to 0 RIR.',
              videoUrl: 'https://www.youtube.com/results?search_query=incline+dumbbell+hammer+curl+form',
              targetMuscleGroups: ['Brachialis', 'Forearms', 'Biceps'],
              selectedEquipment: 'dumbbell',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'Preacher Curl Machine (Hammer Grip)',
                  formCue: 'Grip vertical handles; curl upward keeping wrists locked neutral.',
                  videoUrl: 'https://www.youtube.com/results?search_query=machine+hammer+curl+form',
                  targetFocus: 'Brachialis & Forearm Thickness',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'Incline DB Hammer Curl',
                  formCue: 'Sit on 60° incline bench; neutral grip; curl both weights without swinging.',
                  videoUrl: 'https://www.youtube.com/results?search_query=incline+dumbbell+hammer+curl+form',
                  targetFocus: 'Brachialis & Forearm Thickness',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'Cable Rope Hammer Curl',
                  formCue: 'Attach rope to low pulley; thumbs point up; curl keeping elbows pinned to ribs.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+rope+hammer+curl+form',
                  targetFocus: 'Brachialis & Forearm Thickness',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'Inverted Neutral-Grip Towel Row',
                  formCue: 'Drape towels over pull-up bar; grip vertically; row chest up using elbow flexion.',
                  videoUrl: 'https://www.youtube.com/results?search_query=towel+pull+ups+grip+strength',
                  targetFocus: 'Brachialis & Forearm Thickness',
                },
              ],
            },
          ],
        },
      ],
    },

    // WEDNESDAY: Lower Body A (Quads & Glutes) + Posture & Lateral Delt Cable Superset — 40 hours post-football
    {
      id: `${weekId}_d2`,
      weekId,
      dayOfWeek: 2,
      label: 'Wednesday: Lower Body A (Quads & Glutes) + Posture & Lateral Delt Cable Superset',
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: workoutDayNutrition,
      blocks: [
        {
          id: `${weekId}_d2_b1`,
          order: 1,
          type: 'straight',
          exercises: [
            // Slot 1: Quad & Glute Compound (Sway / Pelvic Alignment)
            {
              id: `${weekId}_d2_ep1`,
              exerciseId: 'ex_leg_press_high_wide',
              exerciseName: '45° Leg Press (Feet Mid/High Placement)',
              category: 'Primary Lower Body Compound (Machine)',
              sets: 3,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: [2, 2, 1],
              restSeconds: 90,
              loadGuidance: 'Feet placed shoulder-width, mid-to-high on the sled to prioritize glutes and distribute knee shear. Maintain a flat pelvis against the seat pad—stop depth before any lumbar tuck (butt wink).',
              formCueText: 'Feet placed shoulder-width, mid-to-high on the sled to prioritize glutes and distribute knee shear. Maintain a flat pelvis against the seat pad—stop depth before any lumbar tuck (butt wink).',
              videoUrl: 'https://www.youtube.com/results?search_query=high+foot+placement+leg+press+form',
              targetMuscleGroups: ['Glutes', 'Quadriceps'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: '45° Leg Press (Feet Mid/High Placement)',
                  formCue: 'Feet middle-to-high on platform; unlock sled; lower to 90°; press through heels.',
                  videoUrl: 'https://www.youtube.com/results?search_query=high+foot+placement+leg+press+form',
                  targetFocus: 'Primary Lower Body Compound (Machine)',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'Dumbbell Goblet Squat (Heels Elevated)',
                  formCue: 'Heels on low plates; hold DB vertically against sternum; squat between hips.',
                  videoUrl: 'https://www.youtube.com/results?search_query=heels+elevated+goblet+squat+form',
                  targetFocus: 'Primary Lower Body Compound (Machine)',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'Cable Belt Squat',
                  formCue: 'Stand over low pulley holding straight bar at arms length; squat deeply upright.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+squat+form',
                  targetFocus: 'Primary Lower Body Compound (Machine)',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'Deficit Reverse Lunge',
                  formCue: 'Stand on low platform; step back into deep lunge; front shin vertical; drive heel.',
                  videoUrl: 'https://www.youtube.com/results?search_query=deficit+reverse+lunge+form',
                  targetFocus: 'Primary Lower Body Compound (Machine)',
                },
              ],
            },
            // Slot 2: Knee Extensor / Patellar Tendon Conditioning (Football Deceleration Armor)
            {
              id: `${weekId}_d2_ep2`,
              exerciseId: 'ex_seated_leg_ext',
              exerciseName: 'Seated Leg Extension Machine',
              category: 'Quad Isolation (Machine)',
              sets: 3,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: [1, 1, 0],
              weekRirGuidance: {
                weeks1_2: 'Strictly 2 RIR (Tendon conditioning only; do NOT train to failure to avoid impacting Thursday RDLs)',
                week3Plus: 'Sets 1–2: 1 RIR | Set 3: 0 RIR (Technical failure)',
              },
              restSeconds: 75,
              loadGuidance: 'Hips flexed at 90° to isolate the vastus medialis and lateralis. Enforce a 3-second eccentric lowering phase and a 1-second pause at full extension to condition tendons for football deceleration.',
              formCueText: 'Hips flexed at 90° to isolate the vastus medialis and lateralis. Enforce a 3-second eccentric lowering phase and a 1-second pause at full extension to condition tendons for football deceleration.',
              videoUrl: 'https://www.youtube.com/results?search_query=seated+leg+extension+machine+form',
              targetMuscleGroups: ['Quadriceps', 'Vastus Medialis', 'Vastus Lateralis'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'Seated Leg Extension Machine',
                  formCue: 'Align knees with pivot; extend legs to horizontal; hold 1s; 3-second negative.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated+leg+extension+machine+form',
                  targetFocus: 'Quad Isolation (Machine)',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'DB Spanish Squat / 45s Weighted Wall Sit',
                  formCue: 'Band behind knees to post or 90° wall sit with DB on thighs; hold 45s per set.',
                  videoUrl: 'https://www.youtube.com/results?search_query=spanish+squat+with+dumbbell+form',
                  targetFocus: 'Quad Isolation (Machine)',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'Cable Terminal Knee Extension (TKE)',
                  formCue: 'Cable loop behind knee; step back; drive knee backward into full lockout (15 reps/leg).',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+terminal+knee+extension+form',
                  targetFocus: 'Quad Isolation (Machine)',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'Assisted Bodyweight Sissy Squat',
                  formCue: 'Hold post for balance; push knees forward and hips back leaning torso; press back up.',
                  videoUrl: 'https://www.youtube.com/results?search_query=bodyweight+sissy+squat+form',
                  targetFocus: 'Quad Isolation (Machine)',
                },
              ],
            },
          ],
        },
        // Slot 3: Station-Locked Cable Posture & Delt Superset (Single Column, Zero Transit)
        {
          id: `${weekId}_d2_b2`,
          order: 2,
          type: 'superset',
          tag: 'STATION-LOCKED SUPERSET',
          bannerText: 'STATION-LOCKED SUPERSET: Single Cable Column (Eye-level to Knee-level). Zero station transit.',
          rounds: 3,
          exercises: [
            // Sub-Movement 3A: Standing Cable Face Pull (External Rotation Focus)
            {
              id: `${weekId}_d2_ep3a`,
              exerciseId: 'ex_cable_face_pull_wed',
              exerciseName: 'Standing Cable Face Pull (External Rotation Focus)',
              category: 'Station-Locked Cable Posture & Delt Superset',
              subMovementOrder: '3A',
              supersetTag: 'STATION-LOCKED SUPERSET: Single Cable Column (Eye-level to Knee-level). Zero station transit.',
              sets: 3,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: [1, 1, 0],
              restSeconds: 0,
              interSetRestSeconds: 0,
              loadGuidance: 'Set pulley to eye height with rope. Pull toward bridge of nose while rotating knuckles backward past ears. Squeeze lower traps and rhomboids for 1 second. Immediate 0-second transition to 3B.',
              formCueText: 'Set pulley to eye height with rope. Pull toward bridge of nose while rotating knuckles backward past ears. Squeeze lower traps and rhomboids for 1 second.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable+face+pull+form+posture',
              targetMuscleGroups: ['Posterior Deltoids', 'Lower Trapezius', 'Infraspinatus', 'Rhomboids'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'Standing Cable Face Pull (External Rotation Focus)',
                  formCue: 'Set pulley to eye height with rope; pull toward bridge of nose rotating knuckles backward past ears; squeeze 1s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+face+pull+form+posture',
                  targetFocus: 'Station-Locked Superset 3A',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'Reverse Pec Deck (Horizontal Handles)',
                  formCue: 'Chest on pad; horizontal handles; lead with elbows; squeeze rear delts 1s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=reverse+pec+deck+rear+delt+fly+form',
                  targetFocus: 'Station-Locked Superset 3A',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'Incline Prone DB Y-Raise',
                  formCue: 'Chest on 30–45° incline bench; thumbs point up in Y shape; squeeze lower traps 1s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest+supported+incline+y+raise+form',
                  targetFocus: 'Station-Locked Superset 3A',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'Inverted TRX Face Pull',
                  formCue: 'Hang back at 45° holding rings/straps; pull handles to ears while rotating hands back; pause 1s.',
                  videoUrl: 'https://www.youtube.com/results?search_query=trx+face+pull+form',
                  targetFocus: 'Station-Locked Superset 3A',
                },
              ],
            },
            // Sub-Movement 3B: Cable Lateral Raise
            {
              id: `${weekId}_d2_ep3b`,
              exerciseId: 'ex_cable_lateral_raise_wed',
              exerciseName: 'Cable Lateral Raise',
              category: 'Station-Locked Cable Posture & Delt Superset',
              subMovementOrder: '3B',
              supersetTag: 'STATION-LOCKED SUPERSET: Single Cable Column (Eye-level to Knee-level). Zero station transit.',
              sets: 3,
              repRangeLow: 12,
              repRangeHigh: 15,
              rirScheme: [1, 1, 0],
              restSeconds: 60,
              interSetRestSeconds: 60,
              loadGuidance: 'Slide pulley down to knee height. Sweep handle wide in the scapular plane with continuous tension. Do not swing. 60-second rest starts after 3B is completed before looping back to 3A.',
              formCueText: 'Slide pulley down to knee height. Sweep handle wide in the scapular plane with continuous tension. Do not swing.',
              videoUrl: 'https://www.youtube.com/results?search_query=cable+lateral+raise+form',
              targetMuscleGroups: ['Side Deltoids'],
              selectedEquipment: 'cable',
              equipmentVariations: [
                {
                  equipmentType: 'cable',
                  exerciseName: 'Cable Lateral Raise',
                  formCue: 'Cable at knee height; stand beside pulley; sweep handle to shoulder height in scapular plane.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+lateral+raise+form',
                  targetFocus: 'Station-Locked Superset 3B',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'Chest-Supported Incline DB Lateral Raise',
                  formCue: 'Chest against 60° incline bench; hold light DBs; sweep outward without momentum.',
                  videoUrl: 'https://www.youtube.com/results?search_query=chest+supported+incline+lateral+raise',
                  targetFocus: 'Station-Locked Superset 3B',
                },
                {
                  equipmentType: 'machine',
                  exerciseName: 'Seated Lateral Raise Machine',
                  formCue: 'Seat height aligned with machine arms; raise pads to shoulder level; control negative.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated+lateral+raise+machine+form',
                  targetFocus: 'Station-Locked Superset 3B',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'Side-Plank Isometric Wall Press',
                  formCue: 'Side-plank next to wall; press top forearm outward against wall isometrically 30s/side.',
                  videoUrl: 'https://www.youtube.com/results?search_query=side+plank+deltoid+isometric+hold',
                  targetFocus: 'Station-Locked Superset 3B',
                },
              ],
            },
          ],
        },
      ],
    },

    // THURSDAY: Lower Body B (Posterior Overload), Knee Flexion & Shoulders — 72 hours post-football
    {
      id: `${weekId}_d3`,
      weekId,
      dayOfWeek: 3,
      label: 'Thursday: Lower Body B (Posterior Overload), Knee Flexion & Shoulders',
      isRestDay: false,
      morningRoutine: morningAlignmentDrills,
      nutrition: workoutDayNutrition,
      blocks: [
        {
          id: `${weekId}_d3_b1`,
          order: 1,
          type: 'straight',
          exercises: [
            // Slot 1: Posterior Chain Hip Hinge (Primary Overload Lift)
            {
              id: `${weekId}_d3_ep1`,
              exerciseId: 'ex_rdl',
              exerciseName: 'Dumbbell Romanian Deadlift (RDL)',
              sets: 3,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: [2, 2, 1],
              restSeconds: 90,
              loadGuidance: 'Thursday Primary Overload Rule: 72h post-football, this is your primary lower-body progression movement. Shins vertical; push hips horizontally back. Double progression: reach 10 reps on all sets before adding weight. Stall Rule: If stalled 3 sessions, drop load 10% for 1 session with 3s tempo.',
              formCueText: 'Thursday Primary Overload Lift. Vertical shins, push hips straight back. Cap at 1 RIR.',
              videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+rdl+form+for+beginners',
              targetMuscleGroups: ['Hamstrings', 'Glutes', 'Posterior Chain'],
              selectedEquipment: 'dumbbell',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'Smith Machine Romanian Deadlift',
                  formCue: 'Shins close to bar; push hips backward along fixed vertical track; flat lumbar spine.',
                  videoUrl: 'https://www.youtube.com/results?search_query=smith+machine+rdl+form',
                  targetFocus: 'Posterior Chain Overload Hinge',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'Dumbbell Romanian Deadlift (RDL)',
                  formCue: 'Hold DBs against thighs; hinge hips back with flat spine to mid-shin; drive heels.',
                  videoUrl: 'https://www.youtube.com/results?search_query=dumbbell+rdl+form+for+beginners',
                  targetFocus: 'Posterior Chain Overload Hinge',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'Low-Pulley Cable RDL (Straight Bar)',
                  formCue: 'Straight bar on low pulley; step back 2 paces; cable pulls hips back into stretch.',
                  videoUrl: 'https://www.youtube.com/results?search_query=cable+rdl+with+bar+form',
                  targetFocus: 'Posterior Chain Overload Hinge',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'Single-Leg Bodyweight RDL',
                  formCue: 'Hinge at hip extending rear leg straight back in line with torso; 10 reps/side.',
                  videoUrl: 'https://www.youtube.com/results?search_query=single+leg+bodyweight+rdl+form',
                  targetFocus: 'Posterior Chain Overload Hinge',
                },
              ],
            },
            // Slot 2: Knee Flexion Hamstring Hypertrophy
            {
              id: `${weekId}_d3_ep2`,
              exerciseId: 'ex_seated_leg_curl',
              exerciseName: 'Seated Leg Curl Machine',
              sets: 3,
              repRangeLow: 10,
              repRangeHigh: 12,
              rirScheme: [1, 1, 0],
              restSeconds: 75,
              loadGuidance: 'Pull toes up toward shins (dorsiflexion) throughout set. Control eccentric lowering for 3 slow seconds. Set 3 to 0 RIR technical failure.',
              formCueText: 'Dorsiflex toes toward shins; 3-second negative eccentric. Set 3 to 0 RIR.',
              videoUrl: 'https://www.youtube.com/results?search_query=seated+leg+curl+machine+form',
              targetMuscleGroups: ['Hamstrings'],
              selectedEquipment: 'machine',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'Seated Leg Curl Machine',
                  formCue: 'Lock thigh pad tightly; toes to shins; curl heels backward; hold 1s; 3s negative.',
                  videoUrl: 'https://www.youtube.com/results?search_query=seated+leg+curl+machine+form',
                  targetFocus: 'Hamstring Knee Flexion',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'Lying Dumbbell Hamstring Curl',
                  formCue: 'Prone on flat bench; cup light dumbbell between feet; curl feet upward toward glutes.',
                  videoUrl: 'https://www.youtube.com/results?search_query=lying+dumbbell+leg+curl+form',
                  targetFocus: 'Hamstring Knee Flexion',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'Standing Single-Leg Cable Curl',
                  formCue: 'Ankle cuff to low pulley; keep upper thigh pinned vertical; curl heel toward glute.',
                  videoUrl: 'https://www.youtube.com/results?search_query=standing+cable+leg+curl+form',
                  targetFocus: 'Hamstring Knee Flexion',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'Towel / Slider Floor Hamstring Curls',
                  formCue: 'Supine on floor, heels on towel; bridge hips and slide heels in toward glutes.',
                  videoUrl: 'https://www.youtube.com/results?search_query=towel+hamstring+curl+on+floor',
                  targetFocus: 'Hamstring Knee Flexion',
                },
              ],
            },
            // Slot 3: Vertical Press & Deltoid Hit 3 (Drop Set Finish)
            {
              id: `${weekId}_d3_ep3`,
              exerciseId: 'ex_seated_neutral_db_press',
              exerciseName: 'Seated Neutral-Grip DB Overhead Press',
              sets: 3,
              repRangeLow: 8,
              repRangeHigh: 10,
              rirScheme: [2, 2, 1],
              restSeconds: 90,
              hasDropSet: true,
              dropSetGuidance: 'Set 3 Lateral Delt Burnout Drop Set: Immediately upon racking Set 3, grab 3–4 kg dumbbells without resting and perform DB Lateral Raises to 0 RIR failure.',
              loadGuidance: 'Palms face each other (neutral grip) to protect desk-tight rotator cuffs. Keep ribcage down. 👉 Lateral Delt Hit 3 Drop Set: Immediately upon racking Set 3, grab light DBs (3–4 kg) without resting and perform 1 burnout drop set of Lateral Raises to 0 RIR failure.',
              formCueText: 'Neutral grip protects rotator cuffs. Set 3 drop set: immediate DB lateral raise to 0 RIR.',
              videoUrl: 'https://www.youtube.com/results?search_query=neutral+grip+dumbbell+shoulder+press+form',
              targetMuscleGroups: ['Front Deltoids', 'Side Deltoids', 'Triceps'],
              selectedEquipment: 'dumbbell',
              equipmentVariations: [
                {
                  equipmentType: 'machine',
                  exerciseName: 'Neutral-Grip Machine Shoulder Press',
                  formCue: 'Vertical handles; flat back against pad; press overhead smoothly.',
                  videoUrl: 'https://www.youtube.com/results?search_query=neutral+grip+machine+shoulder+press+form',
                  targetFocus: 'Vertical Press & Drop Set Finish',
                },
                {
                  equipmentType: 'dumbbell',
                  exerciseName: 'Seated Neutral-Grip DB Overhead Press',
                  formCue: 'Back support; DBs at ear level with palms facing; press overhead in scapular plane.',
                  videoUrl: 'https://www.youtube.com/results?search_query=neutral+grip+dumbbell+shoulder+press+form',
                  targetFocus: 'Vertical Press & Drop Set Finish',
                },
                {
                  equipmentType: 'cable',
                  exerciseName: 'Kneeling Dual-Cable Overhead Press',
                  formCue: 'Kneel between low pulleys; press handles overhead in natural upward arc.',
                  videoUrl: 'https://www.youtube.com/results?search_query=kneeling+cable+shoulder+press+form',
                  targetFocus: 'Vertical Press & Drop Set Finish',
                },
                {
                  equipmentType: 'bodyweight',
                  exerciseName: 'Pike Push-ups (Elevated Feet)',
                  formCue: 'Feet on bench in pike position; lower forehead toward floor between hands; press up.',
                  videoUrl: 'https://www.youtube.com/results?search_query=pike+push+ups+proper+form',
                  targetFocus: 'Vertical Press & Drop Set Finish',
                },
              ],
            },
          ],
        },
      ],
    },

    // FRIDAY: Scheduled Rest & Growth — Friday Fasted Scale Milestone
    {
      id: `${weekId}_d4`,
      weekId,
      dayOfWeek: 4,
      label: 'Friday: Rest & Growth (Friday Fasted Scale Milestone)',
      isRestDay: true,
      morningRoutine: [
        'Friday Scale Milestone: Step on scale fasted upon waking (Target: +0.25 to +0.40 kg/wk on 7-day rolling average)',
        'The Weekend Anchor: Prepare and consume afternoon digestive shake to protect surplus',
      ],
      nutrition: restDayNutrition,
      blocks: [],
    },

    // SATURDAY: Full Parasympathetic Regeneration & Weekend Shake Anchor
    {
      id: `${weekId}_d5`,
      weekId,
      dayOfWeek: 5,
      label: 'Saturday: Full Parasympathetic Regeneration',
      isRestDay: true,
      morningRoutine: [
        'Weekend Morning Hydration: 500ml water upon waking',
        'The Weekend Anchor: Mandatory afternoon digestive shake between meals',
      ],
      nutrition: restDayNutrition,
      blocks: [],
    },

    // SUNDAY: Weekly Review & Shaker Batch Prep
    {
      id: `${weekId}_d6`,
      weekId,
      dayOfWeek: 6,
      label: 'Sunday: Weekly Review & Meal/Shaker Prep',
      isRestDay: true,
      morningRoutine: [
        'Sunday 7-Day Rolling Average Review: Evaluate weight trend against +0.25 to 0.40 kg/wk target',
        'Prep shaker ingredients and desk-drawer low-fat carbs for Monday kickoff',
      ],
      nutrition: restDayNutrition,
      blocks: [],
    },
  ];
}

// 16-Week Program Structure Factory
export function generateMaster16WeekProgram(): Program {
  const startDate = new Date();
  // Start on Monday of current week
  const day = startDate.getDay();
  const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
  startDate.setDate(diff);
  const startStr = startDate.toISOString().split('T')[0];

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 16 * 7 - 1);
  const endStr = endDate.toISOString().split('T')[0];

  const weeks: ProgramWeek[] = [];
  for (let w = 1; w <= 16; w++) {
    const weekId = `prog_master_w${w}`;
    weeks.push({
      id: weekId,
      programId: 'prog_master_transformation_16w',
      weekIndex: w,
      days: createBlueprintDays(weekId, w),
    });
  }

  return {
    id: 'prog_master_transformation_16w',
    trainerId: 'trainer_alaa',
    traineeId: 'trainee_alaa',
    title: 'The Master Hypertrophy & Postural Architecture Protocol',
    startDate: startStr,
    endDate: endStr,
    durationWeeks: 16,
    status: 'published',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    weeks,
  };
}

// Supplement Protocols for Master Blueprint: The Unified Dinner Stack (Zero Daytime Remembering)
export const masterSupplementProtocols: SupplementProtocol[] = [
  {
    id: 'sp_creatine_master',
    programId: 'prog_master_transformation_16w',
    name: 'Creatine Monohydrate',
    category: 'performance',
    phases: [
      {
        phaseIndex: 1,
        name: 'Saturation Loading Phase (Days 1–5: 20.7g / day)',
        startDay: 1,
        endDay: 5,
        doses: [
          {
            id: 'sp_cr_p1_d1',
            doseOrder: 1,
            amount: 6.9,
            unit: 'g',
            timingType: 'standalone',
            standaloneTiming: 'on_waking',
            targetTime: '07:30',
            notes: 'Dissolved in 300ml warm water upon waking',
          },
          {
            id: 'sp_cr_p1_d2',
            doseOrder: 2,
            amount: 6.9,
            unit: 'g',
            timingType: 'meal_linked',
            mealLabel: '16:00 Afternoon Digestive Shake',
            targetTime: '16:00',
            notes: 'Blended into low-osmolarity shake for carbohydrate-mediated cellular retention',
          },
          {
            id: 'sp_cr_p1_d3',
            doseOrder: 3,
            amount: 6.9,
            unit: 'g',
            timingType: 'meal_linked',
            mealLabel: '21:30 Unified Dinner Stack',
            targetTime: '21:30',
            notes: 'Taken with dinner (completely outside pre-football window)',
          },
        ],
      },
      {
        phaseIndex: 2,
        name: 'Maintenance Phase (Day 6+: 5g / day)',
        startDay: 6,
        endDay: 112,
        doses: [
          {
            id: 'sp_cr_p2_d1',
            doseOrder: 1,
            amount: 5.0,
            unit: 'g',
            timingType: 'meal_linked',
            mealLabel: '21:30 Unified Dinner Stack',
            targetTime: '21:30',
            notes: 'Taken beside dinner plate; keeps creatine out of pre-match window preventing GI issues',
          },
        ],
      },
    ],
  },
  {
    id: 'sp_dinner_foundation',
    programId: 'prog_master_transformation_16w',
    name: 'The Unified Dinner Stack (D3/K2, Omega-3, Magnesium)',
    category: 'health',
    phases: [
      {
        phaseIndex: 1,
        name: 'Nightly Recovery Baseline Foundation',
        startDay: 1,
        endDay: 112,
        doses: [
          {
            id: 'sp_d3k2_d1',
            doseOrder: 1,
            amount: 2500,
            unit: 'IU',
            timingType: 'meal_linked',
            mealLabel: '21:30 Unified Dinner Stack',
            targetTime: '21:30',
            notes: 'Vitamin D3 (2,000–3,000 IU) + K2 (100mcg) absorbed with dinner olive oil/fats',
          },
          {
            id: 'sp_omega3_d1',
            doseOrder: 2,
            amount: 1250,
            unit: 'mg',
            timingType: 'meal_linked',
            mealLabel: '21:30 Unified Dinner Stack',
            targetTime: '21:30',
            notes: 'Omega-3 Fish Oil (1,000–1,500mg EPA/DHA) for systemic recovery',
          },
          {
            id: 'sp_mag_d1',
            doseOrder: 3,
            amount: 300,
            unit: 'mg',
            timingType: 'meal_linked',
            mealLabel: '21:30 Unified Dinner Stack',
            targetTime: '21:30',
            notes: 'Magnesium Bisglycinate (300mg) for neuromuscular relaxation and deep sleep architecture',
          },
        ],
      },
    ],
  },
];

// Hydration Architecture: 3.5 Liters base + 500ml workout bonus
export const masterHydrationGoal: HydrationGoal = {
  id: 'hg_trainee_alaa',
  programId: 'prog_master_transformation_16w',
  traineeId: 'trainee_alaa',
  dailyTargetMl: 3500,
  workoutDayBonusMl: 500,
};

// Seed 14-day weight milestones for Alaa starting at 49.0 kg
export const seedMetricsAlaa: BodyMetricEntry[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  const baseWeight = 49.0;
  const gain = (i * 0.05); // +0.7kg over 14 days (+0.35kg/week target)
  return {
    id: `m_alaa_${i + 1}`,
    traineeId: 'trainee_alaa',
    date: d.toISOString().split('T')[0],
    weightKg: Math.round((baseWeight + gain) * 10) / 10,
    source: 'manual',
  };
});
