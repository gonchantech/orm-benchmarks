import { preparePg } from "./lib/prepare-pg-native"; // seed via `pg_restore`
// import { preparePg } from "./lib/prepare-pg-prisma"; // seed via `createMany`
import writeResults from "./lib/write-results";
import { BenchmarkOptions, MultipleBenchmarkRunResults } from "./lib/types";
import { prismaPg } from "./prisma/prisma-pg";
import { typeormPg } from "./typeorm/typeorm-pg";
import { drizzlePg } from "./drizzle/drizzle-pg";
import { compareResults } from "./lib/compare-results";
import { kyselyPg } from "./kysely/kysely-pg";

export default async function runBenchmarksPg(
  benchmarkOptions: BenchmarkOptions
) {
  const { databaseUrl, iterations, size, fakerSeed } = benchmarkOptions;

  const resultsDirectoryTimestamp = Date.now().toString();

  const prismaResults: MultipleBenchmarkRunResults = [];
  const drizzleResults: MultipleBenchmarkRunResults = [];
  const typeormResults: MultipleBenchmarkRunResults = [];
  const kyselyResults: MultipleBenchmarkRunResults = [];

  // Define benchmark runners with their names and result arrays
  const benchmarks = [
    {
      name: "Prisma",
      run: async () => {
        const results = await prismaPg(databaseUrl);
        prismaResults.push(results);
      },
    },
    {
      name: "Drizzle",
      run: async () => {
        const results = await drizzlePg(databaseUrl);
        drizzleResults.push(results);
      },
    },
    {
      name: "TypeORM",
      run: async () => {
        const results = await typeormPg(databaseUrl);
        typeormResults.push(results);
      },
    },
    {
      name: "Kysely",
      run: async () => {
        const results = await kyselyPg(databaseUrl);
        kyselyResults.push(results);
      },
    },
  ];

  // Define 4 different execution orders to rotate through
  const executionOrders = [
    [0, 1, 2, 3], // Prisma, Drizzle, TypeORM, Kysely
    [1, 2, 3, 0], // Drizzle, TypeORM, Kysely, Prisma
    [2, 3, 0, 1], // TypeORM, Kysely, Prisma, Drizzle
    [3, 0, 1, 2], // Kysely, Prisma, Drizzle, TypeORM
  ];

  const iterationsPerGroup = Math.ceil(iterations / 4);

  for (let i = 0; i < iterations; i++) {
    // Determine which execution order to use based on the current iteration group
    const groupIndex = Math.floor(i / iterationsPerGroup);
    const order = executionOrders[Math.min(groupIndex, 3)];

    console.log(
      `\n🔄 Iteration ${i + 1}/${iterations} (Group ${
        groupIndex + 1
      }, Order: ${order.map((idx) => benchmarks[idx].name).join(" → ")})`
    );

    for (const benchmarkIndex of order) {
      const benchmark = benchmarks[benchmarkIndex];
      try {
        await preparePg({ databaseUrl, size, fakerSeed });
        await benchmark.run();
      } catch (error) {
        console.error(
          `❌ ${benchmark.name} iteration ${i + 1} failed:`,
          error instanceof Error ? error.message : error
        );
        if (error instanceof Error && error.stack) {
          console.error(`❌ Stack:`, error.stack);
        }
      }
    }
  }

  writeResults(
    "prisma",
    "postgresql",
    prismaResults,
    benchmarkOptions,
    resultsDirectoryTimestamp
  );

  writeResults(
    "drizzle",
    "postgresql",
    drizzleResults,
    benchmarkOptions,
    resultsDirectoryTimestamp
  );

  writeResults(
    "typeorm",
    "postgresql",
    typeormResults,
    benchmarkOptions,
    resultsDirectoryTimestamp
  );

  writeResults(
    "kysely",
    "postgresql",
    kyselyResults,
    benchmarkOptions,
    resultsDirectoryTimestamp
  );

  // Optionally compare results
  if (process.env.DEBUG === "benchmarks:compare-results") {
    compareResults({
      prismaResults,
      drizzleResults,
      typeormResults,
      kyselyResults,
    });
  }
}
