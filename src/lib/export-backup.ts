import { appStore } from "./store";
import { getClientStoredData, loadAllClientSessions, serializeBackupJson } from "./storage";
import { athleteModelStore, AthleteModel } from "./ai/athlete-model";
import { sensoryMemoryStore, SensoryFeedbackEntry } from "./ai/sensory-memory";
import { gymVisionInventoryStore, LocationEquipmentInventory } from "./ai/gym-vision-inventory";
import {
  BodyMetricEntry,
  ExerciseFeedbackRecord,
  GymLocation,
  HydrationGoal,
  HydrationLog,
  Program,
  SetLog,
  SupplementLog,
  SupplementProtocol,
  User,
  WearableBiometricSnapshot,
  WorkoutSession,
} from "./types";

export interface EquipmentPhotoCatalogEntry {
  photoKey: string;
  exerciseName: string;
  sessionId: string;
  mimeType: string;
  isBase64: boolean;
  byteLength: number;
  setCount: number;
}

export interface FullTraineeExportSummary {
  sessionsCount: number;
  totalSetsCount: number;
  setsWithEquipmentPhotoCount: number;
  setsWithBase64PhotoCount: number;
  uniqueEquipmentPhotosCount: number;
  programsCount: number;
  metricsCount: number;
  readinessLogsCount: number;
  supplementProtocolsCount: number;
  supplementLogsCount: number;
  hydrationLogsCount: number;
  sensoryEntriesCount: number;
  estimatedJsonBytes: number;
}

export interface FullTraineeExportPayload {
  schemaVersion: "2.1.0";
  exportedAt: string;
  user: Partial<User> & { id: string; name: string };
  activeProgram: Program | null;
  programs: Program[];
  sessions: WorkoutSession[];
  metrics: BodyMetricEntry[];
  readinessLogs: WearableBiometricSnapshot[];
  supplementProtocols: SupplementProtocol[];
  supplementLogs: SupplementLog[];
  hydrationGoals: HydrationGoal[];
  hydrationLogs: HydrationLog[];
  gymLocations: GymLocation[];
  gymInventory: LocationEquipmentInventory[];
  athleteModel: AthleteModel | null;
  sensoryMemory: SensoryFeedbackEntry[];
  equipmentPhotosCatalog: EquipmentPhotoCatalogEntry[];
  exportSummary: FullTraineeExportSummary;
}

export interface ExportBackupOptions {
  /** Additional sessions (e.g., from IndexedDB or custom test inputs) to merge */
  extraSessions?: WorkoutSession[];
  /** Custom or browser image resolver/compressor returning a Base64 data URI */
  photoDataResolver?: (uri: string) => Promise<string | undefined>;
  /** Max length of a single data URI before browser canvas optimization kicks in */
  maxPhotoDataUriChars?: number;
}

function normalizeExerciseKey(name?: string): string {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function isBase64ImageDataUri(uri?: string): boolean {
  if (!uri || typeof uri !== "string") return false;
  return /^data:image\/[a-zA-Z0-9+.-]+;base64,/i.test(uri.trim());
}

function extractMimeTypeFromUri(uri?: string): string {
  if (!uri) return "application/octet-stream";
  const match = uri.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/i);
  if (match?.[1]) return match[1].toLowerCase();
  if (/\.png(\?|$)/i.test(uri)) return "image/png";
  if (/\.webp(\?|$)/i.test(uri)) return "image/webp";
  return "image/jpeg";
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function mergeById<T extends { id?: string }>(primary: T[], secondary: T[]): T[] {
  const map = new Map<string, T>();
  let anonCounter = 0;

  for (const item of primary) {
    if (!item) continue;
    const key = item.id || `__anon_1_${anonCounter++}`;
    map.set(key, item);
  }
  for (const item of secondary) {
    if (!item) continue;
    const key = item.id || `__anon_2_${anonCounter++}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

function mergeSessionsWithPhotoPreservation(
  storeSessions: WorkoutSession[],
  clientSessions: WorkoutSession[]
): WorkoutSession[] {
  const map = new Map<string, WorkoutSession>();

  const upsert = (incoming: WorkoutSession) => {
    if (!incoming || !incoming.id) return;
    const existing = map.get(incoming.id);
    if (!existing) {
      map.set(incoming.id, cloneJson(incoming));
      return;
    }

    // Prefer whichever copy has more logged sets / richer media, merging feedback & set photos
    const existingSets = existing.setLogs || [];
    const incomingSets = incoming.setLogs || [];
    const base = incomingSets.length >= existingSets.length ? cloneJson(incoming) : cloneJson(existing);
    const other = incomingSets.length >= existingSets.length ? existing : incoming;

    base.exerciseFeedbacks = mergeFeedbackLists(base.exerciseFeedbacks, other.exerciseFeedbacks);
    base.audioNoteUrl = base.audioNoteUrl || other.audioNoteUrl;
    base.audioTranscript = base.audioTranscript || other.audioTranscript;
    base.sessionNote = base.sessionNote || other.sessionNote;
    base.gymId = base.gymId || other.gymId;
    base.gymName = base.gymName || other.gymName;

    map.set(base.id, base);
  };

  storeSessions.forEach(upsert);
  clientSessions.forEach(upsert);

  return Array.from(map.values()).sort((a, b) => {
    const tA = new Date(a.startedAt || a.date || 0).getTime();
    const tB = new Date(b.startedAt || b.date || 0).getTime();
    return tB - tA;
  });
}

function mergeFeedbackLists(
  primary?: ExerciseFeedbackRecord[],
  secondary?: ExerciseFeedbackRecord[]
): ExerciseFeedbackRecord[] | undefined {
  if (!primary?.length && !secondary?.length) return primary || secondary;
  const map = new Map<string, ExerciseFeedbackRecord>();
  for (const fb of [...(primary || []), ...(secondary || [])]) {
    const key = normalizeExerciseKey(fb.exerciseName);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...fb });
    } else {
      map.set(key, {
        ...prev,
        ...fb,
        photoUrl: fb.photoUrl || prev.photoUrl,
        equipmentPhotoUrl: fb.equipmentPhotoUrl || prev.equipmentPhotoUrl,
        equipmentPhotoBase64: fb.equipmentPhotoBase64 || prev.equipmentPhotoBase64,
        audioNoteUrl: fb.audioNoteUrl || prev.audioNoteUrl,
        audioTranscript: fb.audioTranscript || prev.audioTranscript,
        note: fb.note || prev.note,
      });
    }
  }
  return Array.from(map.values());
}

/**
 * Browser-only helper that fetches or downscales oversized image URLs/Base64 data URIs
 * into crisp compact JPEG Base64 strings so every set keeps its photo without export bloat.
 */
export async function optimizePhotoUriToBase64Browser(
  uri: string,
  maxDim = 560,
  quality = 0.65,
  maxPassThroughChars = 120_000
): Promise<string | undefined> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return isBase64ImageDataUri(uri) ? uri : undefined;
  }

  const trimmed = (uri || "").trim();
  if (!trimmed) return undefined;

  // Keep already-compact Base64 images untouched to preserve exact pixels
  if (isBase64ImageDataUri(trimmed) && trimmed.length <= maxPassThroughChars) {
    return trimmed;
  }

  let objectUrlToRevoke: string | null = null;
  try {
    let imageSrc = trimmed;
    if (!trimmed.startsWith("data:")) {
      const response = await fetch(trimmed);
      if (!response.ok) return undefined;
      const blob = await response.blob();
      objectUrlToRevoke = URL.createObjectURL(blob);
      imageSrc = objectUrlToRevoke;
    }

    return await new Promise<string | undefined>((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          let w = img.width || maxDim;
          let h = img.height || maxDim;
          if (w > maxDim || h > maxDim) {
            if (w >= h) {
              h = Math.max(1, Math.round((h * maxDim) / w));
              w = maxDim;
            } else {
              w = Math.max(1, Math.round((w * maxDim) / h));
              h = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(isBase64ImageDataUri(trimmed) ? trimmed : undefined);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          const optimized = canvas.toDataURL("image/jpeg", quality);
          if (isBase64ImageDataUri(trimmed) && optimized.length >= trimmed.length) {
            resolve(trimmed);
          } else {
            resolve(optimized);
          }
        } catch {
          resolve(isBase64ImageDataUri(trimmed) ? trimmed : undefined);
        }
      };
      img.onerror = () => resolve(isBase64ImageDataUri(trimmed) ? trimmed : undefined);
      img.src = imageSrc;
    });
  } catch {
    return isBase64ImageDataUri(trimmed) ? trimmed : undefined;
  } finally {
    if (objectUrlToRevoke) {
      try {
        URL.revokeObjectURL(objectUrlToRevoke);
      } catch {}
    }
  }
}

function enrichSessionsSetEquipmentPhotos(
  sessions: WorkoutSession[],
  programs: Program[],
  sensoryMemory: SensoryFeedbackEntry[]
): WorkoutSession[] {
  // Index program prescription photos by prescriptionId and normalized exerciseName
  const programPhotoByPrescriptionId = new Map<string, string>();
  const programPhotoByExerciseName = new Map<string, string>();
  for (const prog of programs) {
    for (const week of prog.weeks || []) {
      for (const day of week.days || []) {
        for (const block of day.blocks || []) {
          for (const ep of block.exercises || []) {
            if (ep.equipmentPhotoUrl) {
              programPhotoByPrescriptionId.set(ep.id, ep.equipmentPhotoUrl);
              const nameKey = normalizeExerciseKey(ep.exerciseName);
              if (!programPhotoByExerciseName.has(nameKey)) {
                programPhotoByExerciseName.set(nameKey, ep.equipmentPhotoUrl);
              }
            }
          }
        }
      }
    }
  }

  // Index sensory memory photos by (exerciseName + gymId) and fallback (exerciseName)
  const sensoryPhotoByExGym = new Map<string, string>();
  const sensoryPhotoByEx = new Map<string, string>();
  for (const entry of sensoryMemory) {
    if (!entry.equipmentPhotoUrl) continue;
    const exKey = normalizeExerciseKey(entry.exerciseName);
    if (entry.gymId) {
      sensoryPhotoByExGym.set(`${exKey}::${entry.gymId}`, entry.equipmentPhotoUrl);
    }
    if (!sensoryPhotoByEx.has(exKey)) {
      sensoryPhotoByEx.set(exKey, entry.equipmentPhotoUrl);
    }
  }

  return sessions.map((session) => {
    const clonedSession = cloneJson(session);

    // Build session-level photo map from feedbacks AND any sets that already carry a photo
    const sessionPhotoByPrescriptionId = new Map<string, string>();
    const sessionPhotoByExerciseName = new Map<string, string>();

    for (const fb of clonedSession.exerciseFeedbacks || []) {
      const uri = fb.equipmentPhotoBase64 || fb.photoUrl || fb.equipmentPhotoUrl;
      if (uri) {
        sessionPhotoByExerciseName.set(normalizeExerciseKey(fb.exerciseName), uri);
      }
    }

    for (const set of clonedSession.setLogs || []) {
      const uri = set.equipmentPhotoBase64 || set.photoUrl || set.equipmentPhotoUrl;
      if (uri) {
        if (set.exercisePrescriptionId && !sessionPhotoByPrescriptionId.has(set.exercisePrescriptionId)) {
          sessionPhotoByPrescriptionId.set(set.exercisePrescriptionId, uri);
        }
        const exKey = normalizeExerciseKey(set.exerciseName);
        if (exKey && !sessionPhotoByExerciseName.has(exKey)) {
          sessionPhotoByExerciseName.set(exKey, uri);
        }
      }
    }

    // Ensure EVERY SetLog in this session receives its equipment photo when available
    clonedSession.setLogs = (clonedSession.setLogs || []).map((set: SetLog) => {
      const exKey = normalizeExerciseKey(set.exerciseName);
      const resolvedUri =
        set.equipmentPhotoBase64 ||
        set.photoUrl ||
        set.equipmentPhotoUrl ||
        (set.exercisePrescriptionId ? sessionPhotoByPrescriptionId.get(set.exercisePrescriptionId) : undefined) ||
        sessionPhotoByExerciseName.get(exKey) ||
        (set.exercisePrescriptionId ? programPhotoByPrescriptionId.get(set.exercisePrescriptionId) : undefined) ||
        programPhotoByExerciseName.get(exKey) ||
        (clonedSession.gymId ? sensoryPhotoByExGym.get(`${exKey}::${clonedSession.gymId}`) : undefined) ||
        sensoryPhotoByEx.get(exKey);

      if (!resolvedUri) return set;

      const isB64 = isBase64ImageDataUri(resolvedUri);
      return {
        ...set,
        photoUrl: set.photoUrl || resolvedUri,
        equipmentPhotoUrl: set.equipmentPhotoUrl || resolvedUri,
        equipmentPhotoBase64: set.equipmentPhotoBase64 || (isB64 ? resolvedUri : undefined),
      };
    });

    // Keep exerciseFeedbacks synchronized as well
    if (clonedSession.exerciseFeedbacks?.length) {
      clonedSession.exerciseFeedbacks = clonedSession.exerciseFeedbacks.map((fb) => {
        const uri =
          fb.equipmentPhotoBase64 ||
          fb.photoUrl ||
          fb.equipmentPhotoUrl ||
          sessionPhotoByExerciseName.get(normalizeExerciseKey(fb.exerciseName));
        if (!uri) return fb;
        const isB64 = isBase64ImageDataUri(uri);
        return {
          ...fb,
          photoUrl: fb.photoUrl || uri,
          equipmentPhotoUrl: fb.equipmentPhotoUrl || uri,
          equipmentPhotoBase64: fb.equipmentPhotoBase64 || (isB64 ? uri : undefined),
        };
      });
    }

    return clonedSession;
  });
}

function buildPhotosCatalogAndStats(sessions: WorkoutSession[]): {
  catalog: EquipmentPhotoCatalogEntry[];
  totalSetsCount: number;
  setsWithEquipmentPhotoCount: number;
  setsWithBase64PhotoCount: number;
} {
  let totalSetsCount = 0;
  let setsWithEquipmentPhotoCount = 0;
  let setsWithBase64PhotoCount = 0;

  const uniqueMap = new Map<string, EquipmentPhotoCatalogEntry>();

  for (const session of sessions) {
    for (const set of session.setLogs || []) {
      totalSetsCount++;
      const photo = set.equipmentPhotoBase64 || set.photoUrl || set.equipmentPhotoUrl;
      if (photo) {
        setsWithEquipmentPhotoCount++;
        const isB64 = isBase64ImageDataUri(photo);
        if (isB64) setsWithBase64PhotoCount++;

        const existing = uniqueMap.get(photo);
        if (existing) {
          existing.setCount++;
        } else {
          uniqueMap.set(photo, {
            photoKey: `photo_${uniqueMap.size + 1}`,
            exerciseName: set.exerciseName,
            sessionId: session.id,
            mimeType: extractMimeTypeFromUri(photo),
            isBase64: isB64,
            byteLength: photo.length,
            setCount: 1,
          });
        }
      }
    }
  }

  return {
    catalog: Array.from(uniqueMap.values()),
    totalSetsCount,
    setsWithEquipmentPhotoCount,
    setsWithBase64PhotoCount,
  };
}

/**
 * Synchronously gathers ALL trainee data from appStore, client localStorage,
 * athleteModelStore, sensoryMemoryStore, and gymVisionInventoryStore,
 * guaranteeing that every logged SetLog carries its equipment picture if available.
 */
export function buildFullTraineeExportPayload(
  traineeId: string,
  options?: ExportBackupOptions
): FullTraineeExportPayload {
  const userObj = appStore.getUser(traineeId) || appStore.getCurrentUser();
  const user = cloneJson(userObj);

  const clientStored = getClientStoredData();
  const clientSessions = (clientStored.sessions || []).filter(
    (s: any) => !s?.traineeId || s.traineeId === traineeId
  );

  const activeProgramRaw = appStore.getActiveProgramForTrainee(traineeId) || null;
  const allProgramsRaw = appStore.getAllProgramsForTrainee(traineeId);
  const programs = cloneJson(
    allProgramsRaw.length > 0
      ? allProgramsRaw
      : activeProgramRaw
      ? [activeProgramRaw]
      : []
  );
  const activeProgram = activeProgramRaw ? cloneJson(activeProgramRaw) : null;

  const storeMetrics = appStore.getMetrics(traineeId);
  const clientMetrics = (clientStored.metrics || []).filter(
    (m: any) => !m?.traineeId || m.traineeId === traineeId
  );
  const metrics = cloneJson(mergeById<BodyMetricEntry>(storeMetrics, clientMetrics));

  const storeReadiness = appStore.getWearableBiometricsHistory(traineeId);
  const clientReadiness = (clientStored.readinessLogs || []).filter(
    (r: any) => !r?.traineeId || r.traineeId === traineeId
  );
  const readinessLogs = cloneJson(
    mergeById<WearableBiometricSnapshot>(storeReadiness, clientReadiness)
  );

  // Gather supplement protocols across all trainee programs
  const protocolMap = new Map<string, SupplementProtocol>();
  for (const p of programs) {
    for (const sp of appStore.getSupplementProtocols(p.id)) {
      protocolMap.set(sp.id, cloneJson(sp));
    }
    for (const sp of p.supplementProtocols || []) {
      if (!protocolMap.has(sp.id)) protocolMap.set(sp.id, cloneJson(sp));
    }
  }
  const supplementProtocols = Array.from(protocolMap.values());

  const storeSuppLogs = appStore.getAllSupplementLogs(traineeId);
  const clientSuppLogs = (clientStored.supplementLogs || []).filter(
    (l: any) => !l?.traineeId || l.traineeId === traineeId
  );
  const supplementLogs = cloneJson(mergeById<SupplementLog>(storeSuppLogs, clientSuppLogs));

  const hydrationGoal = appStore.getHydrationGoal(traineeId);
  const hydrationGoals = hydrationGoal ? [cloneJson(hydrationGoal)] : [];
  const hydrationLogs = cloneJson(appStore.getAllHydrationLogs(traineeId));

  const gymLocations = cloneJson(appStore.getUserGymLocations(traineeId));
  const gymInventory: LocationEquipmentInventory[] = [];
  for (const gym of gymLocations) {
    try {
      const inv = gymVisionInventoryStore.getInventoryForGym(gym.id, traineeId);
      if (inv) gymInventory.push(cloneJson(inv));
    } catch {}
  }

  let athleteModel: AthleteModel | null = null;
  try {
    athleteModel = cloneJson(athleteModelStore.getAthleteModel(traineeId));
  } catch {
    athleteModel = null;
  }

  let sensoryMemory: SensoryFeedbackEntry[] = [];
  try {
    sensoryMemory = cloneJson(sensoryMemoryStore.getAllForTrainee(traineeId));
  } catch {
    sensoryMemory = [];
  }

  const combinedSessions = mergeSessionsWithPhotoPreservation(
    appStore.getSessions(traineeId),
    [...clientSessions, ...(options?.extraSessions || [])]
  );

  const enrichedSessions = enrichSessionsSetEquipmentPhotos(
    combinedSessions,
    programs,
    sensoryMemory
  );

  const {
    catalog,
    totalSetsCount,
    setsWithEquipmentPhotoCount,
    setsWithBase64PhotoCount,
  } = buildPhotosCatalogAndStats(enrichedSessions);

  const payloadWithoutSize: Omit<FullTraineeExportPayload, "exportSummary"> & {
    exportSummary: FullTraineeExportSummary;
  } = {
    schemaVersion: "2.1.0",
    exportedAt: new Date().toISOString(),
    user,
    activeProgram,
    programs,
    sessions: enrichedSessions,
    metrics,
    readinessLogs,
    supplementProtocols,
    supplementLogs,
    hydrationGoals,
    hydrationLogs,
    gymLocations,
    gymInventory,
    athleteModel,
    sensoryMemory,
    equipmentPhotosCatalog: catalog,
    exportSummary: {
      sessionsCount: enrichedSessions.length,
      totalSetsCount,
      setsWithEquipmentPhotoCount,
      setsWithBase64PhotoCount,
      uniqueEquipmentPhotosCount: catalog.length,
      programsCount: programs.length,
      metricsCount: metrics.length,
      readinessLogsCount: readinessLogs.length,
      supplementProtocolsCount: supplementProtocols.length,
      supplementLogsCount: supplementLogs.length,
      hydrationLogsCount: hydrationLogs.length,
      sensoryEntriesCount: sensoryMemory.length,
      estimatedJsonBytes: 0,
    },
  };

  payloadWithoutSize.exportSummary.estimatedJsonBytes = serializeBackupJson(payloadWithoutSize).length;
  return payloadWithoutSize;
}

/**
 * Asynchronous complete export:
 * 1. Loads IndexedDB offline sessions in addition to localStorage & in-memory store
 * 2. Resolves & optimizes equipment photos to Base64 (caching once per unique URI) so
 *    every set includes a crisp, self-contained Base64 image without truncation or buffer bloat.
 */
export async function buildFullTraineeExportPayloadAsync(
  traineeId: string,
  options?: ExportBackupOptions
): Promise<FullTraineeExportPayload> {
  const idbAndLocalSessions = await loadAllClientSessions(traineeId);
  const mergedExtras = [...idbAndLocalSessions, ...(options?.extraSessions || [])];

  const payload = buildFullTraineeExportPayload(traineeId, {
    ...options,
    extraSessions: mergedExtras,
  });

  const resolver =
    options?.photoDataResolver ||
    (typeof window !== "undefined"
      ? (uri: string) =>
          optimizePhotoUriToBase64Browser(
            uri,
            560,
            0.65,
            options?.maxPhotoDataUriChars ?? 120_000
          )
      : undefined);

  if (!resolver) {
    return payload;
  }

  // Deduplicated media resolution cache so identical photos across sets are processed once
  const resolvedCache = new Map<string, string | undefined>();
  const resolveOnce = async (uri?: string): Promise<string | undefined> => {
    if (!uri) return undefined;
    if (resolvedCache.has(uri)) return resolvedCache.get(uri);
    const out = await resolver(uri);
    resolvedCache.set(uri, out);
    return out;
  };

  for (const session of payload.sessions) {
    for (let i = 0; i < (session.setLogs || []).length; i++) {
      const set = session.setLogs[i];
      const rawUri = set.equipmentPhotoBase64 || set.photoUrl || set.equipmentPhotoUrl;
      if (!rawUri) continue;

      const resolved = await resolveOnce(rawUri);
      if (resolved) {
        const isB64 = isBase64ImageDataUri(resolved);
        session.setLogs[i] = {
          ...set,
          photoUrl: resolved,
          equipmentPhotoUrl: set.equipmentPhotoUrl || resolved,
          equipmentPhotoBase64: isB64 ? resolved : set.equipmentPhotoBase64,
        };
      }
    }

    for (let i = 0; i < (session.exerciseFeedbacks || []).length; i++) {
      const fb = session.exerciseFeedbacks![i];
      const rawUri = fb.equipmentPhotoBase64 || fb.photoUrl || fb.equipmentPhotoUrl;
      if (!rawUri) continue;
      const resolved = await resolveOnce(rawUri);
      if (resolved) {
        const isB64 = isBase64ImageDataUri(resolved);
        session.exerciseFeedbacks![i] = {
          ...fb,
          photoUrl: resolved,
          equipmentPhotoUrl: fb.equipmentPhotoUrl || resolved,
          equipmentPhotoBase64: isB64 ? resolved : fb.equipmentPhotoBase64,
        };
      }
    }
  }

  const {
    catalog,
    totalSetsCount,
    setsWithEquipmentPhotoCount,
    setsWithBase64PhotoCount,
  } = buildPhotosCatalogAndStats(payload.sessions);

  payload.equipmentPhotosCatalog = catalog;
  payload.exportSummary = {
    ...payload.exportSummary,
    sessionsCount: payload.sessions.length,
    totalSetsCount,
    setsWithEquipmentPhotoCount,
    setsWithBase64PhotoCount,
    uniqueEquipmentPhotosCount: catalog.length,
    estimatedJsonBytes: 0,
  };
  payload.exportSummary.estimatedJsonBytes = serializeBackupJson(payload).length;

  return payload;
}
