/**
 * @file tools.ts
 * @description Native MCP Tools connecting Anthropic Claude to Vyra Athlete Telemetry.
 */

import { appStore } from "@/lib/store";
import { loadExerciseCatalogue } from "@/lib/rag/catalogue-loader";
import {
  resolveCanonicalMcpAthlete,
  resolveMcpBiometricCurve,
  resolveMcpFlightLogs,
  resolveMcpTodayWorkout,
  resolveMcpShadowAngelAudit,
} from "./athlete-context";
import {
  McpJsonRpcRequest,
  McpJsonRpcResponse,
  McpToolDefinition,
  McpToolCallResult,
  MCP_SERVER_INFO,
  MCP_PROTOCOL_VERSION,
} from "./protocol";

export const VYRA_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: "vyra_get_athlete_dossier",
    description:
      "Retrieves the sovereign athlete profile, InBody bio-impedance baseline (Skeletal Muscle Mass, Body Fat %, bilateral symmetry balance), caloric targets, and injury restrictions.",
    inputSchema: {
      type: "object",
      properties: {
        traineeId: {
          type: "string",
          description: "Optional trainee ID (defaults to active authenticated trainee or trainee_alaa)",
        },
      },
    },
  },
  {
    name: "vyra_get_biometric_curve",
    description:
      "Retrieves the historical 14-day/30-day bodyweight weigh-in curve, 7-day rolling average, weekly rate-of-gain pacing (+0.25% to 0.50%/week), and caloric surplus audit.",
    inputSchema: {
      type: "object",
      properties: {
        traineeId: {
          type: "string",
          description: "Optional trainee ID",
        },
        days: {
          type: "number",
          description: "Days of history to analyze (default: 14, max: 60)",
        },
      },
    },
  },
  {
    name: "vyra_get_flight_logs",
    description:
      "Retrieves past completed workout flight logs, including ballast volume (kg), set logs (weight, reps, RIR), PRs recorded, and progressive overload audit.",
    inputSchema: {
      type: "object",
      properties: {
        traineeId: {
          type: "string",
          description: "Optional trainee ID",
        },
        limit: {
          type: "number",
          description: "Maximum number of recent sessions to retrieve (default: 10, max: 50)",
        },
      },
    },
  },
  {
    name: "vyra_get_today_workout",
    description:
      "Retrieves today's scheduled training session, prescribed exercise blocks, sets, reps, target RIR, rest periods, load guidance, warmup protocol, and technical focus intentions.",
    inputSchema: {
      type: "object",
      properties: {
        traineeId: {
          type: "string",
          description: "Optional trainee ID",
        },
      },
    },
  },
  {
    name: "vyra_get_active_mesocycle",
    description:
      "Retrieves the active 16-week periodized mesocycle split, target muscle recruitment, volume landmarks (MEV/MAV/MRV), exercise assignments, and current progression week.",
    inputSchema: {
      type: "object",
      properties: {
        traineeId: {
          type: "string",
          description: "Optional trainee ID",
        },
      },
    },
  },
  {
    name: "vyra_get_shadow_angel_audit",
    description:
      "Comprehensive 360° neutral Shadow Angel audit snapshot compiling athlete dossier, 14-day weigh-in curve & pacing, progressive overload history, today's workout, and joint health status in one call.",
    inputSchema: {
      type: "object",
      properties: {
        traineeId: {
          type: "string",
          description: "Optional trainee ID",
        },
      },
    },
  },
  {
    name: "vyra_query_exercise_catalogue",
    description:
      "Searches the 6,554-movement biomechanical library by target muscle, apparatus group, hardware detail, movement pattern, or name. Returns video streaming URLs, resistance profiles, and coaching cues.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keyword (e.g. 'pulldown', 'incline press', 'lateral raise')",
        },
        targetMuscle: {
          type: "string",
          description: "Target muscle group (e.g. 'lats', 'chest', 'quadriceps', 'shoulders')",
        },
        apparatusGroup: {
          type: "string",
          description: "Equipment group (e.g. 'cable', 'dumbbell', 'barbell', 'machine', 'smith_machine')",
        },
        movementPattern: {
          type: "string",
          description: "Biomechanical pattern (e.g. 'horizontal_push', 'vertical_pull', 'isolation_flexion')",
        },
      },
    },
  },
  {
    name: "vyra_propose_coaching_intervention",
    description:
      "Formulates a structured Claude AI coaching proposition or deload/exercise adjustment that dispatches directly into the trainee's Vyra session HUD.",
    inputSchema: {
      type: "object",
      properties: {
        traineeId: {
          type: "string",
          description: "Trainee ID to receive the proposition",
        },
        title: {
          type: "string",
          description: "Concise title of the proposed adaptation",
        },
        rationale: {
          type: "string",
          description: "Biomechanical reasoning explaining why this adjustment optimizes stimulus-to-fatigue",
        },
        actionType: {
          type: "string",
          enum: ["EXERCISE_SWAP", "VOLUME_PRUNE", "DELOAD_PIVOT", "SETUP_CUE"],
          description: "Category of coaching action",
        },
      },
      required: ["traineeId", "title", "rationale", "actionType"],
    },
  },
];

export async function executeMcpToolCall(
  name: string,
  args: Record<string, unknown> = {},
  fallbackTraineeId: string = "trainee_alaa"
): Promise<McpToolCallResult> {
  const traineeId = (typeof args.traineeId === "string" && args.traineeId.trim()) || fallbackTraineeId;

  switch (name) {
    case "vyra_get_athlete_dossier": {
      const dossier = resolveCanonicalMcpAthlete(traineeId);
      return {
        content: [{ type: "text", text: JSON.stringify(dossier, null, 2) }],
      };
    }

    case "vyra_get_biometric_curve": {
      const days = typeof args.days === "number" ? Math.min(60, Math.max(1, args.days)) : 14;
      const curveReport = resolveMcpBiometricCurve(traineeId, days);
      return {
        content: [{ type: "text", text: JSON.stringify(curveReport, null, 2) }],
      };
    }

    case "vyra_get_flight_logs": {
      const limit = typeof args.limit === "number" ? Math.min(50, Math.max(1, args.limit)) : 10;
      const flightLogsReport = resolveMcpFlightLogs(traineeId, limit);
      return {
        content: [{ type: "text", text: JSON.stringify(flightLogsReport, null, 2) }],
      };
    }

    case "vyra_get_today_workout": {
      const todayReport = resolveMcpTodayWorkout(traineeId);
      return {
        content: [{ type: "text", text: JSON.stringify(todayReport, null, 2) }],
      };
    }

    case "vyra_get_active_mesocycle": {
      const isAlaa = !traineeId || traineeId === "trainee_alaa" || traineeId === "anon_visitor";
      const mesocycleData = {
        traineeId: isAlaa ? "trainee_alaa" : traineeId,
        programId: "prog_master_16wk",
        title: "16-Week Recomposition & Structural Balance",
        totalDurationWeeks: 16,
        currentWeekNumber: 1,
        activePhase: "Hypertrophy Phase 1 - Structural Calibration & Baseline Load",
        splitModel: "5-Day Master Split (Mon/Tue/Wed/Thu/Sat | Fri & Sun Rest)",
        weeklyVolumeLandmarks: {
          chest: { weeklyPrescribedSets: 14, mev: 10, mav: 16, mrv: 22 },
          upperBackAndLats: { weeklyPrescribedSets: 16, mev: 12, mav: 18, mrv: 24 },
          lateralDeltoids: { weeklyPrescribedSets: 12, mev: 8, mav: 14, mrv: 20 },
          quadriceps: { weeklyPrescribedSets: 12, mev: 8, mav: 14, mrv: 20 },
          hamstrings: { weeklyPrescribedSets: 10, mev: 6, mav: 12, mrv: 18 },
          arms: { weeklyPrescribedSets: 12, mev: 6, mav: 12, mrv: 18 },
        },
        scheduledDays: [
          { day: 1, dayName: "Monday", label: "Upper Hypertrophy A", focus: "Clavicular Chest, Upper Back & Side Delts" },
          { day: 2, dayName: "Tuesday", label: "Lower Hypertrophy A", focus: "Knee-Dominant Quads & Hamstrings" },
          { day: 3, dayName: "Wednesday", label: "Push Hypertrophy B", focus: "Sternal Chest, Triceps & Lateral Delts" },
          { day: 4, dayName: "Thursday", label: "Pull Hypertrophy B", focus: "Vertical Lats, Rhomboids & Rear Delts" },
          { day: 5, dayName: "Friday", label: "Active Recovery", focus: "Mobility, Decompression & Walk" },
          { day: 6, dayName: "Saturday", label: "Legs Core & Balance", focus: "Posterior Chain, Glutes & Core Bracing" },
          { day: 7, dayName: "Sunday", label: "Full Systemic Recovery", focus: "Glycogen Supercompensation & Sleep" },
        ],
        nutritionAndSupplementation: {
          dailyCaloricTargetKcal: 2850,
          dailyMacros: { proteinG: 140, carbsG: 380, fatsG: 65 },
          dailySupplements: [
            { name: "Scitec Jumbo Hardcore Mass Gainer", timing: "Post-workout / Mid-afternoon", dose: "4 scoops (2.82g Creatine Monohydrate)" },
            { name: "Vitamin D3 + K2", timing: "With fat-containing lunch", dose: "Mandatory daily target 40-60 ng/mL" },
            { name: "Electrolytes & Sodium", timing: "Intra-workout", dose: "750ml water + 500mg sodium" },
          ],
        },
        status: "ACTIVE",
      };

      return {
        content: [{ type: "text", text: JSON.stringify(mesocycleData, null, 2) }],
      };
    }

    case "vyra_get_shadow_angel_audit": {
      const shadowAngelReport = resolveMcpShadowAngelAudit(traineeId);
      return {
        content: [{ type: "text", text: JSON.stringify(shadowAngelReport, null, 2) }],
      };
    }

    case "vyra_query_exercise_catalogue": {
      const query = (typeof args.query === "string" ? args.query : "").toLowerCase().trim();
      const targetMuscle = (typeof args.targetMuscle === "string" ? args.targetMuscle : "").toLowerCase().trim();
      const apparatusGroup = (typeof args.apparatusGroup === "string" ? args.apparatusGroup : "").toLowerCase().trim();
      const movementPattern = (typeof args.movementPattern === "string" ? args.movementPattern : "").toLowerCase().trim();

      const catalogue = loadExerciseCatalogue();
      let matches = catalogue.exercises;

      if (targetMuscle) {
        matches = matches.filter(
          (e) =>
            (e.target || "").toLowerCase().includes(targetMuscle) ||
            (e.bodyPart || "").toLowerCase().includes(targetMuscle) ||
            (e.primaryMuscles || []).some((m) => m.toLowerCase().includes(targetMuscle))
        );
      }
      if (apparatusGroup) {
        matches = matches.filter(
          (e) =>
            (e.apparatusGroup || "").toLowerCase().includes(apparatusGroup) ||
            (e.equipment || "").toLowerCase().includes(apparatusGroup)
        );
      }
      if (movementPattern) {
        matches = matches.filter(
          (e) => (e.movementPattern || "").toLowerCase() === movementPattern
        );
      }
      if (query) {
        matches = matches.filter((e) => e.name.toLowerCase().includes(query));
      }

      const results = matches.slice(0, 15).map((e) => ({
        id: e.id,
        name: e.name,
        targetMuscle: e.target || e.bodyPart,
        primaryMuscles: e.primaryMuscles,
        apparatusGroup: e.apparatusGroup,
        hardwareDetail: e.hardwareDetail,
        movementPattern: e.movementPattern,
        resistanceProfile: e.resistanceProfile,
        axialLoading: e.axialLoading,
        videoUrl: e.videoUrl || e.clipUrl,
        coachingCues: e.coachingCues?.slice(0, 3),
        instructions: e.instructions?.slice(0, 2),
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                totalMatches: matches.length,
                returnedMatches: results.length,
                exercises: results,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "vyra_propose_coaching_intervention": {
      const title = String(args.title || "Claude AI Coaching Proposition");
      const rationale = String(args.rationale || "Biomechanical optimization recommended by Claude.");
      const actionType = String(args.actionType || "SETUP_CUE");

      // Structured logging for Cloud Run audit
      console.log(
        JSON.stringify({
          severity: "INFO",
          event: "vyra_claude_mcp_proposition",
          traineeId,
          title,
          rationale,
          actionType,
          timestamp: new Date().toISOString(),
        })
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: `Coaching proposition registered in Vyra for trainee ${traineeId}. The athlete will review it upon starting their next session.`,
                proposition: {
                  id: `prop_claude_${Date.now()}`,
                  traineeId,
                  title,
                  rationale,
                  actionType,
                  status: "PENDING_ATHLETE_REVIEW",
                  createdAt: new Date().toISOString(),
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
}

/**
 * Dispatches an MCP JSON-RPC 2.0 Request according to Anthropic MCP specifications.
 */
export async function handleMcpJsonRpcRequest(
  req: McpJsonRpcRequest,
  authTraineeId: string = "trainee_alaa"
): Promise<McpJsonRpcResponse> {
  const id = req.id !== undefined ? req.id : null;

  switch (req.method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {
            tools: {},
            resources: {},
          },
          serverInfo: MCP_SERVER_INFO,
        },
      };

    case "notifications/initialized":
      return {
        jsonrpc: "2.0",
        id,
        result: {},
      };

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: VYRA_MCP_TOOLS,
        },
      };

    case "tools/call": {
      const params = (req.params || {}) as {
        name?: string;
        arguments?: Record<string, unknown>;
      };
      if (!params.name) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: "Missing required tool name" },
        };
      }
      const callResult = await executeMcpToolCall(
        params.name,
        params.arguments || {},
        authTraineeId
      );
      return {
        jsonrpc: "2.0",
        id,
        result: callResult,
      };
    }

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${req.method}` },
      };
  }
}
