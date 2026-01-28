/**
 * Streaming Example
 *
 * Demonstrates streaming chat completions with Revenium tracking.
 */

import { Initialize, GetClient, UsageMetadata } from "@revenium/openai";

async function main() {
  // Initialize middleware
  Initialize();

  // Get client
  const client = GetClient();

  // Create a metadata
  const metadata: UsageMetadata = {
    organizationName: "org-streaming-demo",
    productName: "prod-openai-streaming",
    taskType: "creative-writing",
    agent: "story-generator",
  };

  const wrapper = await client
    .chat()
    .completions()
    .createStreaming(
      {
        model: "gpt-4",
        messages: [
          {
            role: "system" as const,
            content: "You are a creative poet.",
          },
          {
            role: "user" as const,
            content:
              "Write a short poem about artificial intelligence and its impact on humanity.",
          },
        ],
        max_tokens: 1000,
        stream: true as const,
      },
      metadata,
    );

  // Process the stream
  process.stdout.write("Assistant: ");
  for await (const chunk of wrapper) {
    if (chunk.choices.length > 0 && chunk.choices[0].delta.content) {
      process.stdout.write(chunk.choices[0].delta.content);
    }
  }

  console.log("\n");
  console.log("\nUsage data sent to Revenium! Check your dashboard");
}

main().catch(console.error);
