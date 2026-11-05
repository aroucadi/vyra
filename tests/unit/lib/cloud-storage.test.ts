import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import {
  isCloudStorageEnabled,
  getCloudStorageConfig,
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

  test("when feature flag is activated, routes to configured GCS bucket with cloud URL", async () => {
    // Dynamically activate feature flag
    setCloudStorageConfig({
      enabled: true,
      provider: "gcs",
      bucketName: "vyra-test-bucket",
      publicUrlPrefix: "https://storage.googleapis.com/vyra-test-bucket",
    });

    assert.strictEqual(isCloudStorageEnabled(), true);

    const samplePng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const result = await uploadEquipmentPhoto(samplePng, {
      traineeId: "trainee_alaa",
      exerciseName: "glute bridge machine",
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.isCloud, true, "Must be marked as cloud when flag is active");
    assert.strictEqual(result.provider, "gcs");
    assert.ok(result.url.startsWith("https://storage.googleapis.com/vyra-test-bucket/equipment-photos/trainee_alaa/"));
    assert.ok(result.url.endsWith(".png"));
  });

  test("when feature flag is activated for S3, routes to S3 endpoint", async () => {
    setCloudStorageConfig({
      enabled: true,
      provider: "s3",
      bucketName: "vyra-s3-bucket",
      region: "eu-west-1",
    });

    const sampleJpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
    const result = await uploadEquipmentPhoto(sampleJpeg, {
      traineeId: "trainee_alaa",
      exerciseName: "lever seated hip abduction",
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.isCloud, true);
    assert.strictEqual(result.provider, "s3");
    assert.ok(result.url.includes("vyra-s3-bucket.s3.eu-west-1.amazonaws.com"));
  });
});
