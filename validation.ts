/**
 * Kiln Code Validation (W3b.3 - AST-hardened)
 *
 * Validates generated Kiln code before rendering. Catches:
 *  - Missing/stray imports + exports (regex, cheap)
 *  - Missing `meta` const / `build` function (AST, accurate)
 *  - `value:` keyframe typos (regex, cheap)
 *  - Infinite loops (`while(true)`, `for(;;)` without break) — AST
 *  - Recursive `build()` calls that'd blow the stack — AST
 *  - Triangle budget estimate — AST sum of geometry calls
 *  - Syntax errors — acorn throws with line numbers
 *
 * Results are compatible with the prior shape (`valid` + `errors`) — the new
 * structured `errors` / `warnings` arrays are additive.
 *
 * Not caught statically (runtime-only, surfaced via renderGLB warnings):
 *  - Animation track targets that don't match any scene node
 *  - `build()` returning a non-Object3D
 *
 * Returned `code` values follow {@link KilnCodeValidationFailed} conventions —
 * see packages/core/src/errors.ts.
 */

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

// =============================================================================
// Types
// =============================================================================

export interface ValidationIssue {
  /** Stable code agents can branch on. */
  code: string;
  /** Human-readable description of the issue. */
  message: string;
  /** Agent-facing one-liner: what to change to fix. */
  fixHint?: string;
  /** 1-based source line where the issue was detected, when known. */
  line?: number;
}

export interface ValidationResult {
  valid: boolean;
  /**
   * Flat list of human-readable error messages. Kept for compatibility with
   * the pre-W3b.3 shape; existing consumers can keep using it unchanged.
   */
  errors: string[];
  /**
   * Structured error list — same set as `errors` but with codes, fix hints,
   * and line numbers. New agents should prefer this.
   */
  issues: ValidationIssue[];
  /**
   * Non-fatal advisories (tri budget, style suggestions). Never block
   * execution, always worth surfacing to agents.
   */
  warnings: ValidationIssue[];
}

// =============================================================================
// Budget table
// =============================================================================

/**
 * Rough static triangle estimates for every geometry primitive. Used to add a
 * "your asset is likely to blow the category budget" warning before a render
 * is attempted. Exact numbers come from Three.js's own primitive builders.
 */
function estimateGeometryTris(
  name: string,
  args: readonly acorn.Expression[]
): number | null {
  function asNum(node: acorn.Expression | undefined): number | null {
    if (!node) return null;
    if (node.type === 'Literal' && typeof node.value === 'number') return node.value;
    if (node.type === 'UnaryExpression' && node.operator === '-') {
      const inner = asNum(node.argument);
      return inner === null ? null : -inner;
    }
    return null;
  }

  switch (name) {
    case 'boxGeo':
      return 12; // 6 faces x 2 tris
    case 'planeGeo': {
      const ws = asNum(args[2]) ?? 1;
      const hs = asNum(args[3]) ?? 1;
      return Math.max(1, ws * hs) * 2;
    }
    case 'coneGeo': {
      const segs = asNum(args[2]) ?? 8;
      return segs * 2; // cap + sides
    }
    case 'cylinderGeo': {
      const segs = asNum(args[3]) ?? 8;
      return segs * 4; // side + 2 caps
    }
    case 'sphereGeo': {
      const w = asNum(args[1]) ?? 8;
      const h = asNum(args[2]) ?? 6;
      return w * h * 2;
    }
    case 'capsuleGeo': {
      const segs = asNum(args[2]) ?? 6;
      return segs * 8; // rough: body + caps
    }
    case 'torusGeo': {
      const rad = asNum(args[2]) ?? 8;
      const tub = asNum(args[3]) ?? 12;
      return rad * tub * 2;
    }
    default:
      return null;
  }
}

const CATEGORY_TRI_BUDGETS: Record<string, number> = {
  character: 5000,
  prop: 3000,
  vfx: 2000,
  environment: 15000,
};

// =============================================================================
// Core validator
// =============================================================================

/**
 * Validate Kiln code before rendering.
 *
 * @param code      raw JS string as returned by the LLM
 * @param opts      optional hints the validator can use for richer checks
 */
export function validate(
  code: string,
  opts: { category?: string } = {}
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    issues.push({
      code: 'EMPTY_CODE',
      message: 'Empty or missing code',
      fixHint: 'Provide a non-empty code string from the code generator.',
    });
    return toResult(issues, warnings);
  }

  // Normalize CRLF → LF so line numbers line up with what the LLM sees.
  const normalized = code.replace(/\r\n/g, '\n');

  // --- Regex pre-checks (cheap, catch malformed code before AST parse) -----

  if (/^\s*import\s+/m.test(normalized)) {
    issues.push({
      code: 'HAS_IMPORT',
      message: 'Contains import statements — code must use sandbox globals only',
      fixHint: 'Remove all `import` lines; primitives like boxGeo are already in scope.',
      line: findLineOf(normalized, /^\s*import\s+/m),
    });
  }

  if (/^\s*export\s+/m.test(normalized)) {
    issues.push({
      code: 'HAS_EXPORT',
      message: 'Contains export statements — just define meta, build, animate',
      fixHint: 'Remove `export` keywords; the sandbox evaluator picks up `meta` and `build` by name.',
      line: findLineOf(normalized, /^\s*export\s+/m),
    });
  }

  // The `value:` keyframe mistake is the single most common LLM regression.
  // Matched with a regex so we get it before the parser so failures point to
  // the exact line.
  const valueMatch = /\{\s*time:\s*[^,]+,\s*value:\s*\[/.exec(normalized);
  if (valueMatch) {
    issues.push({
      code: 'KEYFRAME_VALUE_KEY',
      message: 'Uses `value:` in keyframes — must use `rotation:` or `position:` instead',
      fixHint: 'In every `{ time, value: [...] }` change `value:` to `rotation:` (degrees) or `position:`.',
      line: lineOfIndex(normalized, valueMatch.index),
    });
  }

  // --- AST parse ---------------------------------------------------------

  let ast: acorn.Program;
  try {
    ast = acorn.parse(normalized, {
      ecmaVersion: 2022,
      sourceType: 'script',
      allowReturnOutsideFunction: false,
      locations: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // acorn error messages already include (line:col); extract it if present
    // so `line` is available structured even with the raw string around.
    const locMatch = /\((\d+):\d+\)/.exec(msg);
    issues.push({
      code: 'SYNTAX_ERROR',
      message: `Syntax error: ${msg}`,
      fixHint: 'Fix the syntax error at the reported line/column.',
      line: locMatch ? Number(locMatch[1]) : undefined,
    });
    // Can't continue AST-level checks without a tree — return now.
    return toResult(issues, warnings);
  }

  // --- Structural checks --------------------------------------------------

  const structure = analyzeTopLevel(ast);

  if (!structure.hasMetaConst) {
    issues.push({
      code: 'MISSING_META',
      message: 'Missing `const meta = { ... }` declaration at top level',
      fixHint: 'Add `const meta = { name: "YourAsset" };` at the top of the file.',
    });
  } else if (!structure.metaHasName) {
    warnings.push({
      code: 'META_MISSING_NAME',
      message: '`meta` object has no `name` property',
      fixHint: 'Add `name: "YourAsset"` to the meta object.',
    });
  }

  if (!structure.hasBuildFn) {
    issues.push({
      code: 'MISSING_BUILD',
      message: 'Missing top-level `function build()` declaration',
      fixHint:
        'Add `function build() { const root = createRoot("..."); ...; return root; }` at top level.',
    });
  }

  // --- Body analysis — infinite loops, recursion, tri budget --------------

  const analysis = analyzeBody(ast);

  if (analysis.infiniteLoops.length > 0) {
    for (const hit of analysis.infiniteLoops) {
      issues.push({
        code: 'INFINITE_LOOP',
        message: `${hit.kind} with no break statement`,
        fixHint: `Add a break/return condition inside the ${hit.kind} loop, or switch to a bounded for/forEach.`,
        line: hit.line,
      });
    }
  }

  if (analysis.recursiveBuild) {
    issues.push({
      code: 'RECURSIVE_BUILD',
      message: '`build()` calls itself — will blow the stack at render time',
      fixHint: 'Refactor the recursive step into a helper function; keep `build()` non-recursive.',
      line: analysis.recursiveBuild,
    });
  }

  // Tri-count advisory. Only warn; LLMs over- and under-estimate both ways.
  if (analysis.estimatedTris > 0) {
    const budget = opts.category ? CATEGORY_TRI_BUDGETS[opts.category] : undefined;
    if (budget && analysis.estimatedTris > budget * 1.5) {
      warnings.push({
        code: 'TRI_BUDGET_EXCEEDED',
        message: `Estimated ${analysis.estimatedTris} tris — category "${opts.category}" suggests <= ${budget}`,
        fixHint: 'Reduce segments on cylinderGeo/sphereGeo, or drop decorative parts.',
      });
    }
  }

  return toResult(issues, warnings);
}

// Backward-compat alias.
export const validateKilnCode = validate;

// =============================================================================
// Internals
// =============================================================================

function toResult(
  issues: ValidationIssue[],
  warnings: ValidationIssue[]
): ValidationResult {
  return {
    valid: issues.length === 0,
    errors: issues.map((i) => i.message),
    issues,
    warnings,
  };
}

function findLineOf(code: string, re: RegExp): number | undefined {
  const match = re.exec(code);
  if (!match) return undefined;
  return lineOfIndex(code, match.index);
}

function lineOfIndex(code: string, idx: number): number {
  let line = 1;
  for (let i = 0; i < idx; i++) if (code.charCodeAt(i) === 10) line++;
  return line;
}

// -----------------------------------------------------------------------------
// Top-level shape
// -----------------------------------------------------------------------------

interface TopLevelStructure {
  hasMetaConst: boolean;
  metaHasName: boolean;
  hasBuildFn: boolean;
  hasAnimateFn: boolean;
}

function analyzeTopLevel(ast: acorn.Program): TopLevelStructure {
  const out: TopLevelStructure = {
    hasMetaConst: false,
    metaHasName: false,
    hasBuildFn: false,
    hasAnimateFn: false,
  };

  for (const stmt of ast.body) {
    if (
      stmt.type === 'VariableDeclaration' &&
      (stmt.kind === 'const' || stmt.kind === 'let')
    ) {
      for (const decl of stmt.declarations) {
        if (decl.id.type === 'Identifier' && decl.id.name === 'meta') {
          out.hasMetaConst = true;
          if (decl.init && decl.init.type === 'ObjectExpression') {
            out.metaHasName = decl.init.properties.some(
              (p) =>
                p.type === 'Property' &&
                !p.computed &&
                ((p.key.type === 'Identifier' && p.key.name === 'name') ||
                  (p.key.type === 'Literal' && p.key.value === 'name'))
            );
          }
        }
      }
    } else if (stmt.type === 'FunctionDeclaration' && stmt.id) {
      if (stmt.id.name === 'build') out.hasBuildFn = true;
      if (stmt.id.name === 'animate') out.hasAnimateFn = true;
    }
  }

  return out;
}

// -----------------------------------------------------------------------------
// Body walk — loops, recursion, geometry calls
// -----------------------------------------------------------------------------

interface BodyAnalysis {
  infiniteLoops: Array<{ kind: 'while(true)' | 'for(;;)'; line?: number }>;
  recursiveBuild: number | undefined; // line number of the self-call
  estimatedTris: number;
}

function analyzeBody(ast: acorn.Program): BodyAnalysis {
  const infiniteLoops: BodyAnalysis['infiniteLoops'] = [];
  let recursiveBuild: number | undefined;
  let estimatedTris = 0;

  // Track the enclosing function for recursion detection.
  const stack: string[] = [];

  walk.ancestor(ast, {
    FunctionDeclaration(node, _state, ancestors) {
      void _state;
      void ancestors;
      if (node.id?.name) stack.push(node.id.name);
    },
    WhileStatement(node) {
      if (isConstantTruthy(node.test) && !hasBreak(node.body)) {
        infiniteLoops.push({ kind: 'while(true)', line: node.loc?.start.line });
      }
    },
    ForStatement(node) {
      // for(;;) with no test (always-true) and no break is infinite.
      if (!node.test && !hasBreak(node.body)) {
        infiniteLoops.push({ kind: 'for(;;)', line: node.loc?.start.line });
      } else if (node.test && isConstantTruthy(node.test) && !hasBreak(node.body)) {
        infiniteLoops.push({ kind: 'for(;;)', line: node.loc?.start.line });
      }
    },
    CallExpression(node, _state, ancestors) {
      void _state;
      // Recursion detection: `build()` invoked from inside build's body.
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'build' &&
        insideFunctionNamed(ancestors, 'build')
      ) {
        recursiveBuild ??= node.loc?.start.line;
      }

      // Tri estimate — count geometry primitive calls at any depth.
      if (node.callee.type === 'Identifier') {
        const est = estimateGeometryTris(node.callee.name, node.arguments as acorn.Expression[]);
        if (est !== null) estimatedTris += est;
      }
    },
  });

  return { infiniteLoops, recursiveBuild, estimatedTris };
}

function insideFunctionNamed(
  ancestors: readonly acorn.AnyNode[],
  name: string
): boolean {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const node = ancestors[i];
    if (!node) continue;
    if (node.type === 'FunctionDeclaration' && node.id?.name === name) return true;
  }
  return false;
}

function isConstantTruthy(node: acorn.Expression): boolean {
  if (node.type === 'Literal') {
    return Boolean(node.value);
  }
  if (node.type === 'Identifier') return false;
  // `1` / `!0` / `true` all show up as Literal or UnaryExpression.
  if (node.type === 'UnaryExpression' && node.operator === '!') {
    // `!0` -> truthy, `!1` -> falsy, `!true` -> falsy, `!false` -> truthy.
    if (node.argument.type === 'Literal') return !node.argument.value;
  }
  return false;
}

function hasBreak(body: acorn.Statement): boolean {
  let found = false;
  walk.simple(body, {
    BreakStatement() {
      found = true;
    },
    ReturnStatement() {
      found = true;
    },
    ThrowStatement() {
      found = true;
    },
  });
  return found;
}
