import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const minStatements = Number(readFlag(args, '--min-statements', '0'));
const minLines = Number(readFlag(args, '--min-lines', '0'));
const scope = readFlag(args, '--scope', 'all');

const workspace = process.cwd();
const summaryPath = path.join(workspace, 'coverage', 'buygo-web', 'coverage-summary.json');
const finalPath = path.join(workspace, 'coverage', 'buygo-web', 'coverage-final.json');
const cloverPath = path.join(workspace, 'coverage', 'buygo-web', 'clover.xml');

let allMetrics;
let appOnlyMetrics;

if (fs.existsSync(summaryPath)) {
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  allMetrics = {
    statements: summary.total.statements.pct,
    lines: summary.total.lines.pct,
  };

  const appFiles = Object.entries(summary)
    .filter(([file]) => file !== 'total')
    .filter(([file]) => !file.includes('/src/app/core/api/api/v1/'))
    .map(([, metrics]) => metrics);

  appOnlyMetrics = aggregateSummaryMetrics(appFiles);
} else if (fs.existsSync(finalPath)) {
  const finalJson = JSON.parse(fs.readFileSync(finalPath, 'utf8'));
  const allStatements = aggregateFinalMetrics(finalJson, () => true);
  const appOnlyStatements = aggregateFinalMetrics(
    finalJson,
    (filePath) => !filePath.includes('/src/app/core/api/api/v1/'),
  );

  const cloverMetrics = fs.existsSync(cloverPath)
    ? aggregateCloverMetrics(fs.readFileSync(cloverPath, 'utf8'), () => true)
    : null;
  const cloverAppOnly = fs.existsSync(cloverPath)
    ? aggregateCloverMetrics(
        fs.readFileSync(cloverPath, 'utf8'),
        (filePath) => !filePath.includes('/src/app/core/api/api/v1/'),
      )
    : null;

  allMetrics = {
    statements: allStatements.statements,
    lines: cloverMetrics?.lines ?? allStatements.lines,
  };
  appOnlyMetrics = {
    statements: appOnlyStatements.statements,
    lines: cloverAppOnly?.lines ?? appOnlyStatements.lines,
  };
} else {
  console.error('[coverage] missing coverage summary file');
  process.exit(1);
}

console.log(
  `[coverage] frontend all-files statements=${allMetrics.statements.toFixed(2)}% lines=${allMetrics.lines.toFixed(2)}%`,
);
console.log(
  `[coverage] frontend app-only (exclude generated proto) statements=${appOnlyMetrics.statements.toFixed(2)}% lines=${appOnlyMetrics.lines.toFixed(2)}%`,
);

const gateMetrics = scope === 'app-only' ? appOnlyMetrics : allMetrics;

let failed = false;
if (gateMetrics.statements < minStatements) {
  console.error(
    `[coverage] statements gate failed (${scope}): ${gateMetrics.statements.toFixed(2)}% < ${minStatements}%`,
  );
  failed = true;
}
if (gateMetrics.lines < minLines) {
  console.error(
    `[coverage] lines gate failed (${scope}): ${gateMetrics.lines.toFixed(2)}% < ${minLines}%`,
  );
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log(`[coverage] frontend gate passed (scope=${scope})`);

function readFlag(values, name, fallback) {
  const item = values.find((value) => value.startsWith(`${name}=`));
  return item ? item.slice(name.length + 1) : fallback;
}

function aggregateSummaryMetrics(files) {
  if (files.length === 0) return { statements: 0, lines: 0 };

  const totals = files.reduce(
    (acc, metrics) => {
      acc.statements.total += metrics.statements.total;
      acc.statements.covered += metrics.statements.covered;
      acc.lines.total += metrics.lines.total;
      acc.lines.covered += metrics.lines.covered;
      return acc;
    },
    {
      statements: { total: 0, covered: 0 },
      lines: { total: 0, covered: 0 },
    },
  );

  return {
    statements:
      totals.statements.total === 0
        ? 0
        : (totals.statements.covered / totals.statements.total) * 100,
    lines: totals.lines.total === 0 ? 0 : (totals.lines.covered / totals.lines.total) * 100,
  };
}

function aggregateFinalMetrics(finalJson, filterFn) {
  let totalStatements = 0;
  let coveredStatements = 0;
  const totalLines = new Set();
  const coveredLines = new Set();

  for (const [filePath, entry] of Object.entries(finalJson)) {
    if (!filterFn(filePath)) continue;

    for (const [stmtId, count] of Object.entries(entry.s)) {
      const location = entry.statementMap[stmtId];
      totalStatements += 1;
      totalLines.add(location.start.line);

      if (count > 0) {
        coveredStatements += 1;
        coveredLines.add(location.start.line);
      }
    }
  }

  return {
    statements: totalStatements === 0 ? 0 : (coveredStatements / totalStatements) * 100,
    lines: totalLines.size === 0 ? 0 : (coveredLines.size / totalLines.size) * 100,
  };
}

function aggregateCloverMetrics(cloverXml, filterFn) {
  const fileRegex =
    /<file\b[^>]*path="([^"]+)"[^>]*>\s*<metrics\b[^>]*statements="(\d+)"[^>]*coveredstatements="(\d+)"/gms;

  let total = 0;
  let covered = 0;
  for (const match of cloverXml.matchAll(fileRegex)) {
    const filePath = match[1];
    if (!filterFn(filePath)) continue;
    total += Number(match[2]);
    covered += Number(match[3]);
  }

  return {
    lines: total === 0 ? 0 : (covered / total) * 100,
  };
}
