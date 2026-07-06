import { useState, useMemo, Fragment } from 'react';
import { useAppStore } from '../store/appStore';
import { simplifyWithDontCares } from '../logic/simplifier';
import { getKMapDimensions, getMintermIndex, solveKMapGroups, GRAY_CODE_2, GRAY_CODE_4 } from '../logic/kmapSolver';
import type { KMapGroup } from '../logic/kmapSolver';
import { RotateCcw, ArrowRight, Check } from 'lucide-react';

type CellValue = '0' | '1' | 'X';
const CELL_SIZE = 68;

export default function KMapBuilder() {
  const { setExpression } = useAppStore();

  const [numVars, setNumVars] = useState<2 | 3 | 4>(3);
  const [varNames, setVarNames] = useState(['A', 'B', 'C', 'D']);
  const [cellValues, setCellValues] = useState<Record<number, CellValue>>({});
  const [hoveredGroup, setHoveredGroup] = useState<KMapGroup | null>(null);
  const [sent, setSent] = useState(false);

  const variables = varNames.slice(0, numVars);
  const { rows, cols } = getKMapDimensions(numVars);
  const grayRows = rows === 4 ? GRAY_CODE_4 : GRAY_CODE_2;
  const grayCols = cols === 4 ? GRAY_CODE_4 : GRAY_CODE_2;

  const rowVarLabel = numVars === 2 ? variables[0] : variables.slice(0, numVars === 3 ? 1 : 2).join('');
  const colVarLabel = numVars === 2 ? variables[1] : variables.slice(numVars === 3 ? 1 : 2).join('');

  const allIndices = useMemo(() =>
    grayRows.flatMap((_, r) => grayCols.map((_, c) => getMintermIndex(r, c, numVars))),
    [numVars, grayRows, grayCols]
  );

  const getCellVal = (idx: number): CellValue => cellValues[idx] ?? '0';

  const cycleCell = (idx: number) => {
    const order: CellValue[] = ['0', '1', 'X'];
    const cur = getCellVal(idx);
    const next = order[(order.indexOf(cur) + 1) % 3];
    setCellValues(prev => ({ ...prev, [idx]: next }));
  };

  const minterms  = useMemo(() => allIndices.filter(i => getCellVal(i) === '1'), [allIndices, cellValues]);
  const dontCares = useMemo(() => allIndices.filter(i => getCellVal(i) === 'X'), [allIndices, cellValues]);

  const result = useMemo(() => {
    if (minterms.length === 0 && dontCares.length === 0) return null;
    return simplifyWithDontCares(variables, minterms, dontCares);
  }, [variables, minterms, dontCares]);

  const kmapGroups = useMemo<KMapGroup[]>(() => {
    if (!result?.primeImplicants.length) return [];
    try { return solveKMapGroups(variables, result.primeImplicants); } catch { return []; }
  }, [variables, result]);

  const handleNumVars = (n: 2 | 3 | 4) => { setNumVars(n); setCellValues({}); };

  const handleVarName = (idx: number, val: string) => {
    const ch = val.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
    if (!ch) return;
    const next = [...varNames];
    if (!next.includes(ch) || next[idx] === ch) { next[idx] = ch; setVarNames(next); setCellValues({}); }
  };

  const handleUseExpression = () => {
    if (result?.simplifiedText) {
      setExpression(result.simplifiedText);
      setSent(true); setTimeout(() => setSent(false), 1600);
    }
  };

  const cellBg = (val: CellValue) =>
    val === '1' ? 'rgba(59,130,246,0.1)' : val === 'X' ? 'var(--surface-hover)' : 'var(--bg)';

  const cellColor = (val: CellValue) =>
    val === '1' ? 'var(--primary-hover)' : val === 'X' ? 'var(--text-muted)' : 'var(--text-dim)';

  const cellGlow = (val: CellValue) =>
    val === '1' ? '0 0 12px rgba(59,130,246,0.5)' : 'none';

  return (
    <div className="animate-float-in">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-5 mb-6 p-4 rounded-xl"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        {/* Num vars */}
        <div>
          <p className="section-label mb-2">Variables</p>
          <div className="flex gap-1.5">
            {([2, 3, 4] as const).map(n => (
              <button key={n} onClick={() => handleNumVars(n)}
                className={n === numVars ? 'btn-primary' : 'btn-secondary'}
                style={{ width: 36, height: 36, padding: 0, justifyContent: 'center', borderRadius: 8, fontWeight: 800 }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Variable names */}
        <div>
          <p className="section-label mb-2">Names</p>
          <div className="flex gap-2">
            {Array.from({ length: numVars }).map((_, i) => (
              <input key={i}
                value={varNames[i]}
                onChange={e => handleVarName(i, e.target.value)}
                maxLength={1}
                className="ide-input text-center text-sm font-black"
                style={{ width: 36, height: 36, padding: 0, borderRadius: 8, fontFamily: "'JetBrains Mono', monospace" }}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div>
          <p className="section-label mb-2">Click to toggle</p>
          <div className="flex items-center gap-3">
            {(['0', '1', 'X'] as CellValue[]).map(v => (
              <span key={v} className="flex items-center gap-1.5 text-xs"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded font-bold"
                  style={{
                    background: cellBg(v),
                    border: '1px solid var(--border)',
                    color: cellColor(v),
                    boxShadow: cellGlow(v),
                  }}
                >{v}</span>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
                  {v === '0' ? 'Zero' : v === '1' ? 'One' : "Don't care"}
                </span>
              </span>
            ))}
          </div>
        </div>

        <button onClick={() => setCellValues({})} className="btn-secondary ml-auto">
          <RotateCcw className="h-3.5 w-3.5" /> Clear
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* K-Map grid */}
        <div className="lg:col-span-2 flex items-start justify-center overflow-x-auto">
          <div className="relative" style={{ paddingTop: 32, paddingLeft: 36 }}>
            {/* Axis labels */}
            <div className="absolute text-xs font-bold text-center"
              style={{
                left: CELL_SIZE + 36, top: 6, width: cols * CELL_SIZE,
                color: 'var(--primary-hover)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {colVarLabel} →
            </div>
            <div className="absolute text-xs font-bold"
              style={{
                top: CELL_SIZE + 32, left: 2,
                writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                height: rows * CELL_SIZE,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary-hover)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {rowVarLabel} →
            </div>

            <div>
              {/* Header row */}
              <div className="flex">
                <div className="relative shrink-0 flex items-end justify-start p-1.5"
                  style={{ width: CELL_SIZE, height: CELL_SIZE, background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
                >
                  <span className="text-[10px] font-bold absolute bottom-2 left-2"
                    style={{ color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}
                  >{rowVarLabel}</span>
                  <span className="text-[10px] font-bold absolute top-2 right-2"
                    style={{ color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}
                  >{colVarLabel}</span>
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute w-px origin-top-left"
                      style={{ height: '140%', transform: 'rotate(45deg)', top: 0, left: 0, background: 'var(--border)' }}
                    />
                  </div>
                </div>
                {grayCols.map(label => (
                  <div key={label} className="flex items-center justify-center shrink-0"
                    style={{ width: CELL_SIZE, height: CELL_SIZE, background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
                  >
                    <span className="text-sm font-bold"
                      style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
                    >{label}</span>
                  </div>
                ))}
              </div>

              {/* Data rows */}
              <div className="relative">
                {grayRows.map((rLabel, rIdx) => (
                  <Fragment key={rLabel}>
                    <div className="flex">
                      <div className="flex items-center justify-center shrink-0"
                        style={{ width: CELL_SIZE, height: CELL_SIZE, background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
                      >
                        <span className="text-sm font-bold"
                          style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
                        >{rLabel}</span>
                      </div>
                      {grayCols.map((_, cIdx) => {
                        const idx = getMintermIndex(rIdx, cIdx, numVars);
                        const val = getCellVal(idx);
                        return (
                          <div key={`${rIdx}-${cIdx}`}
                            onClick={() => cycleCell(idx)}
                            className="flex items-center justify-center relative shrink-0 select-none transition-all duration-150 active:scale-95"
                            style={{
                              width: CELL_SIZE, height: CELL_SIZE,
                              background: cellBg(val),
                              border: '1px solid var(--border)',
                              cursor: 'pointer',
                              boxShadow: cellGlow(val),
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary-border)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                          >
                            <span className="absolute top-1.5 right-2 text-[9px]"
                              style={{ color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}
                            >{idx}</span>
                            <span className="text-xl font-black"
                              style={{
                                color: cellColor(val),
                                fontFamily: "'JetBrains Mono', monospace",
                                textShadow: val === '1' ? '0 0 12px rgba(59,130,246,0.6)' : 'none',
                              }}
                            >{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Fragment>
                ))}

                {/* Loop overlays — pointer-events:none so clicks reach cells */}
                <div className="absolute top-0"
                  style={{ left: CELL_SIZE, width: cols * CELL_SIZE, height: rows * CELL_SIZE, pointerEvents: 'none' }}
                >
                  {kmapGroups.map((group, gIdx) =>
                    group.rects.map((rect, rIdx) => {
                      const left   = rect.startCol * CELL_SIZE + 5;
                      const top    = rect.startRow * CELL_SIZE + 5;
                      const width  = (rect.endCol - rect.startCol + 1) * CELL_SIZE - 10;
                      const height = (rect.endRow - rect.startRow + 1) * CELL_SIZE - 10;
                      const isHov  = hoveredGroup?.term === group.term;
                      const border = group.color.replace(/[\d.]+\)$/, '0.75)');
                      const bg     = group.color.replace(/[\d.]+\)$/, isHov ? '0.14)' : '0.06)');
                      const glow   = group.color.replace(/[\d.]+\)$/, '0.4)');
                      return (
                        <div key={`${gIdx}-${rIdx}`}
                          className="absolute rounded-xl transition-all duration-150"
                          style={{
                            left, top, width, height,
                            backgroundColor: bg,
                            border: `2px solid ${border}`,
                            boxShadow: isHov ? `0 0 0 1px ${border}, 0 0 20px ${glow}` : `0 0 8px ${group.color.replace(/[\d.]+\)$/, '0.2)')}`,
                            zIndex: 10,
                          }}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Result panel */}
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <p className="section-label mb-3">Summary</p>
            <div className="space-y-2">
              {[
                { label: 'Minterms (1)',     value: minterms.length > 0  ? `m(${minterms.join(', ')})` : '—' },
                { label: "Don't Cares (X)",  value: dontCares.length > 0 ? `d(${dontCares.join(', ')})` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="text-xs font-semibold text-right"
                    style={{ color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}
                  >{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Minimized expression */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <p className="section-label mb-2">Minimized Expression</p>
            <div className="py-2 min-h-12 flex items-center">
              {result ? (
                <span className="text-2xl font-black"
                  style={{
                    color: 'var(--primary-hover)',
                    fontFamily: "'JetBrains Mono', monospace",
                    textShadow: '0 0 16px rgba(59,130,246,0.4)',
                  }}
                >
                  {result.simplifiedText}
                </span>
              ) : (
                <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
                  Fill cells above…
                </span>
              )}
            </div>
          </div>

          {/* Groups */}
          {kmapGroups.length > 0 && (
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <p className="section-label mb-3">Groups</p>
              <div className="space-y-2">
                {kmapGroups.map(group => {
                  const isHov = hoveredGroup?.term === group.term;
                  return (
                    <div key={group.term}
                      onMouseEnter={() => setHoveredGroup(group)}
                      onMouseLeave={() => setHoveredGroup(null)}
                      className="flex items-center justify-between p-2.5 rounded-lg cursor-default transition-all duration-150"
                      style={isHov ? {
                        background: group.color.replace(/[\d.]+\)$/, '0.1)'),
                        border: `1px solid ${group.color.replace(/[\d.]+\)$/, '0.5)')}`,
                      } : {
                        background: 'var(--surface-hover)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-3 w-3 rounded-sm"
                          style={{
                            backgroundColor: group.color.replace(/[\d.]+\)$/, '0.7)'),
                            border: `1px solid ${group.color.replace(/[\d.]+\)$/, '0.9)')}`,
                          }}
                        />
                        <span className="font-bold text-sm"
                          style={{ color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}
                        >{group.term}</span>
                      </div>
                      <span className="text-xs"
                        style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
                      >{group.binary}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Use expression button */}
          {result?.simplifiedText && result.simplifiedText !== '0' && (
            <button onClick={handleUseExpression}
              className={sent ? 'btn-secondary' : 'btn-primary'}
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
            >
              {sent
                ? <><Check className="h-4 w-4" /> Sent to Expression Input</>
                : <><ArrowRight className="h-4 w-4" /> Use This Expression</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
