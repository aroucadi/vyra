/**
 * @file voice-coach.ts
 * @description In-gym hands-free vocal coach and natural speech command interpreter.
 * Synthesizes real-time spoken guidance during rest periods and parses hands-free speech commands.
 */

export type VoiceCommandAction =
  | { type: "LOG_SET"; reps?: number; weightKg?: number; rir?: number }
  | { type: "SET_WEIGHT"; weightKg: number }
  | { type: "ADJUST_WEIGHT"; deltaKg: number }
  | { type: "SET_REPS"; reps: number }
  | { type: "SET_RIR"; rir: number }
  | { type: "SKIP_REST" }
  | { type: "SWAP_EXERCISE" }
  | { type: "ADD_SET" }
  | { type: "UNKNOWN"; raw: string };

/**
 * Parses raw transcribed speech into structured gym cockpit actions.
 * Handles diverse colloquial speech patterns in the gym.
 */
export function parseVoiceCommand(transcript: string): VoiceCommandAction {
  const text = transcript.trim().toLowerCase();
  if (!text) return { type: "UNKNOWN", raw: transcript };

  // 1. SWAP / OCCUPIED STATION
  if (
    text.includes("swap") ||
    text.includes("occupied") ||
    text.includes("change exercise") ||
    text.includes("changer")
  ) {
    return { type: "SWAP_EXERCISE" };
  }

  // 2. SKIP REST / NEXT SET
  if (
    text.includes("skip rest") ||
    text.includes("next set") ||
    text.includes("ready") ||
    text.includes("prêt") ||
    text.includes("passer le repos")
  ) {
    return { type: "SKIP_REST" };
  }

  // 3. ADD BONUS SET
  if (
    text.includes("add set") ||
    text.includes("bonus set") ||
    text.includes("extra set") ||
    text.includes("ajouter une série")
  ) {
    return { type: "ADD_SET" };
  }

  // 4. WEIGHT INCREMENTS (UP / DOWN / PLUS / MINUS)
  const plusMatch = text.match(/(?:plus|up|add|\+)\s*(\d+(?:\.\d+)?)/i);
  if (plusMatch) {
    return { type: "ADJUST_WEIGHT", deltaKg: parseFloat(plusMatch[1]) };
  }
  const minusMatch = text.match(/(?:minus|down|drop|-)\s*(\d+(?:\.\d+)?)/i);
  if (minusMatch) {
    return { type: "ADJUST_WEIGHT", deltaKg: -parseFloat(minusMatch[1]) };
  }

  // 5. EXTRACT REPS, WEIGHT, AND RIR
  const repsMatch = text.match(/(\d+)\s*(?:reps?|rep|répétitions?)/i);
  const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos?|kilo|pounds?|lbs?)/i);
  
  let rirVal: number | undefined;
  if (text.includes("failure") || text.includes("échec") || text.includes("fail")) {
    rirVal = 0;
  } else {
    const rirMatch = text.match(/(?:rir|reserve|reps in reserve)\s*(\d+)/i);
    if (rirMatch) {
      rirVal = parseInt(rirMatch[1], 10);
    }
  }

  // If "log" or "did" or "done" or explicit reps + weight are mentioned:
  const isExplicitLog =
    text.startsWith("log") ||
    text.includes("logged") ||
    text.includes("enregistre") ||
    text.includes("done") ||
    text.includes("finished");

  if (isExplicitLog || (repsMatch && weightMatch)) {
    return {
      type: "LOG_SET",
      reps: repsMatch ? parseInt(repsMatch[1], 10) : undefined,
      weightKg: weightMatch ? parseFloat(weightMatch[1]) : undefined,
      rir: rirVal,
    };
  }

  // 6. STANDALONE WEIGHT SETTING
  if (weightMatch) {
    return {
      type: "SET_WEIGHT",
      weightKg: parseFloat(weightMatch[1]),
    };
  }

  // 7. STANDALONE REPS SETTING
  if (repsMatch) {
    return {
      type: "SET_REPS",
      reps: parseInt(repsMatch[1], 10),
    };
  }

  // 8. STANDALONE RIR SETTING
  if (rirVal !== undefined) {
    return {
      type: "SET_RIR",
      rir: rirVal,
    };
  }

  return { type: "UNKNOWN", raw: transcript };
}

class VoiceCoachSynthesizer {
  private isEnabled: boolean = true;
  private isMuted: boolean = false;

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  /**
   * Speaks a concise, athletic audio cue using browser speech synthesis.
   */
  public speak(message: string, priority: "normal" | "high" = "normal"): void {
    if (!this.isEnabled || this.isMuted) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      if (priority === "high") {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.08; // slightly brisk athletic cadence
      utterance.pitch = 1.0;
      utterance.volume = 0.9;

      // Select natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel"))
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis fails silently
    }
  }

  public speakRestPace(
    remainingSec: number,
    nextWeightKg?: number,
    nextReps?: number,
    nextRir?: number
  ): void {
    if (remainingSec === 45) {
      if (nextWeightKg !== undefined && nextReps !== undefined) {
        const rirClause = nextRir !== undefined ? ` at RIR ${nextRir}` : "";
        this.speak(
          `45 seconds remaining. Next set: ${nextWeightKg} kilos for ${nextReps} reps${rirClause}.`
        );
      } else {
        this.speak("45 seconds remaining.");
      }
    } else if (remainingSec === 15) {
      this.speak("15 seconds. Step up to station.");
    } else if (remainingSec === 0) {
      this.speak("Rest complete. Lock in.");
    }
  }

  public speakSetLogged(reps: number, weightKg: number, rir?: number): void {
    const rirText = rir !== undefined ? `, RIR ${rir}` : "";
    this.speak(`Logged ${reps} reps at ${weightKg} kilos${rirText}. Rest timer started.`);
  }

  public speakExerciseStarted(name: string, targetMuscle: string, sets: number): void {
    this.speak(`${name}. Target: ${targetMuscle}. ${sets} sets.`);
  }

  public speakSwapConfirmed(newName: string): void {
    this.speak(`Swapped station to ${newName}.`);
  }
}

export const voiceCoach = new VoiceCoachSynthesizer();
