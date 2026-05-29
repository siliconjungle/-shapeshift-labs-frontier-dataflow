import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import {
  compileDataflow,
  createDataflowGraph,
  createDataflowProof,
  createDataflowRegistryGraph,
  decodeDataflowJsonl,
  encodeDataflowJsonl,
  explainDataflowChange,
  materializeDataflow,
  planDataflowRecompute,
  queryDataflowGraph,
  traceDataflowImpact,
  validateDataflowGraph
} from '../dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(__dirname, '..');
const repoRoot = path.basename(path.dirname(packageDir)) === 'packages'
  ? path.resolve(packageDir, '..', '..')
  : packageDir;
const args = parseArgs(process.argv.slice(2));
const orderCount = readPositiveInt(args.orders, 1000);
const rounds = readPositiveInt(args.rounds, 30);
const outPath = args.out ? path.resolve(repoRoot, args.out) : null;

const state = makeState(orderCount);
const input = makeGraphInput();
let graph = createDataflowGraph(input);
let compiled = compileDataflow(graph);
let materialized = materializeDataflow(compiled, state);
let plan = planDataflowRecompute(compiled, { changedPaths: ['/entities/orders/o1/status'] });
let jsonl = encodeDataflowJsonl([plan, materialized]);
let cursor = 0;

const rows = [
  measure('create-graph', 16, () => {
    graph = createDataflowGraph(input);
    return graph.nodes.length;
  }),
  measure('compile-dataflow', 16, () => {
    compiled = compileDataflow(graph);
    return compiled.topologicalOrder.length;
  }),
  measure('validate-dataflow', 16, () => validateDataflowGraph(graph).issues.length),
  measure('query-output-path', 32, () => queryDataflowGraph(compiled, { outputPaths: ['/dashboard/revenue/c1'] }).nodes.length),
  measure('plan-recompute-' + orderCount, 64, () => {
    const id = 'o' + (cursor++ % orderCount);
    plan = planDataflowRecompute(compiled, { changedPaths: ['/entities/orders/' + id + '/status'], budgetLimit: 1000 });
    return plan.staleNodeIds.length;
  }),
  measure('materialize-' + orderCount, 8, () => {
    materialized = materializeDataflow(compiled, state);
    return Object.keys(materialized.valuesByNode).length;
  }),
  measure('explain-row', 64, () => explainDataflowChange(materialized, { path: '/dashboard/revenue/c1' }).length),
  measure('trace-impact', 32, () => traceDataflowImpact(compiled, { nodes: ['/entities/orders/o1/status'] }).nodeIds.length),
  measure('registry-graph', 8, () => {
    const registry = createDataflowRegistryGraph(compiled, { package: '@shapeshift-labs/frontier-dataflow' });
    return registry.entries.length + registry.edges.length;
  }),
  measure('jsonl-encode', 16, () => {
    jsonl = encodeDataflowJsonl([plan, materialized]);
    return jsonl.length;
  }),
  measure('jsonl-decode', 16, () => decodeDataflowJsonl(jsonl).length),
  measure('proof', 8, () => createDataflowProof(graph).hash.length)
];

const report = {
  package: '@shapeshift-labs/frontier-dataflow',
  version: readPackageVersion(),
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform + ' ' + process.arch,
  orderCount,
  rounds,
  rows
};

if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
}

console.log(report.package + ' package benchmark');
console.log('Node ' + report.node + ' on ' + report.platform + ', orders=' + orderCount + ', rounds=' + rounds);
console.log('These are Frontier-only package measurements, not competitor comparisons.');
console.log('');
console.log(padRight('Fixture', 30) + padLeft('Median', 12) + padLeft('p95', 12));
for (const row of rows) {
  console.log(padRight(row.fixture, 30) + padLeft(formatUs(row.medianUs), 12) + padLeft(formatUs(row.p95Us), 12));
}
if (outPath) console.log('\nwrote ' + path.relative(repoRoot, outPath));

function makeGraphInput() {
  return {
    id: 'bench.dataflow',
    nodes: [
      { id: 'orders', sourcePath: '/entities/orders' },
      { id: 'paidOrders', input: 'orders', predicate: { field: 'status', equals: 'paid' }, budgetCost: 2 },
      { id: 'ordersByCustomer', input: 'paidOrders', groupBy: 'customerId', budgetCost: 3 },
      { id: 'totals', input: 'ordersByCustomer', aggregate: { op: 'sum', field: 'total' }, outputPath: '/views/customerTotals', budgetCost: 3 },
      { id: 'recentInvoices', sourcePath: '/entities/recentInvoices' },
      { id: 'dashboard', inputs: ['totals', 'recentInvoices'], join: { fields: ['total', 'invoice'] }, outputPath: '/dashboard/revenue', budgetCost: 4 }
    ],
    metadata: { token: 'bench-secret' }
  };
}

function makeState(count) {
  const orders = {};
  const recentInvoices = {};
  for (let i = 0; i < count; i++) {
    const customerId = 'c' + (i % 64);
    orders['o' + i] = {
      id: 'o' + i,
      customerId,
      status: i % 3 === 0 ? 'pending' : 'paid',
      total: 10 + (i % 200)
    };
    recentInvoices[customerId] = { id: 'i' + customerId, amount: 20 + (i % 100) };
  }
  return { entities: { orders, recentInvoices } };
}

function measure(fixture, batchSize, fn) {
  const values = [];
  let sink = 0;
  for (let round = 0; round < rounds; round++) {
    const started = performance.now();
    for (let i = 0; i < batchSize; i++) sink += fn();
    values[values.length] = ((performance.now() - started) * 1000) / batchSize;
  }
  if (sink === -1) console.log('sink=' + sink);
  values.sort((left, right) => left - right);
  return { fixture, medianUs: percentile(values, 0.5), p95Us: percentile(values, 0.95) };
}

function percentile(values, p) {
  return values[Math.min(values.length - 1, Math.floor((values.length - 1) * p))] ?? 0;
}

function formatUs(value) {
  if (value >= 1000) return (value / 1000).toFixed(2) + ' ms';
  return value.toFixed(2) + ' us';
}

function padRight(value, width) {
  return String(value).padEnd(width, ' ');
}

function padLeft(value, width) {
  return String(value).padStart(width, ' ');
}

function readPackageVersion() {
  return JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8')).version;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--orders') out.orders = argv[++i];
    else if (arg === '--rounds') out.rounds = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run bench -- [--orders 1000] [--rounds 30] [--out benchmarks/results/frontier-dataflow-package-bench-latest.json]');
      process.exit(0);
    }
  }
  return out;
}

function readPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
