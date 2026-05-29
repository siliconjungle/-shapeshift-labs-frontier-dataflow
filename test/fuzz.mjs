import assert from 'node:assert';
import {
  compileDataflow,
  createDataflowGraph,
  createDataflowProof,
  decodeDataflowJsonl,
  encodeDataflowJsonl,
  explainDataflowChange,
  materializeDataflow,
  planDataflowRecompute,
  queryDataflowGraph,
  traceDataflowImpact,
  validateDataflowGraph
} from '../dist/index.js';

const args = parseArgs(process.argv.slice(2));
const cases = readPositiveInt(args.cases, 500);
let seed = readPositiveInt(args.seed, 0xdaf10a11);
let checked = 0;

for (let i = 0; i < cases; i++) {
  const scenario = makeScenario(i);
  const graph = createDataflowGraph(scenario.graph);
  const compiled = compileDataflow(graph);
  const validation = validateDataflowGraph(graph);
  assert.strictEqual(compiled.validation.valid, validation.valid);
  assert.strictEqual(compiled.graph.nodes.length, graph.nodes.length);

  const aggregateNodes = queryDataflowGraph(compiled, { types: ['aggregate'] }).nodes;
  assert.ok(aggregateNodes.every((node) => node.type === 'aggregate'));

  const materialized = materializeDataflow(compiled, scenario.state, { now: i + 1 });
  assert.ok(Object.keys(materialized.valuesByNode).length >= graph.nodes.length);
  assert.ok(Array.isArray(materialized.provenance));
  assert.ok(Array.isArray(explainDataflowChange(materialized, { path: '/views/totals' })));

  const changedOrder = 'o' + nextInt(scenario.orderCount);
  const plan = planDataflowRecompute(compiled, {
    changedPaths: ['/entities/orders/' + changedOrder + '/total'],
    budgetLimit: 10000
  }, { now: i + 2 });
  assert.ok(Array.isArray(plan.staleNodeIds));
  assert.ok(plan.recomputeBudget.estimatedCost > 0 || plan.staleNodeIds.length === 0);

  const impact = traceDataflowImpact(compiled, { nodes: ['/entities/orders/' + changedOrder] });
  assert.ok(Array.isArray(impact.nodeIds));
  const jsonl = encodeDataflowJsonl([plan, materialized]);
  assert.strictEqual(decodeDataflowJsonl(jsonl).length, 2);
  assert.notStrictEqual(createDataflowProof(graph).hash.length, 0);
  checked++;
}

console.log('frontier-dataflow fuzz ok: ' + checked + ' cases');

function makeScenario(index) {
  const orderCount = 3 + nextInt(8);
  const orders = {};
  for (let i = 0; i < orderCount; i++) {
    orders['o' + i] = {
      id: 'o' + i,
      customerId: 'c' + (i % 3),
      status: maybe() ? 'paid' : 'pending',
      total: 10 + nextInt(200)
    };
  }
  return {
    orderCount,
    state: {
      entities: {
        orders,
        recentInvoices: {
          c0: { id: 'i0', amount: 20 },
          c1: { id: 'i1', amount: 30 },
          c2: { id: 'i2', amount: 40 }
        }
      }
    },
    graph: {
      id: 'dataflow-fuzz-' + index,
      nodes: [
        { id: 'orders', sourcePath: '/entities/orders' },
        { id: 'paidOrders', input: 'orders', predicate: { field: 'status', equals: 'paid' } },
        { id: 'ordersByCustomer', input: 'paidOrders', groupBy: 'customerId' },
        { id: 'totals', input: 'ordersByCustomer', aggregate: { op: pick(['sum', 'count', 'avg']), field: 'total' }, outputPath: '/views/totals' },
        { id: 'recentInvoices', sourcePath: '/entities/recentInvoices' },
        { id: 'dashboard', inputs: ['totals', 'recentInvoices'], join: { fields: ['total', 'invoice'] }, outputPath: '/dashboard/revenue' }
      ],
      metadata: { seed }
    }
  };
}

function pick(values) {
  return values[nextInt(values.length)];
}

function maybe() {
  return (next() & 1) === 1;
}

function nextInt(max) {
  return next() % max;
}

function next() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--cases') out.cases = argv[++i];
    else if (argv[i] === '--seed') out.seed = argv[++i];
  }
  return out;
}

function readPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
