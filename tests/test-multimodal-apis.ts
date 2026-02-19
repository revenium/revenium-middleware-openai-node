import OpenAI from "openai";
import { Initialize, GetClient } from "../src/index.js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REVENIUM_API_KEY = process.env.REVENIUM_METERING_API_KEY;
const REVENIUM_BASE_URL =
  process.env.REVENIUM_METERING_BASE_URL || "https://api.revenium.io";

if (!OPENAI_API_KEY) {
  console.error(" OPENAI_API_KEY not set");
  process.exit(1);
}

if (!REVENIUM_API_KEY) {
  console.error(" REVENIUM_API_KEY not set");
  process.exit(1);
}

Initialize({
  openaiApiKey: OPENAI_API_KEY,
  reveniumApiKey: REVENIUM_API_KEY,
  reveniumBaseUrl: REVENIUM_BASE_URL,
});

const client = GetClient();

async function testCompletions() {
  console.log(
    "\nTesting Chat Completions (should go to /meter/v2/ai/completions)..."
  );
  try {
    const response = await client
      .chat()
      .completions()
      .create({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: 'Say "Hello from completions test"' },
        ],
        max_tokens: 20,
      });
    console.log(" Completions test passed");
    console.log("   Response:", response.choices[0].message.content);
    console.log("   Tokens:", response.usage);
  } catch (error) {
    console.error(" Completions test failed:", error);
  }
}

async function testImages() {
  console.log(
    "\n Testing Image Generation (should go to /meter/v2/ai/images)..."
  );
  try {
    const response = await client.images().generate({
      model: "dall-e-2",
      prompt: "A cute robot waving hello",
      n: 1,
      size: "256x256",
    });
    console.log(" Image generation test passed");
    console.log("   Generated images:", response.data.length);
    console.log("   URL:", response.data[0].url?.substring(0, 50) + "...");
  } catch (error) {
    console.error(" Image generation test failed:", error);
  }
}

async function testAudioTranscription() {
  console.log(
    "\n Testing Audio Transcription (should go to /meter/v2/ai/audio)..."
  );

  const audioFilePath = path.join(__dirname, "test-audio.mp3");
  if (!fs.existsSync(audioFilePath)) {
    console.log(
      "  Skipping audio transcription test - test-audio.mp3 not found"
    );
    console.log("   To test: place an MP3 file at:", audioFilePath);
    return;
  }

  try {
    const response = await client.audio().transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: "whisper-1",
    });
    console.log(" Audio transcription test passed");
    console.log("   Transcription:", response.text?.substring(0, 100));
  } catch (error) {
    console.error(" Audio transcription test failed:", error);
  }
}

async function testAudioSpeech() {
  console.log(
    "\nTesting Audio Speech/TTS (should go to /meter/v2/ai/audio)..."
  );
  try {
    const response = await client.audio().speech.create({
      model: "tts-1",
      voice: "alloy",
      input: "Hello from TTS test",
    });
    console.log("PASS: Audio speech test passed");
    console.log("   Response type:", typeof response);
  } catch (error) {
    console.error("FAIL: Audio speech test failed:", error);
  }
}

async function runTests() {
  console.log("Starting Multimodal API Tests");
  console.log("=".repeat(60));
  console.log("Testing endpoints:");
  console.log("  - /meter/v2/ai/completions (chat)");
  console.log("  - /meter/v2/ai/images (DALL-E)");
  console.log("  - /meter/v2/ai/audio (Whisper, TTS)");
  console.log("=".repeat(60));

  await testCompletions();
  await testImages();
  await testAudioTranscription();
  await testAudioSpeech();

  console.log("\n" + "=".repeat(60));
  console.log(" All tests completed!");
  console.log(
    "Check Revenium dashboard to verify metrics were sent to correct endpoints"
  );
  console.log("=".repeat(60));
}

runTests().catch(console.error);
