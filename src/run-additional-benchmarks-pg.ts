import { preparePg } from "./lib/prepare-pg-native"; // seed via `pg_restore`
import writeResults from "./lib/write-results";
import { BenchmarkOptions, MultipleBenchmarkRunResults } from "./lib/types";
import { additionalKyselyPg } from "./kysely/additional-kysely-pg";

export default async function runAdditionalBenchmarksPg(
  benchmarkOptions: BenchmarkOptions
) {
  const { databaseUrl, iterations, size, fakerSeed } = benchmarkOptions;

  const resultsDirectoryTimestamp = Date.now().toString();

  const additionalKyselyResults: MultipleBenchmarkRunResults = [];

  for (let i = 0; i < iterations; i++) {
    console.log(`\n🔄 Additional Kysely Iteration ${i + 1}/${iterations}`);

    try {
      await preparePg({ databaseUrl, size, fakerSeed });
      const results = await additionalKyselyPg(databaseUrl);
      additionalKyselyResults.push(results);
    } catch (error) {
      console.error(
        `❌ Additional Kysely iteration ${i + 1} failed:`,
        error instanceof Error ? error.message : error
      );
      if (error instanceof Error && error.stack) {
        console.error(`❌ Stack:`, error.stack);
      }
    }
  }

  writeResults(
    "kysely-additional",
    "postgresql",
    additionalKyselyResults,
    benchmarkOptions,
    resultsDirectoryTimestamp
  );

  console.log("\n✅ Additional Kysely benchmarks completed!");
}
