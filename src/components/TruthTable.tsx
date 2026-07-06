import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { evaluateAST, parseExpression, getVariables } from '../logic/parser';
import type { ASTNode } from '../logic/parser';
import { Download, Search, ArrowUpDown, ChevronDown, ChevronUp, Scale, CheckCircle2, XCircle, Table2, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface TableRow {
  index: number;
  vals: boolean[];
  out: boolean;
  outCompare: boolean | null;
}

export default function TruthTable() {
  const { expression, parsedAST, variables } = useAppStore();

  const [searchQuery, setSearchQuery]   = useState('');
  const [sortCol, setSortCol]           = useState<number | 'out' | 'compare' | null>(null);
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('asc');
  const [compareMode, setCompareMode]   = useState(false);
  const [compareExpr, setCompareExpr]   = useState('');

  const { compareAST, compareVars, compareError } = useMemo<{
    compareAST: ASTNode | null; compareVars: string[]; compareError: string | null;
  }>(() => {
    if (!compareMode || !compareExpr.trim()) return { compareAST: null, compareVars: [], compareError: null };
    try {
      const ast = parseExpression(compareExpr);
      return { compareAST: ast, compareVars: getVariables(ast), compareError: null };
    } catch (e: unknown) {
      return { compareAST: null, compareVars: [], compareError: (e as Error).message || 'Invalid' };
    }
  }, [compareMode, compareExpr]);

  const allVariables = useMemo(() => {
    const s = new Set([...variables, ...(compareMode ? compareVars : [])]);
    return Array.from(s).sort();
  }, [variables, compareVars, compareMode]);

  const combinations = useMemo<TableRow[]>(() => {
    if (!parsedAST || allVariables.length === 0 || allVariables.length > 10) return [];
    return Array.from({ length: Math.pow(2, allVariables.length) }, (_, i) => {
      const vals: boolean[] = [];
      const values: Record<string, boolean> = {};
      allVariables.forEach((v, vIdx) => {
        const bit = ((i >> (allVariables.length - 1 - vIdx)) & 1) === 1;
        vals.push(bit); values[v] = bit;
      });
      let out = false;
      try { out = evaluateAST(parsedAST, values); } catch { /* noop */ }
      let outCompare: boolean | null = null;
      if (compareMode && compareAST) try { outCompare = evaluateAST(compareAST, values); } catch { /* noop */ }
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
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `truth_table_${safeFilename}.csv` }).click();
  };

  const handleExportJSON = () => {
    if (!allVariables.length) return;
    const data = {
      expression, variables: allVariables,
      rows: combinations.map((r) => {
        const inputs: Record<string, number> = {};
        allVariables.forEach((v, i) => { inputs[v] = r.vals[i] ? 1 : 0; });
        return { inputs, F1: r.out ? 1 : 0 };
      }),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `truth_table_${safeFilename}.json` }).click();
  };

  const handleExportPDF = () => {
    if (!allVariables.length) return;
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(16);
    doc.text('Truth Table — Logic Lab', 14, 18);
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`F1: ${expression}`, 14, 26);
    let y = 34;
    const colW = Math.min(20, 170 / (allVariables.length + 1));
    doc.setFont('Helvetica', 'bold');
    let x = 14; doc.text('#', x, y); x += colW;
    allVariables.forEach((v) => { doc.text(v, x, y); x += colW; });
    doc.text('F1', x, y);
    y += 2; doc.line(14, y, 196, y); y += 5;
    doc.setFont('Helvetica', 'normal');
    combinations.forEach((r) => {
      x = 14; doc.text(r.index.toString(), x, y); x += colW;
      r.vals.forEach((v) => { doc.text(v ? '1' : '0', x, y); x += colW; });
      doc.text(r.out ? '1' : '0', x, y);
      y += 6; if (y > 275) { doc.addPage(); y = 20; }
    });
    doc.save(`truth_table_${safeFilename}.pdf`);
  };

  const SortIcon = ({ col }: { col: number | 'out' | 'compare' }) =>
    sortCol === col
      ? sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      : <ArrowUpDown className="h-3 w-3" style={{ color: 'var(--text-dim)' }} />;

  if (!parsedAST) {
    return (
      <div className="glass flex flex-col items-center justify-center p-12 animate-float-in">
        <Table2 className="h-10 w-10 mb-3" style={{ color: 'var(--border)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No active expression</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>Enter an expression on the Home tab first.</p>
      </div>
    );
  }

  return (
    <div className="glass p-6 animate-float-in">

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-border)' }}
          >
            <Table2 className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Truth Table</h3>
            <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              F1: {expression}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={() => setCompareMode(!compareMode)}
            className={compareMode ? 'btn-primary' : 'btn-secondary'}
          >
            <Scale className="h-3.5 w-3.5" />
            {compareMode ? 'Exit Compare' : 'Compare'}
          </button>
          <div className="w-px h-5" style={{ background: 'var(--border)' }} />
          <button onClick={handleExportCSV}  className="btn-secondary"><Download className="h-3.5 w-3.5" /> CSV</button>
          <button onClick={handleExportJSON} className="btn-secondary"><Download className="h-3.5 w-3.5" /> JSON</button>
          <button onClick={handleExportPDF}  className="btn-primary" ><FileText className="h-3.5 w-3.5" /> PDF</button>
        </div>
      </div>

      {/* Compare panel */}
      {compareMode && (
        <div className="mb-5 p-4 rounded-xl animate-float-in"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1">
              <label className="section-label block mb-2">Compare with F2</label>
              <input
                type="text"
                value={compareExpr}
                onChange={(e) => setCompareExpr(e.target.value)}
                placeholder="e.g.  A'B' or A XNOR B"
                className={`ide-input${compareError && compareExpr.trim() ? ' error' : ''}`}
                style={{ borderRadius: 8 }}
              />
              {compareError && compareExpr.trim() && (
                <p className="text-xs mt-1.5 flex items-center gap-1"
                  style={{ color: 'var(--error)' }}
                >
                  <XCircle className="h-3 w-3" /> {compareError}
                </p>
              )}
            </div>
            {compareAST && (
              <div className="shrink-0 pt-6">
                {isEquivalent ? (
                  <div className="badge badge-success px-4 py-2.5 text-sm font-bold">
                    <CheckCircle2 className="h-4 w-4" /> Equivalent
                  </div>
                ) : (
                  <div className="badge badge-error px-4 py-2.5 text-sm font-bold">
                    <XCircle className="h-4 w-4" /> Not Equivalent
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-dim)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter rows by binary, row number, or output…"
          className="ide-input"
          style={{ paddingLeft: '2.5rem', borderRadius: 8 }}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border max-h-[520px]"
        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
      >
        <table className="truth-table">
          <thead>
            <tr>
              <th className="w-14">#</th>
              {allVariables.map((v, idx) => (
                <th key={v}
                  onClick={() => handleSort(idx)}
                  className="cursor-pointer select-none"
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <div className="flex items-center gap-1">{v}<SortIcon col={idx} /></div>
                </th>
              ))}
              <th onClick={() => handleSort('out')}
                className="cursor-pointer select-none"
                style={{ color: 'var(--primary-hover)', borderLeft: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--primary-hover)')}
              >
                <div className="flex items-center gap-1">F1<SortIcon col="out" /></div>
              </th>
              {compareMode && compareAST && (
                <>
                  <th onClick={() => handleSort('compare')}
                    className="cursor-pointer select-none"
                    style={{ borderLeft: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-1">F2<SortIcon col="compare" /></div>
                  </th>
                  <th className="text-center w-14">=</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {processedRows.map((row) => (
              <tr key={row.index}>
                <td style={{ color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {row.index}
                </td>
                {row.vals.map((val, idx) => (
                  <td key={idx}>
                    <span style={{
                      color: val ? 'var(--text)' : 'var(--text-dim)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: val ? 700 : 400,
                    }}>
                      {val ? '1' : '0'}
                    </span>
                  </td>
                ))}
                <td style={{ borderLeft: '1px solid var(--border)' }}>
                  <span className={`badge ${row.out ? 'badge-primary' : 'badge-muted'}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {row.out ? '1' : '0'}
                  </span>
                </td>
                {compareMode && compareAST && row.outCompare !== null && (
                  <>
                    <td style={{ borderLeft: '1px solid var(--border)' }}>
                      <span className={`badge ${row.outCompare ? 'badge-primary' : 'badge-muted'}`}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {row.outCompare ? '1' : '0'}
                      </span>
                    </td>
                    <td className="text-center">
                      {row.out === row.outCompare
                        ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
                        : <span style={{ color: 'var(--error)',   fontWeight: 700 }}>✗</span>
                      }
                    </td>
                  </>
                )}
              </tr>
            ))}
            {processedRows.length === 0 && (
              <tr>
                <td colSpan={allVariables.length + (compareMode && compareAST ? 4 : 2)}
                  className="text-center py-10"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No rows matching "{searchQuery}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Row count */}
      <p className="mt-3 text-xs text-right" style={{ color: 'var(--text-muted)' }}>
        {processedRows.length} / {combinations.length} rows
        {searchQuery && <> · filtered</>}
      </p>
    </div>
  );
}
