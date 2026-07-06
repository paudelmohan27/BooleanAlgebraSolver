import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Clipboard, X, ChevronRight, HelpCircle, BookOpen, AlertTriangle, CheckCircle2, Play, History, Trash2 } from 'lucide-react';

export default function ExpressionInput() {
  const {
    expression, setExpression, parseError, parsedAST,
    history, clearHistory, setActiveTab,
  } = useAppStore();

  const [inputVal, setInputVal] = useState(expression);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => { setInputVal(expression); }, [expression]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    setExpression(val);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { setInputVal(text.trim()); setExpression(text.trim()); }
    } catch { /* clipboard denied */ }
  };

  const handleClear = () => { setInputVal(''); setExpression(''); };

  const handleSolve = () => {
    if (parsedAST) setActiveTab('table');
  };

  const insertSymbol = (sym: string) => {
    const input = document.getElementById('expr-input') as HTMLInputElement;
    if (!input) return;
    const s = input.selectionStart || 0;
    const e = input.selectionEnd || 0;
    const next = input.value.substring(0, s) + sym + input.value.substring(e);
    setInputVal(next);
    setExpression(next);
    setTimeout(() => { input.focus(); input.setSelectionRange(s + sym.length, s + sym.length); }, 0);
  };

  const operators = [
    { label: "AND  ·",  sym: "·"  }, { label: "OR   +",   sym: "+"  },
    { label: "NOT  '",  sym: "'"  }, { label: "XOR  ⊕",   sym: "⊕"  },
    { label: "XNOR ⊙",  sym: "⊙"  }, { label: "NAND ↑",  sym: "↑"  },
    { label: "NOR  ↓",  sym: "↓"  }, { label: "(",        sym: "("  },
    { label: ")",       sym: ")"  },
  ];

  const examples = {
    Basic:        ['A + B', 'A·B', "A'"],
    Intermediate: ["(A+B')C", 'A⊕B', '(A+B)(C+D)'],
    Advanced:     ["A'B+AB'", "ABC+A'B'C'", "(A↑B)+C"],
  };

  const hasError = !!parseError && !!inputVal.trim();
  const isValid  = !!parsedAST  && !!inputVal.trim();
  const inputClass = `ide-input${hasError ? ' error' : isValid ? ' valid' : ''}`;

  return (
    <div className="glass p-6 animate-float-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Expression Input</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Boolean expression compiler &amp; simplifier
          </p>
        </div>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="btn-ghost"
          title="Syntax reference"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Reference</span>
        </button>
      </div>

      {/* ─── Main input area ──────────────────── */}
      <div className="p-4 rounded-xl mb-4"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        {/* Label */}
        <label htmlFor="expr-input" className="section-label block mb-2">
          Boolean Expression
        </label>

        {/* Input field */}
        <input
          id="expr-input"
          type="text"
          value={inputVal}
          onChange={handleChange}
          placeholder="e.g.  A'BC + AB' + C(D+E)"
          className={inputClass}
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          onKeyDown={e => { if (e.key === 'Enter') handleSolve(); }}
          style={{ borderRadius: '8px' }}
        />

        {/* Status line */}
        <div className="mt-2 min-h-5 flex items-center">
          {inputVal.trim() === '' ? (
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Type an expression or pick an example below
            </span>
          ) : hasError ? (
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--error)' }}>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {parseError}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--success)' }}>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Valid expression
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3 pt-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button onClick={handlePaste} className="btn-secondary">
            <Clipboard className="h-3.5 w-3.5" /> Paste
          </button>
          <button onClick={handleClear} className="btn-secondary">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
          <div className="flex-1" />
          <button
            onClick={handleSolve}
            disabled={!parsedAST}
            className="btn-primary"
            style={!parsedAST ? { opacity: 0.45, cursor: 'not-allowed', transform: 'none', boxShadow: 'none' } : {}}
          >
            <Play className="h-3.5 w-3.5" />
            Solve
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Syntax guide ─────────────────────── */}
      {showGuide && (
        <div className="mb-4 p-4 rounded-xl animate-float-in"
          style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
        >
          <h4 className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
            <BookOpen className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
            Syntax Reference
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { op: 'AND',  syms: ["A·B", "AB", "A*B"] },
              { op: 'OR',   syms: ["A+B"] },
              { op: 'NOT',  syms: ["A'", "!A", "~A"] },
              { op: 'XOR',  syms: ["A⊕B"] },
            ].map(({ op, syms }) => (
              <div key={op}>
                <span className="font-bold block mb-1" style={{ color: 'var(--text)' }}>{op}</span>
                <div className="flex flex-wrap gap-1">
                  {syms.map(s => (
                    <code key={s}
                      className="code-block px-1.5 py-0.5 text-xs"
                      style={{ borderRadius: 4 }}
                    >{s}</code>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Variables must be single uppercase letters (A–Z). Implicit AND:{' '}
            <code className="code-block px-1 py-0 text-xs" style={{ borderRadius: 3 }}>AB → A·B</code>
          </p>
        </div>
      )}

      {/* ─── Quick Insert ─────────────────────── */}
      <div className="mb-5">
        <p className="section-label mb-2">Quick Insert</p>
        <div className="flex flex-wrap gap-1.5">
          {operators.map(op => (
            <button key={op.label} onClick={() => insertSymbol(op.sym)} className="chip">
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Examples ────────────────────────── */}
      <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="section-label mb-3 flex items-center gap-1.5">
          <BookOpen className="h-3 w-3" /> Examples
        </p>
        <div className="space-y-2.5">
          {Object.entries(examples).map(([level, exprs]) => (
            <div key={level} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="w-20 text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                {level}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {exprs.map(expr => (
                  <button key={expr} onClick={() => { setInputVal(expr); setExpression(expr); }}
                    className="chip"
                  >
                    {expr}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── History ─────────────────────────── */}
      {history.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <p className="section-label flex items-center gap-1.5">
              <History className="h-3 w-3" /> Recent
            </p>
            <button onClick={clearHistory} className="btn-ghost text-xs"
              style={{ color: 'var(--error)', fontSize: 11 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {history.map(expr => (
              <button key={expr} onClick={() => { setInputVal(expr); setExpression(expr); }}
                className="chip"
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
