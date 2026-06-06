import { useAppStore } from './store/appStore';
import ExpressionInput from './components/ExpressionInput';
import TruthTable from './components/TruthTable';
import KMap from './components/KMap';
import LogicCircuit from './components/LogicCircuit';
import StepEvaluation from './components/StepEvaluation';
import StatsPanel from './components/StatsPanel';
import EducationalPanel from './components/EducationalPanel';
import { Home as HomeIcon, Table, Cpu, Grid, BookOpen, Binary } from 'lucide-react';

export default function App() {
  const { activeTab, setActiveTab, parsedAST } = useAppStore();

  const tabs = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'table', label: 'Truth Table', icon: Table },
    { id: 'circuit', label: 'Circuit', icon: Cpu },
    { id: 'kmap', label: 'K-Map', icon: Grid },
    { id: 'learn', label: 'Learn', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">

      {/* Top Navbar */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Binary className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight leading-none text-slate-900">
                Logic Lab
              </h1>
              <p className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase mt-0.5">
                Boolean Algebra IDE
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tab Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-[57px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <ExpressionInput />
              {parsedAST && <StepEvaluation />}
            </div>
            <div className="lg:col-span-1">
              <StatsPanel />
            </div>
          </div>
        )}

        {activeTab === 'table' && <TruthTable />}
        {activeTab === 'circuit' && <LogicCircuit />}
        {activeTab === 'kmap' && <KMap />}
        {activeTab === 'learn' && <EducationalPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-auto py-5 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center md:flex md:items-center md:justify-between text-xs text-slate-400 font-medium">
          <p>© {new Date().getFullYear()} Logic Lab — Boolean Algebra &amp; Digital Design IDE</p>
          <p className="mt-1 md:mt-0">Built with React + TypeScript</p>
        </div>
      </footer>

    </div>
  );
}
