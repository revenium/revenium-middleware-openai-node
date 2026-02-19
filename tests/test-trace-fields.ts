import "dotenv/config";
import { Initialize, GetClient } from "../src/index";

async function testTraceFields(): Promise<void> {
  const reveniumApiKey =
    process.env.REVENIUM_API_KEY || process.env.REVENIUM_METERING_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!reveniumApiKey || !openaiApiKey) {
    console.error("E2E Test Failed - Missing API keys\n");
    console.error("This test requires real API credentials to run.");
    console.error("Required environment variables:");
    console.error(
      "  REVENIUM_API_KEY or REVENIUM_METERING_API_KEY:",
      reveniumApiKey ? "SET" : "MISSING"
    );
    console.error("  OPENAI_API_KEY:", openaiApiKey ? "SET" : "MISSING");
    console.error(
      "\nTo run E2E tests, create a .env file with the required keys."
    );
    process.exit(1);
  }

  Initialize({
    openaiApiKey,
    reveniumApiKey,
    reveniumBaseUrl: process.env.REVENIUM_METERING_BASE_URL || "https://api.revenium.io",
  });

  const client = GetClient();

  console.log("Testing trace fields with real API call...\n");
  console.log("Environment variables being tested:");
  console.log(
    "  REVENIUM_ENVIRONMENT:",
    process.env.REVENIUM_ENVIRONMENT || "(not set)"
  );
  console.log("  REVENIUM_REGION:", process.env.REVENIUM_REGION || "(not set)");
  console.log(
    "  REVENIUM_CREDENTIAL_ALIAS:",
    process.env.REVENIUM_CREDENTIAL_ALIAS || "(not set)"
  );
  console.log(
    "  REVENIUM_TRACE_TYPE:",
    process.env.REVENIUM_TRACE_TYPE || "(not set)"
  );
  console.log(
    "  REVENIUM_TRACE_NAME:",
    process.env.REVENIUM_TRACE_NAME || "(not set)"
  );
  console.log(
    "  REVENIUM_PARENT_TRANSACTION_ID:",
    process.env.REVENIUM_PARENT_TRANSACTION_ID || "(not set)"
  );
  console.log(
    "  REVENIUM_TRANSACTION_NAME:",
    process.env.REVENIUM_TRANSACTION_NAME || "(not set)"
  );
  console.log(
    "  REVENIUM_RETRY_NUMBER:",
    process.env.REVENIUM_RETRY_NUMBER || "(not set)"
  );
  console.log("");

  try {
    const response = await client.chat().completions().create({
      model: "gpt-4o-mini",
      max_tokens: 100,
      messages: [{ role: "user", content: "Say hello in one word." }],
    });

    console.log("API Response received:");
    console.log("  Model:", response.model);
    console.log("  Finish Reason:", response.choices[0].finish_reason);
    console.log("  Input Tokens:", response.usage?.prompt_tokens);
    console.log("  Output Tokens:", response.usage?.completion_tokens);
    console.log("  Response:", response.choices[0].message.content);

    console.log("\nE2E test completed successfully!");
    console.log(
      "Check the Revenium dashboard to verify all trace fields were sent."
    );
  } catch (error) {
    console.error("E2E test failed:", error);
    process.exit(1);
  }
}

testTraceFields();

