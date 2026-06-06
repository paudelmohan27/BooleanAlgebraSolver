import type { ASTNode } from '../logic/parser';
import { useAppStore } from '../store/appStore';
import { BarChart3, Settings, Cpu } from 'lucide-react';

function getDepth(node: ASTNode | null): number {
  if (!node) return 0;
  if (node.type === 'VAR') return 0;
  return 1 + Math.max(getDepth(node.left ?? null), getDepth(node.right ?? null));
}

function getGateCount(node: ASTNode | null): number {
  if (!node) return 0;
  if (node.type === 'VAR') return 0;
  return 1 + getGateCount(node.left ?? null) + getGateCount(node.right ?? null);
}

export default function StatsPanel() {
  const { variables, parsedAST, reductionPercentage, simplifiedExpression } = useAppStore();

  const numVars = variables.length;
  const numRows = Math.pow(2, numVars);
  const depth = parsedAST ? getDepth(parsedAST) : 0;
  const gateCount = parsedAST ? getGateCount(parsedAST) : 0;

  let complexity: 'Simple' | 'Medium' | 'Complex' = 'Simple';
  let complexityStyle = 'text-emerald-700 bg-emerald-100 border-emerald-200';
  if (gateCount > 5 || numVars > 4) {
    complexity = 'Complex';
    complexityStyle = 'text-red-700 bg-red-100 border-red-200';
  } else if (gateCount > 2 || numVars > 2) {
    complexity = 'Medium';
    complexityStyle = 'text-amber-700 bg-amber-100 border-amber-200';
  }

  if (!parsedAST) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl h-full min-h-48">
        <BarChart3 className="h-8 w-8 mb-3 text-slate-300" />
        <p className="font-semibold text-sm text-slate-500">No expression metrics</p>
        <p className="text-xs mt-1">Enter an expression to see stats.</p>
      </div>
    );
  }

  const stats = [
    { label: 'Variables', value: numVars },
    { label: 'Truth Rows', value: numRows },
    { label: 'AST Depth', value: depth },
    { label: 'Gate Count', value: gateCount },
  ];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
        <Settings className="h-4 w-4 text-slate-400" />
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Expression Metrics</h4>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1">{label}</span>
            <span className="text-2xl font-black text-slate-800 font-mono">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-violet-500" /> Complexity
        </span>
        <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${complexityStyle}`}>
          {complexity}
        </span>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span>Optimization</span>
          <span className="text-violet-600 font-mono">{reductionPercentage}% reduction</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
          <div
            className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${reductionPercentage}%` }}
          />
        </div>
        <div className="mt-3 bg-violet-50 border border-violet-200 p-3 rounded-lg">
          <p className="text-xs font-medium text-violet-800 font-mono">
            Simplified: <span className="font-bold">{simplifiedExpression || '0'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
