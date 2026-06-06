// Quine-McCluskey simplifier and canonical forms generator

// Represents a term in the Quine-McCluskey algorithm.
// binary: e.g. "01-1" for a 4-variable term.
// minterms: list of decimal minterms covered by this term, e.g. [5, 7].
interface QMTerm {
  binary: string;
  minterms: number[];
  combined: boolean;
}


// Helper: Check if two binary strings differ by exactly one bit, and combine them
function combineTerms(t1: QMTerm, t2: QMTerm): QMTerm | null {
  const len = t1.binary.length;
  let diffCount = 0;
  let diffIndex = -1;

  for (let i = 0; i < len; i++) {
    if (t1.binary[i] !== t2.binary[i]) {
      diffCount++;
      diffIndex = i;
    }
  }

  if (diffCount === 1) {
    const combinedBinary =
      t1.binary.substring(0, diffIndex) +
      '-' +
      t1.binary.substring(diffIndex + 1);
    
    // Merge minterms and sort them
    const combinedMinterms = Array.from(
      new Set([...t1.minterms, ...t2.minterms])
    ).sort((a, b) => a - b);

    return {
      binary: combinedBinary,
      minterms: combinedMinterms,
      combined: false,
    };
  }

  return null;
}

// Helper: Check if a term covers a minterm
function coversMinterm(qmBinary: string, mintermBinary: string): boolean {
  for (let i = 0; i < qmBinary.length; i++) {
    if (qmBinary[i] !== '-' && qmBinary[i] !== mintermBinary[i]) {
      return false;
    }
  }
  return true;
}

// The Quine-McCluskey simplification algorithm
export function simplifyExpression(
  variables: string[],
  minterms: number[]
): {
  simplifiedText: string;
  reductionPercentage: number;
  primeImplicants: string[];
} {
  const numVars = variables.length;

  if (minterms.length === 0) {
    return {
      simplifiedText: '0',
      reductionPercentage: 100,
      primeImplicants: [],
    };
  }

  if (minterms.length === Math.pow(2, numVars)) {
    return {
      simplifiedText: '1',
      reductionPercentage: 100,
      primeImplicants: [],
    };
  }

  // Phase 1: Generate Prime Implicants
  // Group 0: terms of size 1 (the initial minterms)
  let currentGroup: QMTerm[] = minterms.map((m) => {
    const bin = m.toString(2).padStart(numVars, '0');
    return {
      binary: bin,
      minterms: [m],
      combined: false,
    };
  });

  const primeImplicantsList: QMTerm[] = [];

  while (currentGroup.length > 0) {
    const nextGroup: QMTerm[] = [];

    // Compare all pairs in the current group
    for (let i = 0; i < currentGroup.length; i++) {
      for (let j = i + 1; j < currentGroup.length; j++) {
        const combined = combineTerms(currentGroup[i], currentGroup[j]);
        if (combined) {
          currentGroup[i].combined = true;
          currentGroup[j].combined = true;

          // Check if this combined term already exists in nextGroup
          const exists = nextGroup.some((t) => t.binary === combined.binary);
          if (!exists) {
            nextGroup.push(combined);
          }
        }
      }
    }

    // Collect prime implicants (terms that were not combined)
    for (const term of currentGroup) {
      if (!term.combined) {
        // Avoid duplicate PIs in list
        const exists = primeImplicantsList.some((t) => t.binary === term.binary);
        if (!exists) {
          primeImplicantsList.push(term);
        }
      }
    }

    currentGroup = nextGroup;
  }

  // Phase 2: Solve the Prime Implicant Chart
  // Columns: all minterms
  // Rows: prime implicants
  const chart: Record<number, QMTerm[]> = {};
  for (const m of minterms) {
    chart[m] = [];
    const mBin = m.toString(2).padStart(numVars, '0');
    for (const pi of primeImplicantsList) {
      if (coversMinterm(pi.binary, mBin)) {
        chart[m].push(pi);
      }
    }
  }

  const selectedPIs: QMTerm[] = [];
  const coveredMinterms = new Set<number>();

  // Find Essential Prime Implicants (EPIs)
  // These are PIs that are the ONLY cover for at least one minterm.
  for (const m of minterms) {
    if (chart[m].length === 1) {
      const epi = chart[m][0];
      if (!selectedPIs.some((pi) => pi.binary === epi.binary)) {
        selectedPIs.push(epi);
        epi.minterms.forEach((cm) => coveredMinterms.add(cm));
      }
    }
  }

  // Remove covered minterms from the list of remaining minterms
  let remainingMinterms = minterms.filter((m) => !coveredMinterms.has(m));

  // Find remaining PIs that cover remaining minterms (Greedy Set Cover)
  while (remainingMinterms.length > 0) {
    // Find the PI that covers the maximum number of remaining minterms
    let bestPI: QMTerm | null = null;
    let maxCovered = -1;

    for (const pi of primeImplicantsList) {
      if (selectedPIs.some((sel) => sel.binary === pi.binary)) continue;

      const coveredCount = pi.minterms.filter((m) =>
        remainingMinterms.includes(m)
      ).length;

      if (coveredCount > maxCovered) {
        maxCovered = coveredCount;
        bestPI = pi;
      }
    }

    if (bestPI && maxCovered > 0) {
      selectedPIs.push(bestPI);
      bestPI.minterms.forEach((cm) => coveredMinterms.add(cm));
      remainingMinterms = remainingMinterms.filter((m) => !coveredMinterms.has(m));
    } else {
      break; // No more cover possible
    }
  }

  // Phase 3: Build simplified expression string
  const termStrings = selectedPIs.map((pi) => {
    let termStr = '';
    for (let i = 0; i < numVars; i++) {
      const char = pi.binary[i];
      if (char === '1') {
        termStr += variables[i];
      } else if (char === '0') {
        termStr += variables[i] + "'";
      }
    }
    return termStr === '' ? '1' : termStr;
  });

  // Sort terms by length (simplest first) and alphabetically
  termStrings.sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length;
    return a.localeCompare(b);
  });

  const simplifiedText = termStrings.join('+');

  // Calculate reduction percentage
  // Original is sum of minterms, each with full variables
  // e.g. A'B'C' + A'BC' (length = 2 terms * 4 chars each = 8)
  // Simplified terms length: count of symbols (variables, operators, primes)
  // Let's estimate complexity using character count (excluding '+')
  const originalComplexity = minterms.length * numVars;
  const simplifiedComplexity = selectedPIs.reduce((sum, pi) => {
    let termWeight = 0;
    for (const char of pi.binary) {
      if (char === '1') termWeight += 1; // e.g. A
      if (char === '0') termWeight += 2; // e.g. A'
    }
    return sum + (termWeight === 0 ? 1 : termWeight);
  }, 0);

  const reduction =
    originalComplexity > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((originalComplexity - simplifiedComplexity) /
                originalComplexity) *
                100
            )
          )
        )
      : 0;

  return {
    simplifiedText: simplifiedText || '0',
    reductionPercentage: reduction,
    // Return only the SELECTED (minimal cover) prime implicants, not all of them.
    // primeImplicantsList contains every PI found by Q-M; selectedPIs is the
    // minimal subset that covers all minterms (essential PIs + greedy picks).
    primeImplicants: selectedPIs.map((pi) => {
      let termStr = '';
      for (let i = 0; i < numVars; i++) {
        const char = pi.binary[i];
        if (char === '1') termStr += variables[i];
        if (char === '0') termStr += variables[i] + "'";
      }
      return termStr === '' ? '1' : termStr;
    }),
  };
}

// Generate SOP (Sum of Products) Form
export function generateSOP(variables: string[], minterms: number[]): string {
  if (minterms.length === 0) return '0';
  if (minterms.length === Math.pow(2, variables.length)) return '1';

  return minterms
    .map((m) => {
      const bin = m.toString(2).padStart(variables.length, '0');
      let term = '';
      for (let i = 0; i < variables.length; i++) {
        term += bin[i] === '1' ? variables[i] : `${variables[i]}'`;
      }
      return term;
    })
    .join(' + ');
}

// Generate POS (Product of Sums) Form
export function generatePOS(variables: string[], maxterms: number[]): string {
  if (maxterms.length === 0) return '1';
  if (maxterms.length === Math.pow(2, variables.length)) return '0';

  return maxterms
    .map((m) => {
      const bin = m.toString(2).padStart(variables.length, '0');
      const terms: string[] = [];
      for (let i = 0; i < variables.length; i++) {
        terms.push(bin[i] === '0' ? variables[i] : `${variables[i]}'`);
      }
      return `(${terms.join('+')})`;
    })
    .join('');
}
