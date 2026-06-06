import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { generateEvaluationSteps } from '../logic/parser';
import { Compass, HelpCircle } from 'lucide-react';

export default function StepEvaluation() {
  const { parsedAST, variables } = useAppStore();
  const [varValues, setVarValues] = useState<Record<string, boolean>>({});

  // Build safe values ensuring all variables default to false
  const safeVarValues = useMemo(() => {
    const vals: Record<string, boolean> = {};
    variables.forEach((v) => { vals[v] = varValues[v] ?? false; });
    return vals;
  }, [variables, varValues]);

  const handleToggleVar = (v: string) => {
    setVarValues((prev) => ({ ...prev, [v]: !(prev[v] ?? false) }));
  };

  // Safely compute steps
  let steps: ReturnType<typeof generateEvaluationSteps> = [];
  try {
    if (parsedAST) steps = generateEvaluationSteps(parsedAST, safeVarValues);
  } catch { /* ignore */ }

  if (!parsedAST) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
        <Compass className="h-10 w-10 mb-3 text-slate-300" />
        <p className="font-semibold text-base text-slate-500">No active expression</p>
        <p className="text-sm mt-1">Enter a valid expression on the Home tab.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

      <div className="mb-5">
        <h3 className="text-lg font-bold text-slate-800">Step-by-Step Evaluator</h3>
        <p className="text-sm text-slate-500 mt-0.5">Toggle variables to trace evaluation through each sub-expression.</p>
      </div>

      {/* Variable Toggles */}
      <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Input Values</span>
        <div className="flex flex-wrap gap-2">
          {variables.map((v) => {
            const isTrue = safeVarValues[v];
            return (
              <button
                key={v}
                onClick={() => handleToggleVar(v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-all duration-150 cursor-pointer ${
                  isTrue
                    ? 'bg-violet-600 border-violet-500 text-white shadow-sm'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-violet-300 hover:text-violet-700'
                }`}
              >
                <span className="font-mono">{v}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${isTrue ? 'bg-white' : 'bg-slate-400'}`} />
                <span className="font-mono text-xs opacity-75">{isTrue ? '1' : '0'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Steps */}
      <div>
        {steps.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">Computing evaluation...</div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-violet-300 transition-colors duration-150"
              >
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-violet-100 border border-violet-200 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="font-mono font-semibold text-slate-800 text-sm">{step.expr}</span>
                    <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1">
                      <HelpCircle className="h-3 w-3 text-slate-300 shrink-0" />
                      {step.explanation}
                    </p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 shrink-0">
                  <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${
                    step.val
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {step.val ? '1 (TRUE)' : '0 (FALSE)'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
