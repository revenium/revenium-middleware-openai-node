import "dotenv/config";
import { Initialize, GetClient } from "../../src/index";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REVENIUM_API_KEY =
  process.env.REVENIUM_API_KEY || process.env.REVENIUM_METERING_API_KEY;
const SHOULD_RUN = !!(OPENAI_API_KEY && REVENIUM_API_KEY);

const describeIfKeys = SHOULD_RUN ? describe : describe.skip;

describeIfKeys("Trace Fields E2E Tests", () => {
  beforeAll(() => {
    Initialize({
      openaiApiKey: OPENAI_API_KEY!,
      reveniumApiKey: REVENIUM_API_KEY!,
      reveniumBaseUrl:
        process.env.REVENIUM_METERING_BASE_URL || "https://api.revenium.io",
    });
  });

  it("should send trace fields with real API call", async () => {
    const client = GetClient();

    const response = await client.chat().completions().create({
      model: "gpt-4o-mini",
      max_tokens: 100,
      messages: [{ role: "user", content: "Say hello in one word." }],
    });

    expect(response).toBeDefined();
    // OpenAI returns versioned model names like "gpt-4o-mini-2024-07-18"
    expect(response.model).toContain("gpt-4o-mini");
    expect(response.choices).toHaveLength(1);
    expect(response.choices[0].finish_reason).toBeDefined();
    expect(response.usage).toBeDefined();
    expect(response.usage?.prompt_tokens).toBeGreaterThan(0);
    expect(response.usage?.completion_tokens).toBeGreaterThan(0);
  }, 30000);

  it("should handle trace environment variables", async () => {
    const client = GetClient();

    const originalEnv = process.env.REVENIUM_ENVIRONMENT;
    const originalRegion = process.env.REVENIUM_REGION;
    const originalTraceType = process.env.REVENIUM_TRACE_TYPE;
    const originalTraceName = process.env.REVENIUM_TRACE_NAME;

    process.env.REVENIUM_ENVIRONMENT = "test";
    process.env.REVENIUM_REGION = "us-east-1";
    process.env.REVENIUM_TRACE_TYPE = "e2e_test";
    process.env.REVENIUM_TRACE_NAME = "E2E Test Run";

    const response = await client.chat().completions().create({
      model: "gpt-4o-mini",
      max_tokens: 50,
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(response).toBeDefined();
    expect(response.choices[0].message.content).toBeDefined();

    process.env.REVENIUM_ENVIRONMENT = originalEnv;
    process.env.REVENIUM_REGION = originalRegion;
    process.env.REVENIUM_TRACE_TYPE = originalTraceType;
    process.env.REVENIUM_TRACE_NAME = originalTraceName;
  }, 30000);

  it("should handle image generation with trace fields", async () => {
    const client = GetClient();

    const response = await client.images().generate({
      model: "dall-e-2",
      prompt: "A simple test image",
      n: 1,
      size: "256x256",
    });

    expect(response).toBeDefined();
    expect(response.data).toHaveLength(1);
    expect(response.data[0].url).toBeDefined();
  }, 60000);
});

