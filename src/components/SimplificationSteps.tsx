import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { simplifyWithSteps } from '../logic/simplifier';
import type { SimplificationStep } from '../logic/simplifier';
import { ChevronDown, ChevronUp, ArrowRight, Sparkles, Copy, Check, ListOrdered, GitMerge, Zap, Target, Star } from 'lucide-react';

function stepIcon(step: SimplificationStep) {
  if (step.isFinal)                       return Star;
  if (step.title.startsWith('Canonical')) return ListOrdered;
  if (step.title.startsWith('Adjacency')) return GitMerge;
  if (step.title.startsWith('Prime'))     return Zap;
  if (step.title.startsWith('Select'))    return Target;
  return Sparkles;
}

function StepCard({
  step, expanded, onToggle,
}: {
  step: SimplificationStep;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = stepIcon(step);

  return (
    <div className="rounded-xl overflow-hidden transition-all duration-150"
      style={step.isFinal ? {
        background: 'var(--primary-bg)',
        border: '1px solid var(--primary-border)',
        boxShadow: '0 0 20px rgba(59,130,246,0.12)',
      } : {
        background: 'var(--bg)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left cursor-pointer transition-all"
        style={{ background: 'transparent' }}
        onMouseEnter={e => { if (!step.isFinal) (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        {/* Badge */}
        <div className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center font-black text-xs"
          style={step.isFinal ? {
            background: 'var(--primary)',
            color: '#fff',
            boxShadow: '0 0 10px rgba(59,130,246,0.4)',
          } : {
            background: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          {step.isFinal ? <Icon className="h-3.5 w-3.5" /> : step.stepNum}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold"
              style={{ color: step.isFinal ? 'var(--primary-hover)' : 'var(--text)' }}
            >
              {step.title}
            </span>
            <span className="badge badge-muted"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {step.rule}
            </span>
          </div>
          {!expanded && (
            <p className="text-xs mt-0.5 truncate"
              style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {step.terms.slice(0, 3).join(' + ')}{step.terms.length > 3 ? ' + …' : ''}
            </p>
          )}
        </div>

        <div className="shrink-0" style={{ color: 'var(--text-dim)' }}>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 pt-1"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {/* Explanation */}
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
            {step.explanation}
          </p>

          {/* Combination equations */}
          {step.combinations && step.combinations.length > 0 && (
            <div className="mb-4">
              <p className="section-label mb-2">Combinations Made</p>
              <div className="space-y-1.5 pl-3"
                style={{ borderLeft: '2px solid var(--primary-border)' }}
              >
                {step.combinations.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap text-xs"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <span className="font-bold" style={{ color: 'var(--text)' }}>{c.t1Term}</span>
                    <span style={{ color: 'var(--text-muted)' }}>+</span>
                    <span className="font-bold" style={{ color: 'var(--text)' }}>{c.t2Term}</span>
                    <ArrowRight className="h-3 w-3 shrink-0" style={{ color: 'var(--text-dim)' }} />
                    <span className="font-bold" style={{ color: 'var(--primary-hover)' }}>{c.resultTerm}</span>
                    <span className="badge badge-primary" style={{ fontSize: '0.6rem' }}>
                      {c.eliminated} eliminated
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terms */}
          {step.isFinal ? (
            <div>
              <p className="section-label mb-2">Result</p>
              <span className="text-2xl font-black"
                style={{
                  color: 'var(--primary-hover)',
                  fontFamily: "'JetBrains Mono', monospace",
                  textShadow: '0 0 16px rgba(59,130,246,0.4)',
                }}
              >
                {step.terms[0]}
              </span>
            </div>
          ) : (
            <div>
              <p className="section-label mb-2">
                {step.title.startsWith('Canonical') ? 'Minterms' : 'Terms'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {step.terms.map((t, i) => (
                  <span key={i} className="badge badge-muted"
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SimplificationSteps() {
  const { variables, minterms, parsedAST } = useAppStore();
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const steps = useMemo<SimplificationStep[]>(() => {
    if (!parsedAST || !variables.length || !minterms.length) return [];
    try { return simplifyWithSteps(variables, minterms, []); }
    catch { return []; }
  }, [parsedAST, variables, minterms]);

  const finalStep  = steps.find(s => s.isFinal);
  const finalExpr  = finalStep?.terms[0] ?? '';

  // Auto-expand final step
  useMemo(() => {
    if (finalStep) setExpandedSteps(prev => new Set([...prev, finalStep.stepNum]));
  }, [finalStep?.stepNum]);

  const toggleStep = (n: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  };

  const toggleAll = () => {
    setAllExpanded(v => {
      if (!v) setExpandedSteps(new Set(steps.map(s => s.stepNum)));
      else    setExpandedSteps(new Set());
      return !v;
    });
  };

  const handleCopy = () => {
    if (finalExpr) {
      navigator.clipboard.writeText(finalExpr).catch(() => {});
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!parsedAST || steps.length === 0) return null;

  return (
    <div className="glass p-6 animate-float-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-border)' }}
          >
            <Sparkles className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              Step-by-Step Simplification
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Quine-McCluskey reduction · {steps.length} steps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {finalExpr && (
            <button onClick={handleCopy} className="btn-secondary">
              {copied
                ? <><Check className="h-3.5 w-3.5" /> Copied</>
                : <><Copy className="h-3.5 w-3.5" /> Copy</>
              }
            </button>
          )}
          <button onClick={toggleAll} className="btn-secondary">
            {allExpanded
              ? <><ChevronUp   className="h-3.5 w-3.5" /> Collapse All</>
              : <><ChevronDown className="h-3.5 w-3.5" /> Expand All</>
            }
          </button>
        </div>
      </div>

      {/* Quick result */}
      {finalExpr && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl"
          style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-border)' }}
        >
          <Star className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />
          <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>Minimized:</span>
          <span className="font-black text-lg"
            style={{
              color: 'var(--primary-hover)',
              fontFamily: "'JetBrains Mono', monospace",
              textShadow: '0 0 12px rgba(59,130,246,0.35)',
            }}
          >
            {finalExpr}
          </span>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-2">
        {steps.map(step => (
          <StepCard
            key={step.stepNum}
            step={step}
            expanded={expandedSteps.has(step.stepNum)}
            onToggle={() => toggleStep(step.stepNum)}
          />
        ))}
      </div>
    </div>
  );
}
