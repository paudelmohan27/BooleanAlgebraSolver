import type { ASTNode } from '../logic/parser';
import { useAppStore } from '../store/appStore';
import { BarChart3, Hash, Rows3, GitBranch, Layers, Cpu } from 'lucide-react';

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

  const complexity: 'Simple' | 'Medium' | 'Complex' =
    gateCount > 5 || numVars > 4 ? 'Complex' :
    gateCount > 2 || numVars > 2 ? 'Medium'  : 'Simple';

  if (!parsedAST) {
    return (
      <div className="glass flex flex-col items-center justify-center p-8 min-h-48 animate-float-in">
        <BarChart3 className="h-10 w-10 mb-3" style={{ color: 'var(--border)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No metrics yet</p>
        <p className="text-xs mt-1 text-center" style={{ color: 'var(--text-dim)' }}>
          Enter a valid expression to see stats.
        </p>
      </div>
    );
  }

  const stats = [
    { label: 'Variables',   value: numVars,    icon: Hash      },
    { label: 'Truth Rows',  value: numRows,     icon: Rows3     },
    { label: 'AST Depth',   value: depth,       icon: GitBranch },
    { label: 'Gate Count',  value: gateCount,   icon: Layers    },
  ];

  const complexityStyle = {
    Simple:  { color: 'var(--success)', bg: 'var(--success-bg)', border: 'rgba(34,197,94,0.25)' },
    Medium:  { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'rgba(245,158,11,0.25)' },
    Complex: { color: 'var(--error)',   bg: 'var(--error-bg)',   border: 'rgba(239,68,68,0.25)'  },
  }[complexity];

  return (
    <div className="glass p-6 flex flex-col gap-5 animate-float-in">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-border)' }}
        >
          <BarChart3 className="h-4 w-4" style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h4 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Circuit Metrics</h4>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Expression analysis</p>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="p-4 rounded-xl"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="section-label">{label}</span>
              <Icon className="h-3.5 w-3.5" style={{ color: 'var(--text-dim)' }} />
            </div>
            <span
              className="text-3xl font-black mono"
              style={{ color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Complexity */}
      <div className="flex items-center justify-between p-3.5 rounded-xl"
        style={{ background: complexityStyle.bg, border: `1px solid ${complexityStyle.border}` }}
      >
        <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Cpu className="h-3.5 w-3.5" /> Complexity
        </span>
        <span className="text-xs font-black uppercase tracking-wider"
          style={{ color: complexityStyle.color }}
        >
          {complexity}
        </span>
      </div>

      {/* Optimization bar */}
      <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between text-xs mb-2">
          <span style={{ color: 'var(--text-muted)' }}>Optimization</span>
          <span
            className="font-bold mono"
            style={{ color: 'var(--primary-hover)', fontFamily: "'JetBrains Mono', monospace" }}
          >
            {reductionPercentage}% reduction
          </span>
        </div>
        {/* Track */}
        <div className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--border)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${reductionPercentage}%`,
              background: 'linear-gradient(90deg, var(--primary), var(--primary-hover))',
              boxShadow: reductionPercentage > 0 ? '0 0 8px rgba(59,130,246,0.5)' : 'none',
            }}
          />
        </div>

        {/* Simplified expression */}
        {simplifiedExpression && (
          <div className="mt-3 p-3 rounded-xl"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <p className="section-label mb-1.5">Simplified</p>
            <p
              className="font-bold text-sm mono"
              style={{ color: 'var(--primary-hover)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {simplifiedExpression}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
