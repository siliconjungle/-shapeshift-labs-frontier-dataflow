import assert from 'node:assert';
import {
  compileDataflow,
  createDataflowGraph,
  createDataflowAutonomousQueueView,
  createDataflowAutonomousQueueUtilization,
  createDataflowModelRoutingRecommendations,
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

const autonomousQueueView = createDataflowAutonomousQueueView({
  id: 'autonomous-merge.queue-view',
  queueItems: [
    { id: 'queue:queued', status: 'queued' },
    { id: 'queue:active', status: 'active' },
    { id: 'queue:review-debt', status: 'human-question' }
  ],
  leases: [
    { id: 'queue:active', status: 'active' },
    { id: 'queue:draining', status: 'draining' }
  ],
  semanticRows: [
    { id: 'queue:drained', status: 'drained' },
    { id: 'queue:rerun', status: 'rerun' },
    { id: 'queue:conflicted', status: 'conflict' },
    { id: 'queue:questioned', status: 'review', question: 'Approve the rerun?' }
  ],
  terminalDecisions: [
    { id: 'queue:drained', decision: 'drained' },
    { id: 'queue:retired', decision: 'retired' }
  ]
});

assert.strictEqual(autonomousQueueView.kind, 'frontier.dataflow.autonomous-queue-view');
assert.strictEqual(autonomousQueueView.version, 1);
assert.strictEqual(autonomousQueueView.summary.totalCount, 9);
assert.strictEqual(autonomousQueueView.summary.liveCount, 4);
assert.strictEqual(autonomousQueueView.summary.historicalCount, 5);
assert.strictEqual(autonomousQueueView.summary.active, 1);
assert.strictEqual(autonomousQueueView.summary.queued, 1);
assert.strictEqual(autonomousQueueView.summary.draining, 2);
assert.strictEqual(autonomousQueueView.summary.drained, 1);
assert.strictEqual(autonomousQueueView.summary.rerun, 1);
assert.strictEqual(autonomousQueueView.summary.conflicted, 1);
assert.strictEqual(autonomousQueueView.summary.humanQuestion, 1);
assert.strictEqual(autonomousQueueView.summary.retired, 1);
assert.strictEqual(autonomousQueueView.summary.queueItemCount, 3);
assert.strictEqual(autonomousQueueView.summary.leaseCount, 2);
assert.strictEqual(autonomousQueueView.summary.semanticRowCount, 4);
assert.strictEqual(autonomousQueueView.summary.terminalDecisionCount, 2);

const autonomousQueueUtilization = createDataflowAutonomousQueueUtilization({
  id: 'autonomous-merge.utilization',
  events: [
    { id: 'sample:30', observedAt: 30, activeCount: 1, totalCount: 4 },
    { id: 'sample:15', observedAt: 15, activeCount: 1, totalCount: 4 }
  ],
  snapshots: [
    {
      id: 'sample:30',
      observedAt: 30,
      queueItems: [
        { id: 'queue:active-a', status: 'active' },
        { id: 'queue:active-b', status: 'active' },
        { id: 'queue:queued-a', status: 'queued' },
        { id: 'queue:queued-b', status: 'queued' }
      ],
      capacity: 8
    }
  ],
  queueSnapshots: [
    {
      id: 'sample:10',
      observedAt: 10,
      queueItems: [
        { id: 'queue:active-a', status: 'active' },
        { id: 'queue:queued-a', status: 'queued' }
      ],
      capacity: 8
    }
  ]
});

assert.strictEqual(autonomousQueueUtilization.kind, 'frontier.dataflow.autonomous-queue-utilization');
assert.strictEqual(autonomousQueueUtilization.version, 1);
assert.strictEqual(autonomousQueueUtilization.summary.sampleCount, 3);
assert.strictEqual(autonomousQueueUtilization.summary.eventCount, 2);
assert.strictEqual(autonomousQueueUtilization.summary.snapshotCount, 2);
assert.strictEqual(autonomousQueueUtilization.summary.earliestObservedAt, 10);
assert.strictEqual(autonomousQueueUtilization.summary.latestObservedAt, 30);
assert.strictEqual(autonomousQueueUtilization.summary.minUtilization, 0.25);
assert.strictEqual(autonomousQueueUtilization.summary.maxUtilization, 0.5);
assert.strictEqual(autonomousQueueUtilization.summary.latestUtilization, 0.5);
assert.strictEqual(autonomousQueueUtilization.samples[0].observedAt, 10);
assert.strictEqual(autonomousQueueUtilization.samples[0].utilization, 0.25);
assert.strictEqual(autonomousQueueUtilization.samples[1].observedAt, 15);
assert.strictEqual(autonomousQueueUtilization.samples[1].utilization, 0.25);
assert.strictEqual(autonomousQueueUtilization.samples[2].observedAt, 30);
assert.strictEqual(autonomousQueueUtilization.samples[2].active, 2);
assert.strictEqual(autonomousQueueUtilization.samples[2].queued, 2);
assert.strictEqual(autonomousQueueUtilization.samples[2].liveCount, 4);
assert.strictEqual(autonomousQueueUtilization.samples[2].utilization, 0.5);

const modelRoutingRecommendations = createDataflowModelRoutingRecommendations({
  id: 'model-routing.recommendations',
  windowSize: 2,
  minimumSamples: 2,
  outcomes: [
    { id: 'mini:1', modelId: 'gpt-5.4-mini', outcome: 'failed', score: 0.12, latencyMs: 320, costUsd: 0.05, observedAt: 1 },
    { id: 'mini:2', modelId: 'gpt-5.4-mini', outcome: 'failed', score: 0.25, latencyMs: 300, costUsd: 0.05, observedAt: 2 },
    { id: 'mini:3', modelId: 'gpt-5.4-mini', outcome: 'success', score: 0.91, latencyMs: 140, costUsd: 0.05, observedAt: 3 },
    { id: 'mini:4', modelId: 'gpt-5.4-mini', outcome: 'success', score: 0.95, latencyMs: 120, costUsd: 0.05, observedAt: 4 },
    { id: 'deep:1', modelId: 'gpt-5.4-deep', outcome: 'failed', score: 0.2, latencyMs: 500, costUsd: 0.18, observedAt: 1 },
    { id: 'deep:2', modelId: 'gpt-5.4-deep', outcome: 'failed', score: 0.15, latencyMs: 520, costUsd: 0.18, observedAt: 2 }
  ]
});

assert.strictEqual(modelRoutingRecommendations.kind, 'frontier.dataflow.model-routing-recommendations');
assert.strictEqual(modelRoutingRecommendations.summary.modelCount, 2);
assert.strictEqual(modelRoutingRecommendations.summary.outcomeCount, 6);
assert.strictEqual(modelRoutingRecommendations.summary.windowedOutcomeCount, 4);
assert.strictEqual(modelRoutingRecommendations.summary.promoteCount, 1);
assert.strictEqual(modelRoutingRecommendations.summary.deprioritizeCount, 1);
assert.strictEqual(modelRoutingRecommendations.recommendations[0].modelId, 'gpt-5.4-mini');
assert.strictEqual(modelRoutingRecommendations.recommendations[0].recommendation, 'promote');
assert.ok(modelRoutingRecommendations.recommendations[0].reason.includes('rolling score'));
assert.strictEqual(modelRoutingRecommendations.recommendations[1].modelId, 'gpt-5.4-deep');
assert.strictEqual(modelRoutingRecommendations.recommendations[1].recommendation, 'deprioritize');
