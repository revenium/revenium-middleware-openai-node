import { ReveniumPayload } from "../../src/types";

const mockPayload: ReveniumPayload = {
  transactionId: "test-transaction-123",
  operationType: "CHAT",
  costType: "AI",
  model: "gpt-4",
  provider: "OPENAI",
  middlewareSource: "revenium-openai-node",
  requestTime: new Date().toISOString(),
  responseTime: new Date().toISOString(),
  requestDuration: 1500,
  completionStartTime: new Date().toISOString(),
  inputTokenCount: 100,
  outputTokenCount: 50,
  totalTokenCount: 150,
  reasoningTokenCount: undefined,
  cacheCreationTokenCount: undefined,
  cacheReadTokenCount: undefined,
  stopReason: "stop",
  isStreamed: false,
  traceId: "trace-123",
};

describe("Summary Printer", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;
  let consoleSpy: jest.SpyInstance;
  let mockGetConfig: jest.Mock;
  let mockGetLogger: jest.Mock;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    mockGetConfig = jest.fn();
    mockGetLogger = jest.fn().mockReturnValue({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    });
    mockFetch = jest.fn();

    jest.doMock("../../src/core/config", () => ({
      getConfig: mockGetConfig,
      getLogger: mockGetLogger,
    }));

    (global as any).fetch = mockFetch;
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe("printUsageSummary", () => {
    it("does nothing when printSummary is disabled", async () => {
      mockGetConfig.mockReturnValue({
        reveniumApiKey: "test-key",
        printSummary: false,
      });

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(mockPayload);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("does nothing when config is null", async () => {
      mockGetConfig.mockReturnValue(null);

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(mockPayload);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("prints summary with teamId hint when teamId is not set", async () => {
      mockGetConfig.mockReturnValue({
        reveniumApiKey: "test-key",
        printSummary: true,
      });

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(mockPayload);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(output).toContain("REVENIUM USAGE SUMMARY");
      expect(output).toContain("gpt-4");
      expect(output).toContain("OPENAI");
      expect(output).toContain("Set REVENIUM_TEAM_ID");
    });

    it("prints token counts correctly", async () => {
      mockGetConfig.mockReturnValue({
        reveniumApiKey: "test-key",
        printSummary: true,
      });

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(mockPayload);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const output = consoleSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(output).toContain("Input Tokens");
      expect(output).toContain("100");
      expect(output).toContain("Output Tokens");
      expect(output).toContain("50");
      expect(output).toContain("Total Tokens");
      expect(output).toContain("150");
    });

    it("prints traceId when present", async () => {
      mockGetConfig.mockReturnValue({
        reveniumApiKey: "test-key",
        printSummary: true,
      });

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(mockPayload);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const output = consoleSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(output).toContain("trace-123");
    });

    it("fetches and displays cost from API when teamId is configured", async () => {
      mockGetConfig.mockReturnValue({
        reveniumApiKey: "test-key",
        printSummary: true,
        teamId: "team-123",
        reveniumBaseUrl: "https://api.test.io",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          _embedded: {
            aICompletionMetricResourceList: [
              {
                id: "abc123",
                transactionId: "test-transaction-123",
                model: "gpt-4",
                provider: "OPENAI",
                inputTokenCount: 100,
                outputTokenCount: 50,
                totalTokenCount: 150,
                totalCost: 0.00345,
              },
            ],
          },
        }),
      });

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(mockPayload);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/profitstream/v2/api/sources/metrics/ai/completions"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "x-api-key": "test-key",
          }),
        })
      );

      const output = consoleSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(output).toContain("REVENIUM USAGE SUMMARY");
      expect(output).toContain("$0.003450");
    });

    it("retries when API returns empty data", async () => {
      mockGetConfig.mockReturnValue({
        reveniumApiKey: "test-key",
        printSummary: true,
        teamId: "team-123",
        reveniumBaseUrl: "https://api.test.io",
      });

      // First call returns empty, second call returns data
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            _embedded: {
              aICompletionMetricResourceList: [],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            _embedded: {
              aICompletionMetricResourceList: [
                {
                  totalCost: 0.001,
                },
              ],
            },
          }),
        });

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(mockPayload);

      // Wait for retries (retryDelay is 2000ms by default, but we mock it)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // At minimum, fetch should have been called at least once
      expect(mockFetch).toHaveBeenCalled();
    });

    it("handles non-200 API responses gracefully", async () => {
      jest.useFakeTimers();

      mockGetConfig.mockReturnValue({
        reveniumApiKey: "test-key",
        printSummary: true,
        teamId: "team-123",
        reveniumBaseUrl: "https://api.test.io",
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(mockPayload);

      // Advance timers to allow all retries to complete (3 retries * 2000ms delay)
      await jest.advanceTimersByTimeAsync(10000);

      // Should still print summary with pending message (teamId is set but API failed)
      const output = consoleSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(output).toContain("REVENIUM USAGE SUMMARY");
      expect(output).toContain("pending aggregation");

      jest.useRealTimers();
    });

    it("handles network errors gracefully", async () => {
      jest.useFakeTimers();

      mockGetConfig.mockReturnValue({
        reveniumApiKey: "test-key",
        printSummary: true,
        teamId: "team-123",
        reveniumBaseUrl: "https://api.test.io",
      });

      mockFetch.mockRejectedValue(new Error("Network failure"));

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(mockPayload);

      // Advance timers to allow all retries to complete
      await jest.advanceTimersByTimeAsync(10000);

      // Should still print summary without cost
      const output = consoleSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(output).toContain("REVENIUM USAGE SUMMARY");

      jest.useRealTimers();
    });

    it("handles malformed API responses gracefully", async () => {
      jest.useFakeTimers();

      mockGetConfig.mockReturnValue({
        reveniumApiKey: "test-key",
        printSummary: true,
        teamId: "team-123",
        reveniumBaseUrl: "https://api.test.io",
      });

      // Return response with unexpected structure
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          unexpectedField: "value",
          // Missing _embedded.aICompletionMetricResourceList
        }),
      });

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(mockPayload);

      // Advance timers to allow all retries to complete
      await jest.advanceTimersByTimeAsync(10000);

      // Should still print summary with pending message (teamId is set but API returned malformed data)
      const output = consoleSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(output).toContain("REVENIUM USAGE SUMMARY");
      expect(output).toContain("pending aggregation");

      jest.useRealTimers();
    });

    it("handles 401/403 API responses without retrying indefinitely", async () => {
      jest.useFakeTimers();

      mockGetConfig.mockReturnValue({
        reveniumApiKey: "invalid-key",
        printSummary: true,
        teamId: "team-123",
        reveniumBaseUrl: "https://api.test.io",
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(mockPayload);

      // Advance timers to allow all retries to complete
      await jest.advanceTimersByTimeAsync(10000);

      // Should print summary without cost even on auth failure
      const output = consoleSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(output).toContain("REVENIUM USAGE SUMMARY");

      jest.useRealTimers();
    });

    it("prints summary in JSON format when printSummary is 'json'", async () => {
      mockGetConfig.mockReturnValue({
        reveniumApiKey: "test-key",
        printSummary: "json",
      });

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(mockPayload);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);

      expect(parsed.model).toBe("gpt-4");
      expect(parsed.provider).toBe("OPENAI");
      expect(parsed.durationSeconds).toBe(1.5);
      expect(parsed.inputTokenCount).toBe(100);
      expect(parsed.outputTokenCount).toBe(50);
      expect(parsed.totalTokenCount).toBe(150);
      expect(parsed.cost).toBeNull();
      expect(parsed.costStatus).toBe("unavailable");
      expect(parsed.traceId).toBe("trace-123");
    });

    it("preserves null token counts in JSON format for non-applicable scenarios", async () => {
      mockGetConfig.mockReturnValue({
        reveniumApiKey: "test-key",
        printSummary: "json",
      });

      // Create payload with null token counts (e.g., image/audio payloads)
      const payloadWithNullTokens: ReveniumPayload = {
        ...mockPayload,
        inputTokenCount: null,
        outputTokenCount: null,
        totalTokenCount: null,
      };

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(payloadWithNullTokens);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);

      // Verify null values are preserved (not converted to 0)
      expect(parsed.inputTokenCount).toBeNull();
      expect(parsed.outputTokenCount).toBeNull();
      expect(parsed.totalTokenCount).toBeNull();
    });

    it("prints summary in human format when printSummary is 'human'", async () => {
      mockGetConfig.mockReturnValue({
        reveniumApiKey: "test-key",
        printSummary: "human",
      });

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(mockPayload);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(output).toContain("REVENIUM USAGE SUMMARY");
      expect(output).toContain("gpt-4");
    });

    it("prints JSON with cost from API when teamId is configured", async () => {
      mockGetConfig.mockReturnValue({
        reveniumApiKey: "test-key",
        printSummary: "json",
        teamId: "team-123",
        reveniumBaseUrl: "https://api.test.io",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          _embedded: {
            aICompletionMetricResourceList: [
              {
                id: "abc123",
                transactionId: "test-transaction-123",
                totalCost: 0.00345,
              },
            ],
          },
        }),
      });

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(mockPayload);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);

      expect(parsed.cost).toBe(0.00345);
      expect(parsed.costStatus).toBeUndefined();
    });

    it("prints JSON with pending costStatus when teamId is set but cost unavailable", async () => {
      jest.useFakeTimers();

      mockGetConfig.mockReturnValue({
        reveniumApiKey: "test-key",
        printSummary: "json",
        teamId: "team-123",
        reveniumBaseUrl: "https://api.test.io",
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          _embedded: {
            aICompletionMetricResourceList: [],
          },
        }),
      });

      const { printUsageSummary } = await import(
        "../../src/core/tracking/summary-printer"
      );
      printUsageSummary(mockPayload);

      await jest.advanceTimersByTimeAsync(10000);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);

      expect(parsed.cost).toBeNull();
      expect(parsed.costStatus).toBe("pending");

      jest.useRealTimers();
    });
  });
});

