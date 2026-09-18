import { EquipmentType, ExerciseConfidenceGuide, GripType, GripWidth, MachineHardwareType } from "./types";

/**
 * Curated Exercise Confidence Guides for key gym movements.
 * Formatted for sub-5-second glanceability and sensory calibration.
 */
export const CONFIDENCE_GUIDES_MAP: Record<string, ExerciseConfidenceGuide> = {
  // --- INCLINE CHEST PRESS VARIATIONS ---
  "incline machine chest press_machine": {
    exerciseName: "Incline Machine Chest Press",
    equipmentType: "machine",
    hardware: {
      type: "pin_selectorized",
      typeLabel: "Pin-Selected Incline Chest Press",
      commonAliases: ["Hammer Strength Incline", "Technogym Chest Press", "Selectorized Incline Press"],
      setupSteps: [
        "Adjust seat height so handles align with your upper clavicle/armpits.",
        "Insert the weight pin into a safe warmup plate (e.g. Plate 3 or 4).",
        "Plant feet firmly flat on the floor; pin shoulder blades tight against the back pad."
      ],
    },
    mechanics: {
      gripType: "overhand",
      gripWidth: "shoulder_width",
      wristCue: "Stack wrists directly above forearms; do not let the bar bend your wrists back.",
      threeCues: [
        "Pack shoulders down and back.",
        "Tuck elbows at a 45° angle.",
        "Control 3-second lowering phase."
      ],
      mentalCue: "Push yourself into the back pad; drive through elbows toward the ceiling."
    },
    proprioception: {
      primaryMuscle: "Upper Clavicular Chest",
      targetFeel: "By rep 8–10: intense burn and deep stretching tension across your upper chest shelf.",
      normalSensations: ["Triceps and front deltoids will feel warm and fatigued as secondary pushers."],
      redFlagStop: "Sharp anterior shoulder pinching or arching lower back off the pad: STOP immediately."
    }
  },

  "30° incline dumbbell press_dumbbell": {
    exerciseName: "30° Incline Dumbbell Press",
    equipmentType: "dumbbell",
    hardware: {
      type: "free_weight",
      typeLabel: "Adjustable Bench + Dumbbell Rack",
      commonAliases: ["Incline DB Bench", "30 Degree Dumbbell Press"],
      setupSteps: [
        "Set adjustable bench to 30° notch (usually notch 2 or 3; NOT steep 45°).",
        "Pick dumbbells from rack and rest them vertically on your knees while seated.",
        "Kick knees up one at a time to bring dumbbells safely to shoulder height as you lie back."
      ],
    },
    mechanics: {
      gripType: "overhand",
      gripWidth: "shoulder_width",
      wristCue: "Punch knuckles straight toward ceiling; wrists rigid and neutral.",
      threeCues: [
        "Chest proud, shoulder blades pinched.",
        "Lower dumbbells until level with chest.",
        "Press up in a gentle triangle arc."
      ],
      mentalCue: "Squeeze your biceps together at the top without banging the weights together."
    },
    proprioception: {
      primaryMuscle: "Upper Clavicular Chest",
      targetFeel: "By rep 8–10: intense deep chest burn and wide stretch across upper pectoral fibers.",
      normalSensations: ["Slight tricep burn at full extension; light forearm pump from gripping."],
      redFlagStop: "Sudden shoulder impingement click or inability to stabilize dumbbells: drop to knees and rest."
    }
  },

  "incline cable chest press_cable": {
    exerciseName: "Incline Cable Chest Press",
    equipmentType: "cable",
    hardware: {
      type: "cable_tower",
      typeLabel: "Dual Cable Tower + Incline Bench",
      commonAliases: ["Cable Incline Press", "Cable Crossover Station"],
      setupSteps: [
        "Position an adjustable bench at 30° midway between two cable towers.",
        "Set both cable pulleys to the lowest floor setting and attach D-handles.",
        "Grab handles and sit down, locking elbows close to ribs before pressing upward."
      ],
      requiredAttachment: "Pair of Single D-Handles"
    },
    mechanics: {
      gripType: "neutral",
      gripWidth: "shoulder_width",
      wristCue: "Maintain rigid straight wrists; keep tension continuous throughout.",
      threeCues: [
        "Press upward along 30° trajectory.",
        "Slow 3-second negative descent.",
        "Keep shoulder blades glued to bench."
      ],
      mentalCue: "Guide handles together smoothly like hugging a large tree trunk."
    },
    proprioception: {
      primaryMuscle: "Upper Clavicular Chest",
      targetFeel: "Constant mechanical tension throughout the entire rep; peak burn right in the upper center chest.",
      normalSensations: ["Smooth constant resistance unlike dumbbells; steady core bracing."],
      redFlagStop: "Shoulder shrugging up to ears or loss of cable control: lower weight."
    }
  },

  "feet-elevated decline push-ups_bodyweight": {
    exerciseName: "Feet-Elevated Decline Push-ups",
    equipmentType: "bodyweight",
    hardware: {
      type: "bodyweight_station",
      typeLabel: "Gym Bench or Box + Floor Mat",
      commonAliases: ["Decline Push-ups", "Feet-Up Pushups"],
      setupSteps: [
        "Place toes securely on a standard flat bench or 30-40cm plyo box.",
        "Place hands on the floor slightly wider than shoulder-width, fingers pointing forward.",
        "Squeeze glutes and draw navel to spine so your body forms a straight rigid plank."
      ],
    },
    mechanics: {
      gripType: "overhand",
      gripWidth: "shoulder_width",
      wristCue: "Spread fingers wide on floor, press through the base of your palms.",
      threeCues: [
        "Tuck elbows back at 45°.",
        "Lower nose gently toward the mat.",
        "Push floor away aggressively to finish."
      ],
      mentalCue: "Imagine pushing the gym floor down into the basement."
    },
    proprioception: {
      primaryMuscle: "Upper Chest & Anterior Core",
      targetFeel: "Intense pump in upper chest by rep 10, combined with tight transverse abdominal bracing.",
      normalSensations: ["Deep core activation and shoulder burn as you fight gravity."],
      redFlagStop: "Sagging lower back or wrist pain: stop immediately and switch to floor pushups."
    }
  },

  // --- POSTURE PULL & REAR DELT VARIATIONS ---
  "standing cable face pull_cable": {
    exerciseName: "Standing Cable Face Pull",
    equipmentType: "cable",
    hardware: {
      type: "cable_tower",
      typeLabel: "Adjustable Cable Column",
      commonAliases: ["Cable Face Pull", "Rope Face Pull", "Posture Cable Pull"],
      setupSteps: [
        "Set the cable pulley to eye level or forehead height.",
        "Attach the heavy braided tricep rope securely with the carabiner.",
        "Step back 2 steps until cable is taut; assume an athletic staggered stance."
      ],
      requiredAttachment: "Braided Tricep Rope"
    },
    mechanics: {
      gripType: "thumbless",
      gripWidth: "shoulder_width",
      wristCue: "Thumbs point backward over shoulders; lead the movement with your elbows, not hands.",
      threeCues: [
        "Pull rope toward your forehead/eyes.",
        "Rotate hands backward at peak.",
        "Hold 1-second pause every rep."
      ],
      mentalCue: "Pull the rope apart and show off your biceps to the wall behind you."
    },
    proprioception: {
      primaryMuscle: "Rear Deltoids & Rotator Cuff",
      targetFeel: "By rep 10–12: deep burning squeeze across the back of your shoulders and upper shoulder blades.",
      normalSensations: ["Rhomboids and upper back tightening; zero lower back strain."],
      redFlagStop: "Leaning back excessively to yank weight or neck tension: lower the weight pin."
    }
  },

  "reverse pec deck (high grip)_machine": {
    exerciseName: "Reverse Pec Deck (High Grip)",
    equipmentType: "machine",
    hardware: {
      type: "pin_selectorized",
      typeLabel: "Dual Function Rear Delt / Pec Deck Machine",
      commonAliases: ["Reverse Pec Fly", "Rear Delt Machine", "Rear Fly Station"],
      setupSteps: [
        "Move both top levers all the way back to the rear delt setting (not chest fly).",
        "Sit facing the machine pad with your chest flush against it.",
        "Adjust seat so horizontal handles align directly with your shoulders/ears."
      ],
    },
    mechanics: {
      gripType: "neutral",
      gripWidth: "shoulder_width",
      wristCue: "Keep wrists straight and thumbs up; slight soft bend in elbows locked in place.",
      threeCues: [
        "Chest pinned firmly to pad.",
        "Lead backward with elbows high.",
        "Pause 1s at back before returning."
      ],
      mentalCue: "Push your elbows outward and back like trying to touch the side walls."
    },
    proprioception: {
      primaryMuscle: "Rear Deltoids",
      targetFeel: "Targeted fiery burn isolated directly behind the shoulder joints by rep 10.",
      normalSensations: ["Middle traps working gently; chest pad takes all lower back load."],
      redFlagStop: "Shoulders shrugging up toward ears: lower seat or drop 1 pin."
    }
  },

  // --- TRICEP PUSHDOWN & EXTENSION ---
  "overhead cable rope tricep extension_cable": {
    exerciseName: "Overhead Cable Rope Tricep Extension",
    equipmentType: "cable",
    hardware: {
      type: "cable_tower",
      typeLabel: "Adjustable Cable Column",
      commonAliases: ["Cable Overhead Tricep Extension", "Rope Tricep Extension"],
      setupSteps: [
        "Set cable pulley to hip/waist height or top height and attach rope.",
        "Grab rope, pivot forward with back facing the machine in a staggered split stance.",
        "Lean torso slightly forward (30°), locking elbows pointing high forward."
      ],
      requiredAttachment: "Braided Tricep Rope"
    },
    mechanics: {
      gripType: "neutral",
      gripWidth: "narrow",
      wristCue: "Keep wrists aligned with forearms; flare rope apart slightly at peak extension.",
      threeCues: [
        "Keep elbows pinned in place.",
        "Full stretch behind the head.",
        "Lock out triceps with split rope."
      ],
      mentalCue: "Freeze your upper arms like statues; only hinge at the elbow joint."
    },
    proprioception: {
      primaryMuscle: "Triceps Long Head",
      targetFeel: "By rep 8–10: intense deep stretch and hot burn on the back of your arms.",
      normalSensations: ["Tricep horseshoe pump; core braced to prevent torso sway."],
      redFlagStop: "Sharp elbow joint sting or arching lumbar spine: decrease weight immediately."
    }
  },

  // --- LATERAL RAISES ---
  "cable lateral raise_cable": {
    exerciseName: "Cable Lateral Raise",
    equipmentType: "cable",
    hardware: {
      type: "cable_tower",
      typeLabel: "Low Pulley Cable Station",
      commonAliases: ["Single Arm Cable Lateral", "Side Delt Cable Raise"],
      setupSteps: [
        "Set pulley to lowest notch (floor level) with single D-handle attached.",
        "Stand sideways to machine, grab handle with outer hand behind or in front of body.",
        "Take a slight step out to ensure cable has tension from the very bottom."
      ],
      requiredAttachment: "Single D-Handle or Cuff"
    },
    mechanics: {
      gripType: "overhand",
      gripWidth: "shoulder_width",
      wristCue: "Pour the pitcher: keep pinky slightly higher than thumb; wrists relaxed.",
      threeCues: [
        "Raise arm out to shoulder height.",
        "Lead motion with elbow, not hand.",
        "Control descent for 3 seconds."
      ],
      mentalCue: "Push knuckles out toward the far wall, not up to the ceiling."
    },
    proprioception: {
      primaryMuscle: "Side / Lateral Deltoids",
      targetFeel: "Fiery, localized burn on the outer cap of your shoulder by rep 10–12.",
      normalSensations: ["Smooth constant tension through entire arc; traps should stay relaxed."],
      redFlagStop: "Neck shrugging or rocking whole torso: reduce weight to lowest pin."
    }
  },

  "dumbbell lateral raise_dumbbell": {
    exerciseName: "Dumbbell Lateral Raise",
    equipmentType: "dumbbell",
    hardware: {
      type: "free_weight",
      typeLabel: "Dumbbell Rack (Light Weights: 4kg–10kg)",
      commonAliases: ["DB Side Raise", "Dumbbell Lateral Raise"],
      setupSteps: [
        "Select light dumbbells (side delts require strict form, not heavy ego lifting).",
        "Stand tall with feet hip-width, knees slightly bent, dumbbells resting at thighs.",
        "Hinge forward 5° at hips to match side delt fiber angle."
      ],
    },
    mechanics: {
      gripType: "overhand",
      gripWidth: "shoulder_width",
      wristCue: "Keep wrists neutral and relaxed; don't cock wrists upwards.",
      threeCues: [
        "Raise arms out in a wide 'V'.",
        "Lead with elbows, knuckles flat.",
        "Zero swinging from hips or knees."
      ],
      mentalCue: "Pretend you are pushing two side walls away from your body."
    },
    proprioception: {
      primaryMuscle: "Side / Lateral Deltoids",
      targetFeel: "Intense cap pump on side delts by rep 10; pure isolation.",
      normalSensations: ["Slight upper trap stabilization, but traps must not shrug."],
      redFlagStop: "Using body momentum or bending backwards: pick lighter dumbbells."
    }
  },

  // --- LAT PULLDOWN & ROWS ---
  "wide-grip lat pulldown_cable": {
    exerciseName: "Wide-Grip Lat Pulldown",
    equipmentType: "cable",
    hardware: {
      type: "pin_selectorized",
      typeLabel: "Lat Pulldown Station",
      commonAliases: ["Cable Lat Pulldown", "High Pulley Pulldown", "Technogym Lat Machine"],
      setupSteps: [
        "Adjust thigh rollers so they lock your thighs down tightly with feet flat on the floor.",
        "Stand up to grip the wide bar outside shoulder width, then sit down under pads.",
        "Lean back 10–15° with chest puffed up proud toward the ceiling."
      ],
      requiredAttachment: "Wide Lat Pulldown Bar"
    },
    mechanics: {
      gripType: "thumbless",
      gripWidth: "wide",
      wristCue: "Use thumbless 'hook' grip (false grip) to take forearms out of the movement.",
      threeCues: [
        "Pull shoulder blades down first.",
        "Drive elbows toward your hips.",
        "Pull bar to upper chest / collarbone."
      ],
      mentalCue: "Imagine pulling yourself up to the bar rather than yanking the bar down."
    },
    proprioception: {
      primaryMuscle: "Latissimus Dorsi (Lats)",
      targetFeel: "By rep 8–10: intense deep squeeze and widening burn under your armpits and down ribs.",
      normalSensations: ["Biceps and forearms assist moderately, but shouldn't fail before your back."],
      redFlagStop: "Swinging torso aggressively back and forth or pulling behind the neck: stop."
    }
  },

  "neutral-grip lat pulldown_cable": {
    exerciseName: "Neutral-Grip Lat Pulldown",
    equipmentType: "cable",
    hardware: {
      type: "cable_tower",
      typeLabel: "Lat Pulldown Station + V-Bar / Mag Handle",
      commonAliases: ["Close Grip Pulldown", "V-Bar Pulldown", "Neutral Grip Pulldown"],
      setupSteps: [
        "Attach close-grip V-bar or parallel neutral grip handle to the high cable pulley.",
        "Slide thighs under locked pads with feet flat on the floor.",
        "Take a slight 10° lean, puff out chest, and look up toward the pulley."
      ],
      requiredAttachment: "V-Bar or Dual Neutral Handle"
    },
    mechanics: {
      gripType: "neutral",
      gripWidth: "narrow",
      wristCue: "Palms face each other; wrists locked straight in neutral alignment.",
      threeCues: [
        "Initiate pull by dropping scapulae.",
        "Tuck elbows tight against ribs.",
        "Touch attachment to upper sternum."
      ],
      mentalCue: "Drive elbows straight down into your back pockets."
    },
    proprioception: {
      primaryMuscle: "Lower & Middle Lats",
      targetFeel: "Tremendous stretch at top extension and dense lat contraction at the bottom.",
      normalSensations: ["Biceps brachialis pump; extremely joint-friendly on wrists and shoulders."],
      redFlagStop: "Rounding upper back forward at bottom or letting shoulders shrug into ears."
    }
  },

  "chest-supported neutral machine row_machine": {
    exerciseName: "Chest-Supported Neutral Machine Row",
    equipmentType: "machine",
    hardware: {
      type: "pin_selectorized",
      typeLabel: "Seated Row / Chest-Supported Row Machine",
      commonAliases: ["Hammer Strength Row", "Seated Cable Row Machine", "Chest Supported Row"],
      setupSteps: [
        "Adjust chest pad so your hands can comfortably reach handles with slight stretch.",
        "Set seat height so handles pull directly toward your mid-abdomen/navel.",
        "Plant feet firmly against footrests; brace chest flat against the center pad."
      ],
    },
    mechanics: {
      gripType: "neutral",
      gripWidth: "shoulder_width",
      wristCue: "Straight neutral wrists, palms facing inward; hook with fingers.",
      threeCues: [
        "Keep chest glued to support pad.",
        "Drive elbows far behind your back.",
        "Squeeze shoulder blades 1 second."
      ],
      mentalCue: "Pinch a pencil between your shoulder blades at the peak of every rep."
    },
    proprioception: {
      primaryMuscle: "Mid-Back, Rhomboids & Lats",
      targetFeel: "Thick, deep pump between shoulder blades and lower lats by rep 8–10.",
      normalSensations: ["Zero lower back fatigue due to chest pad support; arms lightly assist."],
      redFlagStop: "Peeling your chest off the pad to heave the weight: drop 2 plates."
    }
  },

  // --- POSTERIOR CHAIN & LEGS ---
  "romanian deadlift_barbell": {
    exerciseName: "Romanian Deadlift",
    equipmentType: "machine", // can be free_weight or barbell
    hardware: {
      type: "free_weight",
      typeLabel: "Olympic Barbell & Squat Rack / Deadlift Platform",
      commonAliases: ["RDL", "Barbell Romanian Deadlift", "Stiff-Legged Deadlift"],
      setupSteps: [
        "Set barbell on rack pins at mid-thigh height; grip bar just outside knees.",
        "Take 2 steps back; stand with feet hip-width apart and toes pointing forward.",
        "Lock shoulder blades back, pull chest up, take a deep belly breath to brace core."
      ],
    },
    mechanics: {
      gripType: "overhand",
      gripWidth: "shoulder_width",
      wristCue: "Keep bar dragging against thighs and shins at all times; do not let it drift forward.",
      threeCues: [
        "Push hips straight back.",
        "Soft knees (do not squat).",
        "Stop when hamstrings are fully tight."
      ],
      mentalCue: "Pretend you are pushing a car door closed with your butt while holding grocery bags."
    },
    proprioception: {
      primaryMuscle: "Hamstrings & Glutes",
      targetFeel: "Tremendous tension and stretch in the backs of your thighs on the way down; powerful glute squeeze on top.",
      normalSensations: ["Erector spinae holding static brace; hamstring tightness."],
      redFlagStop: "Any lower back rounding, pinching, or lumbar pain: STOP immediately."
    }
  },

  "seated leg curl_machine": {
    exerciseName: "Seated Leg Curl",
    equipmentType: "machine",
    hardware: {
      type: "pin_selectorized",
      typeLabel: "Seated Hamstring Leg Curl Machine",
      commonAliases: ["Hamstring Curl", "Seated Leg Curl", "Technogym Leg Curl"],
      setupSteps: [
        "Align machine pivot point (red dot) directly with your knee joints.",
        "Adjust lower leg pad to sit comfortably right behind your Achilles/lower calves.",
        "Lock the top thigh pad down firmly against your quads so thighs cannot lift."
      ],
    },
    mechanics: {
      gripType: "neutral",
      gripWidth: "narrow",
      wristCue: "Firmly grip side machine handles to anchor pelvis down into seat.",
      threeCues: [
        "Point toes up toward shins.",
        "Curl heels hard under the seat.",
        "Control 3-second return to top."
      ],
      mentalCue: "Snap your heels into the back of your thighs with controlled force."
    },
    proprioception: {
      primaryMuscle: "Hamstrings",
      targetFeel: "Deep, intense cramp-like burn right across the belly of your hamstrings by rep 8–10.",
      normalSensations: ["Full hamstring pump; calf muscles assisting slightly."],
      redFlagStop: "Knees slipping or hips lifting off the seat pad: tighten the thigh lock."
    }
  },

  // --- BICEPS ---
  "incline dumbbell bicep curl_dumbbell": {
    exerciseName: "Incline Dumbbell Bicep Curl",
    equipmentType: "dumbbell",
    hardware: {
      type: "free_weight",
      typeLabel: "Adjustable Bench (45°–60°) + Dumbbell Rack",
      commonAliases: ["Incline Bicep Curl", "Seated Incline Curl"],
      setupSteps: [
        "Set adjustable bench to 45° or 60° angle.",
        "Sit back with head and spine resting completely against the pad.",
        "Let arms hang straight down toward the floor to establish full long-head stretch."
      ],
    },
    mechanics: {
      gripType: "underhand",
      gripWidth: "shoulder_width",
      wristCue: "Supinate wrists hard (turn pinky knuckles outward) as you curl upward.",
      threeCues: [
        "Keep elbows pinned behind torso.",
        "Curl dumbbells without swinging.",
        "Full stretch at bottom every rep."
      ],
      mentalCue: "Glue your upper arms in place; curl the weight by flexing your biceps against your bone."
    },
    proprioception: {
      primaryMuscle: "Biceps (Long Head)",
      targetFeel: "By rep 8–10: skin-stretching peak bicep burn and deep ache right in the bicep belly.",
      normalSensations: ["Forearm activation from gripping; shoulders should feel zero strain."],
      redFlagStop: "Shoulders rolling forward off the bench to assist the curl: choose lighter weight."
    }
  },
};

/**
 * Intelligent fallback generator that synthesizes a medically accurate,
 * glanceable Exercise Confidence Guide based on exercise pattern & equipment.
 */
export function getConfidenceGuide(
  exerciseName: string,
  equipmentType?: EquipmentType
): ExerciseConfidenceGuide {
  const normName = exerciseName.toLowerCase().trim();
  const eq = equipmentType || "machine";
  const directKey = `${normName}_${eq}`;

  // 1. Check exact key in dictionary
  if (CONFIDENCE_GUIDES_MAP[directKey]) {
    return CONFIDENCE_GUIDES_MAP[directKey];
  }

  // 2. Fuzzy match in dictionary
  for (const [k, guide] of Object.entries(CONFIDENCE_GUIDES_MAP)) {
    const guideKeyPart = k.split("_")[0];
    if (normName.includes(guideKeyPart) || guideKeyPart.includes(normName)) {
      if (guide.equipmentType === eq) {
        return guide;
      }
    }
  }

  // 3. Biomechanical category fallback generator
  return buildDynamicFallbackGuide(exerciseName, eq);
}

function buildDynamicFallbackGuide(
  name: string,
  equipment: EquipmentType
): ExerciseConfidenceGuide {
  const lower = name.toLowerCase();

  // Pattern detection
  const isLegs = lower.includes("squat") || lower.includes("lunge") || lower.includes("deadlift") || lower.includes("rdl") || lower.includes("leg") || lower.includes("calf") || lower.includes("glute") || lower.includes("hamstring");
  const isPress = !isLegs && (lower.includes("press") || lower.includes("push-up") || lower.includes("pushup") || lower.includes("dip"));
  const isPull = lower.includes("pull") || lower.includes("row") || lower.includes("chin-up") || lower.includes("chin up");
  const isDelt = lower.includes("lateral") || lower.includes("delt") || lower.includes("raise") || lower.includes("face pull");
  const isArms = (!lower.includes("leg") && lower.includes("curl")) || lower.includes("bicep") || lower.includes("tricep") || lower.includes("extension");

  let hardwareType: MachineHardwareType = "pin_selectorized";
  let typeLabel = "Standard Gym Machine";
  let commonAliases = [name, "Station"];
  let setupSteps = [
    "Locate the station and check all pins/adjustment levers.",
    "Adjust seat/pad height so joints align with machine pivot point.",
    "Select a conservative warmup weight to test path of motion."
  ];

  if (equipment === "dumbbell") {
    hardwareType = "free_weight";
    typeLabel = "Free Weight / Dumbbell Station";
    commonAliases = ["Dumbbell Rack", "Adjustable Bench"];
    setupSteps = [
      "Select matched pair of dumbbells with secure collar rings.",
      "Position yourself on an open flat or adjustable bench.",
      "Brace core firmly and control movement with zero swinging."
    ];
  } else if (equipment === "cable") {
    hardwareType = "cable_tower";
    typeLabel = "Adjustable Cable Column";
    commonAliases = ["Cable Station", "Functional Trainer"];
    setupSteps = [
      "Slide cable pulley to desired height notch and lock pin securely.",
      "Clip the appropriate handle attachment to the carabiner.",
      "Step back slightly to ensure cable is taut at starting position."
    ];
  } else if (equipment === "bodyweight") {
    hardwareType = "bodyweight_station";
    typeLabel = "Calisthenics / Floor Station";
    commonAliases = ["Gym Floor Mat", "Pullup / Dip Station"];
    setupSteps = [
      "Clear a 2x2 meter space on a supportive gym floor mat.",
      "Ensure solid footing and proper joint alignment before initiating reps.",
      "Brace transverse abdominals throughout entire movement."
    ];
  }

  let gripType: GripType = "overhand";
  let gripWidth: GripWidth = "shoulder_width";
  let wristCue = "Keep wrists neutral and aligned with forearms; never allow wrists to bend backward.";
  let threeCues: [string, string, string] = [
    "Pack shoulders down and back.",
    "Control 3-second lowering phase.",
    "Exhale smoothly during effort."
  ];
  let mentalCue = "Move with calm control; focus strictly on muscle tension rather than speed.";

  let primaryMuscle = "Target Muscle Group";
  let targetFeel = "By rep 8–10: intense deep burn and muscle pump in target region.";
  let normalSensations = ["Secondary stabilizing muscles will fatigue as supporting structure."];
  let redFlagStop = "Sharp joint pain, bone pinching, or loss of spinal control: STOP immediately.";

  if (isPress) {
    primaryMuscle = "Chest, Front Delts & Triceps";
    threeCues = ["Retract shoulder blades tight.", "Tuck elbows at 45° angle.", "Drive through palms smoothly."];
    mentalCue = "Push the floor or machine away from your torso.";
    targetFeel = "By rep 8–10: deep muscle fullness and heat spreading across the chest.";
    redFlagStop = "Sharp anterior shoulder click or lower back arching: reduce weight.";
  } else if (isPull) {
    gripType = "thumbless";
    primaryMuscle = "Back & Lats";
    threeCues = ["Initiate by dropping shoulders.", "Drive elbows into back pockets.", "Squeeze shoulder blades 1s."];
    mentalCue = "Think of your hands as hooks; pull with your elbows.";
    targetFeel = "By rep 8–10: deep burning squeeze across the lats and mid-back.";
    redFlagStop = "Shoulders shrugging toward ears or lumbar hyperextension.";
  } else if (isDelt) {
    primaryMuscle = "Side Deltoids";
    threeCues = ["Raise arms out in wide arc.", "Lead with elbows, knuckles flat.", "Strict form, zero torso swing."];
    mentalCue = "Push your knuckles away toward the side walls.";
    targetFeel = "Fiery, localized burn on the outer caps of your shoulders.";
    redFlagStop = "Neck straining or swinging body momentum: use lighter weight.";
  } else if (isLegs) {
    primaryMuscle = "Posterior Chain / Quads / Hamstrings";
    threeCues = ["Maintain neutral spine.", "Drive weight through whole foot.", "Brace core like taking a punch."];
    mentalCue = "Spread the floor with your feet to engage your hips.";
    targetFeel = "By rep 8–10: deep lactic burn across working leg muscles.";
    redFlagStop = "Knee cave, lower back rounding, or joint pain.";
  } else if (isArms) {
    primaryMuscle = "Arm Flexors / Extensors";
    threeCues = ["Lock elbows in fixed position.", "Full range of motion.", "Squeeze peak contraction 1s."];
    mentalCue = "Isolate the joint; eliminate all shoulder assist.";
    targetFeel = "Dense pump and skin-tight burn in arms by rep 10.";
    redFlagStop = "Elbow tendon pain: lower the weight.";
  }

  return {
    exerciseName: name,
    equipmentType: equipment,
    hardware: {
      type: hardwareType,
      typeLabel,
      commonAliases,
      setupSteps,
    },
    mechanics: {
      gripType,
      gripWidth,
      wristCue,
      threeCues,
      mentalCue,
    },
    proprioception: {
      primaryMuscle,
      targetFeel,
      normalSensations,
      redFlagStop,
    },
  };
}
