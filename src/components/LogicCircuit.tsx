import { useState, useRef, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { layoutCircuit } from '../logic/circuitLayout';
import type { CircuitNode } from '../logic/circuitLayout';
import { ZoomIn, ZoomOut, RotateCcw, Download, Cpu } from 'lucide-react';

export default function LogicCircuit() {
  const { parsedAST, expression } = useAppStore();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  const layout = useMemo(() => {
    if (!parsedAST) return null;
    try { return layoutCircuit(parsedAST); } catch { return null; }
  }, [parsedAST]);

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.3, +(z - 0.15).toFixed(2)));
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(2.5, +(z * (e.deltaY < 0 ? 1.06 : 0.94)).toFixed(2))));
  };

  const safeFilename = expression.replace(/[\s()'+·⊕⊙↑↓*]+/g, '_').slice(0, 40);

  const exportSVG = () => {
    if (!svgRef.current) return;
    const el = svgRef.current.cloneNode(true) as SVGSVGElement;
    el.querySelector('#circuit-viewport')?.removeAttribute('transform');
    const src = new XMLSerializer().serializeToString(el);
    Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([src], { type: 'image/svg+xml;charset=utf-8' })),
      download: `circuit_${safeFilename}.svg`,
    }).click();
  };

  const exportPNG = () => {
    if (!svgRef.current || !layout) return;
    const el = svgRef.current.cloneNode(true) as SVGSVGElement;
    el.querySelector('#circuit-viewport')?.removeAttribute('transform');
    const src = new XMLSerializer().serializeToString(el);
    const canvas = document.createElement('canvas');
    canvas.width = layout.width; canvas.height = layout.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml;charset=utf-8' }));
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      Object.assign(document.createElement('a'), { href: canvas.toDataURL('image/png'), download: `circuit_${safeFilename}.png` }).click();
    };
    img.src = url;
  };

  const renderGate = (node: CircuitNode) => {
    const { x, y, gateType } = node;

    const inputLeads = gateType === 'NOT' ? (
      <line x1={x - 25} y1={y} x2={x - 15} y2={y} stroke="#6d28d9" strokeWidth="2" />
    ) : (
      <>
        <line x1={x - 25} y1={y - 12} x2={x - 20} y2={y - 12} stroke="#6d28d9" strokeWidth="2" />
        <line x1={x - 25} y1={y + 12} x2={x - 20} y2={y + 12} stroke="#6d28d9" strokeWidth="2" />
      </>
    );

    const outputX = ['NOT', 'NAND', 'NOR', 'XNOR'].includes(gateType || '') ? x + 29 : x + 20;
    const outputLead = <line x1={outputX} y1={y} x2={x + 25} y2={y} stroke="#6d28d9" strokeWidth="2" />;

    const gateColor = '#6d28d9';
    const gateFill = '#ede9fe';

    const shape = (() => {
      switch (gateType) {
        case 'AND':
          return <path d={`M ${x-20} ${y-15} L ${x} ${y-15} A 15 15 0 0 1 ${x} ${y+15} L ${x-20} ${y+15} Z`} fill={gateFill} stroke={gateColor} strokeWidth="2" />;
        case 'NAND':
          return <><path d={`M ${x-20} ${y-15} L ${x} ${y-15} A 15 15 0 0 1 ${x} ${y+15} L ${x-20} ${y+15} Z`} fill={gateFill} stroke={gateColor} strokeWidth="2" /><circle cx={x+24} cy={y} r="4" fill={gateFill} stroke={gateColor} strokeWidth="2" /></>;
        case 'OR':
          return <path d={`M ${x-20} ${y-15} Q ${x-10} ${y} ${x-20} ${y+15} Q ${x-5} ${y+15} ${x+20} ${y} Q ${x-5} ${y-15} ${x-20} ${y-15}`} fill={gateFill} stroke={gateColor} strokeWidth="2" />;
        case 'NOR':
          return <><path d={`M ${x-20} ${y-15} Q ${x-10} ${y} ${x-20} ${y+15} Q ${x-5} ${y+15} ${x+20} ${y} Q ${x-5} ${y-15} ${x-20} ${y-15}`} fill={gateFill} stroke={gateColor} strokeWidth="2" /><circle cx={x+24} cy={y} r="4" fill={gateFill} stroke={gateColor} strokeWidth="2" /></>;
        case 'XOR':
          return <><path d={`M ${x-20} ${y-15} Q ${x-10} ${y} ${x-20} ${y+15} Q ${x-5} ${y+15} ${x+20} ${y} Q ${x-5} ${y-15} ${x-20} ${y-15}`} fill={gateFill} stroke={gateColor} strokeWidth="2" /><path d={`M ${x-25} ${y-15} Q ${x-15} ${y} ${x-25} ${y+15}`} fill="none" stroke={gateColor} strokeWidth="2" /></>;
        case 'XNOR':
          return <><path d={`M ${x-20} ${y-15} Q ${x-10} ${y} ${x-20} ${y+15} Q ${x-5} ${y+15} ${x+20} ${y} Q ${x-5} ${y-15} ${x-20} ${y-15}`} fill={gateFill} stroke={gateColor} strokeWidth="2" /><path d={`M ${x-25} ${y-15} Q ${x-15} ${y} ${x-25} ${y+15}`} fill="none" stroke={gateColor} strokeWidth="2" /><circle cx={x+24} cy={y} r="4" fill={gateFill} stroke={gateColor} strokeWidth="2" /></>;
        case 'NOT':
          return <><path d={`M ${x-15} ${y-12} L ${x+8} ${y} L ${x-15} ${y+12} Z`} fill={gateFill} stroke={gateColor} strokeWidth="2" /><circle cx={x+12} cy={y} r="4" fill={gateFill} stroke={gateColor} strokeWidth="2" /></>;
        default: return null;
      }
    })();

    return (
      <g key={node.id}>
        {inputLeads}
        {shape}
        {outputLead}
        <text x={x} y={y - 22} textAnchor="middle" fill="#8b5cf6" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="700">
          {gateType}
        </text>
      </g>
    );
  };

  if (!parsedAST || !layout) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
        <Cpu className="h-10 w-10 mb-3 text-slate-300" />
        <p className="font-semibold text-base text-slate-500">No active expression</p>
        <p className="text-sm mt-1">Enter an expression on the Home tab.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Logic Circuit</h3>
          <p className="text-sm text-slate-500 mt-0.5">Drag to pan · Scroll to zoom · Export clean vectors</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-lg">
            <button onClick={handleZoomIn} className="p-1.5 text-slate-600 hover:text-violet-600 hover:bg-white rounded-md transition-all cursor-pointer" title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-500 px-1 min-w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomOut} className="p-1.5 text-slate-600 hover:text-violet-600 hover:bg-white rounded-md transition-all cursor-pointer" title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </button>
            <button onClick={handleReset} className="p-1.5 text-slate-600 hover:text-violet-600 hover:bg-white rounded-md transition-all cursor-pointer" title="Reset">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <button onClick={exportSVG} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-600 active:scale-95 transition-all cursor-pointer">
            <Download className="h-3.5 w-3.5" /> SVG
          </button>
          <button onClick={exportPNG} className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 border border-violet-500 rounded-lg text-xs font-semibold text-white active:scale-95 transition-all cursor-pointer">
            <Download className="h-3.5 w-3.5" /> PNG
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 h-[460px] shadow-inner">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className={isDragging ? 'cursor-grabbing select-none' : 'cursor-grab select-none'}
        >
          <g
            id="circuit-viewport"
            transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}
          >
            {/* Dot grid background */}
            <defs>
              <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="#e2e8f0" />
              </pattern>
            </defs>
            <rect width={layout.width} height={layout.height} fill="url(#dot-grid)" />

            {/* Wires */}
            {layout.connections.map((conn) => {
              const midX = conn.fromX + (conn.toX - conn.fromX) * 0.5;
              return (
                <path
                  key={conn.id}
                  d={`M ${conn.fromX} ${conn.fromY} C ${midX} ${conn.fromY}, ${midX} ${conn.toY}, ${conn.toX} ${conn.toY}`}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Nodes */}
            {layout.nodes.map((node) => {
              if (node.type === 'INPUT') return (
                <g key={node.id}>
                  <circle cx={node.x} cy={node.y} r="16" fill="#f5f3ff" stroke="#6d28d9" strokeWidth="2" />
                  <text x={node.x} y={node.y + 4} textAnchor="middle" fill="#4c1d95" fontSize="12" fontFamily="Fira Code, monospace" fontWeight="700">
                    {node.name}
                  </text>
                </g>
              );
              if (node.type === 'OUTPUT') return (
                <g key={node.id}>
                  <polygon
                    points={`${node.x-22},${node.y-14} ${node.x+22},${node.y-14} ${node.x+35},${node.y} ${node.x+22},${node.y+14} ${node.x-22},${node.y+14}`}
                    fill="#ecfdf5"
                    stroke="#059669"
                    strokeWidth="2"
                  />
                  <text x={node.x + 2} y={node.y + 4} textAnchor="middle" fill="#065f46" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="800">
                    OUT
                  </text>
                </g>
              );
              if (node.type === 'GATE') return renderGate(node);
              return null;
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
