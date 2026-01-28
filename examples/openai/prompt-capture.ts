import OpenAI from "openai";
import { configure } from "../../src/index.js";

async function main() {
  console.log("=== OpenAI Prompt Capture Example ===\n");

  configure({
    reveniumApiKey: process.env.REVENIUM_METERING_API_KEY || "test-key",
    reveniumBaseUrl: process.env.REVENIUM_METERING_BASE_URL,
    capturePrompts: true,
  });

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log("Example 1: Prompt capture enabled via config");
  console.log("Making request with prompt capture enabled...\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 100,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides concise answers.",
        },
        {
          role: "user",
          content: "What is the capital of France?",
        },
      ],
      usageMetadata: {
        organizationName: "org-prompt-capture-demo",
        productName: "prod-openai-prompt-capture",
      },
    });

    console.log("Response:", response.choices[0]?.message?.content);
    console.log("\nPrompts captured and sent to Revenium API!");
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error),
    );
  }

  console.log("\n" + "=".repeat(50) + "\n");
  console.log("Example 2: Prompt capture disabled via metadata override");
  console.log("Making request with prompt capture disabled...\n");

  try {
    const response2 = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 100,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: "What is 2+2?",
        },
      ],
      usageMetadata: {
        organizationName: "org-prompt-capture-demo",
        productName: "prod-openai-prompt-capture",
        capturePrompts: false,
      },
    });

    console.log("Response:", response2.choices[0]?.message?.content);
    console.log("\nPrompts NOT captured (overridden via metadata)!");
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error),
    );
  }

  console.log("\n" + "=".repeat(50) + "\n");
  console.log("Example 3: Prompt capture with environment variable");
  console.log("Set REVENIUM_CAPTURE_PROMPTS=true in your .env file\n");

  console.log("Prompt capture examples completed!");
  console.log("\nConfiguration hierarchy:");
  console.log("1. Per-call metadata (highest priority)");
  console.log("2. Global config");
  console.log("3. Environment variable REVENIUM_CAPTURE_PROMPTS");
  console.log("4. Default: false (lowest priority)");
}

main().catch(console.error);
