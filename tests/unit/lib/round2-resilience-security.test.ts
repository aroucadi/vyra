import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

import { parseGeminiJson } from "@/lib/gemini";
import { runVertexAgenticCoachLoop } from "@/lib/ai/vertex-agent-loop";
import { extractStructuredSymptomsViaLlm } from "@/lib/ai/symptom-nlu";
import { gymVisionInventoryStore } from "@/lib/ai/gym-vision-inventory";
import { clearRateLimitBucketsForTesting, checkDistributedRateLimit } from "@/lib/auth/rate-limit";
import { __setMockFirebaseAdminForTesting } from "@/lib/firebase/admin";
import { resetCloudStorageConfig } from "@/lib/cloud-storage";
import { acceptCoachInvite } from "@/lib/trainer-invite";
import { appStore } from "@/lib/store";
import { BALANCE_STATUSES } from "@/lib/training-math/structural-balance-types";

import { POST as uploadEquipmentPhotoPost } from "@/app/api/upload/equipment-photo/route";
import { POST as syncEventsPost } from "@/app/api/sync/events/route";
import { POST as authPasskeyPost } from "@/app/api/auth/passkey/route";
import { POST as telemetryEventsPost } from "@/app/api/events/route";
import { POST as postureBalancePost } from "@/app/api/posture/route";
import { POST as meSyncPost } from "@/app/api/me/sync/route";
import { GET as exercisesGet } from "@/app/api/exercises/route";

describe("Round-2 Resilience, Failover, Multi-Tenant Isolation & Security", () => {
  beforeEach(() => {
    clearRateLimitBucketsForTesting();
    resetCloudStorageConfig();
  });

  it("parseGeminiJson strips markdown code fences and parses structured payloads", () => {
    const fenced = "```json\n{\"status\":\"ok\",\"items\":[1,2,3]}\n```";
    const parsed = parseGeminiJson<{ status: string; items: number[] }>(fenced);
    assert.equal(parsed.status, "ok");
    assert.deepEqual(parsed.items, [1, 2, 3]);
  });

  it("runVertexAgenticCoachLoop fails over cleanly from gemini-4-argon (404) to gemini-3.8-flash", async () => {
    const calledUrls: string[] = [];
    let stage = 0;

    const fakeFetch: typeof fetch = async (input) => {
      const url = typeof input === "string" ? input : input.toString();
      calledUrls.push(url);

      if (url.includes("gemini-4-argon")) {
        return new Response(JSON.stringify({ error: { code: 404, message: "Not Found" } }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("gemini-3.8-flash")) {
        stage += 1;
        if (stage === 1) {
          return new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    role: "model",
                    parts: [
                      {
                        functionCall: {
                          name: "propose_and_critique_intervention",
                          args: {
                            primaryBottleneck: "None — technique consolidation phase",
                            proposedAction: "Hold at 80kg for consolidation",
                            skepticalChallenge: "No tendon overload risk.",
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  role: "model",
                  parts: [
                    {
                      functionCall: {
                        name: "commit_coaching_decision",
                        args: {
                          tier: "tier_1_micro_setup",
                          headline: "Consolidate 80 kg Bench Press",
                          rootCauseDiagnosis: "Solid bar speed near target RIR",
                          proposedFix: "Keep 80 kg for 3x8-10 and stabilize tempo.",
                          prescribedWeightKg: 80,
                          prescribedSets: 3,
                          repLow: 8,
                          repHigh: 10,
                          whyThis: "Locks in crisp scapular retraction.",
                          whyNow: "Zero red-flag fatigue.",
                          whyForYou: "Calibrated for your baseline.",
                          whatWeWatch: "Lockout bar speed.",
                          whenWeRevisit: "Next chest session.",
                          experimentHypothesis: "Consolidation preserves clean RIR 2.",
                        },
                      },
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response("Unexpected URL", { status: 500 });
    };

    const res = await runVertexAgenticCoachLoop(
      {
        traineeId: "trainee_round2_failover",
        exerciseName: "Barbell Bench Press",
        currentWeightKg: 80,
        targetSets: 3,
        repLow: 8,
        repHigh: 10,
      },
      { maxTurns: 4, fetchImpl: fakeFetch, maxRetries: 0 }
    );

    assert.ok(calledUrls.some((u) => u.includes("gemini-4-argon")));
    assert.ok(calledUrls.some((u) => u.includes("gemini-3.8-flash")));
    assert.equal(res.modelUsed, "gemini-3.8-flash");
    assert.equal(
      res.decisionOrigin,
      "llm_committed_decision",
      `Unexpected result: ${JSON.stringify({
        decisionOrigin: res.decisionOrigin,
        modelUsed: res.modelUsed,
        stagesCompleted: res.stagesCompleted,
        schemaValidationErrors: res.schemaValidationErrors,
        turnsExecuted: res.turnsExecuted,
        toolCallsHistory: res.toolCallsHistory,
      })}`
    );
    assert.equal(res.proposition?.headline, "Consolidate 80 kg Bench Press");
  });

  it("extractStructuredSymptomsViaLlm fails over from gemini-4-argon (404) to gemini-3.8-flash and unwraps fenced JSON", async () => {
    const calledUrls: string[] = [];

    const fakeFetch: typeof fetch = async (input) => {
      const url = typeof input === "string" ? input : input.toString();
      calledUrls.push(url);

      if (url.includes("gemini-4-argon")) {
        return new Response("Model not found", { status: 404 });
      }

      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: "```json\n{\"items\":[{\"rawInput\":\"ketfi kaywja3ni\",\"joint\":\"shoulder\",\"polarity\":\"active_pain\"}]}\n```",
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const result = await extractStructuredSymptomsViaLlm(
      ["ketfi kaywja3ni"],
      { fetchImpl: fakeFetch, apiKeyOverride: "test-key" }
    );

    assert.ok(calledUrls.some((u) => u.includes("gemini-4-argon")));
    assert.ok(calledUrls.some((u) => u.includes("gemini-3.8-flash")));
    assert.ok(result.symptoms.includes("anterior_shoulder_pinch"));
    assert.equal(result.structuredReports[0]?.extractionMethod, "llm_semantic");
  });

  it("isolates gym equipment inventories strictly per traineeId tenant", () => {
    const userA = `tenant_a_${Date.now()}`;
    const userB = `tenant_b_${Date.now()}`;
    const sharedGymId = "gym_shared_club";

    gymVisionInventoryStore.markEquipmentUnavailableForSession({
      gymId: sharedGymId,
      gymName: "Shared Athletic Club",
      traineeId: userA,
      equipment: ["cable"],
      reason: "Cable tower under maintenance",
    });

    const invA = gymVisionInventoryStore.getInventoryForGym(sharedGymId, "Shared Athletic Club", userA);
    const invB = gymVisionInventoryStore.getInventoryForGym(sharedGymId, "Shared Athletic Club", userB);

    assert.ok(invA.unavailableEquipment.includes("cable"));
    assert.equal(invB.unavailableEquipment.includes("cable"), false);

    // Non-Alaa tenant must not inherit Punch Lissasfa limitations
    const otherPunch = gymVisionInventoryStore.getInventoryForGym(
      "gym_punch_lissasfa",
      "Punch by Badr Hari Lissasfa",
      userB
    );
    assert.equal(otherPunch.traineeId, userB);
  });

  it("blocks SVG XSS uploads, malformed JSON, and oversized payloads even when Cloud Storage flag is OFF", async () => {
    const svgReq = new NextRequest("http://localhost:3000/api/upload/equipment-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.1" },
      body: JSON.stringify({
        imageBase64: "data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+",
        traineeId: "trainee_test",
      }),
    });
    const svgRes = await uploadEquipmentPhotoPost(svgReq);
    assert.equal(svgRes.status, 400);

    const badJsonReq = new NextRequest("http://localhost:3000/api/upload/equipment-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.2" },
      body: "{not_json",
    });
    const badJsonRes = await uploadEquipmentPhotoPost(badJsonReq);
    assert.equal(badJsonRes.status, 400);

    const hugeReq = new NextRequest("http://localhost:3000/api/upload/equipment-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.3" },
      body: JSON.stringify({
        imageBase64: `data:image/jpeg;base64,${"A".repeat(14 * 1024 * 1024 + 32)}`,
      }),
    });
    const hugeRes = await uploadEquipmentPhotoPost(hugeReq);
    assert.equal(hugeRes.status, 413);
  });

  it("returns 400 on malformed JSON across mutation/auth/posture endpoints and enforces auth on /api/me/sync", async () => {
    const routes = [
      { url: "http://localhost:3000/api/sync/events", handler: syncEventsPost },
      { url: "http://localhost:3000/api/auth/passkey", handler: authPasskeyPost },
      { url: "http://localhost:3000/api/events", handler: telemetryEventsPost },
      { url: "http://localhost:3000/api/posture", handler: postureBalancePost },
    ];

    for (const r of routes) {
      const req = new NextRequest(r.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.55" },
        body: "{bad-json",
      });
      const res = await r.handler(req);
      assert.equal(res.status, 400, `Expected 400 malformed JSON on ${r.url}`);
    }

    const meSyncUnauth = await meSyncPost(
      new NextRequest("http://localhost:3000/api/me/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programs: [] }),
      })
    );
    assert.equal(meSyncUnauth.status, 401);

    // Rate limit enforcement check on /api/auth/passkey (maxRequests = 20 / min)
    let rateLimited = false;
    for (let i = 0; i < 25; i++) {
      const rlReq = new NextRequest("http://localhost:3000/api/auth/passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.99" },
        body: "{invalid",
      });
      const rlRes = await authPasskeyPost(rlReq);
      if (rlRes.status === 429) {
        rateLimited = true;
        assert.ok(rlRes.headers.get("Retry-After"));
        break;
      }
    }
    assert.equal(rateLimited, true, "Expected 429 on /api/auth/passkey burst");
  });

  it("POST /api/posture computes dynamic snapshot ratios and GET /api/exercises filters across full search hits", async () => {
    const postureRes = await postureBalancePost(
      new NextRequest("http://localhost:3000/api/posture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessions: [],
          metrics: [],
        }),
      })
    );
    assert.equal(postureRes.status, 200);
    const postureJson = (await postureRes.json()) as {
      template: string;
      templateLabel: string;
      results: Array<{ roleId: string; status: string }>;
      labels: Record<string, string>;
    };
    assert.equal(postureJson.template, "poliquin");
    assert.ok(Array.isArray(postureJson.results));
    assert.ok(postureJson.results.length >= 4);
    assert.ok(postureJson.results.every((r) => r.status === BALANCE_STATUSES.NO_DATA));

    const exRes = await exercisesGet(
      new NextRequest(
        "http://localhost:3000/api/exercises?q=press&equipment=dumbbell&limit=5"
      )
    );
    assert.equal(exRes.status, 200);
    const exJson = (await exRes.json()) as {
      total: number;
      exercises: Array<{ equipment: string; name: string }>;
    };
    assert.ok(exJson.exercises.length > 0 && exJson.exercises.length <= 5);
    assert.ok(exJson.total >= exJson.exercises.length);
    for (const ex of exJson.exercises) {
      assert.ok(ex.equipment.toLowerCase().includes("dumbbell"));
    }
  });

  it("acceptCoachInvite assigns non-empty populated workout weeks to a brand-new trainee", () => {
    const traineeId = `trainee_clean_weeks_${Date.now()}`;
    const res = acceptCoachInvite(traineeId, {
      coachId: "coach_round2",
      coachName: "Coach Marcus",
      programTitle: "Round-2 Clean Invite Program",
      weeks: 8,
      anchorLift: "barbell_bench",
      startingBenchKg: 75,
      unit: "kg",
      traineeName: "Sofia Clean",
    });

    assert.equal(res.success, true);
    assert.ok(res.programId);
    const prog = appStore.getActiveProgramForTrainee(traineeId);
    assert.ok(prog);
    assert.equal(prog.weeks.length, 8);
    assert.ok((prog.weeks[0]?.days.length ?? 0) > 0);
  });

  it("checkDistributedRateLimit enforces Firestore L2 limit across cold L1 instances", async () => {
    const l2Docs = new Map<string, Record<string, unknown>>();
    const mockFirestore = {
      collection: (col: string) => ({
        doc: (id: string) => {
          const path = `${col}/${id}`;
          return {
            path,
            get: async () => ({
              exists: l2Docs.has(path),
              data: () => l2Docs.get(path),
            }),
          };
        },
      }),
      runTransaction: async <T>(fn: (tx: {
        get: (ref: { path: string }) => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
        set: (ref: { path: string }, data: Record<string, unknown>, opts?: { merge?: boolean }) => void;
      }) => Promise<T>) => {
        const tx = {
          get: async (ref: { path: string }) => ({
            exists: l2Docs.has(ref.path),
            data: () => l2Docs.get(ref.path),
          }),
          set: (ref: { path: string }, data: Record<string, unknown>, opts?: { merge?: boolean }) => {
            if (opts?.merge && l2Docs.has(ref.path)) {
              l2Docs.set(ref.path, { ...l2Docs.get(ref.path)!, ...data });
            } else {
              l2Docs.set(ref.path, { ...data });
            }
          },
        };
        return fn(tx);
      },
    };

    __setMockFirebaseAdminForTesting({ firestore: mockFirestore as never });
    try {
      const cfg = { maxRequests: 2, windowMs: 60_000 };
      const now = Date.now();
      // Simulate instance 1 hitting twice
      const r1 = await checkDistributedRateLimit("scope:shared_user", cfg, now);
      const r2 = await checkDistributedRateLimit("scope:shared_user", cfg, now + 10);
      assert.equal(r1.allowed, true);
      assert.equal(r1.layer, "firestore_l2");
      assert.equal(r2.allowed, true);

      // Clear L1 memory (simulating a cold Cloud Run instance 2) -> L2 still blocks 3rd request!
      clearRateLimitBucketsForTesting();
      const r3 = await checkDistributedRateLimit("scope:shared_user", cfg, now + 20);
      assert.equal(r3.allowed, false);
      assert.equal(r3.layer, "firestore_l2");
      assert.equal(r3.remaining, 0);
    } finally {
      __setMockFirebaseAdminForTesting(null);
    }
  });
});
