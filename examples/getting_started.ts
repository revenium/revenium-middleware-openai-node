/**
 * Getting Started Example
 *
 * This is the simplest way to get started with Revenium OpenAI middleware.
 * Just initialize and start making requests!
 * Note: .env files are loaded automatically by the middleware.
 */

import { Initialize, GetClient } from "@revenium/openai";

async function main() {
  // Initialize middleware
  Initialize();

  // Get client
  const client = GetClient();

  // Create metadata
  const metadata = {
    organizationName: "org-getting-started-demo",
    productName: "prod-getting-started",
  };

  // Make request
  const params = {
    model: "gpt-4",
    messages: [
      {
        role: "user" as const,
        content: "Hello! Introduce yourself in one sentence.",
      },
    ],
  };

  const response = await client.chat().completions().create(params, metadata);

  // Display response
  console.log(response.choices[0].message.content);
  console.log("\nUsage data sent to Revenium!");
}

main().catch(console.error);
