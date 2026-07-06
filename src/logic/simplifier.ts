// Quine-McCluskey simplifier and canonical forms generator

// Represents a term in the Quine-McCluskey algorithm.
// binary: e.g. "01-1" for a 4-variable term.
// minterms: list of decimal minterms covered by this term, e.g. [5, 7].
interface QMTerm {
  binary: string;
  minterms: number[];
  combined: boolean;
}

// Step-by-step simplification types
export interface QMCombination {
  t1Bin: string;       // binary string e.g. "000"
  t2Bin: string;       // binary string e.g. "001"
  resultBin: string;   // binary string e.g. "00-"
  t1Term: string;      // human readable e.g. "A'B'C'"
  t2Term: string;      // human readable e.g. "A'B'C"
  resultTerm: string;  // human readable e.g. "A'B'"
  eliminated: string;  // e.g. "C"
}

export interface SimplificationStep {
  stepNum: number;
  title: string;
  rule: string;
  explanation: string;
  terms: string[];
  combinations?: QMCombination[];
  isFinal: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function binaryToTermStr(binary: string, variables: string[]): string {
  let term = '';
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') term += variables[i];
    else if (binary[i] === '0') term += variables[i] + "'";
    // '-' means eliminated (don't care in term) — skip
  }
  return term || '1';
}

function findEliminatedVar(bin1: string, bin2: string, variables: string[]): string {
  for (let i = 0; i < bin1.length; i++) {
    if (bin1[i] !== bin2[i]) return variables[i];
  }
  return '?';
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

// ─── Core QM Engine (shared) ───────────────────────────────────────────────────

interface QMResult {
  selectedPIs: QMTerm[];
  primeImplicantsList: QMTerm[];
  rounds: Array<{
    roundNum: number;
    combinations: QMCombination[];
    newTerms: QMTerm[];
  }>;
}

function runQM(
  variables: string[],
  minterms: number[],
  dontCares: number[]
): QMResult {
  const numVars = variables.length;
  const allCells = [...new Set([...minterms, ...dontCares])];

  let currentGroup: QMTerm[] = allCells.map((m) => ({
    binary: m.toString(2).padStart(numVars, '0'),
    minterms: [m],
    combined: false,
  }));

  const primeImplicantsList: QMTerm[] = [];
  const rounds: QMResult['rounds'] = [];
  let roundNum = 1;

  while (currentGroup.length > 0) {
    const nextGroup: QMTerm[] = [];
    const combinations: QMCombination[] = [];

    for (let i = 0; i < currentGroup.length; i++) {
      for (let j = i + 1; j < currentGroup.length; j++) {
        const combined = combineTerms(currentGroup[i], currentGroup[j]);
        if (combined) {
          currentGroup[i].combined = true;
          currentGroup[j].combined = true;
          if (!nextGroup.some((t) => t.binary === combined.binary)) {
            nextGroup.push(combined);
            combinations.push({
              t1Bin: currentGroup[i].binary,
              t2Bin: currentGroup[j].binary,
              resultBin: combined.binary,
              t1Term: binaryToTermStr(currentGroup[i].binary, variables),
              t2Term: binaryToTermStr(currentGroup[j].binary, variables),
              resultTerm: binaryToTermStr(combined.binary, variables),
              eliminated: findEliminatedVar(currentGroup[i].binary, currentGroup[j].binary, variables),
            });
          }
        }
      }
    }

    for (const term of currentGroup) {
      if (!term.combined) {
        if (!primeImplicantsList.some((t) => t.binary === term.binary)) {
          primeImplicantsList.push(term);
        }
      }
    }

    if (combinations.length > 0) {
      rounds.push({ roundNum, combinations, newTerms: [...nextGroup] });
    }

    currentGroup = nextGroup;
    roundNum++;
  }

  // Cover chart — only minterms must be covered (not don't cares)
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

  // Essential PIs
  for (const m of minterms) {
    if (chart[m] && chart[m].length === 1) {
      const epi = chart[m][0];
      if (!selectedPIs.some((pi) => pi.binary === epi.binary)) {
        selectedPIs.push(epi);
        epi.minterms.forEach((cm) => coveredMinterms.add(cm));
      }
    }
  }

  // Greedy cover for remaining minterms
  let remainingMinterms = minterms.filter((m) => !coveredMinterms.has(m));
  while (remainingMinterms.length > 0) {
    let bestPI: QMTerm | null = null;
    let maxCovered = -1;
    for (const pi of primeImplicantsList) {
      if (selectedPIs.some((sel) => sel.binary === pi.binary)) continue;
      const coveredCount = pi.minterms.filter((m) => remainingMinterms.includes(m)).length;
      if (coveredCount > maxCovered) { maxCovered = coveredCount; bestPI = pi; }
    }
    if (bestPI && maxCovered > 0) {
      selectedPIs.push(bestPI);
      bestPI.minterms.forEach((cm) => coveredMinterms.add(cm));
      remainingMinterms = remainingMinterms.filter((m) => !coveredMinterms.has(m));
    } else break;
  }

  return { selectedPIs, primeImplicantsList, rounds };
}

function pisToStrings(pis: QMTerm[], variables: string[]): string[] {
  return pis.map((pi) => binaryToTermStr(pi.binary, variables));
}

// ─── Public API ────────────────────────────────────────────────────────────────

// Original simplifier (no don't cares, for backward compatibility)
export function simplifyExpression(
  variables: string[],
  minterms: number[]
): {
  simplifiedText: string;
  reductionPercentage: number;
  primeImplicants: string[];
} {
  return simplifyWithDontCares(variables, minterms, []);
}

// Extended simplifier with don't care support
export function simplifyWithDontCares(
  variables: string[],
  minterms: number[],
  dontCares: number[] = []
): {
  simplifiedText: string;
  reductionPercentage: number;
  primeImplicants: string[];
} {
  const numVars = variables.length;

  if (minterms.length === 0) {
    return { simplifiedText: '0', reductionPercentage: 100, primeImplicants: [] };
  }
  if (minterms.length === Math.pow(2, numVars)) {
    return { simplifiedText: '1', reductionPercentage: 100, primeImplicants: [] };
  }

  const { selectedPIs } = runQM(variables, minterms, dontCares);

  const termStrings = pisToStrings(selectedPIs, variables);
  termStrings.sort((a, b) => a.length !== b.length ? a.length - b.length : a.localeCompare(b));
  const simplifiedText = termStrings.join('+') || '0';

  const originalComplexity = minterms.length * numVars;
  const simplifiedComplexity = selectedPIs.reduce((sum, pi) => {
    let w = 0;
    for (const c of pi.binary) {
      if (c === '1') w += 1;
      if (c === '0') w += 2;
    }
    return sum + (w === 0 ? 1 : w);
  }, 0);

  const reductionPercentage = originalComplexity > 0
    ? Math.max(0, Math.min(100, Math.round(((originalComplexity - simplifiedComplexity) / originalComplexity) * 100)))
    : 0;

  return {
    simplifiedText,
    reductionPercentage,
    primeImplicants: termStrings,
  };
}

// Step-by-step simplification with full Q-M trace
export function simplifyWithSteps(
  variables: string[],
  minterms: number[],
  dontCares: number[] = []
): SimplificationStep[] {
  const numVars = variables.length;
  const steps: SimplificationStep[] = [];
  let stepNum = 1;

  if (minterms.length === 0) {
    return [{
      stepNum: 1, isFinal: true,
      title: 'Expression Evaluates to 0',
      rule: 'Empty Function',
      explanation: 'No minterms present — the function is identically 0.',
      terms: ['0'],
    }];
  }
  if (minterms.length === Math.pow(2, numVars)) {
    return [{
      stepNum: 1, isFinal: true,
      title: 'Expression Evaluates to 1',
      rule: 'Tautology',
      explanation: 'All possible minterms are present — the function is identically 1.',
      terms: ['1'],
    }];
  }

  // Step 1: Canonical SOP
  const canonicalTerms = minterms.map(m =>
    binaryToTermStr(m.toString(2).padStart(numVars, '0'), variables)
  );
  steps.push({
    stepNum: stepNum++,
    title: 'Canonical SOP (Sum of Minterms)',
    rule: 'Standard Form',
    explanation: `Expand to canonical Sum of Products. Each minterm m(${minterms.join(', ')}) becomes a full product term containing all ${numVars} variables.`,
    terms: canonicalTerms,
    isFinal: false,
  });

  // Steps 2+: Q-M rounds
  const { selectedPIs, primeImplicantsList, rounds } = runQM(variables, minterms, dontCares);

  for (const round of rounds) {
    const newTermStrs = [...new Set(round.newTerms.map(t => binaryToTermStr(t.binary, variables)))];
    steps.push({
      stepNum: stepNum++,
      title: `Adjacency Grouping — Round ${round.roundNum}`,
      rule: "XA + XA' = X  (Boolean Adjacency)",
      explanation: `Combine pairs of terms that differ in exactly one variable. The differing variable is eliminated. ${round.combinations.length} new group${round.combinations.length > 1 ? 's' : ''} formed.`,
      terms: newTermStrs,
      combinations: round.combinations,
      isFinal: false,
    });
  }

  // Step: Prime Implicants
  if (primeImplicantsList.length > 0) {
    const piTermStrs = primeImplicantsList.map(pi => binaryToTermStr(pi.binary, variables));
    steps.push({
      stepNum: stepNum++,
      title: 'Prime Implicants Identified',
      rule: 'Prime Implicant Theorem',
      explanation: 'Terms that cannot be combined further are prime implicants — they represent the largest possible groupings of adjacent 1s.',
      terms: piTermStrs,
      isFinal: false,
    });
  }

  // Step: Essential PI selection
  const essentialTerms = pisToStrings(selectedPIs, variables);
  steps.push({
    stepNum: stepNum++,
    title: 'Select Minimum Cover',
    rule: 'Essential Prime Implicants',
    explanation: 'Choose essential prime implicants (those that uniquely cover at least one minterm), then apply a greedy cover for any remaining minterms.',
    terms: essentialTerms,
    isFinal: false,
  });

  // Final step
  const finalTerms = [...essentialTerms].sort((a, b) =>
    a.length !== b.length ? a.length - b.length : a.localeCompare(b)
  );
  const finalExpr = finalTerms.join(' + ') || '0';
  steps.push({
    stepNum: stepNum++,
    title: 'Minimized Expression',
    rule: 'Minimal SOP Form',
    explanation: `The minimized Sum of Products with the fewest literals.`,
    terms: [finalExpr],
    isFinal: true,
  });

  return steps;
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
