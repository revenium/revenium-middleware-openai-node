/**
 * Azure Responses  API Basic Example
 *
 * Demonstrates usage of the OpenAI Responses API with Azure OpenAI (stateful API).
 * The Responses API is experimental and may not be available in all SDK versions.
 *
 * Reference: https://platform.openai.com/docs/api-reference/responses
 */

import { Initialize, GetClient, UsageMetadata } from "@revenium/openai";

async function main() {
  // Initialize middleware
  Initialize();

  // Get client
  const client = GetClient();

  // Create a metadata
  const metadata: UsageMetadata = {
    organizationName: "org-azure-responses",
    productName: "prod-azure-responses",
  };

  try {
    const response = await client.responses().create(
      {
        model: "gpt-5-mini-2", // Your Azure deployment name
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
