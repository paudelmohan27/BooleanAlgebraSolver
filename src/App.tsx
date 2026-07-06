import { useAppStore } from './store/appStore';
import ExpressionInput from './components/ExpressionInput';
import TruthTable from './components/TruthTable';
import KMap from './components/KMap';
import LogicCircuit from './components/LogicCircuit';
import StepEvaluation from './components/StepEvaluation';
import StatsPanel from './components/StatsPanel';
import EducationalPanel from './components/EducationalPanel';
import SimplificationSteps from './components/SimplificationSteps';

const TABS = [
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'table', label: 'Truth Table', emoji: '📊' },
  { id: 'circuit', label: 'Circuit', emoji: '🔌' },
  { id: 'kmap', label: 'K-Map', emoji: '🧩' },
  { id: 'learn', label: 'Learn', emoji: '📖' },
];

export default function App() {
  const { activeTab, setActiveTab, parsedAST } = useAppStore();

  return (
    <div className="min-h-screen circuit-bg flex flex-col" style={{ color: 'var(--text)' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(9,9,11,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          {/* Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Logo mark */}
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              ΛΒ
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                Logic Lab
              </span>
            </div>
          </div>

          {/* Live indicator */}
          <div className="hidden md:flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}
            />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Live</span>
          </div>
        </div>
      </header>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav
        className="sticky top-14 z-40"
        style={{
          background: 'rgba(9,9,11,0.97)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-tab${isActive ? ' active' : ''}`}
                >
                  <span>{tab.emoji}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── Content ────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {activeTab === 'home' && (
          <>
            {/* Hero bar */}
            <div
              className="rounded-2xl px-7 py-6 relative overflow-hidden"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              {/* Glow corner */}
              <div
                className="absolute top-0 left-0 w-72 h-20 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 0% 0%, rgba(59,130,246,0.1) 0%, transparent 70%)',
                  borderRadius: '16px 0 0 0',
                }}
              />
              <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="section-label mb-1">Boolean Algebra IDE</p>
                  <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                    Simplify. Visualize. Understand.
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Enter any boolean expression for instant truth tables, K-Maps, circuits &amp; proofs.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {[
                    { label: 'Quine-McCluskey', badge: 'Engine' },
                    { label: 'Don\'t Cares', badge: 'K-Map' },
                  ].map(({ label, badge }) => (
                    <div key={label}
                      className="px-3 py-2 rounded-lg text-xs hidden md:block"
                      style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                    >
                      <span className="font-semibold" style={{ color: 'var(--text)' }}>{label}</span>
                      <span className="ml-1 badge badge-primary">{badge}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <ExpressionInput />
                {parsedAST && <SimplificationSteps />}
                {parsedAST && <StepEvaluation />}
              </div>
              <div className="lg:col-span-1">
                <StatsPanel />
              </div>
            </div>
          </>
        )}

        {activeTab === 'table' && <TruthTable />}
        {activeTab === 'circuit' && <LogicCircuit />}
        {activeTab === 'kmap' && <KMap />}
        {activeTab === 'learn' && <EducationalPanel />}
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer
        className="mt-auto py-4"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          <p>Logic Lab — Boolean Algebra IDE</p>
          <p>Built For Students</p>
        </div>
      </footer>
    </div>
  );
}
