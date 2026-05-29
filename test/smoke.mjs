import assert from 'node:assert';
import {
  compileDataflow,
  createDataflowGraph,
  createDataflowProof,
  createDataflowRegistryGraph,
  decodeDataflowJsonl,
  defineDataflowGraph,
  defineDataflowNode,
  encodeDataflowJsonl,
  explainDataflowChange,
  materializeDataflow,
  planDataflowRecompute,
  queryDataflowGraph,
  redactDataflowValue,
  traceDataflowImpact,
  validateDataflowGraph
} from '../dist/index.js';

const graph = createDataflowGraph({
  id: 'commerce.dashboard',
  package: '@app/commerce',
  feature: 'dashboard',
  owner: 'data',
  metadata: { token: 'secret' },
  nodes: [
    { id: 'orders', type: 'source', sourcePath: '/entities/orders', budgetCost: 1 },
    { id: 'paidOrders', type: 'filter', input: 'orders', predicate: { field: 'status', equals: 'paid' }, budgetCost: 2 },
    { id: 'ordersByCustomer', type: 'groupBy', input: 'paidOrders', groupBy: 'customerId', budgetCost: 3 },
    { id: 'customerTotals', type: 'aggregate', input: 'ordersByCustomer', aggregate: { op: 'sum', field: 'total' }, outputPath: '/views/customerTotals', budgetCost: 3 },
    { id: 'recentInvoices', type: 'source', sourcePath: '/entities/recentInvoices', budgetCost: 1 },
    { id: 'dashboard', type: 'join', inputs: ['customerTotals', 'recentInvoices'], join: { fields: ['total', 'invoice'] }, outputPath: '/dashboard/revenue', budgetCost: 4 }
  ]
});

assert.strictEqual(defineDataflowGraph({ id: 'empty' }).id, 'empty');
assert.strictEqual(defineDataflowNode({ id: 'entities.orders', sourcePath: '/entities/orders' }).type, 'source');
assert.strictEqual(graph.summary.nodeCount, 6);
assert.strictEqual(graph.summary.sourceCount, 2);
assert.strictEqual(graph.summary.aggregateCount, 1);
assert.strictEqual(graph.summary.joinCount, 1);
assert.strictEqual(graph.summary.materializedCount, 2);

const validation = validateDataflowGraph(graph);
assert.strictEqual(validation.valid, true);
const invalid = validateDataflowGraph({ id: 'bad', nodes: [{ id: 'derived', input: 'missing' }] });
assert.strictEqual(invalid.valid, false);

const compiled = compileDataflow(graph);
assert.strictEqual(compiled.get('customerTotals').type, 'aggregate');
assert.deepStrictEqual(compiled.dependents('orders').map((node) => node.id), ['paidOrders']);
assert.deepStrictEqual(queryDataflowGraph(compiled, { types: ['aggregate'] }).ids, ['customerTotals']);
assert.deepStrictEqual(queryDataflowGraph(graph, { outputPaths: ['/dashboard/revenue/c1'] }).ids, ['dashboard']);

const previousState = {
  entities: {
    orders: {
      o1: { id: 'o1', customerId: 'c1', status: 'pending', total: 100 },
      o2: { id: 'o2', customerId: 'c1', status: 'paid', total: 50 },
      o3: { id: 'o3', customerId: 'c2', status: 'paid', total: 70 }
    },
    recentInvoices: {
      c1: { id: 'i1', amount: 50 },
      c2: { id: 'i2', amount: 70 }
    }
  }
};

const nextState = {
  entities: {
    orders: {
      o1: { id: 'o1', customerId: 'c1', status: 'paid', total: 100 },
      o2: { id: 'o2', customerId: 'c1', status: 'paid', total: 50 },
      o3: { id: 'o3', customerId: 'c2', status: 'paid', total: 70 }
    },
    recentInvoices: {
      c1: { id: 'i1', amount: 50 },
      c2: { id: 'i2', amount: 70 }
    }
  }
};

const previous = materializeDataflow(compiled, previousState, { now: 1000 });
const next = materializeDataflow(compiled, nextState, { previous, now: 1100 });
assert.strictEqual(previous.valuesByNode.customerTotals.c1, 50);
assert.strictEqual(next.valuesByNode.customerTotals.c1, 150);
assert.ok(next.patches.some((patch) => patch.path === '/views/customerTotals'));
assert.ok(next.patches.some((patch) => patch.path === '/dashboard/revenue'));

const explanation = explainDataflowChange(next, { path: '/dashboard/revenue/c1' });
assert.ok(explanation.some((record) => record.sourcePaths.includes('/entities/orders/o1')));
assert.ok(explanation.some((record) => record.reason.includes('row')));

const plan = planDataflowRecompute(compiled, {
  patches: [{ op: 'set', path: '/entities/orders/o1/status', value: 'paid', oldValue: 'pending' }],
  budgetLimit: 100
}, { now: 1200 });
assert.deepStrictEqual(plan.staleRows.orders, ['o1']);
assert.ok(plan.staleNodeIds.includes('customerTotals'));
assert.ok(plan.staleNodeIds.includes('dashboard'));
assert.ok(plan.staleOutputPaths.includes('/dashboard/revenue'));
assert.strictEqual(plan.recomputeBudget.withinLimit, true);

const graphRegistry = createDataflowRegistryGraph(graph);
assert.ok(graphRegistry.entries.some((entry) => entry.id === 'dataflow-node:dashboard'));
assert.ok(graphRegistry.edges.some((edge) => edge.kind === 'feeds' && edge.to === 'dataflow-node:dashboard'));
const impact = traceDataflowImpact(graph, { nodes: ['/entities/orders/o1/status'] });
assert.ok(impact.nodeIds.includes('dashboard'));
assert.ok(impact.outputPaths.includes('/dashboard/revenue'));

const jsonl = encodeDataflowJsonl([plan, next]);
assert.strictEqual(decodeDataflowJsonl(jsonl).length, 2);
assert.notStrictEqual(createDataflowProof(graph, { generatedAt: 1 }).hash.length, 0);
assert.strictEqual(JSON.stringify(redactDataflowValue(graph)).includes('secret'), false);
