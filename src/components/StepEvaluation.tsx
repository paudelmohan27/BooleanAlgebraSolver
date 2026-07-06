import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { generateEvaluationSteps } from '../logic/parser';
import { FlaskConical, ToggleLeft, ChevronRight } from 'lucide-react';

export default function StepEvaluation() {
  const { parsedAST, variables } = useAppStore();
  const [varValues, setVarValues] = useState<Record<string, boolean>>({});

  const safeVarValues = useMemo(() => {
    const vals: Record<string, boolean> = {};
    variables.forEach((v) => { vals[v] = varValues[v] ?? false; });
    return vals;
  }, [variables, varValues]);

  const handleToggle = (v: string) => {
    setVarValues((prev) => ({ ...prev, [v]: !(prev[v] ?? false) }));
  };

  let steps: ReturnType<typeof generateEvaluationSteps> = [];
  try {
    if (parsedAST) steps = generateEvaluationSteps(parsedAST, safeVarValues);
  } catch { /* ignore */ }

  if (!parsedAST) {
    return (
      <div className="glass flex flex-col items-center justify-center p-12 animate-float-in">
        <FlaskConical className="h-10 w-10 mb-3" style={{ color: 'var(--border)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No active expression</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Enter a valid expression on the Home tab.</p>
      </div>
    );
  }

  return (
    <div className="glass p-6 animate-float-in">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-border)' }}
        >
          <FlaskConical className="h-4 w-4" style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Step-by-Step Evaluator</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Toggle variables to trace evaluation live
          </p>
        </div>
      </div>

      {/* Variable toggles */}
      <div className="mb-5 p-4 rounded-xl"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-1.5 mb-3">
          <ToggleLeft className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
          <span className="section-label">Input Values</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {variables.map((v) => {
            const isTrue = safeVarValues[v];
            return (
              <button
                key={v}
                onClick={() => handleToggle(v)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-150 cursor-pointer"
                style={isTrue ? {
                  background: 'var(--primary)',
                  border: '1px solid var(--primary)',
                  color: '#ffffff',
                  boxShadow: '0 0 16px rgba(59,130,246,0.3)',
                } : {
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                <span
                  className="mono"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {v}
                </span>
                {/* Toggle pill */}
                <span className="relative flex items-center">
                  <span className="w-8 h-4 rounded-full flex items-center px-0.5 transition-all"
                    style={{ background: isTrue ? 'rgba(255,255,255,0.2)' : 'var(--border)' }}
                  >
                    <span className="h-3 w-3 rounded-full transition-all duration-200 bg-white"
                      style={{ transform: isTrue ? 'translateX(16px)' : 'translateX(0)', opacity: isTrue ? 1 : 0.5 }}
                    />
                  </span>
                </span>
                <span
                  className="mono text-xs opacity-80"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {isTrue ? '1' : '0'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Evaluation steps */}
      {steps.length === 0 ? (
        <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
          Computing…
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl transition-all duration-150"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div className="flex items-start gap-3">
                {/* Step number */}
                <div className="h-6 w-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 mt-0.5"
                  style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', color: 'var(--primary-hover)' }}
                >
                  {idx + 1}
                </div>
                <div>
                  <span
                    className="font-semibold text-sm"
                    style={{ color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {step.expr}
                  </span>
                  <p className="text-xs mt-1 flex items-center gap-1"
                    style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <ChevronRight className="h-3 w-3 shrink-0" style={{ color: 'var(--text-dim)' }} />
                    {step.explanation}
                  </p>
                </div>
              </div>

              {/* Result badge */}
              <div className="mt-3 sm:mt-0 shrink-0">
                <span
                  className={`badge ${step.val ? 'badge-success' : 'badge-muted'}`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {step.val ? '1 — TRUE' : '0 — FALSE'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
