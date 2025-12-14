import { extractDatabase } from "./lib/utils";
import runAdditinalBenchmarksPg from "./run-additional-benchmarks-pg";
import dotenv from "dotenv";

const iterations = Number(process.env.ITERATIONS) || 5;
const size = Number(process.env.SIZE) || 1000;
const fakerSeed = Number(process.env.SEED) || 42;

async function main() {
  dotenv.config();

  if (!process.env.DATABASE_URL) {
    console.error(`No database URL provided`);
    return;
  }
  const databaseUrl = process.env.DATABASE_URL;

  // Test safeMeasure function first
  console.log("🧪 Testing safeMeasure function...");
  const safeMeasure = (await import("./lib/measure")).default;

  // Test successful query
  const successResult = await safeMeasure(
    "test-success",
    Promise.resolve("test data")
  );
  console.log("✅ Success test result:", successResult);

  // Test failed query
  const failResult = await safeMeasure(
    "test-failure",
    Promise.reject(new Error("Test error"))
  );
  console.log("✅ Failure test result:", failResult);

  console.log(
    "🧪 safeMeasure tests completed, proceeding with benchmarks...\n"
  );

  const database = extractDatabase(databaseUrl);
  if (database === "postgresql") {
    console.log(`Running benchmarks on ${databaseUrl}.`);
    await runAdditinalBenchmarksPg({
      databaseUrl,
      iterations,
      size,
      fakerSeed,
    });
  } else if (database === "mysql") {
    console.log(`Running benchmarks on ${databaseUrl}.`);
    //await runBenchmarksMySQL({ databaseUrl, iterations, size, fakerSeed });
  } else {
    console.log(`${database} is not yet available.`);
  }
}

// Add global unhandled rejection handler
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Promise Rejection at:", promise);
  console.error("❌ Reason:", reason);
  console.error(
    "❌ Stack:",
    reason instanceof Error ? reason.stack : "No stack trace available"
  );
  process.exit(1);
});

// Add global uncaught exception handler
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  console.error("❌ Stack:", error.stack);
  process.exit(1);
});

main().catch((error) => {
  console.error("❌ Benchmark failed:", error);
  console.error("❌ Stack:", error.stack);
  process.exit(1);
});
