import {
  compileDataflow,
  createDataflowGraph,
  explainDataflowChange,
  materializeDataflow,
  planDataflowRecompute,
  type FrontierDataflowGraph,
  type FrontierDataflowMaterialization,
  type FrontierDataflowPlan
} from '../dist/index.js';

const graph: FrontierDataflowGraph = createDataflowGraph({
  id: 'typed.dataflow',
  nodes: [
    { id: 'orders', sourcePath: '/entities/orders' },
    { id: 'byCustomer', input: 'orders', groupBy: 'customerId' },
    { id: 'totals', input: 'byCustomer', aggregate: { op: 'sum', field: 'total' }, outputPath: '/views/totals' }
  ]
});

const compiled = compileDataflow(graph);
const plan: FrontierDataflowPlan = planDataflowRecompute(compiled, { changedPaths: ['/entities/orders/o1/total'] });
const materialized: FrontierDataflowMaterialization = materializeDataflow(compiled, {
  entities: {
    orders: {
      o1: { customerId: 'c1', total: 10 }
    }
  }
});
const explanation = explainDataflowChange(materialized, { path: '/views/totals/c1' });

plan.staleNodeIds satisfies string[];
materialized.patches satisfies readonly { path: string }[];
explanation satisfies readonly { sourcePaths: string[] }[];
