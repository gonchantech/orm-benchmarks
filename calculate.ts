import fs from "fs";

/* =========================
   CSV 読み込み（列ベース）
========================= */
function readCsvColumns(filePath: string): Record<string, number[]> {
  const content = fs.readFileSync(filePath, "utf-8").trim();
  const lines = content.split("\n");

  // 1行目：列名
  const headers = lines[0].split(",");

  const columns: Record<string, number[]> = {};
  for (const header of headers) {
    columns[header] = [];
  }

  // 2行目以降：数値
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(Number);

    values.forEach((value, idx) => {
      columns[headers[idx]].push(value);
    });
  }

  return columns;
}

/* =========================
   統計関数
========================= */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function quartile(values: number[], q: 0.25 | 0.75): number {
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;

  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

function iqr(values: number[]): number {
  return quartile(values, 0.75) - quartile(values, 0.25);
}

function stdDev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;

  return Math.sqrt(variance);
}

/* =========================
   集計
========================= */
type Stats = {
  median: number;
  iqr: number;
  stdDev: number;
};

function calcStats(columns: Record<string, number[]>): Record<string, Stats> {
  const result: Record<string, Stats> = {};

  for (const [name, values] of Object.entries(columns)) {
    result[name] = {
      median: median(values),
      iqr: iqr(values),
      stdDev: stdDev(values),
    };
  }

  return result;
}

/* =========================
   実行
========================= */
const columns = readCsvColumns(
  "./results/postgresql-1000-500-1765695085840/kysely-additional.csv"
);
const stats = calcStats(columns);

console.log(stats);
