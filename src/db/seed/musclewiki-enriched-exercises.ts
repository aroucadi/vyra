import { Exercise } from "@/lib/types";

/**
 * Pre-cached MuscleWiki Enriched Dataset for Alaa's 16-Week Master Transformation Blueprint.
 * Extracted and formatted according to the official MuscleWiki API schema:
 * https://api.musclewiki.com/documentation
 */
export const alaaProgramMuscleWikiExercises: Exercise[] = [
  // --- MONDAY SLOTS ---
  // Slot 1: Incline Machine Chest Press & Variants
  {
    id: "mw_incline_machine_press",
    name: "Incline Machine Chest Press",
    primaryMuscle: "Upper Chest",
    secondaryMuscles: ["Triceps", "Front Deltoids"],
    equipment: "Machine",
    muscleWikiId: 1042,
    difficulty: "Beginner",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/chest/incline-chest-press-machine",
    steps: [
      "Adjust the seat height so the handles are level with your upper chest / armpits.",
      "Plant your feet firmly on the floor and retract your shoulder blades against the pad.",
      "Grasp the handles with an overhand grip, elbows angled at 45 degrees.",
      "Press the handles upward until your arms are nearly extended without locking elbows.",
      "Slowly lower back down with control for a 3-second negative descent."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-machine-incline-press-front.mp4",
      "https://media.musclewiki.com/media/uploads/videos/branded/male-machine-incline-press-side.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=incline+chest+press+machine+form",
    wikiUrl: "https://en.wikipedia.org/wiki/Incline_press"
  },
  {
    id: "mw_30_incline_db_press",
    name: "30° Incline Dumbbell Press",
    primaryMuscle: "Upper Chest",
    secondaryMuscles: ["Triceps", "Front Deltoids"],
    equipment: "Dumbbells",
    muscleWikiId: 1045,
    difficulty: "Intermediate",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/chest/incline-dumbbell-bench-press",
    steps: [
      "Set an adjustable incline bench to a 30-degree incline.",
      "Sit with dumbbells resting on your knees, then kick back smoothly to shoulder height.",
      "Retract your scapulae, keep your chest high and wrists stacked over elbows.",
      "Press the dumbbells up in a gentle triangle arc, converging at the top without touching.",
      "Lower under control until you feel a deep, comfortable stretch across the clavicular pectorals."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-incline-bench-press-front.mp4",
      "https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-incline-bench-press-side.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=incline+dumbbell+press+proper+form",
    wikiUrl: "https://en.wikipedia.org/wiki/Incline_press"
  },
  {
    id: "mw_decline_pushups",
    name: "Feet-Elevated Decline Push-ups",
    primaryMuscle: "Upper Chest",
    secondaryMuscles: ["Triceps", "Anterior Core"],
    equipment: "Bodyweight",
    muscleWikiId: 1048,
    difficulty: "Intermediate",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/chest/decline-pushup",
    steps: [
      "Place your toes on an elevated bench or plyo box with your hands on the floor.",
      "Position your hands slightly wider than shoulder-width apart.",
      "Brace your core and glutes so your torso and legs form a rigid straight plank.",
      "Lower your chest down until your nose nearly grazes the floor.",
      "Drive through your palms to return to full extension."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-decline-pushup-front.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=decline+push+ups+proper+form"
  },

  // Slot 2: Standing Cable Face Pull & Variants
  {
    id: "mw_cable_face_pull",
    name: "Standing Cable Face Pull",
    primaryMuscle: "Rear Deltoids",
    secondaryMuscles: ["Rotator Cuff", "Rhomboids", "Trapezius"],
    equipment: "Cable",
    muscleWikiId: 2110,
    difficulty: "Beginner",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/shoulders/cable-face-pull",
    steps: [
      "Attach a tricep rope to a cable pulley set at eye level.",
      "Grip the ends of the rope with a thumbless grip, thumbs pointing backwards.",
      "Step back into an athletic staggered stance with arms fully extended.",
      "Pull the center of the rope directly toward your forehead while flaring your elbows wide.",
      "Externally rotate your hands backward at the end of the motion and hold for 1 second."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-cable-face-pull-front.mp4",
      "https://media.musclewiki.com/media/uploads/videos/branded/male-cable-face-pull-side.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=cable+face+pull+form+posture"
  },
  {
    id: "mw_reverse_pec_deck",
    name: "Reverse Pec Deck (High Grip)",
    primaryMuscle: "Rear Deltoids",
    secondaryMuscles: ["Rhomboids", "Middle Traps"],
    equipment: "Machine",
    muscleWikiId: 2115,
    difficulty: "Beginner",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/shoulders/machine-rear-delt-fly",
    steps: [
      "Adjust the seat so the horizontal handles are at shoulder height.",
      "Sit facing the machine with your chest firmly flush against the pad.",
      "Grasp the handles with a neutral or pronated grip and a slight bend in your elbows.",
      "Drive your elbows backward and outward in a wide horizontal arc.",
      "Squeeze your rear deltoids at the back position before returning slowly."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-machine-rear-delt-fly-side.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=reverse+pec+deck+rear+delt+fly+form"
  },

  // Slot 3: Overhead Cable Rope Tricep Extension & Variants
  {
    id: "mw_overhead_cable_triceps",
    name: "Overhead Cable Rope Tricep Extension",
    primaryMuscle: "Triceps",
    secondaryMuscles: ["Forearms"],
    equipment: "Cable",
    muscleWikiId: 3012,
    difficulty: "Beginner",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/triceps/cable-overhead-tricep-extension",
    steps: [
      "Set the cable pulley to chest/waist height and attach a dual rope.",
      "Grab the rope with both hands, face away from the machine, and lean forward in a split stance.",
      "Pin your upper arms next to your ears and bend elbows to lower the weight behind your head.",
      "Extend your elbows forward and flare the rope apart at the top contraction.",
      "Slowly return to the deep stretch without moving your upper arms."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-cable-overhead-tricep-extension-side.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=cable+overhead+tricep+extension+form"
  },

  // Slot 4: Cable Lateral Raise & Variants
  {
    id: "mw_cable_lateral_raise",
    name: "Cable Lateral Raise",
    primaryMuscle: "Lateral Deltoids",
    secondaryMuscles: ["Trapezius", "Forearms"],
    equipment: "Cable",
    muscleWikiId: 2050,
    difficulty: "Intermediate",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/shoulders/cable-lateral-raise",
    steps: [
      "Attach a single D-handle to the lowest pulley setting on a cable station.",
      "Stand sideways to the cable, grabbing the handle with the outside hand.",
      "Keep a slight forward lean (5-10 degrees) and soft bend in the elbow.",
      "Raise the cable outward until your arm is parallel to the floor.",
      "Lower under control for 3 seconds, keeping tension off the shoulder joint."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-cable-lateral-raise-front.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=cable+lateral+raise+form"
  },
  {
    id: "mw_db_lateral_raise",
    name: "Standing Dumbbell Lateral Raise",
    primaryMuscle: "Lateral Deltoids",
    secondaryMuscles: ["Trapezius"],
    equipment: "Dumbbells",
    muscleWikiId: 2052,
    difficulty: "Beginner",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/shoulders/dumbbell-lateral-raise",
    steps: [
      "Stand tall holding a pair of light dumbbells at your sides.",
      "Hinge slightly forward at the hips to align with lateral delt muscle fibers.",
      "Raise the dumbbells outward in a wide 'V' shape, leading with your elbows.",
      "Pause for a fraction of a second at shoulder level with knuckles flat.",
      "Lower the weights slowly without letting them bounce off your thighs."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-lateral-raise-front.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=dumbbell+lateral+raise+form"
  },

  // --- TUESDAY SLOTS ---
  // Slot 5: Romanian Deadlift & Variants
  {
    id: "mw_barbell_rdl",
    name: "Barbell Romanian Deadlift",
    primaryMuscle: "Hamstrings",
    secondaryMuscles: ["Glutes", "Lower Back", "Forearms"],
    equipment: "Barbell",
    muscleWikiId: 4020,
    difficulty: "Intermediate",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/hamstrings/barbell-romanian-deadlift",
    steps: [
      "Stand holding a barbell at hip height with an overhand shoulder-width grip.",
      "Keep feet hip-width apart, knees soft and unlocked.",
      "Hinge backward at the hips, keeping the bar dragging tight against your thighs and shins.",
      "Lower until you feel a maximum hamstring stretch just below the knees (do not round back).",
      "Drive hips forward and squeeze glutes to stand upright."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-romanian-deadlift-side.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=barbell+romanian+deadlift+form"
  },
  {
    id: "mw_db_rdl",
    name: "Dumbbell Romanian Deadlift",
    primaryMuscle: "Hamstrings",
    secondaryMuscles: ["Glutes", "Lower Back"],
    equipment: "Dumbbells",
    muscleWikiId: 4022,
    difficulty: "Beginner",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/hamstrings/dumbbell-romanian-deadlift",
    steps: [
      "Hold dumbbells in front of your thighs with knuckles facing forward.",
      "Maintain a proud chest and neutral spine.",
      "Push your hips straight back as if trying to touch the wall behind you.",
      "Lower dumbbells close to your shins until hamstrings reach full tension.",
      "Contract glutes and hamstrings to return to starting position."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-romanian-deadlift-side.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=dumbbell+romanian+deadlift+proper+form"
  },

  // Slot 6: Seated Leg Curl & Variants
  {
    id: "mw_seated_leg_curl",
    name: "Seated Leg Curl Machine",
    primaryMuscle: "Hamstrings",
    secondaryMuscles: ["Calves"],
    equipment: "Machine",
    muscleWikiId: 4050,
    difficulty: "Beginner",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/hamstrings/seated-leg-curl",
    steps: [
      "Align the machine pivot axis with your knee joint.",
      "Set the lower pad so it rests right against your Achilles tendon/lower calf.",
      "Lock the upper thigh pad firmly down to prevent pelvis movement.",
      "Curl your heels backward and under the seat as far as possible.",
      "Control the 3-second return until hamstrings are fully lengthened."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-machine-seated-leg-curl-side.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=seated+leg+curl+machine+form"
  },

  // Slot 7: Standing Calf Raise & Variants
  {
    id: "mw_standing_calf_raise",
    name: "Standing Machine Calf Raise",
    primaryMuscle: "Calves",
    secondaryMuscles: ["Foot Arch Stabilizers"],
    equipment: "Machine",
    muscleWikiId: 5010,
    difficulty: "Beginner",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/calves/standing-machine-calf-raise",
    steps: [
      "Position your shoulders beneath the padded levers with the balls of your feet on the step.",
      "Lower your heels as far as possible for a full, deep stretch in the gastrocnemius.",
      "Hold the bottom stretch position for 2 full seconds to dissipate elastic rebound.",
      "Drive up through your big toes to reach peak contraction.",
      "Pause for 1 second at the top before lowering with control."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-machine-standing-calf-raise-side.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=standing+machine+calf+raise+form"
  },

  // Slot 8: Hanging Leg Raise & Variants
  {
    id: "mw_hanging_leg_raise",
    name: "Hanging Knee / Leg Raise",
    primaryMuscle: "Abdominals",
    secondaryMuscles: ["Hip Flexors", "Forearms"],
    equipment: "Bodyweight",
    muscleWikiId: 6015,
    difficulty: "Intermediate",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/abs/hanging-leg-raise",
    steps: [
      "Hang from a pull-up bar with an overhand grip and dead hang shoulder engagement.",
      "Roll your pelvis up toward your sternum by raising knees/legs with your lower abs.",
      "Do not swing or rely on momentum.",
      "Squeeze your core tightly at the peak when thighs reach parallel or higher.",
      "Lower your legs slowly back to vertical without arching your lumbar spine."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-hanging-leg-raise-front.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=hanging+leg+raise+proper+form"
  },

  // --- THURSDAY SLOTS ---
  // Slot 10: Chest-Supported Neutral Machine Row & Variants
  {
    id: "mw_chest_supported_row",
    name: "Chest-Supported Neutral Machine Row",
    primaryMuscle: "Lats",
    secondaryMuscles: ["Rhomboids", "Rear Deltoids", "Biceps"],
    equipment: "Machine",
    muscleWikiId: 1080,
    difficulty: "Beginner",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/back/machine-chest-supported-row",
    steps: [
      "Adjust the chest pad so you can reach the handles with a full comfortable reach.",
      "Brace your chest flat against the pad and grip the neutral (parallel) handles.",
      "Pull through your elbows, driving them straight back behind your torso.",
      "Pinch your shoulder blades firmly together for 1 second at full contraction.",
      "Extend your arms slowly to feel a deep lat stretch while keeping your chest glued to pad."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-machine-chest-supported-row-side.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=chest+supported+machine+row+form"
  },

  // Slot 11: Cable Cross Tricep Pushdown & Variants
  {
    id: "mw_cable_pushdown",
    name: "Cable Cross Tricep Pushdown",
    primaryMuscle: "Triceps",
    secondaryMuscles: ["Forearms"],
    equipment: "Cable",
    muscleWikiId: 3020,
    difficulty: "Beginner",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/triceps/cable-pushdown",
    steps: [
      "Set the cable pulley to top height and attach dual ropes or a straight bar.",
      "Stand with a slight forward lean and tuck your elbows tightly into your ribs.",
      "Push the handles down until your triceps are fully locked out.",
      "Hold the peak contraction for 1 second.",
      "Allow the cable to return up to chest level while keeping your upper arms stationary."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-cable-tricep-pushdown-side.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=cable+tricep+pushdown+form"
  },

  // --- FRIDAY SLOTS ---
  // Slot 13: Neutral-Grip Lat Pulldown & Pull-ups
  {
    id: "mw_lat_pulldown_neutral",
    name: "Neutral-Grip Lat Pulldown",
    primaryMuscle: "Lats",
    secondaryMuscles: ["Biceps", "Upper Back"],
    equipment: "Cable",
    muscleWikiId: 1010,
    difficulty: "Beginner",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/back/neutral-grip-lat-pulldown",
    steps: [
      "Attach a close-grip V-bar or MAG neutral handle to the high cable pulley.",
      "Lock your thighs securely under the roller pads with feet flat on the floor.",
      "Grasp the handles, lean back 10 to 15 degrees, and puff your chest toward the ceiling.",
      "Pull your elbows straight down toward your ribs until the attachment touches your upper sternum.",
      "Slowly let the cable pull your arms up into a full, deep lat stretch."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-cable-lat-pulldown-front.mp4",
      "https://media.musclewiki.com/media/uploads/videos/branded/male-cable-lat-pulldown-side.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=lat+pulldown+form"
  },
  {
    id: "mw_neutral_pullup",
    name: "Neutral-Grip Chin-ups / Pull-ups",
    primaryMuscle: "Lats",
    secondaryMuscles: ["Biceps", "Brachialis", "Forearms"],
    equipment: "Bodyweight",
    muscleWikiId: 1015,
    difficulty: "Advanced",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/back/neutral-grip-pullup",
    steps: [
      "Grasp parallel pull-up handles with palms facing each other.",
      "Start from a complete dead hang with elbows straight and shoulders engaged.",
      "Pull yourself upward by driving your elbows down toward your hips.",
      "Continue until your chin clears the height of the handles.",
      "Lower under full muscular control back to the starting dead hang."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-pullup-front.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=neutral+grip+pull+up+form"
  },

  // Slot 14: 45° Hyperextension
  {
    id: "mw_45_hyperextension",
    name: "45° Back / Glute Hyperextension",
    primaryMuscle: "Hamstrings",
    secondaryMuscles: ["Glutes", "Erector Spinae"],
    equipment: "Bodyweight",
    muscleWikiId: 4060,
    difficulty: "Beginner",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/lower-back/45-degree-hyperextension",
    steps: [
      "Position yourself face down in a 45-degree hyperextension bench with thigh pads just below hips.",
      "Lock your heels securely under the foot rollers.",
      "Cross your arms over your chest or place hands behind your head.",
      "Bend forward at the waist until your upper body is at a 90-degree angle with legs.",
      "Contract your hamstrings and glutes to pull your torso back into a straight line (do not hyperextend spine)."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-45-degree-hyperextension-side.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=45+degree+back+hyperextension+glutes+form"
  },

  // Slot 15: Incline Dumbbell Bicep Curl
  {
    id: "mw_incline_bicep_curl",
    name: "Incline Dumbbell Bicep Curl",
    primaryMuscle: "Biceps",
    secondaryMuscles: ["Brachialis", "Forearms"],
    equipment: "Dumbbells",
    muscleWikiId: 3050,
    difficulty: "Beginner",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/biceps/incline-dumbbell-curl",
    steps: [
      "Set an adjustable bench to 45 or 60 degrees and sit with your back and head firmly against the pad.",
      "Hold dumbbells at arms length hanging straight down with palms facing each other.",
      "Curl the weights upward while supinating your wrists so your palms face your shoulders.",
      "Squeeze your biceps at the top without allowing your elbows to swing forward.",
      "Lower the dumbbells slowly back down to full elbow extension for a deep bicep stretch."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-incline-bicep-curl-front.mp4",
      "https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-incline-bicep-curl-side.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=incline+dumbbell+bicep+curl+form"
  },

  // Slot 17: Lean-Away Cable Lateral Raise
  {
    id: "mw_lean_away_lateral_raise",
    name: "Lean-Away Cable Lateral Raise",
    primaryMuscle: "Lateral Deltoids",
    secondaryMuscles: ["Trapezius"],
    equipment: "Cable",
    muscleWikiId: 2055,
    difficulty: "Intermediate",
    muscleWikiUrl: "https://musclewiki.com/exercises/male/shoulders/cable-lean-away-lateral-raise",
    steps: [
      "Set the cable pulley to the lowest floor setting.",
      "Grasp the cable column pole with your inside hand and lean your torso away at a 20-30 degree angle.",
      "Hold the D-handle with your outside hand across your thighs.",
      "Raise the cable outward until your arm is in line with your shoulder.",
      "Lower under control for 3 seconds, keeping tension constant through the lateral deltoid."
    ],
    mediaUrls: [
      "https://media.musclewiki.com/media/uploads/videos/branded/male-cable-lean-away-lateral-raise-front.mp4"
    ],
    videoUrl: "https://www.youtube.com/results?search_query=lean+away+cable+lateral+raise+form"
  }
];
