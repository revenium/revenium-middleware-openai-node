/**
 * Responses API + Basic Example
 *
 * Demonstrates usage of the OpenAI Responses API (stateful API).
 * The Responses API is experimental and may not be available in all SDK versions.
 * Reference: https://platform.openai.com/docs/api-reference/responses
 */

import { Initialize, GetClient, UsageMetadata } from "@revenium/openai";

async function main() {
  // Initialize middleware
  Initialize();

  // Get client
  const client = GetClient();

  // Create with metadata
  const metadata: UsageMetadata = {
    organizationName: "org-responses-basic-demo",
    productName: "prod-openai-responses-basic",
  };

  try {
    const response = await client.responses().create(
      {
        model: "gpt-4",
        input: "What is the capital of France?",
      },
      metadata,
    );

    // Display response
    console.log("Assistant:", response.output_text);
    console.log("\nUsage data sent to Revenium! Check your dashboard");
  } catch (error) {
    console.error("Error:", (error as Error).message);
    console.log(
      "\nNote: Responses API is experimental and may not be available in all OpenAI SDK versions",
    );
  }
}

main().catch(console.error);
