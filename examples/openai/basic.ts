/**
 * Basic Example
 * Demonstrates basic usage of Revenium OpenAI middleware.
 */

import { Initialize, GetClient, UsageMetadata } from "@revenium/openai";

async function main() {
  // Initialize middleware
  Initialize();

  // Get client
  const client = GetClient();
  const metadata: UsageMetadata = {
    organizationName: "org-basic-demo",
    productName: "prod-openai-basic",
  };

  // Create chat completion
  const response = await client
    .chat()
    .completions()
    .create(
      {
        model: "gpt-4",
        messages: [
          {
            role: "user" as const,
            content:
              "Say hello in Spanish and explain why Spanish is a beautiful language in 2-3 sentences.",
          },
        ],
        max_tokens: 1000,
      },
      metadata,
    );

  // Display response
  if (response.choices.length > 0) {
    console.log(`Assistant: ${response.choices[0].message.content}`);
  }
  console.log("\nUsage data sent to Revenium! Check your dashboard");
}

main().catch(console.error);
