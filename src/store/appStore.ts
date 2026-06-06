import { create } from 'zustand';
import { parseExpression, getVariables, evaluateAST } from '../logic/parser';
import type { ASTNode } from '../logic/parser';
import { simplifyExpression } from '../logic/simplifier';

interface AppState {
  expression: string;
  parsedAST: ASTNode | null;
  parseError: string | null;
  variables: string[];
  minterms: number[];
  maxterms: number[];
  simplifiedExpression: string;
  reductionPercentage: number;
  primeImplicants: string[];
  history: string[];
  activeTab: string;
  theme: 'light' | 'dark' | 'system';
  setExpression: (expr: string) => boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setActiveTab: (tab: string) => void;
  clearHistory: () => void;
}

// Helper: Calculate minterms and maxterms
function computeMintermsMaxterms(ast: ASTNode | null, vars: string[]) {
  if (!ast || vars.length === 0) {
    return { minterms: [], maxterms: [] };
  }

  const numCombinations = Math.pow(2, vars.length);
  const minterms: number[] = [];
  const maxterms: number[] = [];

  for (let i = 0; i < numCombinations; i++) {
    // Map combination index to variable boolean values
    // Index i is a binary number. E.g. for variables A, B, C:
    // i = 3 -> binary 011 -> A=false, B=true, C=true
    const values: Record<string, boolean> = {};
    for (let vIdx = 0; vIdx < vars.length; vIdx++) {
      const bitShift = vars.length - 1 - vIdx;
      values[vars[vIdx]] = ((i >> bitShift) & 1) === 1;
    }

    try {
      const output = evaluateAST(ast, values);
      if (output) {
        minterms.push(i);
      } else {
        maxterms.push(i);
      }
    } catch (e) {
      // Ignore evaluation errors for incomplete states
    }
  }

  return { minterms, maxterms };
}

// Initial state from LocalStorage if available
const savedHistory = JSON.parse(localStorage.getItem('dl_expression_history') || '[]');
const savedTheme = (localStorage.getItem('dl_theme') as 'light' | 'dark' | 'system') || 'dark';

export const useAppStore = create<AppState>((set, get) => ({
  expression: '',
  parsedAST: null,
  parseError: null,
  variables: [],
  minterms: [],
  maxterms: [],
  simplifiedExpression: '',
  reductionPercentage: 0,
  primeImplicants: [],
  history: savedHistory,
  activeTab: 'home',
  theme: savedTheme,

  setExpression: (expr: string) => {
    if (!expr.trim()) {
      set({
        expression: expr,
        parsedAST: null,
        parseError: null,
        variables: [],
        minterms: [],
        maxterms: [],
        simplifiedExpression: '',
        reductionPercentage: 0,
        primeImplicants: [],
      });
      return false;
    }

    try {
      const ast = parseExpression(expr);
      const vars = getVariables(ast);

      if (vars.length > 8) {
        throw new Error('Maximum of 8 variables is supported.');
      }

      const { minterms, maxterms } = computeMintermsMaxterms(ast, vars);
      const { simplifiedText, reductionPercentage, primeImplicants } = simplifyExpression(vars, minterms);

      // Add to history if unique and not empty
      let updatedHistory = get().history;
      if (expr.trim() && !updatedHistory.includes(expr.trim())) {
        updatedHistory = [expr.trim(), ...updatedHistory].slice(0, 10);
        localStorage.setItem('dl_expression_history', JSON.stringify(updatedHistory));
      }

      set({
        expression: expr,
        parsedAST: ast,
        parseError: null,
        variables: vars,
        minterms,
        maxterms,
        simplifiedExpression: simplifiedText,
        reductionPercentage,
        primeImplicants,
        history: updatedHistory,
      });

      return true;
    } catch (error: any) {
      set({
        expression: expr,
        parsedAST: null,
        parseError: error.message || 'Invalid expression format.',
        variables: [],
        minterms: [],
        maxterms: [],
        simplifiedExpression: '',
        reductionPercentage: 0,
        primeImplicants: [],
      });
      return false;
    }
  },

  setTheme: (theme) => {
    localStorage.setItem('dl_theme', theme);
    set({ theme });

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  clearHistory: () => {
    localStorage.removeItem('dl_expression_history');
    set({ history: [] });
  },
}));
