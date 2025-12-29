import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

interface TestResult {
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  failures: Array<{
    name: string;
    error: string;
  }>;
}

async function runTests(): Promise<void> {
  const startTime = Date.now();
  console.log("Running Vitest test suite...\n");

  try {
    // Run vitest with JSON reporter
    const { stdout, stderr } = await execAsync(
      "npx vitest run --reporter=json --reporter=default",
      {
        env: { ...process.env, NODE_ENV: "test" },
      }
    );

    // Parse JSON output (vitest outputs JSON to stdout with --reporter=json)
    const lines = stdout.split("\n");
    let jsonOutput: any = null;

    // Find the JSON output line
    for (const line of lines) {
      if (line.trim().startsWith("{")) {
        try {
          jsonOutput = JSON.parse(line);
          break;
        } catch (e) {
          // Continue searching
        }
      }
    }

    const duration = Date.now() - startTime;

    let result: TestResult;

    if (jsonOutput && jsonOutput.testResults) {
      // Parse Vitest JSON format
      const allTests = jsonOutput.testResults.flatMap(
        (file: any) => file.assertionResults || []
      );

      const passed = allTests.filter((t: any) => t.status === "passed").length;
      const failed = allTests.filter((t: any) => t.status === "failed").length;
      const skipped = allTests.filter(
        (t: any) => t.status === "skipped" || t.status === "pending"
      ).length;

      const failures = allTests
        .filter((t: any) => t.status === "failed")
        .map((t: any) => ({
          name: t.fullName || t.title,
          error: t.failureMessages?.join("\n") || "Unknown error",
        }));

      result = {
        timestamp: new Date().toISOString(),
        total: allTests.length,
        passed,
        failed,
        skipped,
        duration,
        failures,
      };
    } else {
      // Fallback: count from console output
      const passMatch = stdout.match(/(\d+) passed/);
      const failMatch = stdout.match(/(\d+) failed/);
      const skipMatch = stdout.match(/(\d+) skipped/);

      const passed = passMatch ? parseInt(passMatch[1]) : 0;
      const failed = failMatch ? parseInt(failMatch[1]) : 0;
      const skipped = skipMatch ? parseInt(skipMatch[1]) : 0;

      result = {
        timestamp: new Date().toISOString(),
        total: passed + failed + skipped,
        passed,
        failed,
        skipped,
        duration,
        failures: [],
      };
    }

    // Write result to JSON file
    const outputPath = path.join(__dirname, "test-results.json");
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));

    console.log("\n✅ Test Results Summary:");
    console.log(`   Total: ${result.total}`);
    console.log(`   Passed: ${result.passed}`);
    console.log(`   Failed: ${result.failed}`);
    console.log(`   Skipped: ${result.skipped}`);
    console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`\n📄 Report written to: ${outputPath}\n`);

    if (result.failed > 0) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error("Test execution failed:", error.message);

    // Still try to write a result file
    const result: TestResult = {
      timestamp: new Date().toISOString(),
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: Date.now() - startTime,
      failures: [{ name: "Test Execution", error: error.message }],
    };

    const outputPath = path.join(__dirname, "test-results.json");
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));

    process.exit(1);
  }
}

runTests();
