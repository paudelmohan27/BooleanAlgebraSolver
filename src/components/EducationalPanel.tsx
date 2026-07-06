import { useState } from 'react';
import { BookOpen, ChevronRight, ChevronDown } from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  content: {
    intro: string;
    sections: {
      heading: string;
      body: string;
      example?: string;
    }[];
  };
}

const TOPICS: Topic[] = [
  {
    id: 'basics',
    title: 'Boolean Algebra Basics',
    content: {
      intro: 'Boolean algebra is a branch of algebra dealing with values that are either true (1) or false (0), forming the mathematical foundation of digital logic.',
      sections: [
        { heading: 'AND Operation  (·)', body: 'Outputs 1 only when all inputs are 1.', example: 'A · B = 1  iff  A=1 and B=1' },
        { heading: 'OR Operation   (+)', body: 'Outputs 1 when at least one input is 1.', example: 'A + B = 1  iff  A=1 or B=1' },
        { heading: "NOT Operation  (')", body: 'Inverts the input.', example: "A' = 1  iff  A = 0" },
      ],
    },
  },
  {
    id: 'laws',
    title: 'Boolean Laws & Theorems',
    content: {
      intro: 'These identities let you simplify any boolean expression algebraically.',
      sections: [
        { heading: 'Identity',       body: 'A + 0 = A   and   A · 1 = A' },
        { heading: 'Null',           body: 'A + 1 = 1   and   A · 0 = 0' },
        { heading: 'Complement',     body: "A + A' = 1  and   A · A' = 0" },
        { heading: 'Idempotent',     body: 'A + A = A   and   A · A = A' },
        { heading: 'Commutativity',  body: 'A + B = B + A   and   A · B = B · A' },
        { heading: 'Associativity',  body: '(A+B)+C = A+(B+C)   and   (A·B)·C = A·(B·C)' },
        { heading: "De Morgan's",    body: "(A+B)' = A'·B'   and   (A·B)' = A'+B'",  example: "Complement flips + ↔ ·" },
        { heading: 'Absorption',     body: "A + A·B = A   and   A·(A+B) = A",         example: 'A absorbs any term containing A' },
        { heading: 'Consensus',      body: "AB + A'C + BC = AB + A'C",                example: 'BC is redundant' },
      ],
    },
  },
  {
    id: 'kmap',
    title: 'Karnaugh Maps',
    content: {
      intro: 'A K-Map is a grid-based visual method for minimizing boolean functions up to 4 variables.',
      sections: [
        { heading: 'Layout',   body: 'Cells are arranged in Gray Code order so adjacent cells differ in exactly one variable.' },
        { heading: 'Grouping', body: 'Group adjacent 1s in rectangles whose size is a power of 2 (1, 2, 4, 8…). Larger groups → simpler terms.' },
        { heading: 'Wrapping', body: 'The K-Map wraps around: the top row is adjacent to the bottom, and the left column to the right.' },
        { heading: "Don't Cares", body: "Mark cells X when the output is irrelevant. X cells can be included in groups to make them larger." },
      ],
    },
  },
  {
    id: 'qm',
    title: 'Quine-McCluskey Algorithm',
    content: {
      intro: 'An algorithmic, tabular minimization method that works for any number of variables — the basis for electronic CAD tools.',
      sections: [
        { heading: 'Step 1 — List Minterms',       body: 'Convert each minterm to binary and group by the number of 1 bits.' },
        { heading: 'Step 2 — Combine Pairs',        body: 'Repeatedly combine pairs of terms that differ in exactly one bit, replacing the differing bit with a dash (−).' },
        { heading: 'Step 3 — Prime Implicants',     body: 'Any term that cannot be combined further is a prime implicant.' },
        { heading: 'Step 4 — Essential PIs',        body: 'Build a cover chart. A PI is essential if it uniquely covers a minterm. Include all essential PIs.' },
        { heading: 'Step 5 — Minimal Cover',        body: "Use a greedy or Petrick\u2019s method to cover remaining minterms with the fewest additional PIs." },
      ],
    },
  },
  {
    id: 'gates',
    title: 'Logic Gates & Circuits',
    content: {
      intro: 'Every boolean expression can be realized as a network of logic gates.',
      sections: [
        { heading: 'AND Gate',  body: 'Two or more inputs; outputs 1 only when all inputs are 1.  Symbol: D-shape.' },
        { heading: 'OR Gate',   body: 'Outputs 1 when any input is 1.  Symbol: curved-back D.' },
        { heading: 'NOT Gate',  body: 'Inverts a single input.  Symbol: triangle with bubble.' },
        { heading: 'NAND Gate', body: 'AND followed by NOT.  Universal gate — any logic can be built from NANDs alone.' },
        { heading: 'NOR Gate',  body: 'OR followed by NOT.  Also universal.' },
        { heading: 'XOR Gate',  body: 'Outputs 1 when an odd number of inputs are 1.  Used in adders.' },
        { heading: 'Wire colors', body: 'In this app: active HIGH → blue, active LOW → grey.', example: 'Hover gates in the Circuit tab to inspect values.' },
      ],
    },
  },
  {
    id: 'sop-pos',
    title: 'SOP and POS Forms',
    content: {
      intro: 'Two canonical forms for representing boolean functions.',
      sections: [
        { heading: 'Sum of Products (SOP)', body: 'OR of AND terms. Each AND term (minterm) covers one row with F=1.', example: "F = A'B + AB' + AB" },
        { heading: 'Product of Sums (POS)', body: 'AND of OR terms. Each OR term (maxterm) covers one row with F=0.', example: "F = (A+B)(A'+B)" },
        { heading: 'Canonical vs Minimal',  body: 'Canonical forms include every variable in every term. Minimal forms are simplified — fewer literals, fewer gates.' },
      ],
    },
  },
];

export default function EducationalPanel() {
  const [activeTopic, setActiveTopic] = useState<string | null>('basics');
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const topic = TOPICS.find(t => t.id === activeTopic);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-float-in">

      {/* ── Sidebar ── */}
      <div className="md:col-span-1">
        <div className="glass p-4 sticky top-28">
          <div className="flex items-center gap-2 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-border)' }}
            >
              <BookOpen className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Learn</span>
          </div>

          <nav className="space-y-1">
            {TOPICS.map(t => {
              const isActive = activeTopic === t.id;
              return (
                <button key={t.id}
                  onClick={() => { setActiveTopic(t.id); setExpandedSection(null); }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-medium cursor-pointer transition-all"
                  style={isActive ? {
                    background: 'var(--primary-bg)',
                    border: '1px solid var(--primary-border)',
                    color: 'var(--primary-hover)',
                  } : {
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: 'var(--text-muted)',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget.style.background = 'var(--surface-hover)'); }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget.style.background = 'transparent'); }}
                >
                  <span className="leading-snug">{t.title}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="md:col-span-3">
        {topic ? (
          <div className="glass p-6 animate-float-in" key={topic.id}>
            {/* Title */}
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>{topic.title}</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
              {topic.content.intro}
            </p>

            {/* Sections */}
            <div className="space-y-2">
              {topic.content.sections.map((sec, idx) => {
                const isOpen = expandedSection === idx;
                return (
                  <div key={idx}
                    className="rounded-xl overflow-hidden transition-all duration-150"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  >
                    <button
                      onClick={() => setExpandedSection(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left cursor-pointer transition-all"
                      style={{ background: isOpen ? 'rgba(59,130,246,0.04)' : 'transparent' }}
                      onMouseEnter={e => { if (!isOpen) (e.currentTarget.style.background = 'var(--surface-hover)'); }}
                      onMouseLeave={e => { if (!isOpen) (e.currentTarget.style.background = 'transparent'); }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Number */}
                        <div className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                          style={isOpen ? {
                            background: 'var(--primary)',
                            color: '#fff',
                          } : {
                            background: 'var(--surface-hover)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {idx + 1}
                        </div>
                        <span className="text-sm font-semibold"
                          style={{ color: isOpen ? 'var(--primary-hover)' : 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {sec.heading}
                        </span>
                      </div>
                      {isOpen
                        ? <ChevronUp   className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />
                        : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: 'var(--text-dim)' }} />
                      }
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 animate-float-in"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          {sec.body}
                        </p>
                        {sec.example && (
                          <div className="mt-3 code-block">
                            <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {sec.example}
                            </code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="glass flex flex-col items-center justify-center p-12">
            <BookOpen className="h-10 w-10 mb-3" style={{ color: 'var(--border)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select a topic from the left panel</p>
          </div>
        )}
      </div>
    </div>
  );
}
