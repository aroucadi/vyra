import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GET } from "../../../src/app/api/health/route.ts";

describe("Google Cloud Run Health Probe API", () => {
  it("returns a 200 OK with valid health metrics", async () => {
    const response = await GET();
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.equal(data.status, "healthy");
    assert.equal(data.service, "newme-app");
    assert.ok(data.uptimeSeconds >= 0);
    assert.ok(data.memoryUsage);
    assert.ok(data.memoryUsage.rssMb > 0);
    assert.ok(data.timestamp);
  });

  it("has no-store caching headers for accurate liveness probing", async () => {
    const response = await GET();
    const cacheHeader = response.headers.get("Cache-Control");
    assert.ok(cacheHeader.toLowerCase().includes("no-store"));
  });
});
