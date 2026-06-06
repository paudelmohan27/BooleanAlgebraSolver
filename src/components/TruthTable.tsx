import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { evaluateAST, parseExpression, getVariables } from '../logic/parser';
import type { ASTNode } from '../logic/parser';
import { FileText, Download, Search, ArrowUpDown, ChevronDown, ChevronUp, Scale, CheckCircle2, XCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface TableRow {
  index: number;
  vals: boolean[];
  out: boolean;
  outCompare: boolean | null;
}

export default function TruthTable() {
  const { expression, parsedAST, variables } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortCol, setSortCol] = useState<number | 'out' | 'compare' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [compareMode, setCompareMode] = useState(false);
  const [compareExpr, setCompareExpr] = useState('');

  // Parse second expression
  const { compareAST, compareVars, compareError } = useMemo<{
    compareAST: ASTNode | null;
    compareVars: string[];
    compareError: string | null;
  }>(() => {
    if (!compareMode || !compareExpr.trim()) return { compareAST: null, compareVars: [], compareError: null };
    try {
      const ast = parseExpression(compareExpr);
      const vars = getVariables(ast);
      return { compareAST: ast, compareVars: vars, compareError: null };
    } catch (e: unknown) {
      return { compareAST: null, compareVars: [], compareError: (e as Error).message || 'Invalid expression' };
    }
  }, [compareMode, compareExpr]);

  // Union of all variables
  const allVariables = useMemo(() => {
    const s = new Set([...variables, ...(compareMode ? compareVars : [])]);
    return Array.from(s).sort();
  }, [variables, compareVars, compareMode]);

  // Compute truth table rows
  const combinations = useMemo<TableRow[]>(() => {
    if (!parsedAST || allVariables.length === 0) return [];
    if (allVariables.length > 10) return [];

    return Array.from({ length: Math.pow(2, allVariables.length) }, (_, i) => {
      const vals: boolean[] = [];
      const values: Record<string, boolean> = {};
      allVariables.forEach((v, vIdx) => {
        const bit = ((i >> (allVariables.length - 1 - vIdx)) & 1) === 1;
        vals.push(bit);
        values[v] = bit;
      });
      let out = false;
      try { out = evaluateAST(parsedAST, values); } catch { /* noop */ }
      let outCompare: boolean | null = null;
      if (compareMode && compareAST) {
        try { outCompare = evaluateAST(compareAST, values); } catch { /* noop */ }
      }
      return { index: i, vals, out, outCompare };
    });
  }, [parsedAST, allVariables, compareMode, compareAST]);

  const isEquivalent = useMemo(() => {
    if (!compareMode || !compareAST || combinations.length === 0) return null;
    return combinations.every((r) => r.out === r.outCompare);
  }, [combinations, compareMode, compareAST]);

  const handleSort = (col: number | 'out' | 'compare') => {
    if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const processedRows = useMemo(() => {
    let rows = [...combinations];
    if (searchQuery.trim()) {
      const q = searchQuery.replace(/\s+/g, '').toLowerCase();
      rows = rows.filter((r) => {
        const bin = r.vals.map((v) => v ? '1' : '0').join('');
        return bin.includes(q) || r.index.toString() === q || (q === '1' && r.out) || (q === '0' && !r.out);
      });
    }
    if (sortCol !== null) {
      rows.sort((a, b) => {
        let va = 0, vb = 0;
        if (sortCol === 'out') { va = a.out ? 1 : 0; vb = b.out ? 1 : 0; }
        else if (sortCol === 'compare') { va = a.outCompare ? 1 : 0; vb = b.outCompare ? 1 : 0; }
        else { va = a.vals[sortCol] ? 1 : 0; vb = b.vals[sortCol] ? 1 : 0; }
        return va !== vb ? (sortDir === 'asc' ? va - vb : vb - va) : a.index - b.index;
      });
    }
    return rows;
  }, [combinations, searchQuery, sortCol, sortDir]);

  const safeFilename = expression.replace(/[\s()'+·⊕⊙↑↓*]+/g, '_').slice(0, 40);

  const handleExportCSV = () => {
    if (!allVariables.length) return;
    let csv = [...allVariables, 'F1'].join(',') + (compareMode && compareAST ? ',F2,Match' : '') + '\n';
    combinations.forEach((r) => {
      let row = [...r.vals.map((v) => v ? '1' : '0'), r.out ? '1' : '0'].join(',');
      if (compareMode && compareAST && r.outCompare !== null) row += `,${r.outCompare ? '1' : '0'},${r.out === r.outCompare ? 'Yes' : 'No'}`;
      csv += row + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `truth_table_${safeFilename}.csv` }).click();
  };

  const handleExportJSON = () => {
    if (!allVariables.length) return;
    const data = {
      expression, compareExpression: compareMode ? compareExpr : undefined,
      isEquivalent: compareMode ? isEquivalent : undefined,
      variables: allVariables,
      rows: combinations.map((r) => {
        const inputs: Record<string, number> = {};
        allVariables.forEach((v, i) => { inputs[v] = r.vals[i] ? 1 : 0; });
        const row: Record<string, unknown> = { inputs, F1: r.out ? 1 : 0 };
        if (compareMode && compareAST && r.outCompare !== null) { row.F2 = r.outCompare ? 1 : 0; row.match = r.out === r.outCompare; }
        return row;
      }),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `truth_table_${safeFilename}.json` }).click();
  };

  const handleExportPDF = () => {
    if (!allVariables.length) return;
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Truth Table Report', 14, 18);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    let y = 26;
    doc.text(`F1: ${expression}`, 14, y); y += 6;
    if (compareMode && compareAST) {
      doc.text(`F2: ${compareExpr}`, 14, y); y += 6;
      doc.text(`Equivalent: ${isEquivalent ? 'Yes' : 'No'}`, 14, y); y += 6;
    }
    y += 4;
    const colW = Math.min(20, 170 / (allVariables.length + (compareMode && compareAST ? 3 : 1)));
    doc.setFont('Helvetica', 'bold');
    let x = 14;
    doc.text('Row', x, y); x += colW;
    allVariables.forEach((v) => { doc.text(v, x, y); x += colW; });
    doc.text('F1', x, y); x += colW;
    if (compareMode && compareAST) { doc.text('F2', x, y); x += colW; doc.text('=', x, y); }
    y += 2; doc.line(14, y, 196, y); y += 5;
    doc.setFont('Helvetica', 'normal');
    combinations.forEach((r) => {
      x = 14;
      doc.text(r.index.toString(), x, y); x += colW;
      r.vals.forEach((v) => { doc.text(v ? '1' : '0', x, y); x += colW; });
      doc.text(r.out ? '1' : '0', x, y); x += colW;
      if (compareMode && compareAST && r.outCompare !== null) { doc.text(r.outCompare ? '1' : '0', x, y); x += colW; doc.text(r.out === r.outCompare ? '✓' : '✗', x, y); }
      y += 6;
      if (y > 275) { doc.addPage(); y = 20; }
    });
    doc.save(`truth_table_${safeFilename}.pdf`);
  };

  const SortIcon = ({ col }: { col: number | 'out' | 'compare' }) =>
    sortCol === col ? (
      sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-violet-600" /> : <ChevronDown className="h-3 w-3 text-violet-600" />
    ) : <ArrowUpDown className="h-3 w-3 text-slate-300" />;

  if (!parsedAST) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
        <FileText className="h-10 w-10 mb-3 text-slate-300" />
        <p className="font-semibold text-base text-slate-500">No active expression</p>
        <p className="text-sm mt-1">Enter an expression on the Home tab first.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Truth Table</h3>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            F1: <span className="text-violet-600 font-semibold">{expression}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
              compareMode
                ? 'bg-violet-50 border-violet-300 text-violet-700'
                : 'bg-white border-slate-300 text-slate-600 hover:border-violet-300 hover:text-violet-700'
            }`}
          >
            <Scale className="h-3.5 w-3.5" /> {compareMode ? 'Exit Compare' : 'Compare'}
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-600 active:scale-95 transition-all cursor-pointer">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button onClick={handleExportJSON} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-600 active:scale-95 transition-all cursor-pointer">
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 border border-violet-500 rounded-lg text-xs font-semibold text-white active:scale-95 transition-all cursor-pointer">
            <FileText className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Compare mode panel */}
      {compareMode && (
        <div className="mb-5 p-4 bg-slate-50 border border-violet-200 rounded-xl">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Compare with F2
              </label>
              <input
                type="text"
                value={compareExpr}
                onChange={(e) => setCompareExpr(e.target.value)}
                placeholder="e.g. A'B' or A XNOR B"
                className={`w-full px-4 py-2.5 bg-white border rounded-lg text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 transition-all ${
                  compareError && compareExpr.trim()
                    ? 'border-red-400 focus:ring-red-100'
                    : 'border-slate-300 focus:border-violet-400 focus:ring-violet-100'
                }`}
              />
              {compareError && compareExpr.trim() && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> {compareError}
                </p>
              )}
            </div>
            {compareAST && (
              <div className="shrink-0 pt-6">
                {isEquivalent ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-bold">Equivalent</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-300 rounded-xl text-red-700">
                    <XCircle className="h-5 w-5" />
                    <span className="text-sm font-bold">Not Equivalent</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter rows by binary, row number, or output..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-inner max-h-[520px]">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 z-10">
            <tr>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">#</th>
              {allVariables.map((v, idx) => (
                <th
                  key={v}
                  onClick={() => handleSort(idx)}
                  className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-200 select-none transition-colors"
                >
                  <div className="flex items-center gap-1">{v} <SortIcon col={idx} /></div>
                </th>
              ))}
              <th
                onClick={() => handleSort('out')}
                className="px-4 py-3 text-xs font-bold text-violet-600 uppercase tracking-wider cursor-pointer hover:bg-slate-200 select-none transition-colors border-l border-slate-200"
              >
                <div className="flex items-center gap-1">F1 <SortIcon col="out" /></div>
              </th>
              {compareMode && compareAST && (
                <>
                  <th
                    onClick={() => handleSort('compare')}
                    className="px-4 py-3 text-xs font-bold text-indigo-600 uppercase tracking-wider cursor-pointer hover:bg-slate-200 select-none transition-colors border-l border-slate-200"
                  >
                    <div className="flex items-center gap-1">F2 <SortIcon col="compare" /></div>
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-16">
                    Match
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {processedRows.map((row) => (
              <tr key={row.index} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{row.index}</td>
                {row.vals.map((val, idx) => (
                  <td key={idx} className="px-4 py-3">
                    <span className={`font-mono font-semibold ${val ? 'text-blue-600' : 'text-slate-400'}`}>{val ? '1' : '0'}</span>
                  </td>
                ))}
                <td className="px-4 py-3 border-l border-slate-100">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                    row.out
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {row.out ? '1' : '0'}
                  </span>
                </td>
                {compareMode && compareAST && row.outCompare !== null && (
                  <>
                    <td className="px-4 py-3 border-l border-slate-100">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                        row.outCompare
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {row.outCompare ? '1' : '0'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.out === row.outCompare
                        ? <span className="text-emerald-600 font-bold text-sm">✓</span>
                        : <span className="text-red-500 font-bold text-sm">✗</span>
                      }
                    </td>
                  </>
                )}
              </tr>
            ))}
            {processedRows.length === 0 && (
              <tr>
                <td colSpan={allVariables.length + (compareMode && compareAST ? 4 : 2)} className="px-6 py-10 text-center text-slate-400 text-sm">
                  No rows matching "{searchQuery}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
