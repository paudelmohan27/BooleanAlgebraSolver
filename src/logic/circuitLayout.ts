import type { ASTNode, NodeType } from './parser';

export interface CircuitNode {
  id: string;
  type: 'INPUT' | 'GATE' | 'OUTPUT';
  gateType?: NodeType;
  name?: string; // For INPUT / OUTPUT
  level: number;
  x: number;
  y: number;
}

export interface CircuitConnection {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromNodeId: string;
  toNodeId: string;
}

export interface CircuitLayout {
  nodes: CircuitNode[];
  connections: CircuitConnection[];
  width: number;
  height: number;
}

// Compute the height of each gate in the AST recursively
function computeGateLevels(
  node: ASTNode,
  levels: Record<string, number>
): number {
  if (node.type === 'VAR') {
    levels[node.id] = 0;
    return 0;
  }

  let leftLevel = 0;
  let rightLevel = 0;

  if (node.left) {
    leftLevel = computeGateLevels(node.left, levels);
  }
  if (node.right) {
    rightLevel = computeGateLevels(node.right, levels);
  }

  const level = Math.max(leftLevel, rightLevel) + 1;
  levels[node.id] = level;
  return level;
}

export function layoutCircuit(ast: ASTNode): CircuitLayout {
  // 1. Gather variables and gate levels
  const levels: Record<string, number> = {};
  computeGateLevels(ast, levels);

  // Collect unique variables
  const uniqueVars = new Set<string>();
  const collectVars = (n: ASTNode) => {
    if (n.type === 'VAR' && n.val) {
      uniqueVars.add(n.val);
    }
    if (n.left) collectVars(n.left);
    if (n.right) collectVars(n.right);
  };
  collectVars(ast);
  const varsList = Array.from(uniqueVars).sort();

  // 2. Build layout nodes
  const nodes: CircuitNode[] = [];

  // Add inputs at level 0
  varsList.forEach((v) => {
    nodes.push({
      id: `VAR_${v}`,
      type: 'INPUT',
      name: v,
      level: 0,
      x: 0,
      y: 0,
    });
  });

  // Collect all gates in AST (exclude leaf VAR nodes)
  const gates: { id: string; type: NodeType; level: number }[] = [];
  const collectGates = (n: ASTNode) => {
    if (n.type !== 'VAR') {
      const exists = gates.some((g) => g.id === n.id);
      if (!exists) {
        gates.push({
          id: n.id,
          type: n.type,
          level: levels[n.id],
        });
      }
    }
    if (n.left) collectGates(n.left);
    if (n.right) collectGates(n.right);
  };
  collectGates(ast);

  // Add gate nodes
  gates.forEach((g) => {
    nodes.push({
      id: g.id,
      type: 'GATE',
      gateType: g.type,
      level: g.level,
      x: 0,
      y: 0,
    });
  });

  // Max gate level
  const maxGateLevel = gates.reduce((max, g) => Math.max(max, g.level), 0);

  // Add output terminal at level (maxGateLevel + 1)
  const outputNodeId = 'OUT_VAL';
  nodes.push({
    id: outputNodeId,
    type: 'OUTPUT',
    name: 'Output',
    level: maxGateLevel + 1,
    x: 0,
    y: 0,
  });

  // 3. Compute (x, y) coordinates
  const levelCols: Record<number, CircuitNode[]> = {};
  nodes.forEach((n) => {
    if (!levelCols[n.level]) {
      levelCols[n.level] = [];
    }
    levelCols[n.level].push(n);
  });

  // Calculate layout dimensions
  const colWidth = 180;
  const rowHeight = 90;
  const totalLevels = maxGateLevel + 2;

  // Determine max nodes in any column to size height
  let maxColNodes = 0;
  for (let l = 0; l < totalLevels; l++) {
    const count = levelCols[l]?.length || 0;
    if (count > maxColNodes) {
      maxColNodes = count;
    }
  }

  const height = Math.max(300, maxColNodes * rowHeight + 80);
  const width = totalLevels * colWidth + 40;

  // Center nodes in each column
  for (let l = 0; l < totalLevels; l++) {
    const colNodes = levelCols[l] || [];
    const colNodeCount = colNodes.length;
    const colHeight = (colNodeCount - 1) * rowHeight;
    const startY = (height - colHeight) / 2;

    colNodes.forEach((node, idx) => {
      node.x = 60 + l * colWidth;
      node.y = startY + idx * rowHeight;
    });
  }

  // 4. Generate connections
  const connections: CircuitConnection[] = [];
  let connectionCounter = 0;

  const nodeMap = new Map<string, CircuitNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const addConn = (fromId: string, toId: string, portIndex: number, totalPorts: number) => {
    const fromNode = nodeMap.get(fromId);
    const toNode = nodeMap.get(toId);
    if (!fromNode || !toNode) return;

    // Output port is at x + 25
    let fromX = fromNode.x;
    if (fromNode.type === 'INPUT') fromX += 20;
    else if (fromNode.type === 'GATE') fromX += 25;

    const fromY = fromNode.y;

    // Input port is at x - 25
    let toX = toNode.x;
    if (toNode.type === 'OUTPUT') toX -= 25;
    else if (toNode.type === 'GATE') toX -= 25;

    let toY = toNode.y;

    // Calculate Y offsets for multiple inputs
    if (toNode.type === 'GATE' && totalPorts > 1) {
      if (totalPorts === 2) {
        toY += portIndex === 0 ? -12 : 12;
      }
    }

    connections.push({
      id: `conn_${++connectionCounter}`,
      fromX,
      fromY,
      toX,
      toY,
      fromNodeId: fromId,
      toNodeId: toId,
    });
  };

  // Traverse AST to create connections
  const createASTConnections = (node: ASTNode, parentId: string, portIdx: number, totalPorts: number) => {
    if (node.type === 'VAR') {
      addConn(`VAR_${node.val}`, parentId, portIdx, totalPorts);
      return;
    }

    // Connect this gate's output to parent
    addConn(node.id, parentId, portIdx, totalPorts);

    // Recurse children
    if (node.type === 'NOT') {
      if (node.right) {
        createASTConnections(node.right, node.id, 0, 1);
      }
    } else {
      // Binary gates
      if (node.left) {
        createASTConnections(node.left, node.id, 0, 2);
      }
      if (node.right) {
        createASTConnections(node.right, node.id, 1, 2);
      }
    }
  };

  // Start connection generation from root to output terminal
  if (ast.type === 'VAR') {
    addConn(`VAR_${ast.val}`, outputNodeId, 0, 1);
  } else {
    createASTConnections(ast, outputNodeId, 0, 1);
  }

  return {
    nodes,
    connections,
    width,
    height,
  };
}
