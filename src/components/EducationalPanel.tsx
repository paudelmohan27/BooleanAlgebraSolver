import { useState } from 'react';
import { BookOpen, Award, CheckCircle2, ChevronRight } from 'lucide-react';

interface TutorialTopic {
  title: string;
  category: string;
  content: React.ReactNode;
}

export default function EducationalPanel() {
  const [activeTopicIdx, setActiveTopicIdx] = useState(0);

  const topics: TutorialTopic[] = [
    {
      title: 'Boolean Algebra',
      category: 'Foundations',
      content: (
        <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
          <p>
            <strong>Boolean Algebra</strong> is a branch of mathematics where variable values are <em>true</em> and <em>false</em>,
            denoted as <strong>1</strong> and <strong>0</strong>. Unlike numerical algebra, it deals with logical relationships.
          </p>
          <div className="bg-violet-50 border border-violet-200 p-4 rounded-xl">
            <h5 className="font-bold text-violet-800 mb-3 text-xs uppercase tracking-wider">Fundamental Laws</h5>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs text-violet-700">
              <li>• Identity: A + 0 = A,  A · 1 = A</li>
              <li>• Annulment: A + 1 = 1, A · 0 = 0</li>
              <li>• Idempotent: A + A = A, A · A = A</li>
              <li>• Complement: A + A' = 1, A · A' = 0</li>
              <li>• Double Negation: (A')' = A</li>
              <li>• De Morgan's: (A+B)' = A'B'</li>
            </ul>
          </div>
          <p>
            De Morgan's laws are critical in digital design — they let engineers convert complex expressions into
            equivalent forms suitable for universal gate (NAND/NOR) construction.
          </p>
        </div>
      ),
    },
    {
      title: 'Truth Tables',
      category: 'Foundations',
      content: (
        <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
          <p>
            A <strong>Truth Table</strong> lists all possible combinations of inputs and their resulting outputs.
            For <em>n</em> variables there are exactly <strong>2<sup>n</sup></strong> rows.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  {['A', 'B', 'AND (A·B)', 'OR (A+B)'].map((h) => (
                    <th key={h} className="px-4 py-2.5 font-bold text-slate-500 uppercase text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[[0,0,0,0],[0,1,0,1],[1,0,0,1],[1,1,1,1]].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {row.map((v, j) => (
                      <td key={j} className={`px-4 py-2.5 font-bold ${
                        j >= 2 ? (v ? 'text-emerald-600' : 'text-slate-400') : 'text-slate-600'
                      }`}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            You can compare two expressions by checking if their output columns match for all input rows — that's
            exactly what the Compare Mode in the Truth Table tab does.
          </p>
        </div>
      ),
    },
    {
      title: 'Logic Gates',
      category: 'Hardware',
      content: (
        <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
          <p>
            <strong>Logic Gates</strong> are the fundamental building blocks of digital systems. They implement Boolean
            functions by accepting binary inputs and producing a binary output.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: 'AND Gate', desc: 'Outputs 1 ONLY when all inputs are 1. Symbol: A·B', color: 'violet' },
              { name: 'OR Gate', desc: 'Outputs 1 when at least one input is 1. Symbol: A+B', color: 'indigo' },
              { name: 'NOT Gate', desc: "Inverts the input. Also called an inverter. Symbol: A'", color: 'blue' },
              { name: 'XOR Gate', desc: 'Outputs 1 when inputs are DIFFERENT. Symbol: A⊕B', color: 'cyan' },
              { name: 'NAND Gate', desc: 'Inverted AND — universal gate. Symbol: A↑B', color: 'emerald' },
              { name: 'NOR Gate', desc: 'Inverted OR — universal gate. Symbol: A↓B', color: 'teal' },
            ].map((g) => (
              <div key={g.name} className={`p-3.5 bg-${g.color}-50 border border-${g.color}-200 rounded-xl`}>
                <h6 className={`font-bold text-xs text-${g.color}-800 mb-1`}>{g.name}</h6>
                <p className={`text-xs text-${g.color}-700`}>{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Karnaugh Maps',
      category: 'Methods',
      content: (
        <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
          <p>
            A <strong>Karnaugh Map (K-Map)</strong> is a graphical method to simplify Boolean expressions.
            Cells are arranged in <strong>Gray Code</strong> order so adjacent cells differ by exactly one bit.
          </p>
          <div className="bg-violet-50 border border-violet-200 p-4 rounded-xl">
            <h5 className="font-bold text-violet-800 mb-3 text-xs uppercase tracking-wider">Grouping Rules</h5>
            <ul className="space-y-2 text-xs text-violet-700">
              <li className="flex items-start gap-1.5">• Groups must contain only 1s, in sizes of powers of 2 (1, 2, 4, 8).</li>
              <li className="flex items-start gap-1.5">• Cells may be grouped horizontally or vertically (no diagonals).</li>
              <li className="flex items-start gap-1.5">• Groups can wrap around edges (toroidal adjacency).</li>
              <li className="flex items-start gap-1.5">• Seek the largest and fewest groups possible for maximum simplification.</li>
            </ul>
          </div>
          <p>
            Each group corresponds to one product term in the final simplified SOP expression. Variables that
            don't change within a group are eliminated.
          </p>
        </div>
      ),
    },
    {
      title: 'SOP & POS Forms',
      category: 'Foundations',
      content: (
        <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
          <p>Any Boolean function can be expressed in two canonical standard forms:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="font-extrabold text-xs text-emerald-700 uppercase tracking-wide">Sum of Products (SOP)</span>
              <p className="text-xs text-emerald-700 mt-2">
                ORing together minterms (rows where output = 1). Each term is an AND of variables.
              </p>
              <code className="block mt-3 bg-white border border-emerald-200 p-2 rounded text-xs font-mono text-emerald-800">
                F = A'B + AB'
              </code>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="font-extrabold text-xs text-blue-700 uppercase tracking-wide">Product of Sums (POS)</span>
              <p className="text-xs text-blue-700 mt-2">
                ANDing together maxterms (rows where output = 0). Each term is an OR of variables.
              </p>
              <code className="block mt-3 bg-white border border-blue-200 p-2 rounded text-xs font-mono text-blue-800">
                F = (A+B)(A'+B')
              </code>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Universal Gates',
      category: 'Hardware',
      content: (
        <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
          <p>
            <strong>NAND</strong> and <strong>NOR</strong> are called <strong>Universal Gates</strong> because any Boolean
            function can be constructed using only one of these gate types.
          </p>
          <div className="bg-violet-50 border border-violet-200 p-4 rounded-xl">
            <h5 className="font-bold text-violet-800 mb-3 text-xs uppercase tracking-wider">NAND Equivalents</h5>
            <ul className="space-y-2 text-xs text-violet-700 font-mono">
              <li>• NOT A &nbsp;&nbsp; = A NAND A</li>
              <li>• A AND B = (A NAND B) NAND (A NAND B)</li>
              <li>• A OR B &nbsp;= (A NAND A) NAND (B NAND B)</li>
            </ul>
          </div>
          <p>
            In practice, NAND-only designs dominate CMOS chip manufacturing because they require fewer transistors
            and provide superior noise margins.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

      <div className="mb-6 flex items-center gap-2.5">
        <div className="h-8 w-8 bg-violet-100 rounded-lg flex items-center justify-center">
          <BookOpen className="h-4 w-4 text-violet-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Learn Boolean Logic</h3>
          <p className="text-xs text-slate-500 mt-0.5">Explore theory behind digital logic design</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Sidebar */}
        <div className="md:col-span-1 flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-3 md:pb-0 md:border-r border-b md:border-b-0 border-slate-200 md:pr-4">
          {topics.map((topic, idx) => {
            const isActive = idx === activeTopicIdx;
            return (
              <button
                key={topic.title}
                onClick={() => setActiveTopicIdx(idx)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold text-left shrink-0 transition-all duration-150 cursor-pointer w-full ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex flex-col">
                  <span className={`text-[9px] uppercase tracking-widest font-bold ${isActive ? 'text-violet-200' : 'text-slate-400'}`}>
                    {topic.category}
                  </span>
                  <span className="mt-0.5 font-bold">{topic.title}</span>
                </div>
                <ChevronRight className={`h-4 w-4 hidden md:block opacity-50 transition-transform ${isActive ? 'translate-x-0.5' : ''}`} />
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="md:col-span-3 flex flex-col justify-between min-h-72">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-violet-600 font-bold uppercase tracking-widest mb-2">
              <Award className="h-3.5 w-3.5" /> {topics[activeTopicIdx].category}
            </div>
            <h4 className="text-2xl font-black text-slate-900 mb-5">{topics[activeTopicIdx].title}</h4>
            {topics[activeTopicIdx].content}
          </div>
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Verified curriculum content
          </div>
        </div>

      </div>
    </div>
  );
}
