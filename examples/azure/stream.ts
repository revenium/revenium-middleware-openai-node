/**
 * Azure Streaming Example
 * Demonstrates streaming chat completions with Azure OpenAI and Revenium tracking.
 */

import { Initialize, GetClient, UsageMetadata } from "@revenium/openai";

async function main() {
  // Initialize middleware
  Initialize();

  // Get client
  const client = GetClient();

  // Create a metadata
  const metadata: UsageMetadata = {
    organizationName: "org-azure-streaming",
    productName: "prod-azure-integration",
    taskType: "creative-writing",
    agent: "azure-poet",
  };
  const wrapper = await client
    .chat()
    .completions()
    .createStreaming(
      {
        model: "gpt-5-mini-2", // Your Azure deployment name
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
        max_completion_tokens: 2000,
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
