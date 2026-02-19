import {
  getEnvironment,
  getRegion,
  getCredentialAlias,
  getTraceType,
  getTraceName,
  detectOperationSubtype,
  getParentTransactionId,
  getTransactionName,
  getRetryNumber,
} from "../src/utils/trace-fields";

function assertEqual<T>(actual: T, expected: T, testName: string): void {
  if (actual !== expected) {
    throw new Error(`${testName} failed: expected ${expected}, got ${actual}`);
  }
  console.log(`PASS: ${testName}`);
}

async function runTests() {
  console.log("\n=== Unit Tests for Trace Visualization Fields ===\n");
  let testsPassed = 0;
  let totalTests = 16;

  try {
    console.log("--- Test 1: getEnvironment() ---");
    process.env.REVENIUM_ENVIRONMENT = "production";
    const env1 = getEnvironment();
    assertEqual(
      env1,
      "production",
      "getEnvironment() with REVENIUM_ENVIRONMENT"
    );
    testsPassed++;

    console.log("\n--- Test 2: getEnvironment() fallback to NODE_ENV ---");
    delete process.env.REVENIUM_ENVIRONMENT;
    process.env.NODE_ENV = "development";
    const env2 = getEnvironment();
    assertEqual(env2, "development", "getEnvironment() fallback to NODE_ENV");
    testsPassed++;

    console.log("\n--- Test 3: getEnvironment() truncation ---");
    process.env.REVENIUM_ENVIRONMENT = "a".repeat(300);
    const env3 = getEnvironment();
    assertEqual(env3?.length, 255, "getEnvironment() truncation to 255 chars");
    testsPassed++;

    console.log("\n--- Test 4: getRegion() from env var ---");
    process.env.AWS_REGION = "us-east-1";
    const region = await getRegion();
    assertEqual(region, "us-east-1", "getRegion() from AWS_REGION");
    testsPassed++;

    console.log("\n--- Test 5: getCredentialAlias() ---");
    process.env.REVENIUM_CREDENTIAL_ALIAS = "my-api-key";
    const alias = getCredentialAlias();
    assertEqual(alias, "my-api-key", "getCredentialAlias()");
    testsPassed++;

    console.log("\n--- Test 6: getTraceType() valid format ---");
    process.env.REVENIUM_TRACE_TYPE = "customer-support";
    const traceType1 = getTraceType();
    assertEqual(traceType1, "customer-support", "getTraceType() valid format");
    testsPassed++;

    console.log("\n--- Test 7: getTraceType() invalid format ---");
    process.env.REVENIUM_TRACE_TYPE = "invalid@type!";
    const traceType2 = getTraceType();
    assertEqual(traceType2, null, "getTraceType() invalid format returns null");
    testsPassed++;

    console.log("\n--- Test 8: getTraceType() truncation ---");
    process.env.REVENIUM_TRACE_TYPE = "a".repeat(150);
    const traceType3 = getTraceType();
    assertEqual(
      traceType3?.length,
      128,
      "getTraceType() truncation to 128 chars"
    );
    testsPassed++;

    console.log("\n--- Test 9: getTraceName() ---");
    process.env.REVENIUM_TRACE_NAME = "Support Ticket #12345";
    const traceName1 = getTraceName();
    assertEqual(traceName1, "Support Ticket #12345", "getTraceName()");
    testsPassed++;

    console.log("\n--- Test 10: getTraceName() truncation ---");
    process.env.REVENIUM_TRACE_NAME = "a".repeat(300);
    const traceName2 = getTraceName();
    assertEqual(
      traceName2?.length,
      256,
      "getTraceName() truncation to 256 chars"
    );
    testsPassed++;

    console.log("\n--- Test 11: detectOperationSubtype() with tools ---");
    const subtype1 = detectOperationSubtype({
      tools: [{ name: "get_weather" }],
    });
    assertEqual(
      subtype1,
      "function_call",
      "detectOperationSubtype() with tools"
    );
    testsPassed++;

    console.log("\n--- Test 12: detectOperationSubtype() without tools ---");
    const subtype2 = detectOperationSubtype({});
    assertEqual(subtype2, null, "detectOperationSubtype() without tools");
    testsPassed++;

    console.log("\n--- Test 13: getParentTransactionId() ---");
    process.env.REVENIUM_PARENT_TRANSACTION_ID = "parent-txn-123";
    const parentTxn = getParentTransactionId();
    assertEqual(parentTxn, "parent-txn-123", "getParentTransactionId()");
    testsPassed++;

    console.log("\n--- Test 14: getTransactionName() ---");
    process.env.REVENIUM_TRANSACTION_NAME = "Process Payment";
    const txnName = getTransactionName();
    assertEqual(txnName, "Process Payment", "getTransactionName()");
    testsPassed++;

    console.log("\n--- Test 15: getRetryNumber() default ---");
    delete process.env.REVENIUM_RETRY_NUMBER;
    const retry1 = getRetryNumber();
    assertEqual(retry1, 0, "getRetryNumber() default to 0");
    testsPassed++;

    console.log("\n--- Test 16: getRetryNumber() with value ---");
    process.env.REVENIUM_RETRY_NUMBER = "3";
    const retry2 = getRetryNumber();
    assertEqual(retry2, 3, "getRetryNumber() with value");
    testsPassed++;

    console.log("\n=== All Unit Tests Complete ===");
    console.log(`PASS: ${testsPassed}/${totalTests} tests passed\n`);
    process.exit(0);
  } catch (error) {
    console.error(
      `\nFAIL: Test failed: ${error instanceof Error ? error.message : error}`
    );
    console.log(
      `\n✗ ${testsPassed}/${totalTests} tests passed before failure\n`
    );
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
