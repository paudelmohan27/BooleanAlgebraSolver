// Karnaugh Map Solver & Cell Coordinates Mapper

export interface KMapCell {
  row: number;
  col: number;
  labelRow: string; // e.g. "00"
  labelCol: string; // e.g. "01"
  mintermIndex: number;
  value: boolean;
}

export interface KMapRect {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

export interface KMapGroup {
  term: string; // e.g. "A'C"
  binary: string; // e.g. "0-1-"
  rects: KMapRect[]; // List of sub-rectangles (handles wrap-around)
  color: string; // Color assigned for display
}

// Color palette for K-Map groups
const GROUP_COLORS = [
  'rgba(59, 130, 246, 0.4)',  // Blue
  'rgba(239, 68, 68, 0.4)',   // Red
  'rgba(16, 185, 129, 0.4)',  // Emerald
  'rgba(245, 158, 11, 0.4)',  // Amber
  'rgba(139, 92, 246, 0.4)',  // Purple
  'rgba(236, 72, 153, 0.4)',  // Pink
  'rgba(6, 182, 212, 0.4)',   // Cyan
  'rgba(132, 204, 22, 0.4)',  // Lime
];

// Gray Code mapping
export const GRAY_CODE_2 = ['0', '1'];
export const GRAY_CODE_4 = ['00', '01', '11', '10'];

// Get row and col count based on number of variables
export function getKMapDimensions(numVars: number): { rows: number; cols: number } {
  if (numVars === 2) return { rows: 2, cols: 2 };
  if (numVars === 3) return { rows: 2, cols: 4 };
  if (numVars === 4) return { rows: 4, cols: 4 };
  throw new Error('K-Map supports only 2, 3, or 4 variables');
}

// Convert row/col index to binary and then to decimal minterm
export function getMintermIndex(
  row: number,
  col: number,
  numVars: number
): number {
  if (numVars === 2) {
    // Row is A, Col is B
    const a = GRAY_CODE_2[row];
    const b = GRAY_CODE_2[col];
    return parseInt(a + b, 2);
  } else if (numVars === 3) {
    // Row is A, Col is BC
    const a = GRAY_CODE_2[row];
    const bc = GRAY_CODE_4[col];
    return parseInt(a + bc, 2);
  } else if (numVars === 4) {
    // Row is AB, Col is CD
    const ab = GRAY_CODE_4[row];
    const cd = GRAY_CODE_4[col];
    return parseInt(ab + cd, 2);
  }
  throw new Error('Unsupported variable count');
}

// Find continuous sub-spans in a list of indices (handles wrap-around split)
// E.g. [0, 3] -> [{start:0, end:0}, {start:3, end:3}]
// E.g. [0, 1, 2] -> [{start:0, end:2}]
// maxVal is the size of the dimension (2 or 4)
function findSpans(indices: number[], maxVal: number): { start: number; end: number }[] {
  if (indices.length === 0) return [];
  indices = [...indices].sort((a, b) => a - b);

  // If it's a full span
  if (indices.length === maxVal) {
    return [{ start: 0, end: maxVal - 1 }];
  }

  // Find contiguous blocks
  const spans: { start: number; end: number }[] = [];
  let start = indices[0];
  let prev = indices[0];

  for (let i = 1; i < indices.length; i++) {
    const curr = indices[i];
    if (curr === prev + 1) {
      prev = curr;
    } else {
      spans.push({ start, end: prev });
      start = curr;
      prev = curr;
    }
  }
  spans.push({ start, end: prev });

  // If there's a wrap-around (e.g. includes both 0 and maxVal - 1),
  // and we have multiple spans, check if we should keep them separate (for split rendering)
  // Yes, for drawing, splitting them at the borders is exactly what we want!
  // E.g. [0, 3] -> row 0 rect and row 3 rect.
  return spans;
}

// Convert a prime implicant binary string (e.g. "0-1-") to K-Map Groups
export function solveKMapGroups(
  variables: string[],
  primeImplicants: string[]
): KMapGroup[] {
  const numVars = variables.length;
  if (numVars < 2 || numVars > 4) return [];

  // Helper to check if a binary term covers a row/col binary key
  const matchKey = (termBits: string, key: string): boolean => {
    for (let i = 0; i < termBits.length; i++) {
      if (termBits[i] !== '-' && termBits[i] !== key[i]) {
        return false;
      }
    }
    return true;
  };

  const { rows: maxRows, cols: maxCols } = getKMapDimensions(numVars);

  return primeImplicants.map((pi, index) => {
    // Reconstruct the term binary representation
    // Let's create a binary string representation (e.g. "0-1-")
    // PI is like "AB'" -> A=1, B=0, other variables = '-'
    let binary = '';
    let termStr = '';
    for (let i = 0; i < numVars; i++) {
      const v = variables[i];
      const match = pi.match(new RegExp(`${v}('?)`));
      if (match) {
        if (match[1] === "'") {
          binary += '0';
          termStr += v + "'";
        } else {
          binary += '1';
          termStr += v;
        }
      } else {
        binary += '-';
      }
    }

    // Split the binary string into row and col parts
    let rowBits = '';
    let colBits = '';
    if (numVars === 2) {
      // Row: A (index 0), Col: B (index 1)
      rowBits = binary[0];
      colBits = binary[1];
    } else if (numVars === 3) {
      // Row: A (index 0), Col: BC (index 1, 2)
      rowBits = binary[0];
      colBits = binary.substring(1, 3);
    } else if (numVars === 4) {
      // Row: AB (index 0, 1), Col: CD (index 2, 3)
      rowBits = binary.substring(0, 2);
      colBits = binary.substring(2, 4);
    }

    // Find all matching row and column indices
    const matchingRows: number[] = [];
    const grayRows = maxRows === 2 ? GRAY_CODE_2 : GRAY_CODE_4;
    for (let r = 0; r < maxRows; r++) {
      if (matchKey(rowBits, grayRows[r])) {
        matchingRows.push(r);
      }
    }

    const matchingCols: number[] = [];
    const grayCols = maxCols === 2 ? GRAY_CODE_2 : GRAY_CODE_4;
    for (let c = 0; c < maxCols; c++) {
      if (matchKey(colBits, grayCols[c])) {
        matchingCols.push(c);
      }
    }

    // Generate spans for rows and cols
    const rowSpans = findSpans(matchingRows, maxRows);
    const colSpans = findSpans(matchingCols, maxCols);

    // Cross-product row spans and col spans to form rectangles
    const rects: KMapRect[] = [];
    for (const rSpan of rowSpans) {
      for (const cSpan of colSpans) {
        rects.push({
          startRow: rSpan.start,
          endRow: rSpan.end,
          startCol: cSpan.start,
          endCol: cSpan.end,
        });
      }
    }

    return {
      term: termStr || '1',
      binary,
      rects,
      color: GROUP_COLORS[index % GROUP_COLORS.length],
    };
  });
}
