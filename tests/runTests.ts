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
      "npx vitest run --reporter=verbose",
      {
        env: {
          ...process.env,
          NODE_ENV: "test",
        },
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      }
    );

    const duration = Date.now() - startTime;

    // Parse from console output - strip ANSI codes first
    const stripAnsi = (str: string) => str.replace(/\x1B\[[0-9;]*m/g, "");
    const output = stripAnsi(stdout + "\n" + stderr);

    // Debug: log output for troubleshooting
    // console.log("OUTPUT:", output.substring(output.length - 500));

    // Extract test counts (not test file counts)
    // Looking for patterns like "Tests  39 passed (39)"
    const testsLineMatch = output.match(/Tests\s+(\d+)\s+passed/i);
    const failedLineMatch = output.match(/(\d+)\s+failed/);
    const skippedLineMatch = output.match(/(\d+)\s+skipped/);

    const passed = testsLineMatch ? parseInt(testsLineMatch[1]) : 0;
    const failed = failedLineMatch ? parseInt(failedLineMatch[1]) : 0;
    const skipped = skippedLineMatch ? parseInt(skippedLineMatch[1]) : 0;

    const result: TestResult = {
      timestamp: new Date().toISOString(),
      total: passed + failed + skipped,
      passed,
      failed,
      skipped,
      duration,
      failures: [],
    };

    // Write result to JSON file
    const outputPath = path.join(__dirname, "test-results.json");
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));

    const icon = result.failed === 0 ? "✅" : "❌";
    console.log(`\n${icon} Test Results Summary:`);
    console.log(`   Total Tests: ${result.total}`);
    console.log(`   Passed: ${result.passed}`);
    console.log(`   Failed: ${result.failed}`);
    console.log(`   Skipped: ${result.skipped}`);
    console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`\n📄 Report written to: ${outputPath}\n`);

    // Exit with appropriate code
    if (result.failed > 0) {
      console.error("\n⚠️  Some tests failed. See output above for details.\n");
      process.exit(1);
    } else {
      console.log("\n🎉 All tests passed!\n");
      process.exit(0);
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
