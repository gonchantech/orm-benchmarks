async function measure(label: string, query: any) {
  const startTime = performance.now();
  let result = await query;
  const endTime = performance.now();

  // Calculate the elapsed time
  const elapsedTime = endTime - startTime;

  console.log(`${label}: ${elapsedTime}ms`);

  return {
    query: label,
    time: elapsedTime,
    // only collect data if DEBUG mode is turned on
    data: process.env.DEBUG === "benchmarks:compare-results" ? result : null,
  };
}

// Safe measure function that handles errors gracefully
export default function safeMeasure(label: string, query: any): Promise<any> {
  const startTime = performance.now();

  // Always return a promise that resolves to either the result or null
  return Promise.resolve()
    .then(async () => {
      // Execute the query
      const result = await query;

      const endTime = performance.now();
      const elapsedTime = endTime - startTime;

      console.log(`${label}: ${elapsedTime}ms`);

      return {
        query: label,
        time: elapsedTime,
        // only collect data if DEBUG mode is turned on
        data:
          process.env.DEBUG === "benchmarks:compare-results" ? result : null,
      };
    })
    .catch((error) => {
      const endTime = performance.now();
      const elapsedTime = endTime - startTime;

      console.warn(
        `⚠️  ${label} failed after ${elapsedTime}ms:`,
        error instanceof Error ? error.message : String(error)
      );
      return null; // Return null for failed queries
    });
}

// Export safeMeasure as both default and named export for compatibility
export { safeMeasure };
