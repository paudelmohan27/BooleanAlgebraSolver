import { useState, useMemo, Fragment } from 'react';
import { useAppStore } from '../store/appStore';
import { getKMapDimensions, getMintermIndex, solveKMapGroups, GRAY_CODE_2, GRAY_CODE_4 } from '../logic/kmapSolver';
import type { KMapGroup } from '../logic/kmapSolver';
import { Grid3x3, Info, Zap, Eye, PenSquare } from 'lucide-react';
import KMapBuilder from './KMapBuilder';

const CELL_SIZE = 68;

export default function KMap() {
  const { variables, minterms, primeImplicants, parsedAST } = useAppStore();
  const [hoveredGroup, setHoveredGroup] = useState<KMapGroup | null>(null);
  const [mode, setMode] = useState<'solve' | 'build'>('solve');

  const numVars = variables.length;
  const isSupported = numVars >= 2 && numVars <= 4;

  const { rows, cols } = useMemo(() => {
    if (!isSupported) return { rows: 0, cols: 0 };
    return getKMapDimensions(numVars);
  }, [numVars, isSupported]);

  const grayRows = rows === 4 ? GRAY_CODE_4 : GRAY_CODE_2;
  const grayCols = cols === 4 ? GRAY_CODE_4 : GRAY_CODE_2;

  const gridCells = useMemo(() => {
    if (!isSupported) return [];
    return grayRows.flatMap((_, r) =>
      grayCols.map((_, c) => ({
        row: r, col: c,
        mintermIndex: getMintermIndex(r, c, numVars),
        value: minterms.includes(getMintermIndex(r, c, numVars)),
      }))
    );
  }, [rows, cols, numVars, minterms, isSupported, grayRows, grayCols]);

  const kmapGroups = useMemo<KMapGroup[]>(() => {
    if (!isSupported) return [];
    return solveKMapGroups(variables, primeImplicants);
  }, [variables, primeImplicants, isSupported]);

  const rowVarLabel = numVars === 2 ? variables[0] : variables.slice(0, numVars === 3 ? 1 : 2).join('');
  const colVarLabel = numVars === 2 ? variables[1] : variables.slice(numVars === 3 ? 1 : 2).join('');

  // ── Shared mode toggle bar ──────────────────────────────────
  const ModeBar = () => (
    <div className="flex items-center gap-1 mb-6 p-1 rounded-xl self-start"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      {([
        ['solve', Eye,       'Expression → K-Map'],
        ['build', PenSquare, 'Build K-Map'],
      ] as const).map(([m, Icon, label]) => (
        <button key={m} onClick={() => setMode(m)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all"
          style={mode === m ? {
            background: 'var(--primary)',
            color: '#fff',
            boxShadow: '0 0 12px rgba(59,130,246,0.3)',
          } : {
            color: 'var(--text-muted)',
          }}
        >
          <Icon className="h-3.5 w-3.5" /> {label}
        </button>
      ))}
    </div>
  );

  // ── Build mode ──────────────────────────────────────────────
  if (mode === 'build') {
    return (
      <div className="glass p-6 animate-float-in">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-border)' }}
          >
            <Grid3x3 className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>K-Map Builder</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Fill cells 0 / 1 / X and compute the minimized expression
            </p>
          </div>
        </div>
        <ModeBar />
        <KMapBuilder />
      </div>
    );
  }

  // ── No expression ───────────────────────────────────────────
  if (!parsedAST) {
    return (
      <div className="glass flex flex-col p-6 animate-float-in">
        <ModeBar />
        <div className="flex flex-col items-center justify-center py-12">
          <Grid3x3 className="h-10 w-10 mb-3" style={{ color: 'var(--border)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No active expression</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
            Enter an expression on Home, or switch to Build mode.
          </p>
        </div>
      </div>
    );
  }

  // ── Unsupported variable count ──────────────────────────────
  if (!isSupported) {
    return (
      <div className="glass flex flex-col p-6 animate-float-in">
        <ModeBar />
        <div className="flex flex-col items-center justify-center py-10">
          <Info className="h-10 w-10 mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-base font-bold" style={{ color: 'var(--text)' }}>K-Map Not Supported</p>
          <p className="text-sm mt-2 text-center max-w-sm" style={{ color: 'var(--text-muted)' }}>
            Karnaugh Maps require <strong style={{ color: 'var(--text)' }}>2–4 variables</strong>.
            This expression has {numVars} variables. Simplification still runs via Quine-McCluskey.
          </p>
        </div>
      </div>
    );
  }

  // ── Full K-Map ──────────────────────────────────────────────
  return (
    <div className="glass p-6 animate-float-in">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-border)' }}
        >
          <Grid3x3 className="h-4 w-4" style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Karnaugh Map</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Gray Code mapping · prime implicant overlays
          </p>
        </div>
      </div>
      <ModeBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Grid ── */}
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

            {/* Grid table */}
            <div>
              {/* Header row */}
              <div className="flex">
                {/* Corner */}
                <div className="flex items-end justify-start p-1.5 relative shrink-0"
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
                {/* Col headers */}
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
                      {/* Row header */}
                      <div className="flex items-center justify-center shrink-0"
                        style={{ width: CELL_SIZE, height: CELL_SIZE, background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
                      >
                        <span className="text-sm font-bold"
                          style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
                        >{rLabel}</span>
                      </div>
                      {/* Data cells */}
                      {grayCols.map((_, cIdx) => {
                        const cell = gridCells.find(c => c.row === rIdx && c.col === cIdx);
                        if (!cell) return null;
                        return (
                          <div key={`${rIdx}-${cIdx}`}
                            className="flex items-center justify-center relative shrink-0 transition-all duration-150"
                            style={{
                              width: CELL_SIZE, height: CELL_SIZE,
                              background: cell.value ? 'rgba(59,130,246,0.08)' : 'var(--bg)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <span className="absolute top-1.5 right-2 text-[9px]"
                              style={{ color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {cell.mintermIndex}
                            </span>
                            <span className="text-xl font-black"
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                ...(cell.value ? {
                                  color: 'var(--primary-hover)',
                                  textShadow: '0 0 14px rgba(59,130,246,0.6)',
                                } : {
                                  color: 'var(--text-dim)',
                                }),
                              }}
                            >
                              {cell.value ? '1' : '0'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </Fragment>
                ))}

                {/* Loop overlays */}
                <div className="absolute top-0 pointer-events-none"
                  style={{ left: CELL_SIZE, width: cols * CELL_SIZE, height: rows * CELL_SIZE }}
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
                          onMouseEnter={() => setHoveredGroup(group)}
                          onMouseLeave={() => setHoveredGroup(null)}
                          className="absolute rounded-xl pointer-events-auto cursor-help transition-all duration-150"
                          style={{
                            left, top, width, height,
                            backgroundColor: bg,
                            border: `2px solid ${border}`,
                            boxShadow: isHov ? `0 0 0 1px ${border}, 0 0 20px ${glow}` : `0 0 8px ${group.color.replace(/[\d.]+\)$/, '0.2)')}`,
                            zIndex: isHov ? 20 : 10,
                          }}
                          title={`Implicant: ${group.term}`}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-col gap-4">
          {/* Info */}
          <div className="p-4 rounded-xl"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
              <Info className="h-4 w-4" style={{ color: 'var(--primary)' }} /> About Loops
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Colored loops group adjacent 1s in powers of 2. Hover to highlight the prime implicant.
            </p>
          </div>

          {/* Prime implicants */}
          <div className="p-4 rounded-xl"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <h4 className="section-label mb-3 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} /> Prime Implicants
            </h4>
            {kmapGroups.length === 0 ? (
              <div className="text-center py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                No groups (function = 0)
              </div>
            ) : (
              <div className="space-y-2">
                {kmapGroups.map(group => {
                  const isHov = hoveredGroup?.term === group.term;
                  return (
                    <div key={group.term}
                      onMouseEnter={() => setHoveredGroup(group)}
                      onMouseLeave={() => setHoveredGroup(null)}
                      className="flex items-center justify-between p-2.5 rounded-lg transition-all duration-150 cursor-default"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
