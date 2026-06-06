# Boolean Algebra Truth Table Generator - Complete Project Specification

## Project Overview

Create a modern, responsive web application that accepts Boolean Algebra expressions and automatically generates truth tables, logic circuit visualizations, Karnaugh Maps, and simplified expressions.

The application should be educational, visually appealing, mobile-friendly, and suitable for engineering students studying Digital Logic Design.

---

# Core Features

## 1. Boolean Expression Input

Users should be able to enter Boolean expressions in multiple formats:

### Supported Operators

| Operation | Symbols          |
| --------- | ---------------- |
| AND       | AB, A.B, A AND B |
| OR        | A+B, A OR B      |
| NOT       | A', !A, NOT A    |
| XOR       | A⊕B, A XOR B     |
| XNOR      | A⊙B, A XNOR B    |
| NAND      | A ↑ B            |
| NOR       | A ↓ B            |

### Example Inputs

```text
A+B
AB
(A+B)'
(A+B)(C+D)
A⊕B
(A+B')C
(A.B)+(C.D)
```

### Input Features

* Real-time validation
* Syntax error detection
* Auto-formatting
* Supported syntax guide
* Sample expressions
* Expression history
* Copy/Paste support

---

# 2. Truth Table Generator

Automatically:

* Detect variables
* Generate all combinations
* Evaluate expression
* Display output

Example:

| A | B | C | Output |
| - | - | - | ------ |
| 0 | 0 | 0 | 0      |
| 0 | 0 | 1 | 1      |
| 0 | 1 | 0 | 1      |
| 0 | 1 | 1 | 0      |

Features:

* Sortable columns
* Sticky headers
* Responsive design
* Export table
* Search rows
* Highlight outputs

---

# 3. Step-by-Step Evaluation

Display how the expression is evaluated.

Example:

Expression:

(A+B')C

Step 1:

B' = NOT B

Step 2:

A + B'

Step 3:

(A+B') AND C

Final Output

This helps students learn Boolean algebra.

---

# 4. Logic Circuit Diagram Generator

Automatically generate circuit diagrams using SVG.

Supported Gates:

* AND
* OR
* NOT
* XOR
* XNOR
* NAND
* NOR

Features:

* Zoom
* Pan
* Download as PNG
* Download as SVG
* Dark Mode compatible

---

# 5. Karnaugh Map Generator

Automatically generate:

### 2 Variables

A, B

### 3 Variables

A, B, C

### 4 Variables

A, B, C, D

Display:

* Gray Code ordering
* Highlighted groups
* Simplification hints

---

# 6. Expression Simplification

Implement:

## Method 1

Karnaugh Map Simplification

## Method 2

Quine-McCluskey Algorithm

Show:

Original Expression

↓

Simplified Expression

↓

Reduction Percentage

Example:

AB + AB'

↓

A

Reduction: 50%

---

# 7. Canonical Forms

Generate:

### SOP

Sum of Products

### POS

Product of Sums

### Minterms

Σm(...)

### Maxterms

ΠM(...)

Example:

Σm(1,3,5,7)

ΠM(0,2,4,6)

---

# 8. Variable Statistics

Display:

Variables Found: 4

Rows Generated: 16

Expression Depth: 3

Gate Count Required: 8

Complexity Score: Medium

---

# 9. Educational Panel

Show explanations:

* What is Boolean Algebra
* Truth Tables
* Logic Gates
* Karnaugh Maps
* SOP vs POS
* XOR vs XNOR
* NAND Universal Gate
* NOR Universal Gate

Include diagrams and examples.

---

# 10. Theme System

Provide:

### Light Mode

### Dark Mode

### System Mode

Save preference in local storage.

---

# 11. Export Features

Export:

### PDF

Truth Table

### PNG

Circuit Diagram

### SVG

Circuit Diagram

### CSV

Truth Table

### JSON

Expression Data

---

# 12. Expression Library

Preloaded examples:

Basic:

```text
A+B
AB
A'
```

Intermediate:

```text
(A+B')C
A⊕B
(A+B)(C+D)
```

Advanced:

```text
(A+B')(C+D')+(A⊕B)
```

---

# 13. Performance Requirements

Support:

* Up to 8 variables
* Up to 256 truth table rows
* Real-time updates
* Fast expression parsing

---

# 14. UI Design Requirements

Design Style:

Modern Educational SaaS

Inspired By:

* Notion
* Linear
* Vercel
* Figma

Requirements:

* Glassmorphism effects
* Smooth animations
* Responsive design
* Modern typography
* Professional color palette
* Accessible UI

---

# 15. Pages

## Home

Expression Input

## Truth Table

Generated table

## Circuit Diagram

Logic gates visualization

## Karnaugh Map

K-map simplification

## Learn

Educational content

## About

Project details

---

# Recommended Tech Stack

Frontend:

* React
* TypeScript
* Tailwind CSS
* Framer Motion

Libraries:

* mathjs
* dagre
* reactflow
* jspdf
* html2canvas

State Management:

* Zustand

Build Tool:

* Vite

---

# Bonus Features

* Share expression via URL
* Save projects locally
* Recently used expressions
* Keyboard shortcuts
* Multi-language support
* PWA support
* Offline functionality
* Voice input
* AI explanation of expression
* Interactive gate simulation

---

# Deliverables

Create a production-ready application with:

* Clean folder structure
* Reusable React components
* TypeScript types
* Responsive UI
* Modern design
* Optimized performance
* Error handling
* Loading states
* Accessibility support
* Comprehensive documentation

The final application should feel like a professional educational tool used by engineering and computer science students to learn Digital Logic Design.
