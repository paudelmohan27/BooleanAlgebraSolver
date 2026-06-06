import { useState, useMemo, Fragment } from 'react';
import { useAppStore } from '../store/appStore';
import { getKMapDimensions, getMintermIndex, solveKMapGroups, GRAY_CODE_2, GRAY_CODE_4 } from '../logic/kmapSolver';
import type { KMapGroup } from '../logic/kmapSolver';
import { Grid, Info } from 'lucide-react';

const CELL_SIZE = 64; // px per cell

export default function KMap() {
  const { variables, minterms, primeImplicants, parsedAST } = useAppStore();
  const [hoveredGroup, setHoveredGroup] = useState<KMapGroup | null>(null);

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
    return grayRows.flatMap((rLabel, r) =>
      grayCols.map((cLabel, c) => ({
        row: r, col: c, labelRow: rLabel, labelCol: cLabel,
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

  if (!parsedAST) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
        <Grid className="h-10 w-10 mb-3 text-slate-300" />
        <p className="font-semibold text-base text-slate-500">No active expression</p>
        <p className="text-sm mt-1">Enter a valid expression on the Home tab.</p>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-2xl">
        <Info className="h-10 w-10 mb-3 text-violet-400" />
        <p className="font-semibold text-base text-slate-700">K-Map Not Supported</p>
        <p className="text-sm mt-2 text-center max-w-sm text-slate-500">
          Karnaugh Maps require <strong>2–4 variables</strong>. This expression has {numVars} variables.
          Simplification is still performed using Quine-McCluskey.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">Karnaugh Map</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Gray Code cell mapping with prime implicant loop overlays.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Grid */}
        <div className="lg:col-span-2 flex items-start justify-center">
          <div className="relative">
            {/* Top variable label */}
            <div
              className="absolute text-xs font-bold text-slate-500 text-center"
              style={{ left: CELL_SIZE + 2, top: -22, width: cols * CELL_SIZE }}
            >
              {colVarLabel} →
            </div>

            {/* Left variable label */}
            <div
              className="absolute text-xs font-bold text-slate-500"
              style={{
                top: CELL_SIZE,
                left: -28,
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                height: rows * CELL_SIZE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {rowVarLabel} →
            </div>

            {/* The grid table */}
            <div className="mt-6" style={{ paddingLeft: CELL_SIZE }}>
              {/* Header row: diagonal label + col headers */}
              <div className="flex">
                {/* Diagonal corner cell */}
                <div
                  className="border border-slate-300 bg-slate-50 flex items-end justify-start p-1 relative shrink-0"
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                >
                  <span className="text-xs font-bold text-slate-400 absolute bottom-1 left-1.5">{rowVarLabel}</span>
                  <span className="text-xs font-bold text-slate-400 absolute top-1 right-1.5">{colVarLabel}</span>
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute w-px bg-slate-300 origin-top-left" style={{ height: '130%', transform: 'rotate(45deg)', top: 0, left: 0 }} />
                  </div>
                </div>
                {/* Col headers */}
                {grayCols.map((label) => (
                  <div
                    key={label}
                    className="border border-slate-300 bg-slate-50 flex items-center justify-center shrink-0"
                    style={{ width: CELL_SIZE, height: CELL_SIZE }}
                  >
                    <span className="font-mono text-sm font-bold text-slate-600">{label}</span>
                  </div>
                ))}
              </div>

              {/* Data rows with overlay */}
              <div className="relative">
                {/* Row headers + cells */}
                {grayRows.map((rLabel, rIdx) => (
                  <Fragment key={rLabel}>
                    <div className="flex">
                      {/* Row header */}
                      <div
                        className="border border-slate-300 bg-slate-50 flex items-center justify-center shrink-0"
                        style={{ width: CELL_SIZE, height: CELL_SIZE }}
                      >
                        <span className="font-mono text-sm font-bold text-slate-600">{rLabel}</span>
                      </div>
                      {/* Data cells */}
                      {grayCols.map((_, cIdx) => {
                        const cell = gridCells.find((c) => c.row === rIdx && c.col === cIdx);
                        if (!cell) return null;
                        return (
                          <div
                            key={`${rIdx}-${cIdx}`}
                            className="border border-slate-300 flex items-center justify-center relative shrink-0 bg-white"
                            style={{ width: CELL_SIZE, height: CELL_SIZE }}
                          >
                            <span className="absolute top-1 right-1.5 text-[9px] font-mono text-slate-300">
                              {cell.mintermIndex}
                            </span>
                            <span className={`font-mono text-lg font-black ${
                              cell.value ? 'text-violet-600' : 'text-slate-300'
                            }`}>
                              {cell.value ? '1' : '0'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </Fragment>
                ))}

                {/* Loop overlays — positioned absolutely over the data cells area (offset by row header width) */}
                <div
                  className="absolute top-0 pointer-events-none"
                  style={{ left: CELL_SIZE, width: cols * CELL_SIZE, height: rows * CELL_SIZE }}
                >
                  {kmapGroups.map((group, gIdx) =>
                    group.rects.map((rect, rIdx) => {
                      const left = rect.startCol * CELL_SIZE + 4;
                      const top = rect.startRow * CELL_SIZE + 4;
                      const width = (rect.endCol - rect.startCol + 1) * CELL_SIZE - 8;
                      const height = (rect.endRow - rect.startRow + 1) * CELL_SIZE - 8;
                      const isHovered = hoveredGroup?.term === group.term;
                      return (
                        <div
                          key={`${gIdx}-${rIdx}`}
                          onMouseEnter={() => setHoveredGroup(group)}
                          onMouseLeave={() => setHoveredGroup(null)}
                          className="absolute rounded-xl border-2 pointer-events-auto cursor-help transition-all duration-200"
                          style={{
                            left, top, width, height,
                            backgroundColor: group.color,
                            borderColor: group.color.replace('0.3', '0.8'),
                            boxShadow: isHovered ? `0 0 0 2px ${group.color.replace('0.3', '0.6')}` : 'none',
                            zIndex: isHovered ? 20 : 10,
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

        {/* Legend */}
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
            <h4 className="font-semibold text-violet-800 mb-2 flex items-center gap-1.5 text-sm">
              <Info className="h-4 w-4" /> About Loops
            </h4>
            <p className="text-xs text-violet-700 leading-relaxed">
              Colored loops group adjacent 1s in powers of 2.
              Hover loops to highlight the corresponding prime implicant term.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Prime Implicants
            </h4>
            {kmapGroups.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs">
                No groups (expression evaluates to 0).
              </div>
            ) : (
              <div className="space-y-2">
                {kmapGroups.map((group) => {
                  const isHovered = hoveredGroup?.term === group.term;
                  return (
                    <div
                      key={group.term}
                      onMouseEnter={() => setHoveredGroup(group)}
                      onMouseLeave={() => setHoveredGroup(null)}
                      className={`flex items-center justify-between p-2.5 border rounded-lg transition-all duration-150 cursor-default ${
                        isHovered ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-3.5 w-3.5 rounded-sm border"
                          style={{
                            backgroundColor: group.color.replace('0.3', '0.7'),
                            borderColor: group.color.replace('0.3', '0.9'),
                          }}
                        />
                        <span className="font-mono font-bold text-slate-800 text-sm">{group.term}</span>
                      </div>
                      <span className="font-mono text-xs text-slate-400">{group.binary}</span>
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
