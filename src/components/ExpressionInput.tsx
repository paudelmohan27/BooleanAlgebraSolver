import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Sparkles, HelpCircle, History, Trash2, Check, AlertTriangle, BookOpen } from 'lucide-react';

export default function ExpressionInput() {
  const {
    expression,
    setExpression,
    parseError,
    parsedAST,
    history,
    clearHistory,
    setActiveTab,
  } = useAppStore();

  const [inputVal, setInputVal] = useState(expression);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setInputVal(expression);
  }, [expression]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    setExpression(val);
  };

  const insertSymbol = (sym: string) => {
    const input = document.getElementById('expr-input') as HTMLInputElement;
    if (!input) return;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = input.value;
    const newText = text.substring(0, start) + sym + text.substring(end);
    setInputVal(newText);
    setExpression(newText);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + sym.length, start + sym.length);
    }, 0);
  };

  const examples = {
    Basic: ['A + B', 'A B', "A'"],
    Intermediate: ["(A + B') C", 'A ⊕ B', '(A + B)(C + D)'],
    Advanced: ["(A + B')(C + D')", "A B C + A' B' C'", "((A ↑ B) + C)"],
  };

  const operators = [
    { label: "AND (·)", sym: "·" },
    { label: "OR (+)", sym: "+" },
    { label: "NOT (')", sym: "'" },
    { label: "XOR (⊕)", sym: "⊕" },
    { label: "XNOR (⊙)", sym: "⊙" },
    { label: "NAND (↑)", sym: "↑" },
    { label: "NOR (↓)", sym: "↓" },
    { label: "(", sym: "(" },
    { label: ")", sym: ")" },
  ];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

      {/* Input */}
      <div className="relative">
        <label htmlFor="expr-input" className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">
          Boolean Expression
        </label>
        <div className="relative flex items-center">
          <input
            id="expr-input"
            type="text"
            value={inputVal}
            onChange={handleChange}
            placeholder="e.g. (A + B')C or A XOR B"
            className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-xl text-slate-800 font-mono text-lg shadow-inner focus:outline-none focus:ring-4 transition-all duration-200 pr-12 ${
              parseError && inputVal.trim()
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : parsedAST && inputVal.trim()
                ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100'
                : 'border-slate-200 focus:border-violet-500 focus:ring-violet-100'
            }`}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`absolute right-4 transition-colors duration-200 ${showGuide ? 'text-violet-500' : 'text-slate-400 hover:text-slate-600'}`}
            title="Syntax Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Validation */}
        <div className="mt-2.5 flex items-center justify-between min-h-5">
          {inputVal.trim() === '' ? (
            <span className="text-xs text-slate-400">Enter a boolean expression to get started</span>
          ) : parseError ? (
            <span className="text-xs text-red-500 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {parseError}
            </span>
          ) : (
            <span className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
              <Check className="h-3.5 w-3.5 shrink-0" /> Expression valid
            </span>
          )}
          {parsedAST && (
            <button
              onClick={() => setActiveTab('table')}
              className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 hover:underline transition-colors"
            >
              Analyze <Sparkles className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Operator Buttons */}
      <div className="mt-5">
        <span className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
          Quick Insert
        </span>
        <div className="flex flex-wrap gap-2">
          {operators.map((op) => (
            <button
              key={op.label}
              onClick={() => insertSymbol(op.sym)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-violet-50 border border-slate-200 hover:border-violet-300 rounded-lg text-slate-700 hover:text-violet-700 font-mono text-sm active:scale-95 transition-all duration-150 cursor-pointer"
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Syntax Guide */}
      {showGuide && (
        <div className="mt-5 p-4 bg-violet-50 border border-violet-200 rounded-xl text-sm">
          <h4 className="font-semibold text-violet-800 mb-3 flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" /> Syntax Reference
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-600">
            <div>
              <span className="font-bold text-slate-700 block mb-1">AND</span>
              <code className="bg-white border border-violet-200 px-1.5 py-0.5 rounded text-xs">AB</code>{' '}
              <code className="bg-white border border-violet-200 px-1.5 py-0.5 rounded text-xs">A·B</code>
            </div>
            <div>
              <span className="font-bold text-slate-700 block mb-1">OR</span>
              <code className="bg-white border border-violet-200 px-1.5 py-0.5 rounded text-xs">A+B</code>
            </div>
            <div>
              <span className="font-bold text-slate-700 block mb-1">NOT</span>
              <code className="bg-white border border-violet-200 px-1.5 py-0.5 rounded text-xs">A'</code>{' '}
              <code className="bg-white border border-violet-200 px-1.5 py-0.5 rounded text-xs">!A</code>
            </div>
            <div>
              <span className="font-bold text-slate-700 block mb-1">XOR</span>
              <code className="bg-white border border-violet-200 px-1.5 py-0.5 rounded text-xs">A⊕B</code>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Variables are single uppercase letters (A–Z). Implicit AND: <code className="font-mono bg-white border border-violet-200 px-1 rounded">AB</code> → A AND B.
          </p>
        </div>
      )}

      {/* Example Library */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" /> Examples
        </h4>
        <div className="space-y-3">
          {Object.entries(examples).map(([level, exprs]) => (
            <div key={level} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="w-24 text-xs font-semibold text-slate-400 uppercase shrink-0">{level}</span>
              <div className="flex flex-wrap gap-2">
                {exprs.map((expr) => (
                  <button
                    key={expr}
                    onClick={() => { setInputVal(expr); setExpression(expr); }}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-300 rounded-lg text-slate-600 hover:text-violet-700 font-mono text-xs active:scale-95 transition-all duration-150 cursor-pointer"
                  >
                    {expr}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-5 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" /> Recent
            </h4>
            <button
              onClick={clearHistory}
              className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((expr) => (
              <button
                key={expr}
                onClick={() => { setInputVal(expr); setExpression(expr); }}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono text-xs active:scale-95 transition-all duration-150 cursor-pointer"
              >
                {expr}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
