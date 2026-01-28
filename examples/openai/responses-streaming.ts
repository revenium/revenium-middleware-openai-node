/**
 * Responses API + Streaming Example
 *
 * Demonstrates streaming usage of the OpenAI Responses API (stateful API).
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
    organizationName: "org-responses-streaming-demo",
    productName: "prod-openai-responses",
    taskType: "creative-writing",
  };

  try {
    console.log("Creating streaming response with Responses API...");
    const wrapper = await client.responses().createStreaming(
      {
        model: "gpt-4",
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
      console.log("\nNo content received from stream");
    }

    console.log("\n");
    console.log("\nUsage data sent to Revenium! Check your dashboard");
  } catch (error) {
    console.error("Error:", (error as Error).message);
    console.error("Stack:", (error as Error).stack);
    console.log(
      "\nNote: Responses API is experimental and may not be available in all OpenAI SDK versions",
    );
  }
}

main().catch(console.error);
