/**
 * Gym Equipment Photo Native Sharing Utility
 * 
 * Prepares and shares machine, barbell, cable, or dumbbell photos using the native
 * OS Web Share API (Level 2 with File payload).
 * 
 * On Android and iOS, sharing a real JPEG File displays Google Gemini, WhatsApp,
 * Drive, Gmail, etc. in the system share sheet, allowing direct sharing into a new
 * Gemini prompt with pre-filled biomechanical analysis instructions.
 */

import { telemetry } from "./telemetry";

export interface ShareEquipmentOptions {
  photoUrl: string;
  exerciseName: string;
  note?: string;
  traineeId?: string;
  gymName?: string;
}

export interface ShareResult {
  shared: boolean;
  method: "native_share" | "clipboard_gemini" | "download_gemini";
  message?: string;
}

/**
 * Converts a Base64 data URI or HTTP image URL to a real binary File.
 */
export async function urlToFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  const mimeType = blob.type || "image/jpeg";
  return new File([blob], filename, { type: mimeType });
}

/**
 * Triggers native system share sheet with the equipment photo file.
 */
export async function shareEquipmentPhotoWithGemini(
  options: ShareEquipmentOptions
): Promise<ShareResult> {
  const { photoUrl, exerciseName, note, traineeId, gymName } = options;
  const cleanName = exerciseName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const filename = `${cleanName}_setup.jpg`;

  const shareTitle = `${exerciseName} — Setup Check`;
  const gymSuffix = gymName ? ` at ${gymName}` : "";
  const shareText = `Here is my gym equipment setup for ${exerciseName}${gymSuffix}${
    note ? ` (Notes: "${note}")` : ""
  }. Please analyze my seat height, pin notch, and joint leverage angles for optimal biomechanics.`;

  telemetry.track("equipment_photo_shared", {
    exercise_name: exerciseName,
    has_note: Boolean(note),
  }, traineeId);

  // 1. Attempt Native Web Share API with File
  try {
    const file = await urlToFile(photoUrl, filename);
    if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        files: [file],
      });
      return { shared: true, method: "native_share" };
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      // User tapped cancel on share tray
      return { shared: false, method: "native_share", message: "Share cancelled" };
    }
    console.warn("Native file share was not completed, attempting clipboard fallback:", err);
  }

  // 2. Clipboard Fallback + Open Gemini in new tab
  try {
    const file = await urlToFile(photoUrl, filename);
    if (typeof navigator !== "undefined" && navigator.clipboard && typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([
        new ClipboardItem({ [file.type]: file }),
      ]);
      window.open("https://gemini.google.com/app", "_blank");
      return {
        shared: true,
        method: "clipboard_gemini",
        message: "Photo copied to clipboard! Paste directly into your new Gemini conversation.",
      };
    }
  } catch (clipErr) {
    console.warn("Clipboard write failed, attempting download fallback:", clipErr);
  }

  // 3. Download Fallback + Open Gemini
  try {
    const a = document.createElement("a");
    a.href = photoUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.open("https://gemini.google.com/app", "_blank");
    return {
      shared: true,
      method: "download_gemini",
      message: "Setup photo downloaded! Open Gemini to upload and ask for biomechanical analysis.",
    };
  } catch (dlErr) {
    return {
      shared: false,
      method: "download_gemini",
      message: "Could not share image automatically.",
    };
  }
}


export interface ShareAudioNoteOptions {
  audioUrl: string;
  exerciseName?: string;
  sessionTitle?: string;
  note?: string;
  traineeId?: string;
  gymName?: string;
}

/**
 * Triggers native system share sheet with an audio feedback memo file.
 * Opens Gemini app with the voice note attached and analysis prompt prefilled.
 */
export async function shareAudioNoteWithGemini(
  options: ShareAudioNoteOptions
): Promise<ShareResult> {
  const { audioUrl, exerciseName, sessionTitle, note, traineeId, gymName } = options;
  const label = exerciseName ? `${exerciseName} — Voice Feedback` : `${sessionTitle || "Workout"} — Voice Debrief`;
  const cleanName = (exerciseName || sessionTitle || "workout_voice_note")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_");

  let extension = "webm";
  if (audioUrl.includes("audio/mp4") || audioUrl.includes("audio/m4a")) {
    extension = "m4a";
  } else if (audioUrl.includes("audio/ogg")) {
    extension = "ogg";
  }
  const filename = `${cleanName}_feedback.${extension}`;

  const shareTitle = `${label} (Gemini Analysis)`;
  const gymSuffix = gymName ? ` at ${gymName}` : "";
  const shareText = `Here is my voice feedback memo for ${
    exerciseName ? `exercise: ${exerciseName}` : `session: ${sessionTitle || "Gym Workout"}`
  }${gymSuffix}${note ? ` (Context note: "${note}")` : ""}. Please listen to this audio note and provide feedback on my fatigue levels, technical execution, and any recovery adjustments needed.`;

  telemetry.track("audio_note_shared", {
    exercise_name: exerciseName || "workout_overall",
    has_note: Boolean(note),
  }, traineeId);

  // 1. Attempt Native Web Share API with real audio File
  try {
    const file = await urlToFile(audioUrl, filename);
    if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        files: [file],
      });
      return { shared: true, method: "native_share" };
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return { shared: false, method: "native_share", message: "Share cancelled" };
    }
    console.warn("Native audio share failed, trying download fallback:", err);
  }

  // 2. Download Fallback + Open Gemini in new tab
  try {
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.open("https://gemini.google.com/app", "_blank");
    return {
      shared: true,
      method: "download_gemini",
      message: "Audio note downloaded! Upload it to Gemini in your new conversation.",
    };
  } catch (dlErr) {
    return {
      shared: false,
      method: "download_gemini",
      message: "Could not share audio note automatically.",
    };
  }
}
