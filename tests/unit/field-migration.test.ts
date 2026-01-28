/**
 * Unit Tests: Field name migration
 *
 * Tests for organizationId/productId -> organizationName/productName migration
 */

import { buildMetadataFields } from "../../src/utils/metadata-builder";
import { UsageMetadata } from "../../src/types";

describe("Field name migration (productId/organizationId -> productName/organizationName)", () => {
  it("accepts new field names (productName, organizationName)", () => {
    const metadata: UsageMetadata = {
      organizationName: "AcmeCorp",
      productName: "ai-assistant",
      taskType: "test",
    };

    const result = buildMetadataFields(metadata);

    expect(result.organizationName).toBe("AcmeCorp");
    expect(result.productName).toBe("ai-assistant");
    expect(result.organizationId).toBeUndefined();
    expect(result.productId).toBeUndefined();
  });

  it("still accepts old field names (productId, organizationId) for backward compatibility", () => {
    const metadata: UsageMetadata = {
      organizationId: "org-123",
      productId: "prod-456",
      taskType: "test",
    };

    const result = buildMetadataFields(metadata);

    expect(result.organizationName).toBe("org-123");
    expect(result.productName).toBe("prod-456");
    expect(result.organizationId).toBeUndefined();
    expect(result.productId).toBeUndefined();
  });

  it("prioritizes new field names when both are provided", () => {
    const metadata: UsageMetadata = {
      organizationId: "old-org",
      organizationName: "new-org",
      productId: "old-product",
      productName: "new-product",
      taskType: "test",
    };

    const result = buildMetadataFields(metadata);

    expect(result.organizationName).toBe("new-org");
    expect(result.productName).toBe("new-product");
    expect(result.organizationId).toBeUndefined();
    expect(result.productId).toBeUndefined();
  });

  it("handles only organizationName without productName", () => {
    const metadata: UsageMetadata = {
      organizationName: "AcmeCorp",
      taskType: "test",
    };

    const result = buildMetadataFields(metadata);

    expect(result.organizationName).toBe("AcmeCorp");
    expect(result.productName).toBeUndefined();
  });

  it("handles only productName without organizationName", () => {
    const metadata: UsageMetadata = {
      productName: "ai-assistant",
      taskType: "test",
    };

    const result = buildMetadataFields(metadata);

    expect(result.productName).toBe("ai-assistant");
    expect(result.organizationName).toBeUndefined();
  });

  it("handles empty metadata", () => {
    const result = buildMetadataFields({});

    expect(result).toEqual({});
  });

  it("handles undefined metadata", () => {
    const result = buildMetadataFields(undefined);

    expect(result).toEqual({});
  });

  it("preserves other metadata fields during migration", () => {
    const metadata: UsageMetadata = {
      organizationId: "org-123",
      productId: "prod-456",
      taskType: "chat",
      traceId: "trace-789",
      agent: "test-agent",
      subscriptionId: "sub-123",
      responseQualityScore: 0.95,
    };

    const result = buildMetadataFields(metadata);

    expect(result.organizationName).toBe("org-123");
    expect(result.productName).toBe("prod-456");
    expect(result.taskType).toBe("chat");
    expect(result.traceId).toBe("trace-789");
    expect(result.agent).toBe("test-agent");
    expect(result.subscriptionId).toBe("sub-123");
    expect(result.responseQualityScore).toBe(0.95);
  });

  it("handles subscriber object correctly", () => {
    const metadata: UsageMetadata = {
      organizationName: "AcmeCorp",
      productName: "ai-assistant",
      subscriber: {
        id: "user-123",
        email: "test@example.com",
        credential: {
          name: "api-key",
          value: "secret",
        },
      },
    };

    const result = buildMetadataFields(metadata);

    expect(result.organizationName).toBe("AcmeCorp");
    expect(result.productName).toBe("ai-assistant");
    expect(result.subscriber).toEqual({
      id: "user-123",
      email: "test@example.com",
      credential: {
        name: "api-key",
        value: "secret",
      },
    });
  });
});

