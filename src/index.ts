import type { JsonObject, JsonValue } from '@shapeshift-labs/frontier';
import { cloneJson } from '@shapeshift-labs/frontier/clone';
import {
  createFrontierRegistryGraph,
  normalizeFrontierRegistryPath,
  type FrontierRegistryEdge,
  type FrontierRegistryEntry,
  type FrontierRegistryGraph,
  type FrontierRegistryImpact,
  type FrontierRegistryImpactInput,
  type FrontierRegistryPath,
  type FrontierRegistrySource
} from '@shapeshift-labs/frontier/registry';

export const FRONTIER_DATAFLOW_GRAPH_KIND = 'frontier.dataflow.graph';
export const FRONTIER_DATAFLOW_GRAPH_VERSION = 1;
export const FRONTIER_DATAFLOW_NODE_KIND = 'frontier.dataflow.node';
export const FRONTIER_DATAFLOW_NODE_VERSION = 1;
export const FRONTIER_DATAFLOW_PLAN_KIND = 'frontier.dataflow.plan';
export const FRONTIER_DATAFLOW_PLAN_VERSION = 1;
export const FRONTIER_DATAFLOW_MATERIALIZATION_KIND = 'frontier.dataflow.materialization';
export const FRONTIER_DATAFLOW_MATERIALIZATION_VERSION = 1;
export const FRONTIER_DATAFLOW_PROOF_KIND = 'frontier.dataflow.proof';
export const FRONTIER_DATAFLOW_PROOF_VERSION = 1;
export const FRONTIER_DATAFLOW_AUTONOMOUS_QUEUE_VIEW_KIND = 'frontier.dataflow.autonomous-queue-view';
export const FRONTIER_DATAFLOW_AUTONOMOUS_QUEUE_VIEW_VERSION = 1;
export const FRONTIER_DATAFLOW_AUTONOMOUS_QUEUE_UTILIZATION_KIND = 'frontier.dataflow.autonomous-queue-utilization';
export const FRONTIER_DATAFLOW_AUTONOMOUS_QUEUE_UTILIZATION_VERSION = 1;
export const FRONTIER_DATAFLOW_MODEL_ROUTING_RECOMMENDATIONS_KIND = 'frontier.dataflow.model-routing-recommendations';
export const FRONTIER_DATAFLOW_MODEL_ROUTING_RECOMMENDATIONS_VERSION = 1;

export type FrontierDataflowNodeType =
  | 'source'
  | 'filter'
  | 'groupBy'
  | 'aggregate'
  | 'join'
  | 'project'
  | 'materialized'
  | string;

export type FrontierDataflowAggregateOp = 'count' | 'sum' | 'min' | 'max' | 'avg' | string;

export interface FrontierDataflowSourceInput {
  file: string;
  line?: number;
  column?: number;
  symbol?: string;
  exportName?: string;
  package?: string;
}

export interface FrontierDataflowPredicateInput {
  field?: string;
  equals?: unknown;
  notEquals?: unknown;
  in?: readonly unknown[];
  exists?: boolean;
  metadata?: unknown;
}

export interface FrontierDataflowPredicate {
  field?: string;
  equals?: JsonValue;
  notEquals?: JsonValue;
  in?: JsonValue[];
  exists?: boolean;
  metadata?: JsonObject;
}

export interface FrontierDataflowAggregateInput {
  op?: FrontierDataflowAggregateOp;
  field?: string;
  metadata?: unknown;
}

export interface FrontierDataflowAggregate {
  op: FrontierDataflowAggregateOp;
  field?: string;
  metadata?: JsonObject;
}

export interface FrontierDataflowJoinInput {
  type?: 'object' | 'array' | 'merge' | string;
  fields?: readonly string[];
  metadata?: unknown;
}

export interface FrontierDataflowJoin {
  type: string;
  fields: string[];
  metadata?: JsonObject;
}

export interface FrontierDataflowNodeInput {
  id: string;
  title?: string;
  description?: string;
  type?: FrontierDataflowNodeType;
  sourcePath?: FrontierRegistryPath | string;
  input?: string;
  inputs?: readonly string[];
  groupBy?: string;
  aggregate?: FrontierDataflowAggregateInput | FrontierDataflowAggregateOp;
  predicate?: FrontierDataflowPredicateInput;
  join?: FrontierDataflowJoinInput;
  outputPath?: FrontierRegistryPath | string;
  budgetCost?: number;
  owner?: string;
  package?: string;
  feature?: string;
  tags?: readonly string[];
  source?: FrontierRegistrySource | FrontierDataflowSourceInput;
  metadata?: unknown;
}

export interface FrontierDataflowNode {
  kind: typeof FRONTIER_DATAFLOW_NODE_KIND;
  version: typeof FRONTIER_DATAFLOW_NODE_VERSION;
  id: string;
  title: string;
  description?: string;
  type: FrontierDataflowNodeType;
  sourcePath?: string;
  inputs: string[];
  groupBy?: string;
  aggregate?: FrontierDataflowAggregate;
  predicate?: FrontierDataflowPredicate;
  join?: FrontierDataflowJoin;
  outputPath?: string;
  budgetCost: number;
  owner?: string;
  package?: string;
  feature?: string;
  tags: string[];
  source?: FrontierRegistrySource;
  metadata?: JsonObject;
}

export interface FrontierDataflowGraphInput {
  id?: string;
  title?: string;
  description?: string;
  package?: string;
  feature?: string;
  owner?: string;
  nodes?: readonly FrontierDataflowNodeInput[];
  sourcePaths?: readonly (FrontierRegistryPath | string)[];
  outputPaths?: readonly (FrontierRegistryPath | string)[];
  tags?: readonly string[];
  source?: FrontierRegistrySource;
  metadata?: unknown;
}

export interface FrontierDataflowGraph {
  kind: typeof FRONTIER_DATAFLOW_GRAPH_KIND;
  version: typeof FRONTIER_DATAFLOW_GRAPH_VERSION;
  id: string;
  title?: string;
  description?: string;
  package?: string;
  feature?: string;
  owner?: string;
  nodes: FrontierDataflowNode[];
  sourcePaths: string[];
  outputPaths: string[];
  tags: string[];
  source?: FrontierRegistrySource;
  metadata?: JsonObject;
  summary: FrontierDataflowSummary;
}

export interface FrontierDataflowSummary {
  nodeCount: number;
  sourceCount: number;
  filterCount: number;
  aggregateCount: number;
  joinCount: number;
  materializedCount: number;
  sourcePathCount: number;
  outputPathCount: number;
  budgetCost: number;
}

export interface FrontierDataflowValidationIssue {
  code: string;
  message: string;
  nodeId?: string;
  targetId?: string;
  severity: 'error' | 'warning';
}

export interface FrontierDataflowValidation {
  valid: boolean;
  issues: FrontierDataflowValidationIssue[];
}

export interface FrontierDataflowCompiled {
  kind: 'frontier.dataflow.compiled';
  version: 1;
  graph: FrontierDataflowGraph;
  nodesById: ReadonlyMap<string, FrontierDataflowNode>;
  dependenciesById: ReadonlyMap<string, readonly string[]>;
  dependentsById: ReadonlyMap<string, readonly string[]>;
  nodesBySourcePath: ReadonlyMap<string, readonly string[]>;
  nodesByOutputPath: ReadonlyMap<string, readonly string[]>;
  topologicalOrder: string[];
  validation: FrontierDataflowValidation;
  get(nodeId: string): FrontierDataflowNode;
  dependents(nodeId: string): FrontierDataflowNode[];
}

export interface FrontierDataflowPatchInput {
  op?: string;
  path?: FrontierRegistryPath | string;
  value?: unknown;
  oldValue?: unknown;
}

export interface FrontierDataflowPatch {
  op: string;
  path: string;
  value?: JsonValue;
  oldValue?: JsonValue;
}

export interface FrontierDataflowPlanInput {
  patches?: readonly (FrontierDataflowPatchInput | readonly unknown[])[];
  changedPaths?: readonly (FrontierRegistryPath | string)[];
  targetNodes?: readonly string[];
  budgetLimit?: number;
  metadata?: unknown;
}

export interface FrontierDataflowStaleReason {
  nodeId: string;
  sourceNodeId?: string;
  changedPath?: string;
  reason: string;
}

export interface FrontierDataflowPlan {
  kind: typeof FRONTIER_DATAFLOW_PLAN_KIND;
  version: typeof FRONTIER_DATAFLOW_PLAN_VERSION;
  id: string;
  graphId: string;
  staleNodeIds: string[];
  staleSourcePaths: string[];
  staleOutputPaths: string[];
  staleRows: Record<string, string[]>;
  recomputeBudget: FrontierDataflowRecomputeBudget;
  reasons: FrontierDataflowStaleReason[];
  createdAt: number;
  metadata?: JsonObject;
}

export interface FrontierDataflowRecomputeBudget {
  nodeCount: number;
  rowCount: number;
  estimatedCost: number;
  withinLimit: boolean;
  limit?: number;
}

export interface FrontierDataflowMaterializeOptions {
  previous?: FrontierDataflowMaterialization;
  targetNodes?: readonly string[];
  now?: number | (() => number);
  metadata?: unknown;
}

export interface FrontierDataflowProvenanceRecord {
  nodeId: string;
  outputPath?: string;
  sourcePaths: string[];
  inputNodeIds: string[];
  reason: string;
  rowKey?: string;
  metadata?: JsonObject;
}

export interface FrontierDataflowMaterialization {
  kind: typeof FRONTIER_DATAFLOW_MATERIALIZATION_KIND;
  version: typeof FRONTIER_DATAFLOW_MATERIALIZATION_VERSION;
  id: string;
  graphId: string;
  valuesByNode: Record<string, JsonValue>;
  patches: FrontierDataflowPatch[];
  provenance: FrontierDataflowProvenanceRecord[];
  recomputeBudget: FrontierDataflowRecomputeBudget;
  createdAt: number;
  metadata?: JsonObject;
}

export interface FrontierDataflowProof {
  kind: typeof FRONTIER_DATAFLOW_PROOF_KIND;
  version: typeof FRONTIER_DATAFLOW_PROOF_VERSION;
  graphId: string;
  generatedAt: number;
  hash: string;
  summary: FrontierDataflowSummary | FrontierDataflowRecomputeBudget;
  validation?: FrontierDataflowValidation;
  metadata?: JsonObject;
}

export interface FrontierDataflowAutonomousQueueRecordInput {
  id?: string;
  queueItemId?: string;
  leaseId?: string;
  semanticRowId?: string;
  decisionId?: string;
  taskId?: string;
  status?: unknown;
  state?: unknown;
  phase?: unknown;
  lane?: unknown;
  decision?: unknown;
  terminalDecision?: unknown;
  result?: unknown;
  outcome?: unknown;
  type?: unknown;
  reason?: unknown;
  summary?: unknown;
  note?: unknown;
  message?: unknown;
  question?: unknown;
  humanQuestion?: unknown;
  questionId?: unknown;
  questionCode?: unknown;
  retired?: unknown;
  archived?: unknown;
  superseded?: unknown;
  obsolete?: unknown;
  conflict?: unknown;
  conflicted?: unknown;
  rerun?: unknown;
  drained?: unknown;
  draining?: unknown;
  active?: unknown;
  queued?: unknown;
  metadata?: unknown;
}

export interface FrontierDataflowAutonomousQueueViewInput {
  id?: string;
  title?: string;
  description?: string;
  queueItems?: readonly FrontierDataflowAutonomousQueueRecordInput[];
  leases?: readonly FrontierDataflowAutonomousQueueRecordInput[];
  semanticRows?: readonly FrontierDataflowAutonomousQueueRecordInput[];
  terminalDecisions?: readonly FrontierDataflowAutonomousQueueRecordInput[];
  metadata?: unknown;
}

export interface FrontierDataflowAutonomousQueueLaneCounts {
  active: number;
  queued: number;
  draining: number;
  drained: number;
  rerun: number;
  conflicted: number;
  humanQuestion: number;
  retired: number;
}

export interface FrontierDataflowAutonomousQueueViewSummary extends FrontierDataflowAutonomousQueueLaneCounts {
  totalCount: number;
  liveCount: number;
  historicalCount: number;
  queueItemCount: number;
  leaseCount: number;
  semanticRowCount: number;
  terminalDecisionCount: number;
}

export interface FrontierDataflowAutonomousQueueView {
  kind: typeof FRONTIER_DATAFLOW_AUTONOMOUS_QUEUE_VIEW_KIND;
  version: typeof FRONTIER_DATAFLOW_AUTONOMOUS_QUEUE_VIEW_VERSION;
  id: string;
  title?: string;
  description?: string;
  summary: FrontierDataflowAutonomousQueueViewSummary;
  metadata?: JsonObject;
}

export type FrontierDataflowAutonomousQueueUtilizationSource = 'event' | 'snapshot';

export interface FrontierDataflowAutonomousQueueUtilizationSampleInput {
  id?: string;
  kind?: FrontierDataflowAutonomousQueueUtilizationSource | string;
  observedAt?: unknown;
  timestamp?: unknown;
  time?: unknown;
  queueItems?: readonly FrontierDataflowAutonomousQueueRecordInput[];
  leases?: readonly FrontierDataflowAutonomousQueueRecordInput[];
  semanticRows?: readonly FrontierDataflowAutonomousQueueRecordInput[];
  terminalDecisions?: readonly FrontierDataflowAutonomousQueueRecordInput[];
  liveCount?: unknown;
  active?: unknown;
  activeCount?: unknown;
  queued?: unknown;
  queuedCount?: unknown;
  draining?: unknown;
  drainingCount?: unknown;
  drained?: unknown;
  drainedCount?: unknown;
  rerun?: unknown;
  rerunCount?: unknown;
  conflicted?: unknown;
  conflictedCount?: unknown;
  humanQuestion?: unknown;
  humanQuestionCount?: unknown;
  retired?: unknown;
  retiredCount?: unknown;
  total?: unknown;
  totalCount?: unknown;
  capacity?: unknown;
  metadata?: unknown;
}

export interface FrontierDataflowAutonomousQueueUtilizationInput {
  id?: string;
  title?: string;
  description?: string;
  events?: readonly FrontierDataflowAutonomousQueueUtilizationSampleInput[];
  snapshots?: readonly FrontierDataflowAutonomousQueueUtilizationSampleInput[];
  queueSnapshots?: readonly FrontierDataflowAutonomousQueueUtilizationSampleInput[];
  metadata?: unknown;
}

export interface FrontierDataflowAutonomousQueueUtilizationSample {
  id: string;
  kind: FrontierDataflowAutonomousQueueUtilizationSource;
  observedAt?: number;
  active: number;
  queued: number;
  draining: number;
  drained: number;
  rerun: number;
  conflicted: number;
  humanQuestion: number;
  retired: number;
  liveCount: number;
  totalCount: number;
  capacity?: number;
  utilization: number;
  metadata?: JsonObject;
}

export interface FrontierDataflowAutonomousQueueUtilizationSummary {
  sampleCount: number;
  eventCount: number;
  snapshotCount: number;
  earliestObservedAt?: number;
  latestObservedAt?: number;
  minUtilization: number;
  averageUtilization: number;
  maxUtilization: number;
  latestUtilization: number;
  peakUtilization: number;
  peakObservedAt?: number;
}

export interface FrontierDataflowAutonomousQueueUtilization {
  kind: typeof FRONTIER_DATAFLOW_AUTONOMOUS_QUEUE_UTILIZATION_KIND;
  version: typeof FRONTIER_DATAFLOW_AUTONOMOUS_QUEUE_UTILIZATION_VERSION;
  id: string;
  title?: string;
  description?: string;
  summary: FrontierDataflowAutonomousQueueUtilizationSummary;
  samples: FrontierDataflowAutonomousQueueUtilizationSample[];
  metadata?: JsonObject;
}

export type FrontierDataflowModelRoutingRecommendationVerdict = 'promote' | 'hold' | 'deprioritize';
export type FrontierDataflowModelRoutingRecommendationTrend = 'improving' | 'stable' | 'declining';

export interface FrontierDataflowModelRoutingOutcomeInput {
  id?: string;
  modelId?: string;
  status?: unknown;
  result?: unknown;
  decision?: unknown;
  outcome?: unknown;
  recommendation?: unknown;
  succeeded?: unknown;
  score?: unknown;
  latencyMs?: unknown;
  costUsd?: unknown;
  observedAt?: unknown;
  metadata?: unknown;
}

export interface FrontierDataflowModelRoutingOutcome {
  id: string;
  modelId: string;
  status?: string;
  success?: boolean;
  score?: number;
  latencyMs?: number;
  costUsd?: number;
  observedAt?: number;
  metadata?: JsonObject;
}

export interface FrontierDataflowModelRoutingRecommendationsInput {
  id?: string;
  title?: string;
  description?: string;
  outcomes?: readonly FrontierDataflowModelRoutingOutcomeInput[];
  windowSize?: number;
  minimumSamples?: number;
  promoteThreshold?: number;
  deprioritizeThreshold?: number;
  metadata?: unknown;
}

export interface FrontierDataflowModelRoutingRecommendation {
  modelId: string;
  outcomeCount: number;
  windowedOutcomeCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageScore: number;
  averageLatencyMs: number;
  averageCostUsd: number;
  trend: FrontierDataflowModelRoutingRecommendationTrend;
  recommendation: FrontierDataflowModelRoutingRecommendationVerdict;
  reason: string;
  lastObservedAt?: number;
  metadata?: JsonObject;
}

export interface FrontierDataflowModelRoutingRecommendationsSummary {
  modelCount: number;
  outcomeCount: number;
  windowedOutcomeCount: number;
  windowSize: number;
  minimumSamples: number;
  promoteCount: number;
  holdCount: number;
  deprioritizeCount: number;
}

export interface FrontierDataflowModelRoutingRecommendations {
  kind: typeof FRONTIER_DATAFLOW_MODEL_ROUTING_RECOMMENDATIONS_KIND;
  version: typeof FRONTIER_DATAFLOW_MODEL_ROUTING_RECOMMENDATIONS_VERSION;
  id: string;
  title?: string;
  description?: string;
  summary: FrontierDataflowModelRoutingRecommendationsSummary;
  recommendations: FrontierDataflowModelRoutingRecommendation[];
  metadata?: JsonObject;
}

interface DataflowEvaluation {
  value: JsonValue;
  sourcePaths: string[];
  rowProvenance: Map<string, string[]>;
}

export function defineDataflowGraph(input: FrontierDataflowGraphInput): FrontierDataflowGraph {
  return createDataflowGraph(input);
}

export function defineDataflowNode(input: FrontierDataflowNodeInput): FrontierDataflowNode {
  return normalizeNode(input);
}

export function createDataflowGraph(input: FrontierDataflowGraphInput = {}): FrontierDataflowGraph {
  const nodes = (input.nodes ?? []).map(normalizeNode);
  const sourcePaths = uniqueStrings((input.sourcePaths ?? []).map((path) => normalizeFrontierRegistryPath(path)));
  const outputPaths = uniqueStrings((input.outputPaths ?? []).map((path) => normalizeFrontierRegistryPath(path)));
  for (const node of nodes) {
    if (node.sourcePath) pushUnique(sourcePaths, [node.sourcePath]);
    if (node.outputPath) pushUnique(outputPaths, [node.outputPath]);
  }
  return {
    kind: FRONTIER_DATAFLOW_GRAPH_KIND,
    version: FRONTIER_DATAFLOW_GRAPH_VERSION,
    id: normalizeId(input.id ?? 'dataflow', 'dataflow graph id'),
    ...(input.title ? { title: input.title } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.package ? { package: input.package } : {}),
    ...(input.feature ? { feature: input.feature } : {}),
    ...(input.owner ? { owner: input.owner } : {}),
    nodes,
    sourcePaths,
    outputPaths,
    tags: uniqueStrings(input.tags),
    ...(input.source ? { source: input.source } : {}),
    ...optionalObject('metadata', input.metadata),
    summary: summarizeDataflow(nodes, sourcePaths, outputPaths)
  };
}

export function compileDataflow(graphOrInput: FrontierDataflowGraph | FrontierDataflowGraphInput): FrontierDataflowCompiled {
  const graph = isDataflowGraph(graphOrInput) ? cloneDataflowGraph(graphOrInput) : createDataflowGraph(graphOrInput);
  const nodesById = new Map<string, FrontierDataflowNode>();
  const dependencies = new Map<string, string[]>();
  const dependents = new Map<string, string[]>();
  const nodesBySourcePath = new Map<string, string[]>();
  const nodesByOutputPath = new Map<string, string[]>();
  for (const node of graph.nodes) {
    nodesById.set(node.id, node);
    dependencies.set(node.id, node.inputs.slice());
    if (node.sourcePath) pushMap(nodesBySourcePath, node.sourcePath, node.id);
    if (node.outputPath) pushMap(nodesByOutputPath, node.outputPath, node.id);
    for (const input of node.inputs) pushMap(dependents, input, node.id);
  }
  const validation = validateDataflowGraph(graph);
  const order = validation.valid ? topologicalSort(graph.nodes, dependencies) : graph.nodes.map((node) => node.id);
  return {
    kind: 'frontier.dataflow.compiled',
    version: 1,
    graph,
    nodesById,
    dependenciesById: freezeMapLists(dependencies),
    dependentsById: freezeMapLists(dependents),
    nodesBySourcePath: freezeMapLists(nodesBySourcePath),
    nodesByOutputPath: freezeMapLists(nodesByOutputPath),
    topologicalOrder: order,
    validation,
    get(nodeId) {
      const node = nodesById.get(normalizeId(nodeId, 'dataflow node id'));
      if (!node) throw new TypeError('unknown dataflow node: ' + nodeId);
      return node;
    },
    dependents(nodeId) {
      return (dependents.get(normalizeId(nodeId, 'dataflow node id')) ?? []).map((id) => {
        const node = nodesById.get(id);
        if (!node) throw new TypeError('unknown dataflow node: ' + id);
        return node;
      });
    }
  };
}

export const compileDataflows = compileDataflow;

export function validateDataflowGraph(graphOrInput: FrontierDataflowGraph | FrontierDataflowGraphInput): FrontierDataflowValidation {
  const graph = isDataflowGraph(graphOrInput) ? graphOrInput : createDataflowGraph(graphOrInput);
  const issues: FrontierDataflowValidationIssue[] = [];
  const seen = new Set<string>();
  const nodesById = new Map<string, FrontierDataflowNode>();
  for (const node of graph.nodes) {
    if (seen.has(node.id)) issues.push({ code: 'duplicate-node', message: 'duplicate dataflow node id: ' + node.id, nodeId: node.id, severity: 'error' });
    seen.add(node.id);
    nodesById.set(node.id, node);
    if (node.type === 'source' && !node.sourcePath) issues.push({ code: 'missing-source-path', message: 'source node requires sourcePath', nodeId: node.id, severity: 'error' });
    if (node.type !== 'source' && node.inputs.length === 0) issues.push({ code: 'missing-input', message: 'derived node requires at least one input', nodeId: node.id, severity: 'warning' });
    if (node.type === 'aggregate' && !node.aggregate) issues.push({ code: 'missing-aggregate', message: 'aggregate node requires aggregate spec', nodeId: node.id, severity: 'error' });
    if (node.type === 'groupBy' && !node.groupBy) issues.push({ code: 'missing-group-by', message: 'groupBy node requires groupBy field', nodeId: node.id, severity: 'error' });
  }
  for (const node of graph.nodes) {
    for (const input of node.inputs) {
      if (!nodesById.has(input)) issues.push({ code: 'unknown-input', message: 'node depends on an unknown input: ' + input, nodeId: node.id, targetId: input, severity: 'error' });
    }
  }
  const cycle = findCycle(graph.nodes, new Map(graph.nodes.map((node) => [node.id, node.inputs.slice()])));
  if (cycle.length) issues.push({ code: 'cycle', message: 'dataflow graph contains a cycle: ' + cycle.join(' -> '), nodeId: cycle[0], severity: 'error' });
  return { valid: !issues.some((issue) => issue.severity === 'error'), issues };
}

export function queryDataflowGraph(graphOrCompiled: FrontierDataflowGraph | FrontierDataflowCompiled, query: {
  nodes?: readonly string[];
  types?: readonly string[];
  sourcePaths?: readonly string[];
  outputPaths?: readonly string[];
  tags?: readonly string[];
} = {}): { kind: 'frontier.dataflow.query'; version: 1; ids: string[]; nodes: FrontierDataflowNode[] } {
  const graph = isCompiledDataflow(graphOrCompiled) ? graphOrCompiled.graph : graphOrCompiled;
  const sourcePaths = query.sourcePaths?.map((path) => normalizeFrontierRegistryPath(path));
  const outputPaths = query.outputPaths?.map((path) => normalizeFrontierRegistryPath(path));
  const nodes = graph.nodes.filter((node) => {
    if (query.nodes && !query.nodes.includes(node.id)) return false;
    if (query.types && !query.types.includes(node.type)) return false;
    if (sourcePaths && !sourcePaths.some((path) => node.sourcePath && pathsOverlap(path, node.sourcePath))) return false;
    if (outputPaths && !outputPaths.some((path) => node.outputPath && pathsOverlap(path, node.outputPath))) return false;
    if (query.tags && !overlaps(query.tags, node.tags)) return false;
    return true;
  });
  return { kind: 'frontier.dataflow.query', version: 1, ids: nodes.map((node) => node.id), nodes };
}

export function planDataflowRecompute(
  graphOrCompiled: FrontierDataflowGraph | FrontierDataflowCompiled,
  input: FrontierDataflowPlanInput = {},
  options: { now?: number | (() => number) } = {}
): FrontierDataflowPlan {
  const compiled = isCompiledDataflow(graphOrCompiled) ? graphOrCompiled : compileDataflow(graphOrCompiled);
  const now = readNow(options.now);
  const changedPaths = uniqueStrings([
    ...(input.changedPaths ?? []).map((path) => normalizeFrontierRegistryPath(path)),
    ...(input.patches ?? []).map((patch) => patchPath(patch)).filter((path): path is string => !!path)
  ]);
  const targetNodes = new Set(uniqueStrings(input.targetNodes));
  const stale = new Set<string>();
  const staleSourcePaths = new Set<string>();
  const staleRows: Record<string, string[]> = {};
  const reasons: FrontierDataflowStaleReason[] = [];

  for (const node of compiled.graph.nodes) {
    if (targetNodes.has(node.id)) {
      stale.add(node.id);
      reasons.push({ nodeId: node.id, reason: 'target-node' });
    }
    if (!node.sourcePath) continue;
    for (const changedPath of changedPaths) {
      if (!pathsOverlap(node.sourcePath, changedPath)) continue;
      stale.add(node.id);
      staleSourcePaths.add(node.sourcePath);
      const rowKey = rowKeyFromChangedPath(node.sourcePath, changedPath);
      if (rowKey) addRow(staleRows, node.id, rowKey);
      reasons.push({ nodeId: node.id, sourceNodeId: node.id, changedPath, reason: 'source-path-overlap' });
    }
  }

  const queue = Array.from(stale);
  for (let i = 0; i < queue.length; i++) {
    const nodeId = queue[i];
    for (const dependent of compiled.dependentsById.get(nodeId) ?? []) {
      if (stale.has(dependent)) continue;
      stale.add(dependent);
      queue.push(dependent);
      if (staleRows[nodeId]) staleRows[dependent] = uniqueStrings((staleRows[dependent] ?? []).concat(staleRows[nodeId]));
      reasons.push({ nodeId: dependent, sourceNodeId: nodeId, reason: 'dependency-stale' });
    }
  }

  const staleNodeIds = compiled.topologicalOrder.filter((id) => stale.has(id));
  const staleOutputPaths = uniqueStrings(staleNodeIds.map((id) => compiled.nodesById.get(id)?.outputPath).filter((path): path is string => !!path));
  const budget = computeBudget(compiled, staleNodeIds, staleRows, input.budgetLimit);
  return {
    kind: FRONTIER_DATAFLOW_PLAN_KIND,
    version: FRONTIER_DATAFLOW_PLAN_VERSION,
    id: 'dataflow-plan:' + stableHash([compiled.graph.id, staleNodeIds, changedPaths, now]),
    graphId: compiled.graph.id,
    staleNodeIds,
    staleSourcePaths: Array.from(staleSourcePaths),
    staleOutputPaths,
    staleRows,
    recomputeBudget: budget,
    reasons,
    createdAt: now,
    ...optionalObject('metadata', input.metadata)
  };
}

export const planDataflow = planDataflowRecompute;

export function materializeDataflow(
  graphOrCompiled: FrontierDataflowGraph | FrontierDataflowCompiled,
  state: unknown,
  options: FrontierDataflowMaterializeOptions = {}
): FrontierDataflowMaterialization {
  const compiled = isCompiledDataflow(graphOrCompiled) ? graphOrCompiled : compileDataflow(graphOrCompiled);
  const now = readNow(options.now);
  const targetNodes = new Set(uniqueStrings(options.targetNodes));
  const evaluations = new Map<string, DataflowEvaluation>();
  const valuesByNode: Record<string, JsonValue> = {};
  const provenance: FrontierDataflowProvenanceRecord[] = [];
  const patches: FrontierDataflowPatch[] = [];
  const materializedNodeIds: string[] = [];

  for (const id of compiled.topologicalOrder) {
    const node = compiled.nodesById.get(id);
    if (!node) continue;
    const evaluation = evaluateNode(node, evaluations, state);
    evaluations.set(id, evaluation);
    valuesByNode[id] = cloneJson(evaluation.value);
    if (targetNodes.size === 0 || targetNodes.has(id) || dependsOnTarget(compiled, id, targetNodes)) {
      materializedNodeIds.push(id);
    }
    if (node.outputPath) {
      const previous = options.previous?.valuesByNode[id];
      if (previous === undefined || stableStringify(previous) !== stableStringify(evaluation.value)) {
        patches.push({ op: 'set', path: node.outputPath, value: cloneJson(evaluation.value) });
      }
      provenance.push(...createProvenanceRecords(node, evaluation));
    }
  }

  return {
    kind: FRONTIER_DATAFLOW_MATERIALIZATION_KIND,
    version: FRONTIER_DATAFLOW_MATERIALIZATION_VERSION,
    id: 'dataflow-materialization:' + stableHash([compiled.graph.id, valuesByNode, now]),
    graphId: compiled.graph.id,
    valuesByNode,
    patches,
    provenance,
    recomputeBudget: computeBudget(compiled, materializedNodeIds, {}, undefined),
    createdAt: now,
    ...optionalObject('metadata', options.metadata)
  };
}

export function explainDataflowChange(
  materialization: FrontierDataflowMaterialization,
  input: { nodeId?: string; path?: FrontierRegistryPath | string } = {}
): FrontierDataflowProvenanceRecord[] {
  const path = input.path === undefined ? undefined : normalizeFrontierRegistryPath(input.path);
  return materialization.provenance.filter((record) => {
    if (input.nodeId && record.nodeId !== input.nodeId) return false;
    if (path && (!record.outputPath || !pathsOverlap(record.outputPath, path))) return false;
    return true;
  });
}

export function createDataflowRegistryGraph(
  graphOrCompiled: FrontierDataflowGraph | FrontierDataflowCompiled,
  options: { generatedAt?: number; package?: string; metadata?: JsonObject } = {}
): FrontierRegistryGraph {
  const graph = isCompiledDataflow(graphOrCompiled) ? graphOrCompiled.graph : graphOrCompiled;
  const entries: FrontierRegistryEntry[] = [{
    id: 'dataflow:' + graph.id,
    kind: 'dataflow',
    description: graph.description ?? graph.title,
    package: options.package ?? graph.package,
    feature: graph.feature,
    owner: graph.owner,
    source: graph.source,
    reads: graph.sourcePaths,
    writes: graph.outputPaths,
    calls: graph.nodes.map((node) => 'dataflow-node:' + node.id),
    tags: graph.tags,
    metadata: { summary: toJsonObject(graph.summary) }
  }];
  const edges: FrontierRegistryEdge[] = [];
  for (const node of graph.nodes) {
    entries.push({
      id: 'dataflow-node:' + node.id,
      kind: node.type === 'source' ? 'state' : 'dataflow-node',
      description: node.description ?? node.title,
      package: node.package ?? graph.package,
      feature: node.feature ?? graph.feature,
      owner: node.owner ?? graph.owner,
      source: node.source,
      reads: node.sourcePath ? [node.sourcePath] : node.inputs.map((id) => 'dataflow-node:' + id),
      writes: node.outputPath ? [node.outputPath] : [],
      dependsOn: node.inputs.map((id) => 'dataflow-node:' + id),
      produces: node.outputPath ? [node.outputPath] : [],
      tags: node.tags,
      metadata: { graphId: graph.id, type: node.type, budgetCost: node.budgetCost }
    });
    edges.push({ from: 'dataflow:' + graph.id, to: 'dataflow-node:' + node.id, kind: 'owns' });
    for (const input of node.inputs) edges.push({ from: 'dataflow-node:' + input, to: 'dataflow-node:' + node.id, kind: 'feeds' });
    if (node.sourcePath) edges.push({ from: 'dataflow-node:' + node.id, to: node.sourcePath, kind: 'declares-read' });
    if (node.outputPath) edges.push({ from: 'dataflow-node:' + node.id, to: node.outputPath, kind: 'declares-write' });
  }
  return createFrontierRegistryGraph({ generatedAt: options.generatedAt, entries, edges, metadata: options.metadata });
}

export function traceDataflowImpact(
  graphOrCompiled: FrontierDataflowGraph | FrontierDataflowCompiled,
  input: FrontierRegistryImpactInput = {}
): FrontierRegistryImpact & { graphIds: string[]; nodeIds: string[]; outputPaths: string[] } {
  const compiled = isCompiledDataflow(graphOrCompiled) ? graphOrCompiled : compileDataflow(graphOrCompiled);
  const seedSet = new Set<string>();
  const pathSeeds = new Set<string>();
  for (const id of input.ids ?? []) seedSet.add(id);
  for (const node of input.nodes ?? []) {
    seedSet.add(node);
    pathSeeds.add(normalizeFrontierRegistryPath(node));
  }
  for (const path of input.paths ?? []) pathSeeds.add(normalizeFrontierRegistryPath(path));
  for (const path of pathSeeds) seedSet.add(path);
  const touched = new Set<string>();
  for (const node of compiled.graph.nodes) {
    if (seedSet.has(node.id) || seedSet.has('dataflow-node:' + node.id)) touched.add(node.id);
    else if (input.features?.includes(node.feature ?? compiled.graph.feature ?? '')) touched.add(node.id);
    else if (input.packages?.includes(node.package ?? compiled.graph.package ?? '')) touched.add(node.id);
    else if (input.tags && node.tags.some((tag) => input.tags?.includes(tag))) touched.add(node.id);
    else if (input.files && sources(node.source).some((source) => input.files?.includes(source.file))) touched.add(node.id);
    else if (node.sourcePath && Array.from(pathSeeds).some((path) => pathsOverlap(path, node.sourcePath ?? ''))) touched.add(node.id);
    else if (node.outputPath && Array.from(pathSeeds).some((path) => pathsOverlap(path, node.outputPath ?? ''))) touched.add(node.id);
  }
  const queue = Array.from(touched);
  const direction = input.direction ?? 'both';
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    if (direction !== 'reverse') {
      for (const dependent of compiled.dependentsById.get(id) ?? []) {
        if (!touched.has(dependent)) {
          touched.add(dependent);
          queue.push(dependent);
        }
      }
    }
    if (direction !== 'forward') {
      for (const dependency of compiled.dependenciesById.get(id) ?? []) {
        if (!touched.has(dependency)) {
          touched.add(dependency);
          queue.push(dependency);
        }
      }
    }
  }
  const entries: FrontierRegistryEntry[] = [];
  const edges: FrontierRegistryEdge[] = [];
  if (touched.size) entries.push({ id: 'dataflow:' + compiled.graph.id, kind: 'dataflow', reads: compiled.graph.sourcePaths, writes: compiled.graph.outputPaths, tags: compiled.graph.tags });
  for (const node of compiled.graph.nodes) {
    if (!touched.has(node.id)) continue;
    entries.push({ id: 'dataflow-node:' + node.id, kind: 'dataflow-node', reads: node.sourcePath ? [node.sourcePath] : [], writes: node.outputPath ? [node.outputPath] : [], tags: node.tags });
    for (const inputId of node.inputs) if (touched.has(inputId)) edges.push({ from: 'dataflow-node:' + inputId, to: 'dataflow-node:' + node.id, kind: 'feeds' });
  }
  const visited = new Set<string>(seedSet);
  for (const entry of entries) visited.add(entry.id);
  for (const edge of edges) {
    visited.add(edge.from);
    visited.add(edge.to);
  }
  const nodeIds = compiled.topologicalOrder.filter((id) => touched.has(id));
  return {
    kind: 'frontier.registry.impact',
    version: 1,
    seeds: Array.from(seedSet),
    nodes: Array.from(visited),
    entries,
    records: [],
    edges,
    graphIds: touched.size ? [compiled.graph.id] : [],
    nodeIds,
    outputPaths: uniqueStrings(nodeIds.map((id) => compiled.nodesById.get(id)?.outputPath).filter((path): path is string => !!path))
  };
}

export function encodeDataflowJsonl(values: readonly unknown[]): string {
  return values.map((value) => JSON.stringify(value)).join('\n') + (values.length ? '\n' : '');
}

export function decodeDataflowJsonl(text: string): JsonValue[] {
  return text.split(/\r?\n/).filter((line) => line.trim().length !== 0).map((line) => JSON.parse(line) as JsonValue);
}

export function redactDataflowValue<T extends JsonValue | FrontierDataflowGraph | FrontierDataflowMaterialization>(
  value: T,
  redactions: readonly string[] = ['token', 'secret', 'password', 'authorization', 'cookie', 'credential']
): T {
  return redactValue(value, redactions) as T;
}

export function createDataflowProof(
  value: FrontierDataflowGraph | FrontierDataflowMaterialization,
  options: { generatedAt?: number; metadata?: unknown } = {}
): FrontierDataflowProof {
  const generatedAt = options.generatedAt ?? Date.now();
  const graphId = isDataflowGraph(value) ? value.id : value.graphId;
  return {
    kind: FRONTIER_DATAFLOW_PROOF_KIND,
    version: FRONTIER_DATAFLOW_PROOF_VERSION,
    graphId,
    generatedAt,
    hash: stableHash(redactDataflowValue(value as JsonValue | FrontierDataflowGraph | FrontierDataflowMaterialization)),
    summary: isDataflowGraph(value) ? value.summary : value.recomputeBudget,
    ...(isDataflowGraph(value) ? { validation: validateDataflowGraph(value) } : {}),
    ...optionalObject('metadata', options.metadata)
  };
}

export function createDataflowAutonomousQueueView(
  input: FrontierDataflowAutonomousQueueViewInput = {}
): FrontierDataflowAutonomousQueueView {
  const queueItems = normalizeAutonomousQueueRecords(input.queueItems ?? [], 'queue-item');
  const leases = normalizeAutonomousQueueRecords(input.leases ?? [], 'lease');
  const semanticRows = normalizeAutonomousQueueRecords(input.semanticRows ?? [], 'semantic-row');
  const terminalDecisions = normalizeAutonomousQueueRecords(input.terminalDecisions ?? [], 'terminal-decision');
  const recordsById = new Map<string, FrontierDataflowAutonomousQueueRankedRecord>();
  for (const record of queueItems.concat(leases, semanticRows, terminalDecisions)) {
    const previous = recordsById.get(record.id);
    if (!previous || record.rank > previous.rank || (record.rank === previous.rank && record.sequence > previous.sequence)) {
      recordsById.set(record.id, record);
    }
  }

  const summary = summarizeAutonomousQueueView(Array.from(recordsById.values()), {
    queueItemCount: input.queueItems?.length ?? 0,
    leaseCount: input.leases?.length ?? 0,
    semanticRowCount: input.semanticRows?.length ?? 0,
    terminalDecisionCount: input.terminalDecisions?.length ?? 0
  });

  return {
    kind: FRONTIER_DATAFLOW_AUTONOMOUS_QUEUE_VIEW_KIND,
    version: FRONTIER_DATAFLOW_AUTONOMOUS_QUEUE_VIEW_VERSION,
    id: normalizeId(input.id ?? 'dataflow-autonomous-queue-view', 'dataflow autonomous queue view id'),
    ...(input.title ? { title: input.title } : {}),
    ...(input.description ? { description: input.description } : {}),
    summary,
    ...optionalObject('metadata', input.metadata)
  };
}

export function createDataflowAutonomousQueueUtilization(
  input: FrontierDataflowAutonomousQueueUtilizationInput = {}
): FrontierDataflowAutonomousQueueUtilization {
  const samplesById = new Map<string, FrontierDataflowAutonomousQueueUtilizationRankedSample>();
  const events = normalizeAutonomousQueueUtilizationSamples(input.events ?? [], 'event');
  const snapshotInputs = (input.snapshots ?? []).concat(input.queueSnapshots ?? []);
  const snapshots = normalizeAutonomousQueueUtilizationSamples(snapshotInputs, 'snapshot');
  for (const sample of events.concat(snapshots)) {
    const previous = samplesById.get(sample.id);
    if (!previous || sample.rank > previous.rank || (sample.rank === previous.rank && sample.sequence > previous.sequence)) {
      samplesById.set(sample.id, previous ? mergeAutonomousQueueUtilizationSamples(previous, sample) : sample);
    }
  }

  const samples = Array.from(samplesById.values())
    .sort(compareAutonomousQueueUtilizationSample)
    .map(stripAutonomousQueueUtilizationRankedSample);
  const summary = summarizeAutonomousQueueUtilization(samples, {
    eventCount: input.events?.length ?? 0,
    snapshotCount: snapshotInputs.length
  });

  return {
    kind: FRONTIER_DATAFLOW_AUTONOMOUS_QUEUE_UTILIZATION_KIND,
    version: FRONTIER_DATAFLOW_AUTONOMOUS_QUEUE_UTILIZATION_VERSION,
    id: normalizeId(input.id ?? 'dataflow-autonomous-queue-utilization', 'dataflow autonomous queue utilization id'),
    ...(input.title ? { title: input.title } : {}),
    ...(input.description ? { description: input.description } : {}),
    summary,
    samples,
    ...optionalObject('metadata', input.metadata)
  };
}

export function createDataflowModelRoutingRecommendations(
  input: FrontierDataflowModelRoutingRecommendationsInput = {}
): FrontierDataflowModelRoutingRecommendations {
  const outcomes = normalizeModelRoutingOutcomes(input.outcomes ?? []);
  const windowSize = Math.max(1, Math.floor(input.windowSize ?? 8));
  const minimumSamples = Math.max(1, Math.floor(input.minimumSamples ?? 2));
  const promoteThreshold = clampUnit(input.promoteThreshold ?? 0.7);
  const deprioritizeThreshold = clampUnit(input.deprioritizeThreshold ?? 0.4);
  const outcomesByModel = new Map<string, FrontierDataflowModelRoutingOutcome[]>();
  for (const outcome of outcomes) {
    pushMapObject(outcomesByModel, outcome.modelId, outcome);
  }

  const recommendations = Array.from(outcomesByModel.entries()).map(([modelId, modelOutcomes]) =>
    summarizeModelRoutingRecommendation(modelId, modelOutcomes, {
      windowSize,
      minimumSamples,
      promoteThreshold,
      deprioritizeThreshold
    })
  );
  recommendations.sort(compareModelRoutingRecommendation);

  const summary = summarizeModelRoutingRecommendations(
    recommendations,
    outcomes.length,
    recommendations.reduce((count, recommendation) => count + recommendation.windowedOutcomeCount, 0),
    windowSize,
    minimumSamples
  );

  return {
    kind: FRONTIER_DATAFLOW_MODEL_ROUTING_RECOMMENDATIONS_KIND,
    version: FRONTIER_DATAFLOW_MODEL_ROUTING_RECOMMENDATIONS_VERSION,
    id: normalizeId(input.id ?? 'dataflow-model-routing-recommendations', 'dataflow model routing recommendations id'),
    ...(input.title ? { title: input.title } : {}),
    ...(input.description ? { description: input.description } : {}),
    summary,
    recommendations,
    ...optionalObject('metadata', input.metadata)
  };
}

function normalizeNode(input: FrontierDataflowNodeInput): FrontierDataflowNode {
  const id = normalizeId(input.id, 'dataflow node id');
  const type = input.type ?? inferNodeType(input);
  return {
    kind: FRONTIER_DATAFLOW_NODE_KIND,
    version: FRONTIER_DATAFLOW_NODE_VERSION,
    id,
    title: input.title ?? titleFromId(id),
    ...(input.description ? { description: input.description } : {}),
    type,
    ...(input.sourcePath !== undefined ? { sourcePath: normalizeFrontierRegistryPath(input.sourcePath) } : {}),
    inputs: uniqueStrings((input.inputs ?? (input.input ? [input.input] : []))),
    ...(input.groupBy ? { groupBy: input.groupBy } : {}),
    ...(input.aggregate ? { aggregate: normalizeAggregate(input.aggregate) } : {}),
    ...(input.predicate ? { predicate: normalizePredicate(input.predicate) } : {}),
    ...(input.join ? { join: normalizeJoin(input.join) } : {}),
    ...(input.outputPath !== undefined ? { outputPath: normalizeFrontierRegistryPath(input.outputPath) } : {}),
    budgetCost: Math.max(1, Math.floor(input.budgetCost ?? 1)),
    ...(input.owner ? { owner: input.owner } : {}),
    ...(input.package ? { package: input.package } : {}),
    ...(input.feature ? { feature: input.feature } : {}),
    tags: uniqueStrings(input.tags),
    ...(input.source ? { source: input.source } : {}),
    ...optionalObject('metadata', input.metadata)
  };
}

function normalizeAggregate(input: FrontierDataflowAggregateInput | FrontierDataflowAggregateOp): FrontierDataflowAggregate {
  if (typeof input === 'string') return { op: input };
  return {
    op: input.op ?? 'count',
    ...(input.field ? { field: input.field } : {}),
    ...optionalObject('metadata', input.metadata)
  };
}

function normalizePredicate(input: FrontierDataflowPredicateInput): FrontierDataflowPredicate {
  return {
    ...(input.field ? { field: input.field } : {}),
    ...optionalJsonValue('equals', input.equals),
    ...optionalJsonValue('notEquals', input.notEquals),
    ...(input.in ? { in: input.in.map(toJsonValue) } : {}),
    ...(input.exists !== undefined ? { exists: input.exists } : {}),
    ...optionalObject('metadata', input.metadata)
  };
}

function normalizeJoin(input: FrontierDataflowJoinInput): FrontierDataflowJoin {
  return {
    type: input.type ?? 'object',
    fields: uniqueStrings(input.fields),
    ...optionalObject('metadata', input.metadata)
  };
}

function inferNodeType(input: FrontierDataflowNodeInput): FrontierDataflowNodeType {
  if (input.sourcePath !== undefined && !input.input && !input.inputs?.length) return 'source';
  if (input.predicate) return 'filter';
  if (input.groupBy) return 'groupBy';
  if (input.aggregate) return 'aggregate';
  if ((input.inputs?.length ?? 0) > 1 || input.join) return 'join';
  return input.outputPath ? 'materialized' : 'project';
}

function evaluateNode(node: FrontierDataflowNode, evaluations: ReadonlyMap<string, DataflowEvaluation>, state: unknown): DataflowEvaluation {
  if (node.type === 'source') return evaluateSource(node, state);
  const inputs = node.inputs.map((id) => evaluations.get(id)).filter((value): value is DataflowEvaluation => !!value);
  if (node.type === 'filter') return evaluateFilter(node, inputs[0]);
  if (node.type === 'groupBy') return evaluateGroupBy(node, inputs[0]);
  if (node.type === 'aggregate') return evaluateAggregate(node, inputs[0]);
  if (node.type === 'join') return evaluateJoin(node, inputs);
  if (inputs[0]) return cloneEvaluation(inputs[0]);
  return { value: null, sourcePaths: [], rowProvenance: new Map() };
}

function evaluateSource(node: FrontierDataflowNode, state: unknown): DataflowEvaluation {
  const sourcePath = node.sourcePath ?? '/';
  const value = cloneJson(readPath(state, sourcePath));
  const rowProvenance = collectionRowProvenance(value, sourcePath);
  return { value, sourcePaths: [sourcePath], rowProvenance };
}

function evaluateFilter(node: FrontierDataflowNode, input: DataflowEvaluation | undefined): DataflowEvaluation {
  if (!input) return { value: null, sourcePaths: [], rowProvenance: new Map() };
  const out: JsonObject = {};
  const rowProvenance = new Map<string, string[]>();
  forEachCollection(input.value, (value, key) => {
    if (!matchesPredicate(value, node.predicate)) return;
    out[String(key)] = cloneJson(value);
    rowProvenance.set(String(key), input.rowProvenance.get(String(key)) ?? input.sourcePaths);
  });
  return { value: out, sourcePaths: uniqueStrings(Array.from(rowProvenance.values()).flat()), rowProvenance };
}

function evaluateGroupBy(node: FrontierDataflowNode, input: DataflowEvaluation | undefined): DataflowEvaluation {
  const groupBy = node.groupBy;
  if (!input || !groupBy) return { value: {}, sourcePaths: [], rowProvenance: new Map() };
  const groups: JsonObject = {};
  const rowProvenance = new Map<string, string[]>();
  forEachCollection(input.value, (value, key) => {
    const group = readField(value, groupBy);
    if (group === undefined || group === null) return;
    const groupKey = String(group);
    const existing = Array.isArray(groups[groupKey]) ? groups[groupKey] as JsonValue[] : [];
    existing[existing.length] = cloneJson(value);
    groups[groupKey] = existing;
    rowProvenance.set(groupKey, uniqueStrings((rowProvenance.get(groupKey) ?? []).concat(input.rowProvenance.get(String(key)) ?? input.sourcePaths)));
  });
  return { value: groups, sourcePaths: uniqueStrings(Array.from(rowProvenance.values()).flat()), rowProvenance };
}

function evaluateAggregate(node: FrontierDataflowNode, input: DataflowEvaluation | undefined): DataflowEvaluation {
  if (!input || !node.aggregate) return { value: null, sourcePaths: [], rowProvenance: new Map() };
  if (isPlainObject(input.value) && Object.values(input.value).some(Array.isArray)) {
    const out: JsonObject = {};
    const rowProvenance = new Map<string, string[]>();
    for (const [key, values] of Object.entries(input.value)) {
      const items = Array.isArray(values) ? values : [values];
      out[key] = aggregateValues(items, node.aggregate);
      rowProvenance.set(key, input.rowProvenance.get(key) ?? input.sourcePaths);
    }
    return { value: out, sourcePaths: uniqueStrings(Array.from(rowProvenance.values()).flat()), rowProvenance };
  }
  return {
    value: aggregateValues(collectionValues(input.value), node.aggregate),
    sourcePaths: input.sourcePaths,
    rowProvenance: new Map([['value', input.sourcePaths]])
  };
}

function evaluateJoin(node: FrontierDataflowNode, inputs: readonly DataflowEvaluation[]): DataflowEvaluation {
  if (inputs.length === 0) return { value: {}, sourcePaths: [], rowProvenance: new Map() };
  const fields = node.join?.fields.length ? node.join.fields : node.inputs;
  if (node.join?.type === 'merge') {
    const merged: JsonObject = {};
    const rowProvenance = new Map<string, string[]>();
    for (let i = 0; i < inputs.length; i++) {
      const value = inputs[i].value;
      if (isPlainObject(value)) {
        for (const [key, item] of Object.entries(value)) {
          merged[key] = item;
          rowProvenance.set(key, uniqueStrings((rowProvenance.get(key) ?? []).concat(inputs[i].rowProvenance.get(key) ?? inputs[i].sourcePaths)));
        }
      }
    }
    return { value: merged, sourcePaths: uniqueStrings(Array.from(rowProvenance.values()).flat()), rowProvenance };
  }
  const keys = new Set<string>();
  for (const input of inputs) {
    if (isPlainObject(input.value)) for (const key of Object.keys(input.value)) keys.add(key);
  }
  const out: JsonObject = {};
  const rowProvenance = new Map<string, string[]>();
  for (const key of keys) {
    const row: JsonObject = {};
    const paths: string[] = [];
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      if (!input) continue;
      const field = fields[i] ?? node.inputs[i] ?? 'input' + i;
      const value = isPlainObject(input.value) ? input.value[key] : null;
      row[field] = cloneJson(value ?? null);
      pushUnique(paths, input.rowProvenance.get(key) ?? input.sourcePaths);
    }
    out[key] = row;
    rowProvenance.set(key, paths);
  }
  return { value: out, sourcePaths: uniqueStrings(Array.from(rowProvenance.values()).flat()), rowProvenance };
}

function aggregateValues(values: readonly JsonValue[], aggregate: FrontierDataflowAggregate): JsonValue {
  if (aggregate.op === 'count') return values.length;
  let count = 0;
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    const fieldValue = aggregate.field ? readField(value, aggregate.field) : value;
    const number = typeof fieldValue === 'number' && Number.isFinite(fieldValue) ? fieldValue : 0;
    if (typeof fieldValue === 'number' && Number.isFinite(fieldValue)) count++;
    sum += number;
    min = Math.min(min, number);
    max = Math.max(max, number);
  }
  if (aggregate.op === 'sum') return sum;
  if (aggregate.op === 'avg') return count === 0 ? 0 : sum / count;
  if (aggregate.op === 'min') return min === Infinity ? null : min;
  if (aggregate.op === 'max') return max === -Infinity ? null : max;
  return null;
}

function createProvenanceRecords(node: FrontierDataflowNode, evaluation: DataflowEvaluation): FrontierDataflowProvenanceRecord[] {
  if (!node.outputPath) return [];
  const records: FrontierDataflowProvenanceRecord[] = [{
    nodeId: node.id,
    outputPath: node.outputPath,
    sourcePaths: evaluation.sourcePaths,
    inputNodeIds: node.inputs,
    reason: node.type
  }];
  for (const [rowKey, sourcePaths] of evaluation.rowProvenance) {
    records.push({
      nodeId: node.id,
      outputPath: joinPath(node.outputPath, rowKey),
      sourcePaths,
      inputNodeIds: node.inputs,
      reason: node.type + ':row',
      rowKey
    });
  }
  return records;
}

function computeBudget(
  compiled: FrontierDataflowCompiled,
  nodeIds: readonly string[],
  rows: Record<string, string[]>,
  limit: number | undefined
): FrontierDataflowRecomputeBudget {
  const rowCount = Object.values(rows).reduce((count, list) => count + list.length, 0);
  const estimatedCost = nodeIds.reduce((cost, id) => cost + (compiled.nodesById.get(id)?.budgetCost ?? 1), 0) * Math.max(1, rowCount || 1);
  return {
    nodeCount: nodeIds.length,
    rowCount,
    estimatedCost,
    withinLimit: limit === undefined || estimatedCost <= limit,
    ...(limit !== undefined ? { limit } : {})
  };
}

function topologicalSort(nodes: readonly FrontierDataflowNode[], dependencies: ReadonlyMap<string, readonly string[]>): string[] {
  const out: string[] = [];
  const temporary = new Set<string>();
  const permanent = new Set<string>();
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visit = (id: string): void => {
    if (permanent.has(id) || temporary.has(id)) return;
    temporary.add(id);
    for (const dependency of dependencies.get(id) ?? []) if (byId.has(dependency)) visit(dependency);
    temporary.delete(id);
    permanent.add(id);
    out.push(id);
  };
  for (const node of nodes) visit(node.id);
  return out;
}

function findCycle(nodes: readonly FrontierDataflowNode[], dependencies: ReadonlyMap<string, readonly string[]>): string[] {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Set(nodes.map((node) => node.id));
  const path: string[] = [];
  const visit = (id: string): string[] => {
    if (visiting.has(id)) return path.slice(path.indexOf(id)).concat(id);
    if (visited.has(id)) return [];
    visiting.add(id);
    path.push(id);
    for (const dependency of dependencies.get(id) ?? []) {
      if (!byId.has(dependency)) continue;
      const cycle = visit(dependency);
      if (cycle.length) return cycle;
    }
    path.pop();
    visiting.delete(id);
    visited.add(id);
    return [];
  };
  for (const node of nodes) {
    const cycle = visit(node.id);
    if (cycle.length) return cycle;
  }
  return [];
}

function summarizeDataflow(nodes: readonly FrontierDataflowNode[], sourcePaths: readonly string[], outputPaths: readonly string[]): FrontierDataflowSummary {
  return {
    nodeCount: nodes.length,
    sourceCount: nodes.filter((node) => node.type === 'source').length,
    filterCount: nodes.filter((node) => node.type === 'filter').length,
    aggregateCount: nodes.filter((node) => node.type === 'aggregate').length,
    joinCount: nodes.filter((node) => node.type === 'join').length,
    materializedCount: nodes.filter((node) => !!node.outputPath).length,
    sourcePathCount: sourcePaths.length,
    outputPathCount: outputPaths.length,
    budgetCost: nodes.reduce((sum, node) => sum + node.budgetCost, 0)
  };
}

function dependsOnTarget(compiled: FrontierDataflowCompiled, id: string, targetNodes: ReadonlySet<string>): boolean {
  if (targetNodes.size === 0 || targetNodes.has(id)) return true;
  const dependencies = compiled.dependenciesById.get(id) ?? [];
  return dependencies.some((dependency) => dependsOnTarget(compiled, dependency, targetNodes));
}

function patchPath(input: FrontierDataflowPatchInput | readonly unknown[]): string | undefined {
  if (isPatchTuple(input)) {
    const path = input[1];
    if (Array.isArray(path)) return normalizeFrontierRegistryPath(path.map(String));
    if (typeof path === 'string') return normalizeFrontierRegistryPath(path);
    return undefined;
  }
  return input.path === undefined ? undefined : normalizeFrontierRegistryPath(input.path);
}

function isPatchTuple(input: FrontierDataflowPatchInput | readonly unknown[]): input is readonly unknown[] {
  return Array.isArray(input);
}

function rowKeyFromChangedPath(sourcePath: string, changedPath: string): string | undefined {
  const source = splitPath(sourcePath);
  const changed = splitPath(changedPath);
  return changed.length > source.length ? changed[source.length] : undefined;
}

function addRow(rows: Record<string, string[]>, nodeId: string, rowKey: string): void {
  rows[nodeId] = uniqueStrings((rows[nodeId] ?? []).concat(rowKey));
}

function pathsOverlap(left: string, right: string): boolean {
  if (left === right) return true;
  const a = normalizeFrontierRegistryPath(left);
  const b = normalizeFrontierRegistryPath(right);
  return b.startsWith(a.endsWith('/') ? a : a + '/') || a.startsWith(b.endsWith('/') ? b : b + '/');
}

function readPath(value: unknown, path: string): JsonValue {
  const parts = splitPath(path);
  let current: unknown = value;
  for (const part of parts) {
    if (Array.isArray(current)) current = current[Number(part)];
    else if (isRecord(current)) current = current[part];
    else return null;
  }
  return toJsonValue(current);
}

function readField(value: unknown, field: string): JsonValue | undefined {
  let current: unknown = value;
  for (const part of field.split('.')) {
    if (Array.isArray(current)) current = current[Number(part)];
    else if (isRecord(current)) current = current[part];
    else return undefined;
  }
  return toJsonValue(current);
}

function splitPath(path: string): string[] {
  return normalizeFrontierRegistryPath(path).split('/').slice(1).map(unescapePointerSegment);
}

function joinPath(base: string, segment: string): string {
  return normalizeFrontierRegistryPath(base).replace(/\/$/, '') + '/' + escapePointerSegment(segment);
}

function escapePointerSegment(segment: string): string {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}

function unescapePointerSegment(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

function matchesPredicate(value: JsonValue, predicate: FrontierDataflowPredicate | undefined): boolean {
  if (!predicate) return true;
  const fieldValue = predicate.field ? readField(value, predicate.field) : value;
  if (predicate.exists !== undefined && (fieldValue !== undefined && fieldValue !== null) !== predicate.exists) return false;
  if (predicate.equals !== undefined && stableStringify(fieldValue ?? null) !== stableStringify(predicate.equals)) return false;
  if (predicate.notEquals !== undefined && stableStringify(fieldValue ?? null) === stableStringify(predicate.notEquals)) return false;
  if (predicate.in && !predicate.in.some((item) => stableStringify(item) === stableStringify(fieldValue ?? null))) return false;
  return true;
}

function forEachCollection(value: JsonValue, callback: (value: JsonValue, key: string | number) => void): void {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) callback(value[i], i);
  } else if (isPlainObject(value)) {
    for (const [key, item] of Object.entries(value)) callback(item, key);
  }
}

function collectionValues(value: JsonValue): JsonValue[] {
  if (Array.isArray(value)) return value;
  if (isPlainObject(value)) return Object.values(value);
  return value === null ? [] : [value];
}

function collectionRowProvenance(value: JsonValue, sourcePath: string): Map<string, string[]> {
  const rows = new Map<string, string[]>();
  forEachCollection(value, (_item, key) => rows.set(String(key), [joinPath(sourcePath, String(key))]));
  if (rows.size === 0) rows.set('value', [sourcePath]);
  return rows;
}

function cloneEvaluation(input: DataflowEvaluation): DataflowEvaluation {
  return {
    value: cloneJson(input.value),
    sourcePaths: input.sourcePaths.slice(),
    rowProvenance: new Map(Array.from(input.rowProvenance, ([key, values]) => [key, values.slice()]))
  };
}

function isDataflowGraph(value: unknown): value is FrontierDataflowGraph {
  return isRecord(value) && value.kind === FRONTIER_DATAFLOW_GRAPH_KIND;
}

function isCompiledDataflow(value: unknown): value is FrontierDataflowCompiled {
  return isRecord(value) && value.kind === 'frontier.dataflow.compiled';
}

function cloneDataflowGraph(graph: FrontierDataflowGraph): FrontierDataflowGraph {
  return cloneJson(toJsonValue(graph)) as unknown as FrontierDataflowGraph;
}

function toJsonObject(value: unknown): JsonObject {
  const json = toJsonValue(value);
  return isPlainObject(json) ? json : {};
}

function toJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (isRecord(value)) {
    const out: JsonObject = {};
    for (const [key, item] of Object.entries(value)) {
      const json = toJsonValue(item);
      if (json !== undefined) out[key] = json;
    }
    return out;
  }
  return null;
}

function optionalObject<K extends string>(key: K, value: unknown): Partial<Record<K, JsonObject>> {
  if (value === undefined) return {};
  const json = toJsonObject(value);
  return Object.keys(json).length || isRecord(value) ? { [key]: json } as Partial<Record<K, JsonObject>> : {};
}

function optionalJsonValue<K extends string>(key: K, value: unknown): Partial<Record<K, JsonValue>> {
  if (value === undefined) return {};
  return { [key]: toJsonValue(value) } as Partial<Record<K, JsonValue>>;
}

function redactValue(value: unknown, redactions: readonly string[]): JsonValue {
  if (Array.isArray(value)) return value.map((item) => redactValue(item, redactions));
  if (!isRecord(value)) return toJsonValue(value);
  const out: JsonObject = {};
  for (const [key, item] of Object.entries(value)) {
    if (redactions.some((pattern) => key.toLowerCase().includes(pattern.toLowerCase()))) out[key] = '[redacted]';
    else out[key] = redactValue(item, redactions);
  }
  return out;
}

function normalizeId(value: string, label: string): string {
  const id = String(value ?? '').trim();
  if (!id) throw new TypeError(label + ' must be a non-empty string');
  return id;
}

function uniqueStrings(values: readonly (string | undefined | null)[] | undefined): string[] {
  const out: string[] = [];
  if (!values) return out;
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const normalized = value.trim();
    if (normalized && !out.includes(normalized)) out.push(normalized);
  }
  return out;
}

function pushUnique(target: string[], values: readonly string[]): void {
  for (const value of values) if (!target.includes(value)) target.push(value);
}

function pushMap(map: Map<string, string[]>, key: string, value: string): void {
  const list = map.get(key);
  if (list) {
    if (!list.includes(value)) list.push(value);
  } else {
    map.set(key, [value]);
  }
}

function pushMapObject<T>(map: Map<string, T[]>, key: string, value: T): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

function freezeMapLists(map: Map<string, string[]>): ReadonlyMap<string, readonly string[]> {
  return new Map(Array.from(map, ([key, values]) => [key, Object.freeze(values.slice())]));
}

function overlaps(left: readonly string[], right: readonly string[]): boolean {
  return left.some((value) => right.includes(value));
}

function titleFromId(id: string): string {
  const last = id.split(/[./:-]/).filter(Boolean).pop() ?? id;
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/[-_]/g, ' ');
}

function readNow(now: number | (() => number) | undefined): number {
  return typeof now === 'function' ? now() : now ?? Date.now();
}

function sources(source: FrontierRegistrySource | undefined): FrontierDataflowSourceInput[] {
  if (!source) return [];
  return Array.isArray(source) ? source as FrontierDataflowSourceInput[] : [source as FrontierDataflowSourceInput];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stableHash(value: unknown): string {
  const text = stableStringify(toJsonValue(value));
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function stableStringify(value: JsonValue): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map((key) => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
}

type FrontierDataflowAutonomousQueueSource = 'queue-item' | 'lease' | 'semantic-row' | 'terminal-decision';
type FrontierDataflowAutonomousQueueLane = 'active' | 'queued' | 'draining' | 'drained' | 'rerun' | 'conflicted' | 'humanQuestion' | 'retired';
type FrontierDataflowAutonomousQueueUtilizationSourceRank = 1 | 2;

interface FrontierDataflowAutonomousQueueRankedRecord {
  id: string;
  lane: FrontierDataflowAutonomousQueueLane;
  source: FrontierDataflowAutonomousQueueSource;
  rank: number;
  sequence: number;
}

interface FrontierDataflowAutonomousQueueUtilizationRankedSample {
  id: string;
  kind: FrontierDataflowAutonomousQueueUtilizationSource;
  observedAt?: number;
  sortObservedAt: number;
  active: number;
  queued: number;
  draining: number;
  drained: number;
  rerun: number;
  conflicted: number;
  humanQuestion: number;
  retired: number;
  liveCount: number;
  totalCount: number;
  capacity?: number;
  utilization: number;
  metadata?: JsonObject;
  rank: FrontierDataflowAutonomousQueueUtilizationSourceRank;
  sequence: number;
}

function normalizeAutonomousQueueRecords(
  records: readonly FrontierDataflowAutonomousQueueRecordInput[],
  source: FrontierDataflowAutonomousQueueSource
): FrontierDataflowAutonomousQueueRankedRecord[] {
  const out: FrontierDataflowAutonomousQueueRankedRecord[] = [];
  for (let index = 0; index < records.length; index++) {
    const record = records[index];
    out.push(normalizeAutonomousQueueRecord(record, source, index, out.length));
  }
  return out;
}

function normalizeAutonomousQueueUtilizationSamples(
  records: readonly FrontierDataflowAutonomousQueueUtilizationSampleInput[],
  kind: FrontierDataflowAutonomousQueueUtilizationSource
): FrontierDataflowAutonomousQueueUtilizationRankedSample[] {
  const out: FrontierDataflowAutonomousQueueUtilizationRankedSample[] = [];
  for (let index = 0; index < records.length; index++) {
    out.push(normalizeAutonomousQueueUtilizationSample(records[index], kind, index, out.length));
  }
  return out;
}

function normalizeAutonomousQueueUtilizationSample(
  record: FrontierDataflowAutonomousQueueUtilizationSampleInput,
  kind: FrontierDataflowAutonomousQueueUtilizationSource,
  index: number,
  sequence: number
): FrontierDataflowAutonomousQueueUtilizationRankedSample {
  const view = createDataflowAutonomousQueueView({
    queueItems: record.queueItems,
    leases: record.leases,
    semanticRows: record.semanticRows,
    terminalDecisions: record.terminalDecisions
  });
  const observedAt = firstNumber(record.observedAt, record.timestamp, record.time);
  const active = countOr(record.active, record.activeCount, view.summary.active);
  const queued = countOr(record.queued, record.queuedCount, view.summary.queued);
  const draining = countOr(record.draining, record.drainingCount, view.summary.draining);
  const drained = countOr(record.drained, record.drainedCount, view.summary.drained);
  const rerun = countOr(record.rerun, record.rerunCount, view.summary.rerun);
  const conflicted = countOr(record.conflicted, record.conflictedCount, view.summary.conflicted);
  const humanQuestion = countOr(record.humanQuestion, record.humanQuestionCount, view.summary.humanQuestion);
  const retired = countOr(record.retired, record.retiredCount, view.summary.retired);
  const liveCount = countOr(record.liveCount, active + queued + draining, view.summary.liveCount);
  const totalCount = countOr(record.total, record.totalCount, active + queued + draining + drained + rerun + conflicted + humanQuestion + retired, view.summary.totalCount);
  const capacity = firstNumber(record.capacity);
  const rank: FrontierDataflowAutonomousQueueUtilizationSourceRank = kind === 'snapshot' ? 2 : 1;
  const denominator = Math.max(
    firstPositiveNumber(capacity, totalCount) ?? 0,
    liveCount,
    1
  );
  return {
    id: normalizeId(firstString(record.id, kind + ':' + index), 'dataflow autonomous queue utilization sample id'),
    kind,
    ...(observedAt !== undefined ? { observedAt } : {}),
    sortObservedAt: observedAt ?? Number.POSITIVE_INFINITY,
    active,
    queued,
    draining,
    drained,
    rerun,
    conflicted,
    humanQuestion,
    retired,
    liveCount,
    totalCount,
    ...(capacity !== undefined ? { capacity } : {}),
    utilization: liveCount / denominator,
    ...optionalObject('metadata', record.metadata),
    rank,
    sequence
  };
}

function mergeAutonomousQueueUtilizationSamples(
  previous: FrontierDataflowAutonomousQueueUtilizationRankedSample,
  next: FrontierDataflowAutonomousQueueUtilizationRankedSample
): FrontierDataflowAutonomousQueueUtilizationRankedSample {
  const observedAt = next.observedAt ?? previous.observedAt;
  const sortObservedAt = observedAt ?? previous.sortObservedAt;
  return {
    ...previous,
    ...next,
    ...(observedAt !== undefined ? { observedAt } : {}),
    sortObservedAt,
    utilization: next.utilization,
    rank: next.rank > previous.rank ? next.rank : previous.rank,
    sequence: next.sequence
  };
}

function stripAutonomousQueueUtilizationRankedSample(
  sample: FrontierDataflowAutonomousQueueUtilizationRankedSample
): FrontierDataflowAutonomousQueueUtilizationSample {
  const { sortObservedAt: _sortObservedAt, rank: _rank, sequence: _sequence, ...out } = sample;
  return out;
}

function compareAutonomousQueueUtilizationSample(
  left: FrontierDataflowAutonomousQueueUtilizationRankedSample,
  right: FrontierDataflowAutonomousQueueUtilizationRankedSample
): number {
  if (left.sortObservedAt !== right.sortObservedAt) return left.sortObservedAt - right.sortObservedAt;
  if (left.rank !== right.rank) return left.rank - right.rank;
  return left.sequence - right.sequence;
}

function summarizeAutonomousQueueUtilization(
  samples: readonly FrontierDataflowAutonomousQueueUtilizationSample[],
  counts: { eventCount: number; snapshotCount: number }
): FrontierDataflowAutonomousQueueUtilizationSummary {
  let minUtilization = Number.POSITIVE_INFINITY;
  let maxUtilization = Number.NEGATIVE_INFINITY;
  let totalUtilization = 0;
  let peakObservedAt: number | undefined;
  let peakUtilization = Number.NEGATIVE_INFINITY;
  let earliestObservedAt: number | undefined;
  let latestObservedAt: number | undefined;
  for (const sample of samples) {
    minUtilization = Math.min(minUtilization, sample.utilization);
    maxUtilization = Math.max(maxUtilization, sample.utilization);
    totalUtilization += sample.utilization;
    if (sample.observedAt !== undefined) {
      if (earliestObservedAt === undefined || sample.observedAt < earliestObservedAt) earliestObservedAt = sample.observedAt;
      if (latestObservedAt === undefined || sample.observedAt > latestObservedAt) latestObservedAt = sample.observedAt;
      if (sample.utilization >= peakUtilization) {
        peakUtilization = sample.utilization;
        peakObservedAt = sample.observedAt;
      }
    }
  }
  if (samples.length === 0) {
    minUtilization = 0;
    maxUtilization = 0;
    peakUtilization = 0;
  }
  return {
    sampleCount: samples.length,
    eventCount: counts.eventCount,
    snapshotCount: counts.snapshotCount,
    ...(earliestObservedAt !== undefined ? { earliestObservedAt } : {}),
    ...(latestObservedAt !== undefined ? { latestObservedAt } : {}),
    minUtilization: minUtilization === Number.POSITIVE_INFINITY ? 0 : minUtilization,
    averageUtilization: samples.length === 0 ? 0 : totalUtilization / samples.length,
    maxUtilization: maxUtilization === Number.NEGATIVE_INFINITY ? 0 : maxUtilization,
    latestUtilization: samples.length ? samples[samples.length - 1].utilization : 0,
    peakUtilization: peakUtilization === Number.NEGATIVE_INFINITY ? 0 : peakUtilization,
    ...(peakObservedAt !== undefined ? { peakObservedAt } : {})
  };
}

function countOr(...values: unknown[]): number {
  for (const value of values) {
    const number = firstNumber(value);
    if (number !== undefined) return number;
  }
  return 0;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

function firstPositiveNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  }
  return undefined;
}

function normalizeAutonomousQueueRecord(
  record: FrontierDataflowAutonomousQueueRecordInput,
  source: FrontierDataflowAutonomousQueueSource,
  index: number,
  sequence: number
): FrontierDataflowAutonomousQueueRankedRecord {
  const id = autonomousQueueRecordId(record, source, index);
  const lane = autonomousQueueRecordLane(record, source);
  return {
    id,
    lane,
    source,
    rank: autonomousQueueSourceRank(source) * 10 + autonomousQueueLaneRank(lane),
    sequence
  };
}

function summarizeAutonomousQueueView(
  records: readonly FrontierDataflowAutonomousQueueRankedRecord[],
  sourceCounts: {
    queueItemCount: number;
    leaseCount: number;
    semanticRowCount: number;
    terminalDecisionCount: number;
  }
): FrontierDataflowAutonomousQueueViewSummary {
  const summary: FrontierDataflowAutonomousQueueViewSummary = {
    totalCount: records.length,
    liveCount: 0,
    historicalCount: 0,
    active: 0,
    queued: 0,
    draining: 0,
    drained: 0,
    rerun: 0,
    conflicted: 0,
    humanQuestion: 0,
    retired: 0,
    queueItemCount: sourceCounts.queueItemCount,
    leaseCount: sourceCounts.leaseCount,
    semanticRowCount: sourceCounts.semanticRowCount,
    terminalDecisionCount: sourceCounts.terminalDecisionCount
  };

  for (const record of records) {
    if (record.lane === 'active') summary.active++;
    else if (record.lane === 'queued') summary.queued++;
    else if (record.lane === 'draining') summary.draining++;
    else if (record.lane === 'drained') summary.drained++;
    else if (record.lane === 'rerun') summary.rerun++;
    else if (record.lane === 'conflicted') summary.conflicted++;
    else if (record.lane === 'humanQuestion') summary.humanQuestion++;
    else if (record.lane === 'retired') summary.retired++;
    if (record.lane === 'active' || record.lane === 'queued' || record.lane === 'draining') summary.liveCount++;
    else summary.historicalCount++;
  }

  return summary;
}

function autonomousQueueRecordId(
  record: FrontierDataflowAutonomousQueueRecordInput,
  source: FrontierDataflowAutonomousQueueSource,
  index: number
): string {
  return firstString(
    record.queueItemId,
    record.leaseId,
    record.semanticRowId,
    record.decisionId,
    record.taskId,
    record.id,
    source + ':' + index
  );
}

function autonomousQueueRecordLane(
  record: FrontierDataflowAutonomousQueueRecordInput,
  source: FrontierDataflowAutonomousQueueSource
): FrontierDataflowAutonomousQueueLane {
  const text = autonomousQueueText(record);
  const hasQuestion = autonomousQueueHasQuestion(record);
  if (autonomousQueueHasAny(text, ['retired', 'archived', 'superseded', 'obsolete', 'withdrawn', 'canceled', 'cancelled', 'abandoned', 'tombstoned'])) {
    return 'retired';
  }
  if (hasQuestion) return 'humanQuestion';
  if (autonomousQueueHasAny(text, ['conflict', 'conflicted', 'merge-conflict', 'blocked-by-conflict', 'conflict-blocked', 'conflict blocked'])) {
    return 'conflicted';
  }
  if (autonomousQueueHasAny(text, ['rerun', 'retry', 'revalidate', 'stale', 'repair', 'missing-evidence', 'missing evidence', 'failed-gate', 'failed gate', 'failed-apply', 'failed apply', 'head-changed', 'head changed', 'current-head', 'current head'])) {
    return 'rerun';
  }
  if (autonomousQueueHasAny(text, ['drained', 'done', 'completed', 'complete', 'applied', 'merged', 'finished', 'closed', 'successful', 'success', 'resolved', 'accepted', 'committed', 'landed'])) {
    return 'drained';
  }
  if (autonomousQueueHasAny(text, ['human-question', 'human question', 'human-blocked', 'human blocked', 'question', 'needs-human', 'needs human']) || autonomousQueueHasAny(text, ['draining', 'drain', 'review', 'coordinator-review', 'review-debt', 'repair', 'blocked', 'processing', 'working', 'running', 'in-flight', 'inflight', 'lease', 'leased'])) {
    return 'draining';
  }
  if (autonomousQueueHasAny(text, ['active', 'running', 'working', 'processing', 'leased', 'busy', 'executing', 'in-flight', 'inflight'])) {
    return 'active';
  }
  if (autonomousQueueHasAny(text, ['queued', 'ready', 'pending', 'waiting', 'backlog', 'scheduled', 'enqueued', 'available', 'reserved'])) {
    return 'queued';
  }
  if (source === 'terminal-decision') return 'drained';
  if (source === 'semantic-row') return 'draining';
  if (source === 'lease') return 'active';
  return 'queued';
}

function autonomousQueueSourceRank(source: FrontierDataflowAutonomousQueueSource): number {
  if (source === 'terminal-decision') return 4;
  if (source === 'semantic-row') return 3;
  if (source === 'lease') return 2;
  return 1;
}

function autonomousQueueLaneRank(lane: FrontierDataflowAutonomousQueueLane): number {
  if (lane === 'retired') return 8;
  if (lane === 'humanQuestion') return 7;
  if (lane === 'conflicted') return 6;
  if (lane === 'rerun') return 5;
  if (lane === 'drained') return 4;
  if (lane === 'draining') return 3;
  if (lane === 'active') return 2;
  return 1;
}

function autonomousQueueText(record: FrontierDataflowAutonomousQueueRecordInput): string {
  return [
    record.status,
    record.state,
    record.phase,
    record.lane,
    record.decision,
    record.terminalDecision,
    record.result,
    record.outcome,
    record.type,
    record.reason,
    record.summary,
    record.note,
    record.message
  ]
    .map(autonomousQueueTextPart)
    .filter((value): value is string => !!value)
    .join(' ')
    .toLowerCase();
}

function autonomousQueueTextPart(value: unknown): string {
  if (typeof value === 'string') return value.trim().replace(/[\s_]+/g, '-').toLowerCase();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim().toLowerCase();
  return '';
}

function autonomousQueueHasQuestion(record: FrontierDataflowAutonomousQueueRecordInput): boolean {
  return autonomousQueueIsPresent(record.question) || autonomousQueueIsPresent(record.humanQuestion) || autonomousQueueIsPresent(record.questionId) || autonomousQueueIsPresent(record.questionCode);
}

function autonomousQueueHasAny(text: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function autonomousQueueIsPresent(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  return value !== undefined && value !== null && value !== false;
}

function normalizeModelRoutingOutcomes(
  outcomes: readonly FrontierDataflowModelRoutingOutcomeInput[]
): FrontierDataflowModelRoutingOutcome[] {
  const out: FrontierDataflowModelRoutingOutcome[] = [];
  for (let index = 0; index < outcomes.length; index++) {
    out.push(normalizeModelRoutingOutcome(outcomes[index], index));
  }
  return out;
}

function normalizeModelRoutingOutcome(
  outcome: FrontierDataflowModelRoutingOutcomeInput,
  index: number
): FrontierDataflowModelRoutingOutcome {
  const modelId = normalizeId(outcome.modelId ?? 'model:' + index, 'model routing outcome model id');
  const status = compactModelRoutingTextPart(outcome.status, outcome.result, outcome.decision, outcome.outcome, outcome.recommendation) || undefined;
  return {
    id: normalizeId(outcome.id ?? modelId + ':' + index, 'model routing outcome id'),
    modelId,
    ...(status ? { status } : {}),
    ...optionalBoolean('success', modelRoutingOutcomeSuccess(outcome)),
    ...optionalNumber('score', outcome.score),
    ...optionalNumber('latencyMs', outcome.latencyMs),
    ...optionalNumber('costUsd', outcome.costUsd),
    ...optionalNumber('observedAt', outcome.observedAt),
    ...optionalObject('metadata', outcome.metadata)
  };
}

function summarizeModelRoutingRecommendation(
  modelId: string,
  outcomes: readonly FrontierDataflowModelRoutingOutcome[],
  options: {
    windowSize: number;
    minimumSamples: number;
    promoteThreshold: number;
    deprioritizeThreshold: number;
  }
): FrontierDataflowModelRoutingRecommendation {
  const sorted = outcomes.slice().sort(compareModelRoutingOutcome);
  const windowed = sorted.slice(Math.max(0, sorted.length - options.windowSize));
  const successCount = windowed.filter((outcome) => outcome.success === true).length;
  const failureCount = Math.max(0, windowed.length - successCount);
  const successRate = windowed.length === 0 ? 0 : successCount / windowed.length;
  const averageScore = average(windowed.map((outcome) => outcome.score));
  const averageLatencyMs = average(windowed.map((outcome) => outcome.latencyMs));
  const averageCostUsd = average(windowed.map((outcome) => outcome.costUsd));
  const signal = rollingSignal(windowed, successRate, averageScore);
  const trend = modelRoutingTrend(windowed, successRate, averageScore);
  const recommendation = modelRoutingRecommendation(signal, trend, windowed.length, options);
  const reason = modelRoutingReason({
    recommendation,
    trend,
    signal,
    successCount,
    windowedOutcomeCount: windowed.length,
    minimumSamples: options.minimumSamples,
    promoteThreshold: options.promoteThreshold,
    deprioritizeThreshold: options.deprioritizeThreshold,
    usesScore: windowed.some((outcome) => outcome.score !== undefined)
  });

  return {
    modelId,
    outcomeCount: sorted.length,
    windowedOutcomeCount: windowed.length,
    successCount,
    failureCount,
    successRate,
    averageScore,
    averageLatencyMs,
    averageCostUsd,
    trend,
    recommendation,
    reason,
    ...(windowed.length ? { lastObservedAt: windowed[windowed.length - 1].observedAt } : {}),
    ...optionalObject('metadata', aggregateModelRoutingMetadata(windowed))
  };
}

function summarizeModelRoutingRecommendations(
  recommendations: readonly FrontierDataflowModelRoutingRecommendation[],
  outcomeCount: number,
  windowedOutcomeCount: number,
  windowSize: number,
  minimumSamples: number
): FrontierDataflowModelRoutingRecommendationsSummary {
  return {
    modelCount: recommendations.length,
    outcomeCount,
    windowedOutcomeCount,
    windowSize,
    minimumSamples,
    promoteCount: recommendations.filter((recommendation) => recommendation.recommendation === 'promote').length,
    holdCount: recommendations.filter((recommendation) => recommendation.recommendation === 'hold').length,
    deprioritizeCount: recommendations.filter((recommendation) => recommendation.recommendation === 'deprioritize').length
  };
}

function compareModelRoutingRecommendation(
  left: FrontierDataflowModelRoutingRecommendation,
  right: FrontierDataflowModelRoutingRecommendation
): number {
  const leftRank = modelRoutingVerdictRank(left.recommendation);
  const rightRank = modelRoutingVerdictRank(right.recommendation);
  if (leftRank !== rightRank) return leftRank - rightRank;
  if (right.averageScore !== left.averageScore) return right.averageScore - left.averageScore;
  if (right.successRate !== left.successRate) return right.successRate - left.successRate;
  return left.modelId.localeCompare(right.modelId);
}

function compareModelRoutingOutcome(left: FrontierDataflowModelRoutingOutcome, right: FrontierDataflowModelRoutingOutcome): number {
  const leftObservedAt = left.observedAt ?? -Infinity;
  const rightObservedAt = right.observedAt ?? -Infinity;
  if (leftObservedAt !== rightObservedAt) return leftObservedAt - rightObservedAt;
  return left.id.localeCompare(right.id);
}

function modelRoutingVerdictRank(verdict: FrontierDataflowModelRoutingRecommendationVerdict): number {
  if (verdict === 'promote') return 0;
  if (verdict === 'hold') return 1;
  return 2;
}

function modelRoutingRecommendation(
  signal: number,
  trend: FrontierDataflowModelRoutingRecommendationTrend,
  sampleCount: number,
  options: { minimumSamples: number; promoteThreshold: number; deprioritizeThreshold: number }
): FrontierDataflowModelRoutingRecommendationVerdict {
  if (sampleCount < options.minimumSamples) return 'hold';
  if (signal >= options.promoteThreshold && trend !== 'declining') return 'promote';
  if (signal <= options.deprioritizeThreshold || (trend === 'declining' && signal < options.promoteThreshold)) return 'deprioritize';
  return 'hold';
}

function modelRoutingTrend(
  outcomes: readonly FrontierDataflowModelRoutingOutcome[],
  successRate: number,
  averageScore: number
): FrontierDataflowModelRoutingRecommendationTrend {
  if (outcomes.length < 4) return 'stable';
  const mid = Math.max(1, Math.floor(outcomes.length / 2));
  const older = outcomes.slice(0, mid);
  const newer = outcomes.slice(mid);
  const olderSignal = rollingSignal(older, rateFromSuccesses(older), averageModelRoutingScore(older));
  const newerSignal = rollingSignal(newer, rateFromSuccesses(newer), averageModelRoutingScore(newer));
  const delta = newerSignal - olderSignal;
  if (delta > 0.05) return 'improving';
  if (delta < -0.05) return 'declining';
  if (averageScore > successRate && newerSignal >= olderSignal) return 'improving';
  return 'stable';
}

function rollingSignal(
  outcomes: readonly FrontierDataflowModelRoutingOutcome[],
  successRate: number,
  averageScore: number
): number {
  return outcomes.some((outcome) => outcome.score !== undefined) ? averageScore : successRate;
}

function rateFromSuccesses(outcomes: readonly FrontierDataflowModelRoutingOutcome[]): number {
  if (outcomes.length === 0) return 0;
  const successes = outcomes.filter((outcome) => outcome.success === true).length;
  return successes / outcomes.length;
}

function averageModelRoutingScore(outcomes: readonly FrontierDataflowModelRoutingOutcome[]): number {
  return average(outcomes.map((outcome) => outcome.score));
}

function aggregateModelRoutingMetadata(
  outcomes: readonly FrontierDataflowModelRoutingOutcome[]
): JsonObject | undefined {
  const sources = outcomes.flatMap((outcome) => {
    const metadata = outcome.metadata;
    if (!metadata) return [];
    const model = metadata.model ?? metadata.provider ?? metadata.tier ?? metadata.route;
    return typeof model === 'string' ? [model] : [];
  });
  return sources.length ? { sources: uniqueStrings(sources) } : undefined;
}

function modelRoutingReason(input: {
  recommendation: FrontierDataflowModelRoutingRecommendationVerdict;
  trend: FrontierDataflowModelRoutingRecommendationTrend;
  signal: number;
  successCount: number;
  windowedOutcomeCount: number;
  minimumSamples: number;
  promoteThreshold: number;
  deprioritizeThreshold: number;
  usesScore: boolean;
}): string {
  const signalLabel = input.usesScore ? 'rolling score' : 'rolling success rate';
  const signalText = formatRatio(input.signal);
  if (input.windowedOutcomeCount < input.minimumSamples) {
    return 'holding until the rolling window reaches ' + input.minimumSamples + ' samples (' + input.windowedOutcomeCount + ' seen)';
  }
  if (input.recommendation === 'promote') {
    return signalLabel + ' ' + signalText + ' meets the promote threshold ' + formatRatio(input.promoteThreshold) + '; trend ' + input.trend + '; ' + input.successCount + '/' + input.windowedOutcomeCount + ' recent outcomes succeeded';
  }
  if (input.recommendation === 'deprioritize') {
    return signalLabel + ' ' + signalText + ' is at or below the deprioritize threshold ' + formatRatio(input.deprioritizeThreshold) + '; trend ' + input.trend + '; ' + input.successCount + '/' + input.windowedOutcomeCount + ' recent outcomes succeeded';
  }
  return signalLabel + ' ' + signalText + '; trend ' + input.trend + '; keep monitoring the rolling window';
}

function compactModelRoutingTextPart(...values: unknown[]): string {
  return values
    .map((value) => {
      if (typeof value === 'string') return value.trim().replace(/[\s_]+/g, '-').toLowerCase();
      if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim().toLowerCase();
      return '';
    })
    .filter((value) => !!value)
    .join(' ');
}

function modelRoutingOutcomeSuccess(outcome: FrontierDataflowModelRoutingOutcomeInput): boolean | undefined {
  if (typeof outcome.succeeded === 'boolean') return outcome.succeeded;
  const text = compactModelRoutingTextPart(outcome.status, outcome.result, outcome.decision, outcome.outcome, outcome.recommendation);
  if (modelRoutingTextHasAny(text, ['success', 'succeed', 'passed', 'pass', 'winner', 'win', 'good', 'preferred', 'promote', 'accept', 'accepted'])) return true;
  if (modelRoutingTextHasAny(text, ['fail', 'failed', 'failure', 'reject', 'rejected', 'bad', 'worse', 'deprioritize', 'downgrade', 'loss'])) return false;
  return undefined;
}

function modelRoutingTextHasAny(text: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function average(values: readonly (number | undefined)[]): number {
  const present = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (present.length === 0) return 0;
  return present.reduce((sum, value) => sum + value, 0) / present.length;
}

function optionalBoolean<K extends string>(key: K, value: boolean | undefined): Partial<Record<K, boolean>> {
  return value === undefined ? {} : ({ [key]: value } as Partial<Record<K, boolean>>);
}

function optionalNumber<K extends string>(key: K, value: unknown): Partial<Record<K, number>> {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  return number === undefined ? {} : ({ [key]: number } as Partial<Record<K, number>>);
}

function clampUnit(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function formatRatio(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const normalized = value.trim();
    if (normalized) return normalized;
  }
  return 'autonomous-queue-item';
}
