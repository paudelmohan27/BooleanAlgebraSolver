export type NodeType =
  | 'VAR'
  | 'NOT'
  | 'AND'
  | 'OR'
  | 'XOR'
  | 'XNOR'
  | 'NAND'
  | 'NOR';

export interface ASTNode {
  id: string;
  type: NodeType;
  val?: string; // Variable name for 'VAR'
  left?: ASTNode;
  right?: ASTNode;
}

export type TokenType =
  | 'VAR'
  | 'AND'
  | 'OR'
  | 'NOT_PRE'  // ! or NOT
  | 'NOT_POST' // '
  | 'XOR'
  | 'XNOR'
  | 'NAND'
  | 'NOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'EOF';

export interface Token {
  type: TokenType;
  val: string;
  pos: number;
}

let nodeCounter = 0;
function generateNodeId(): string {
  return `node_${++nodeCounter}`;
}

// Tokenize the input expression
export function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = expr.length;

  while (i < len) {
    const char = expr[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Single-char symbols
    if (char === '+') {
      tokens.push({ type: 'OR', val: '+', pos: i });
      i++;
      continue;
    }
    if (char === '.' || char === '·' || char === '*') {
      tokens.push({ type: 'AND', val: char, pos: i });
      i++;
      continue;
    }
    if (char === '\'' || char === '’') {
      tokens.push({ type: 'NOT_POST', val: '\'', pos: i });
      i++;
      continue;
    }
    if (char === '!' || char === '~') {
      tokens.push({ type: 'NOT_PRE', val: char, pos: i });
      i++;
      continue;
    }
    if (char === '⊕') {
      tokens.push({ type: 'XOR', val: '⊕', pos: i });
      i++;
      continue;
    }
    if (char === '⊙') {
      tokens.push({ type: 'XNOR', val: '⊙', pos: i });
      i++;
      continue;
    }
    if (char === '↑') {
      tokens.push({ type: 'NAND', val: '↑', pos: i });
      i++;
      continue;
    }
    if (char === '↓') {
      tokens.push({ type: 'NOR', val: '↓', pos: i });
      i++;
      continue;
    }
    if (char === '(' || char === '[' || char === '{') {
      tokens.push({ type: 'LPAREN', val: char, pos: i });
      i++;
      continue;
    }
    if (char === ')' || char === ']' || char === '}') {
      tokens.push({ type: 'RPAREN', val: char, pos: i });
      i++;
      continue;
    }

    // Word operators or single character variables
    if (/[a-zA-Z]/.test(char)) {
      // Check if it's a word operator (AND, OR, NOT, XOR, XNOR, NAND, NOR)
      let word = '';
      let j = i;
      while (j < len && /[a-zA-Z]/.test(expr[j])) {
        word += expr[j];
        j++;
      }

      const upperWord = word.toUpperCase();
      if (upperWord === 'AND') {
        tokens.push({ type: 'AND', val: word, pos: i });
        i = j;
      } else if (upperWord === 'OR') {
        tokens.push({ type: 'OR', val: word, pos: i });
        i = j;
      } else if (upperWord === 'NOT') {
        tokens.push({ type: 'NOT_PRE', val: word, pos: i });
        i = j;
      } else if (upperWord === 'XOR') {
        tokens.push({ type: 'XOR', val: word, pos: i });
        i = j;
      } else if (upperWord === 'XNOR') {
        tokens.push({ type: 'XNOR', val: word, pos: i });
        i = j;
      } else if (upperWord === 'NAND') {
        tokens.push({ type: 'NAND', val: word, pos: i });
        i = j;
      } else if (upperWord === 'NOR') {
        tokens.push({ type: 'NOR', val: word, pos: i });
        i = j;
      } else {
        // Not a keyword. Since variables are single letters,
        // we emit each letter as a VAR token to support adjacency (e.g. AB -> A AND B)
        // Wait, what if the user wrote "VarA"? We treat it as V, a, r, A.
        // Let's emit each alphabetical character as a VAR token.
        for (let k = 0; k < word.length; k++) {
          tokens.push({ type: 'VAR', val: word[k], pos: i + k });
        }
        i = j;
      }
      continue;
    }

    throw new Error(`Unexpected character '${char}' at index ${i}`);
  }

  tokens.push({ type: 'EOF', val: '', pos: i });
  return tokens;
}

// Insert implicit ANDs in the token stream
export function insertImplicitAnds(tokens: Token[]): Token[] {
  const result: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const curr = tokens[i];
    result.push(curr);
    if (i < tokens.length - 1) {
      const next = tokens[i + 1];

      // Insert implicit AND if:
      // Current is a variable, right parenthesis, or post-fix NOT
      // Next is a variable, left parenthesis, or pre-fix NOT
      const isCurrOperand = curr.type === 'VAR' || curr.type === 'RPAREN' || curr.type === 'NOT_POST';
      const isNextOperand = next.type === 'VAR' || next.type === 'LPAREN' || next.type === 'NOT_PRE';

      if (isCurrOperand && isNextOperand) {
        result.push({ type: 'AND', val: '·', pos: curr.pos + 1 });
      }
    }
  }
  return result;
}

// Recursive descent parser
export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    const token = this.peek();
    throw new Error(`${message} (Found '${token.val || token.type}' at position ${token.pos})`);
  }

  // ENTRY POINT
  public parse(): ASTNode {
    nodeCounter = 0; // Reset counter for new parse
    const ast = this.parseExpression();
    if (!this.isAtEnd()) {
      const token = this.peek();
      throw new Error(`Unexpected token '${token.val || token.type}' at position ${token.pos}`);
    }
    return ast;
  }

  // Precedence level 5: OR, NOR (lowest)
  private parseExpression(): ASTNode {
    let expr = this.parseXor();

    while (this.match('OR', 'NOR')) {
      const operator = this.previous();
      const right = this.parseXor();
      expr = {
        id: generateNodeId(),
        type: operator.type === 'OR' ? 'OR' : 'NOR',
        left: expr,
        right: right,
      };
    }

    return expr;
  }

  // Precedence level 4: XOR, XNOR
  private parseXor(): ASTNode {
    let expr = this.parseAnd();

    while (this.match('XOR', 'XNOR')) {
      const operator = this.previous();
      const right = this.parseAnd();
      expr = {
        id: generateNodeId(),
        type: operator.type === 'XOR' ? 'XOR' : 'XNOR',
        left: expr,
        right: right,
      };
    }

    return expr;
  }

  // Precedence level 3: AND, NAND
  private parseAnd(): ASTNode {
    let expr = this.parseNot();

    while (this.match('AND', 'NAND')) {
      const operator = this.previous();
      const right = this.parseNot();
      expr = {
        id: generateNodeId(),
        type: operator.type === 'AND' ? 'AND' : 'NAND',
        left: expr,
        right: right,
      };
    }

    return expr;
  }

  // Precedence level 2: NOT prefix or NOT postfix
  private parseNot(): ASTNode {
    if (this.match('NOT_PRE')) {
      const right = this.parseNot();
      return {
        id: generateNodeId(),
        type: 'NOT',
        right: right,
      };
    }

    let expr = this.parsePrimary();

    while (this.match('NOT_POST')) {
      expr = {
        id: generateNodeId(),
        type: 'NOT',
        right: expr,
      };
    }

    return expr;
  }

  // Precedence level 1: Variables and Parentheses
  private parsePrimary(): ASTNode {
    if (this.match('VAR')) {
      return {
        id: generateNodeId(),
        type: 'VAR',
        val: this.previous().val,
      };
    }

    if (this.match('LPAREN')) {
      const expr = this.parseExpression();
      this.consume('RPAREN', "Expect ')' to close group");
      return expr;
    }

    const token = this.peek();
    throw new Error(`Expect variable or open parenthesis at position ${token.pos}`);
  }
}

// Helper: Parse entry point
export function parseExpression(expr: string): ASTNode {
  const rawTokens = tokenize(expr);
  const processedTokens = insertImplicitAnds(rawTokens);
  const parser = new Parser(processedTokens);
  return parser.parse();
}

// Get all variables in the expression, sorted alphabetically
export function getVariables(ast: ASTNode): string[] {
  const vars = new Set<string>();
  function traverse(node: ASTNode) {
    if (node.type === 'VAR' && node.val) {
      vars.add(node.val);
    }
    if (node.left) traverse(node.left);
    if (node.right) traverse(node.right);
  }
  traverse(ast);
  return Array.from(vars).sort();
}

// Evaluate AST given values for variables
export function evaluateAST(ast: ASTNode, values: Record<string, boolean>): boolean {
  switch (ast.type) {
    case 'VAR':
      if (ast.val === undefined || values[ast.val] === undefined) {
        throw new Error(`Variable ${ast.val} has no assigned value.`);
      }
      return values[ast.val];
    case 'NOT':
      if (!ast.right) throw new Error('NOT node missing child');
      return !evaluateAST(ast.right, values);
    case 'AND':
      if (!ast.left || !ast.right) throw new Error('AND node missing child');
      return evaluateAST(ast.left, values) && evaluateAST(ast.right, values);
    case 'OR':
      if (!ast.left || !ast.right) throw new Error('OR node missing child');
      return evaluateAST(ast.left, values) || evaluateAST(ast.right, values);
    case 'XOR':
      if (!ast.left || !ast.right) throw new Error('XOR node missing child');
      return evaluateAST(ast.left, values) !== evaluateAST(ast.right, values);
    case 'XNOR':
      if (!ast.left || !ast.right) throw new Error('XNOR node missing child');
      return evaluateAST(ast.left, values) === evaluateAST(ast.right, values);
    case 'NAND':
      if (!ast.left || !ast.right) throw new Error('NAND node missing child');
      return !(evaluateAST(ast.left, values) && evaluateAST(ast.right, values));
    case 'NOR':
      if (!ast.left || !ast.right) throw new Error('NOR node missing child');
      return !(evaluateAST(ast.left, values) || evaluateAST(ast.right, values));
    default:
      throw new Error(`Unknown node type: ${(ast as any).type}`);
  }
}

// Convert AST to clean string
export function stringifyAST(ast: ASTNode): string {
  switch (ast.type) {
    case 'VAR':
      return ast.val || '';
    case 'NOT':
      if (!ast.right) return '';
      // If NOT wraps a variable, we can write A'
      if (ast.right.type === 'VAR') {
        return `${stringifyAST(ast.right)}'`;
      }
      return `(${stringifyAST(ast.right)})'`;
    case 'AND':
      return `${wrapBinaryOperand(ast.left, 'AND')}·${wrapBinaryOperand(ast.right, 'AND')}`;
    case 'OR':
      return `${wrapBinaryOperand(ast.left, 'OR')}+${wrapBinaryOperand(ast.right, 'OR')}`;
    case 'XOR':
      return `${wrapBinaryOperand(ast.left, 'XOR')}⊕${wrapBinaryOperand(ast.right, 'XOR')}`;
    case 'XNOR':
      return `${wrapBinaryOperand(ast.left, 'XNOR')}⊙${wrapBinaryOperand(ast.right, 'XNOR')}`;
    case 'NAND':
      return `${wrapBinaryOperand(ast.left, 'NAND')}↑${wrapBinaryOperand(ast.right, 'NAND')}`;
    case 'NOR':
      return `${wrapBinaryOperand(ast.left, 'NOR')}↓${wrapBinaryOperand(ast.right, 'NOR')}`;
  }
}

const precedenceMap: Record<NodeType, number> = {
  VAR: 6,
  NOT: 5,
  AND: 4,
  NAND: 4,
  XOR: 3,
  XNOR: 3,
  OR: 2,
  NOR: 2,
};

function wrapBinaryOperand(node: ASTNode | undefined, parentType: NodeType): string {
  if (!node) return '';
  const parentPrecedence = precedenceMap[parentType];
  const nodePrecedence = precedenceMap[node.type];

  const str = stringifyAST(node);
  if (nodePrecedence < parentPrecedence) {
    return `(${str})`;
  }
  return str;
}

// Generate human-readable step-by-step evaluations
export interface EvalStep {
  expr: string;
  val: boolean;
  explanation: string;
}

export function generateEvaluationSteps(
  ast: ASTNode,
  values: Record<string, boolean>
): EvalStep[] {
  const steps: EvalStep[] = [];
  const seenExprs = new Set<string>();

  function traverse(node: ASTNode): string {
    if (node.type === 'VAR') {
      return node.val || '';
    }

    if (node.left) traverse(node.left);
    const rightStr = node.right ? traverse(node.right) : '';

    const nodeVal = evaluateAST(node, values);
    let exprStr = '';
    let explanation = '';

    switch (node.type) {
      case 'NOT':
        exprStr = node.right?.type === 'VAR' ? `${rightStr}'` : `(${rightStr})'`;
        explanation = `NOT ${rightStr} = NOT ${evaluateAST(node.right!, values) ? '1' : '0'} = ${nodeVal ? '1' : '0'}`;
        break;
      case 'AND':
        exprStr = `${wrapBinaryOperand(node.left, 'AND')}·${wrapBinaryOperand(node.right, 'AND')}`;
        explanation = `${stringifyAST(node.left!)} AND ${stringifyAST(node.right!)} = ${evaluateAST(node.left!, values) ? '1' : '0'} AND ${evaluateAST(node.right!, values) ? '1' : '0'} = ${nodeVal ? '1' : '0'}`;
        break;
      case 'OR':
        exprStr = `${wrapBinaryOperand(node.left, 'OR')}+${wrapBinaryOperand(node.right, 'OR')}`;
        explanation = `${stringifyAST(node.left!)} OR ${stringifyAST(node.right!)} = ${evaluateAST(node.left!, values) ? '1' : '0'} OR ${evaluateAST(node.right!, values) ? '1' : '0'} = ${nodeVal ? '1' : '0'}`;
        break;
      case 'XOR':
        exprStr = `${wrapBinaryOperand(node.left, 'XOR')}⊕${wrapBinaryOperand(node.right, 'XOR')}`;
        explanation = `${stringifyAST(node.left!)} XOR ${stringifyAST(node.right!)} = ${evaluateAST(node.left!, values) ? '1' : '0'} XOR ${evaluateAST(node.right!, values) ? '1' : '0'} = ${nodeVal ? '1' : '0'}`;
        break;
      case 'XNOR':
        exprStr = `${wrapBinaryOperand(node.left, 'XNOR')}⊙${wrapBinaryOperand(node.right, 'XNOR')}`;
        explanation = `${stringifyAST(node.left!)} XNOR ${stringifyAST(node.right!)} = ${evaluateAST(node.left!, values) ? '1' : '0'} XNOR ${evaluateAST(node.right!, values) ? '1' : '0'} = ${nodeVal ? '1' : '0'}`;
        break;
      case 'NAND':
        exprStr = `${wrapBinaryOperand(node.left, 'NAND')}↑${wrapBinaryOperand(node.right, 'NAND')}`;
        explanation = `${stringifyAST(node.left!)} NAND ${stringifyAST(node.right!)} = NOT(${evaluateAST(node.left!, values) ? '1' : '0'} AND ${evaluateAST(node.right!, values) ? '1' : '0'}) = ${nodeVal ? '1' : '0'}`;
        break;
      case 'NOR':
        exprStr = `${wrapBinaryOperand(node.left, 'NOR')}↓${wrapBinaryOperand(node.right, 'NOR')}`;
        explanation = `${stringifyAST(node.left!)} NOR ${stringifyAST(node.right!)} = NOT(${evaluateAST(node.left!, values) ? '1' : '0'} OR ${evaluateAST(node.right!, values) ? '1' : '0'}) = ${nodeVal ? '1' : '0'}`;
        break;
    }

    if (!seenExprs.has(exprStr)) {
      seenExprs.add(exprStr);
      steps.push({
        expr: exprStr,
        val: nodeVal,
        explanation: explanation,
      });
    }

    return exprStr;
  }

  traverse(ast);
  return steps;
}
