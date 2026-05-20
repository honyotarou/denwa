import { FLOW, type FlowNode } from './flow-graph.js';

export function validateFlowGraph(nodes: Record<string, FlowNode> = FLOW): readonly string[] {
  const errs: string[] = [];
  for (const node of Object.values(nodes)) {
    if (node.type === 'question' && node.options) {
      for (const opt of node.options) {
        if (!nodes[opt.next]) errs.push(`missing next node: ${opt.next} from ${node.id}`);
      }
    }
    if (node.type === 'recommend') {
      if (!node.recommends || node.recommends.length === 0) {
        errs.push(`recommend node ${node.id} has no recommendations`);
      }
      if (node.options) {
        for (const opt of node.options) {
          if (!nodes[opt.next]) errs.push(`missing next node: ${opt.next} from ${node.id}`);
        }
      }
    }
  }
  return errs;
}
