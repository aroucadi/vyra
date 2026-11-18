import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import {
  isCloudStorageEnabled,
  setCloudStorageConfig,
  resetCloudStorageConfig,
  sanitizeStorageKey,
  generateEquipmentPhotoPath,
  parseDataUri,
  uploadEquipmentPhoto,
  DEFAULT_CLOUD_STORAGE_CONFIG,
} from "@/lib/cloud-storage";
import { uploadEquipmentPhotoAction, getCloudStorageStatusAction } from "@/lib/actions/upload";

describe("Cloud Storage Service & Feature Flag Gate (GCS / S3)", () => {
  beforeEach(() => {
    resetCloudStorageConfig();
  });

  afterEach(() => {
    resetCloudStorageConfig();
  });

  test("cloud storage feature flag is strictly OFF by default", () => {
    assert.strictEqual(
      DEFAULT_CLOUD_STORAGE_CONFIG.enabled,
      false,
      "Feature flag must default to false / disabled"
    );
    assert.strictEqual(
      isCloudStorageEnabled(),
      false,
      "isCloudStorageEnabled() must return false by default"
    );
  });

  test("when feature flag is OFF, uploadEquipmentPhoto returns local fallback with zero network calls", async () => {
    const sampleDataUri = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQ...";
    const result = await uploadEquipmentPhoto(sampleDataUri, {
      traineeId: "trainee_alaa",
      exerciseName: "lever chest press",
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.isCloud, false, "Must not upload to cloud when feature flag is OFF");
    assert.strictEqual(result.provider, "local_fallback");
    assert.strictEqual(result.url, sampleDataUri, "Must return the local data URI untouched");
  });

  test("server action uploadEquipmentPhotoAction respects the OFF flag", async () => {
    const sampleDataUri = "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const res = await uploadEquipmentPhotoAction({
      dataUri: sampleDataUri,
      traineeId: "trainee_alaa",
      exerciseName: "seated cable row",
    });

    assert.strictEqual(res.isCloud, false);
    assert.strictEqual(res.provider, "local_fallback");
    assert.strictEqual(res.url, sampleDataUri);

    const status = await getCloudStorageStatusAction();
    assert.strictEqual(status.enabled, false);
  });

  test("sanitizes storage keys and formats clean paths", () => {
    assert.strictEqual(sanitizeStorageKey("Trainee Alaa!"), "trainee_alaa");
    assert.strictEqual(sanitizeStorageKey("0597: Lever Seated Hip Abduction (30kg)"), "0597_lever_seated_hip_abduction_30kg");

    const path = generateEquipmentPhotoPath(
      {
        traineeId: "trainee_alaa",
        exerciseName: "Smith Machine Incline Press",
      },
      "jpg"
    );

    assert.ok(path.startsWith("equipment-photos/trainee_alaa/"), "Must be placed in trainee directory");
    assert.ok(path.includes("smith_machine_incline_press.jpg"), "Must contain sanitized exercise name");
  });

  test("correctly parses base64 data URIs into binary buffers", () => {
    const samplePng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const parsed = parseDataUri(samplePng);

    assert.ok(parsed, "Must parse valid data URI");
    assert.strictEqual(parsed.contentType, "image/png");
    assert.ok(parsed.buffer.length > 0, "Buffer must contain decoded bytes");
  });

  test("when feature flag is activated with missing credentials, fails closed without fabricating cloud URLs", async () => {
    const prevGcsToken = process.env.GCS_ACCESS_TOKEN;
    const prevS3Url = process.env.S3_PRESIGNED_PUT_URL;
    delete process.env.GCS_ACCESS_TOKEN;
    delete process.env.S3_PRESIGNED_PUT_URL;

    try {
      setCloudStorageConfig({
        enabled: true,
        provider: "gcs",
        bucketName: "vyra-test-bucket",
        publicUrlPrefix: "https://storage.googleapis.com/vyra-test-bucket",
      });

      const samplePng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const gcsResult = await uploadEquipmentPhoto(samplePng, {
        traineeId: "trainee_alaa",
        exerciseName: "glute bridge machine",
      });
      assert.strictEqual(gcsResult.success, false);
      assert.strictEqual(gcsResult.isCloud, false);
      assert.strictEqual(gcsResult.provider, "local_fallback");
      assert.match(gcsResult.error || "", /GCS_ACCESS_TOKEN|token/i);

      setCloudStorageConfig({ enabled: true, provider: "s3", bucketName: "vyra-s3-bucket" });
      const s3Result = await uploadEquipmentPhoto(samplePng, {
        traineeId: "trainee_alaa",
        exerciseName: "glute bridge machine",
      });
      assert.strictEqual(s3Result.success, false);
      assert.strictEqual(s3Result.isCloud, false);
      assert.match(s3Result.error || "", /S3_PRESIGNED_PUT_URL/i);
    } finally {
      if (prevGcsToken !== undefined) process.env.GCS_ACCESS_TOKEN = prevGcsToken;
      if (prevS3Url !== undefined) process.env.S3_PRESIGNED_PUT_URL = prevS3Url;
    }
  });

  test("when feature flag is activated with credentials, executes GCS upload and returns cloud URL", async () => {
    const prevToken = process.env.GCS_ACCESS_TOKEN;
    process.env.GCS_ACCESS_TOKEN = "mock_gcs_token_123";
    const calls: Array<{ url: string; method?: string; auth?: string }> = [];

    try {
      setCloudStorageConfig({
        enabled: true,
        provider: "gcs",
        bucketName: "vyra-test-bucket",
        publicUrlPrefix: "https://storage.googleapis.com/vyra-test-bucket",
      });

      assert.strictEqual(isCloudStorageEnabled(), true);

      const samplePng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const result = await uploadEquipmentPhoto(
        samplePng,
        {
          traineeId: "trainee_alaa",
          exerciseName: "glute bridge machine",
        },
        {
          fetchImpl: async (input, init) => {
            calls.push({
              url: typeof input === "string" ? input : input.toString(),
              method: init?.method,
              auth: (init?.headers as Record<string, string>)?.Authorization,
            });
            return new Response(JSON.stringify({ name: "ok" }), { status: 200 });
          },
        }
      );

      assert.strictEqual(calls.length, 1);
      assert.strictEqual(calls[0].method, "POST");
      assert.strictEqual(calls[0].auth, "Bearer mock_gcs_token_123");
      assert.ok(calls[0].url.includes("vyra-test-bucket"));
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.isCloud, true, "Must be marked as cloud when upload succeeds");
      assert.strictEqual(result.provider, "gcs");
      assert.ok(result.url.startsWith("https://storage.googleapis.com/vyra-test-bucket/equipment-photos/trainee_alaa/"));
      assert.ok(result.url.endsWith(".png"));
    } finally {
      if (prevToken === undefined) delete process.env.GCS_ACCESS_TOKEN;
      else process.env.GCS_ACCESS_TOKEN = prevToken;
    }
  });

  test("when feature flag is activated for S3 with presigned URL, executes PUT and returns S3 endpoint", async () => {
    const prevS3 = process.env.S3_PRESIGNED_PUT_URL;
    process.env.S3_PRESIGNED_PUT_URL = "https://vyra-s3-bucket.s3.eu-west-1.amazonaws.com/presigned?sig=1";
    let putCalled = false;

    try {
      setCloudStorageConfig({
        enabled: true,
        provider: "s3",
        bucketName: "vyra-s3-bucket",
        region: "eu-west-1",
      });

      const sampleJpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
      const result = await uploadEquipmentPhoto(
        sampleJpeg,
        {
          traineeId: "trainee_alaa",
          exerciseName: "lever seated hip abduction",
        },
        {
          fetchImpl: async (input, init) => {
            assert.strictEqual(init?.method, "PUT");
            assert.ok(String(input).includes("presigned"));
            putCalled = true;
            return new Response("", { status: 200 });
          },
        }
      );

      assert.strictEqual(putCalled, true);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.isCloud, true);
      assert.strictEqual(result.provider, "s3");
      assert.ok(result.url.includes("vyra-s3-bucket.s3.eu-west-1.amazonaws.com"));
    } finally {
      if (prevS3 === undefined) delete process.env.S3_PRESIGNED_PUT_URL;
      else process.env.S3_PRESIGNED_PUT_URL = prevS3;
    }
  });

  test("rejects non-raster SVG data URIs when cloud storage upload is enabled", async () => {
    setCloudStorageConfig({
      enabled: true,
      provider: "gcs",
      bucketName: "vyra-test-bucket",
    });

    const maliciousSvg =
      "data:image/svg+xml;base64," +
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>').toString("base64");
    const result = await uploadEquipmentPhoto(maliciousSvg, {
      traineeId: "trainee_alaa",
      exerciseName: "chest_press",
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.isCloud, false);
    assert.match(result.error || "", /Unsupported image content type/i);
  });
});
