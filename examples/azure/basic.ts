/**
 * Azure OpenAI Example
 * Demonstrates usage with Azure OpenAI.
 */

import { Initialize, GetClient, UsageMetadata } from "@revenium/openai";

async function main() {
  // Initialize the middleware
  Initialize();

  // Get the client
  const client = GetClient();

  // Create a metadata
  const metadata: UsageMetadata = {
    organizationId: "org-azure-demo",
    productId: "prod-azure-integration",
    taskType: "question-answering",
    agent: "azure-assistant",
  };

  // Create a chat completion
  // IMPORTANT: For Azure OpenAI, the Model parameter must be your DEPLOYMENT NAME
  // This is the name you gave to your deployment in Azure Portal, NOT the OpenAI model name
  // Example: If you created a deployment called "gpt-5-mini-2" in Azure, use that name here
  //

  const response = await client
    .chat()
    .completions()
    .create(
      {
        // NOTE: Make sure REVENIUM_AZURE_DISABLE=0 in your .env file to enable Azure
        // If Azure is disabled, this will fail because "gpt-5-mini-2" is not a valid OpenAI model name
        model: "gpt-5-mini-2", // Your Azure deployment name (requires REVENIUM_AZURE_DISABLE=0)
        messages: [
          {
            role: "system" as const,
            content:
              "You are a helpful assistant that explains cloud computing concepts.",
          },
          {
            role: "user" as const,
            content:
              "Explain the difference between Azure OpenAI and OpenAI native API in 2-3 sentences.",
          },
        ],
        max_completion_tokens: 2000, // Increased for reasoning models (gpt-5-mini uses reasoning tokens)
        // Note: Reasoning models like gpt-5-mini only support default temperature (1.0)
      },
      metadata
    );

  // Display the response
  if (response.choices.length > 0) {
    console.log(`Assistant: ${response.choices[0].message.content}`);
  }
  console.log("\nUsage data sent to Revenium! Check your dashboard");
}

main().catch(console.error);
