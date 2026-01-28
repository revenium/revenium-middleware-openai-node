/**
 * Responses API + Embeddings Example
 * Demonstrates basic embeddings usage with Revenium OpenAI middleware.
 */

import { Initialize, GetClient, UsageMetadata } from "@revenium/openai";
async function main() {
  // Initialize middleware
  Initialize();

  // Get client
  const client = GetClient();

  // Create with metadata
  const metadata: UsageMetadata = {
    organizationName: "org-responses-embed-demo",
    productName: "prod-openai-responses-embed",
  };

  const embedding = await client.embeddings().create(
    {
      model: "text-embedding-3-small",
      input: "Hello world",
    },
    metadata,
  );

  console.log("Model:", embedding.model);
  console.log("Usage:", embedding.usage);
  console.log("Embedding dimensions:", embedding.data[0]?.embedding.length);
  console.log("\nUsage data sent to Revenium! Check your dashboard");
}

main().catch(console.error);
