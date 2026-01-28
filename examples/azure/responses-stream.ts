/**
 * Azure Responses API Streaming Example
 *
 * Demonstrates streaming usage of the OpenAI Responses API with Azure OpenAI (stateful API).
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
    organizationName: "org-azure-responses-streaming-demo",
    productName: "prod-azure-responses",
    taskType: "creative-writing",
  };

  try {
    const wrapper = await client.responses().createStreaming(
      {
        // Create a streaming response using the Responses API
        model: "gpt-5-mini-2", // Your Azure deployment name
        input: "Write a short poem about the ocean.",
        stream: true as const,
      },
      metadata,
    );

    // Process the stream
    process.stdout.write("Assistant: ");
    let hasContent = false;
    for await (const chunk of wrapper) {
      // Responses API streaming uses ResponseTextDeltaEvent
      if (chunk.type === "response.output_text.delta" && chunk.delta) {
        hasContent = true;
        process.stdout.write(chunk.delta);
      }
    }
    if (!hasContent) {
      console.log("(no content received)");
    }

    console.log("\n");
    console.log("\nUsage data sent to Revenium! Check your dashboard");
  } catch (error) {
    console.error("Error:", (error as Error).message);
    console.log(
      "\nNote: Responses API is experimental and may not be available in all OpenAI SDK versions",
    );
  }
}

main().catch(console.error);
