/**
 * Hardened kiln validation tests (W3b.3)
 *
 * Covers the AST-level checks added on top of the regex validator:
 *   - Missing meta/build still caught
 *   - Infinite loops (while-true, for-empty)
 *   - Recursive build() self-calls
 *   - Tri budget advisory
 *   - Syntax errors surface with a line number
 *   - Structured `issues[]` shape carries codes + fix hints
 */

import { describe, expect, test } from 'bun:test';

import { validate } from '../validation';

describe('kiln validation — regex layer (preserved)', () => {
  test('accepts a minimal well-formed program', () => {
    const r = validate(`
const meta = { name: 'Ok' };
function build() {
  return createRoot('Ok');
}
`);
    expect(r.valid).toBe(true);
    expect(r.issues).toEqual([]);
  });

  test('rejects stray imports', () => {
    const r = validate(`import * as THREE from 'three';
const meta = { name: 'X' };
function build() { return createRoot('X'); }`);
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === 'HAS_IMPORT')).toBe(true);
    const imp = r.issues.find((i) => i.code === 'HAS_IMPORT');
    expect(imp?.line).toBe(1);
    expect(imp?.fixHint).toBeDefined();
  });

  test('rejects exports', () => {
    const r = validate(`
const meta = { name: 'X' };
export function build() { return createRoot('X'); }
`);
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === 'HAS_EXPORT')).toBe(true);
  });

  test('rejects value: keyframes with a line hint', () => {
    const r = validate(`
const meta = { name: 'X' };
function build() { return createRoot('X'); }
function animate() {
  return [createClip('c', 1, [
    rotationTrack('Joint_A', [{ time: 0, value: [0, 0, 0] }])
  ])];
}
`);
    expect(r.valid).toBe(false);
    const hit = r.issues.find((i) => i.code === 'KEYFRAME_VALUE_KEY');
    expect(hit).toBeDefined();
    expect(hit?.line).toBeGreaterThan(1);
  });
});

describe('kiln validation — AST structure', () => {
  test('flags missing meta declaration', () => {
    const r = validate(`
function build() { return createRoot('X'); }
`);
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === 'MISSING_META')).toBe(true);
  });

  test('flags missing build function', () => {
    const r = validate(`
const meta = { name: 'X' };
`);
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === 'MISSING_BUILD')).toBe(true);
  });

  test('warns when meta has no name', () => {
    const r = validate(`
const meta = { category: 'prop' };
function build() { return createRoot('X'); }
`);
    // Missing `name` is a warning, not a hard error.
    expect(r.valid).toBe(true);
    expect(r.warnings.some((w) => w.code === 'META_MISSING_NAME')).toBe(true);
  });
});

describe('kiln validation — AST infinite loops', () => {
  test('catches while(true) with no break', () => {
    const r = validate(`
const meta = { name: 'X' };
function build() {
  const root = createRoot('X');
  while (true) {
    root.position.x += 1;
  }
  return root;
}
`);
    expect(r.valid).toBe(false);
    const hit = r.issues.find((i) => i.code === 'INFINITE_LOOP');
    expect(hit).toBeDefined();
    expect(hit?.line).toBeGreaterThan(0);
  });

  test('accepts while(true) that contains a break', () => {
    const r = validate(`
const meta = { name: 'X' };
function build() {
  const root = createRoot('X');
  let i = 0;
  while (true) {
    if (i++ > 10) break;
  }
  return root;
}
`);
    expect(r.valid).toBe(true);
  });

  test('catches for(;;) with no break', () => {
    const r = validate(`
const meta = { name: 'X' };
function build() {
  const root = createRoot('X');
  for (;;) {
    root.scale.x *= 1.1;
  }
  return root;
}
`);
    expect(r.valid).toBe(false);
    expect(r.issues.some((i) => i.code === 'INFINITE_LOOP')).toBe(true);
  });

  test('accepts an ordinary for loop', () => {
    const r = validate(`
const meta = { name: 'X' };
function build() {
  const root = createRoot('X');
  for (let i = 0; i < 4; i++) {
    createPivot('Leg' + i, [i, 0, 0], root);
  }
  return root;
}
`);
    expect(r.valid).toBe(true);
  });

  test('accepts while(cond) where cond is a binding', () => {
    const r = validate(`
const meta = { name: 'X' };
function build() {
  const root = createRoot('X');
  let n = 5;
  while (n > 0) { n--; }
  return root;
}
`);
    expect(r.valid).toBe(true);
  });
});

describe('kiln validation — AST recursion', () => {
  test('catches build() calling itself', () => {
    const r = validate(`
const meta = { name: 'X' };
function build() {
  if (Math.random() < 0.5) return build();
  return createRoot('X');
}
`);
    expect(r.valid).toBe(false);
    const hit = r.issues.find((i) => i.code === 'RECURSIVE_BUILD');
    expect(hit).toBeDefined();
    expect(hit?.line).toBeGreaterThan(0);
  });

  test('does not flag helper calling itself', () => {
    const r = validate(`
const meta = { name: 'X' };
function helper(n) { if (n > 0) helper(n - 1); }
function build() {
  const root = createRoot('X');
  helper(3);
  return root;
}
`);
    expect(r.valid).toBe(true);
  });
});

describe('kiln validation — syntax errors', () => {
  test('surfaces syntax errors with a line number', () => {
    const r = validate(`
const meta = { name: 'X' };
function build() {
  const root = createRoot('X')
  return root
`);
    expect(r.valid).toBe(false);
    const hit = r.issues.find((i) => i.code === 'SYNTAX_ERROR');
    expect(hit).toBeDefined();
    expect(hit?.line).toBeGreaterThan(0);
  });

  test('empty string is rejected with EMPTY_CODE', () => {
    const r = validate('');
    expect(r.valid).toBe(false);
    expect(r.issues[0]?.code).toBe('EMPTY_CODE');
  });
});

describe('kiln validation — tri budget advisory', () => {
  test('warns when a prop exceeds its tri budget', () => {
    // 20x sphereGeo(1, 32, 32) -> 20 * 2048 = 40960 tris, dwarfs prop 3000.
    const geo = Array.from({ length: 20 })
      .map(
        () =>
          "  createPart('S' + Math.random(), sphereGeo(1, 32, 32), gameMaterial(0xff0000), { parent: root });",
      )
      .join('\n');
    const r = validate(
      `
const meta = { name: 'Heavy' };
function build() {
  const root = createRoot('Heavy');
${geo}
  return root;
}
`,
      { category: 'prop' },
    );
    expect(r.valid).toBe(true);
    expect(r.warnings.some((w) => w.code === 'TRI_BUDGET_EXCEEDED')).toBe(true);
  });

  test('does not warn without a category hint', () => {
    // Same heavy scene, but no category → we don't have a budget to compare.
    const r = validate(`
const meta = { name: 'Heavy' };
function build() {
  const root = createRoot('Heavy');
  createPart('S', sphereGeo(1, 32, 32), gameMaterial(0xff0000), { parent: root });
  return root;
}
`);
    expect(r.warnings.some((w) => w.code === 'TRI_BUDGET_EXCEEDED')).toBe(false);
  });
});

describe('kiln validation — shape compatibility', () => {
  test('errors[] mirrors issues[].message', () => {
    const r = validate(`import 'x';
const meta = { name: 'X' };
function build() { return createRoot('X'); }
`);
    expect(r.errors).toEqual(r.issues.map((i) => i.message));
  });
});

describe('kiln validation — rotation units lint (ROTATION_RADIANS_SUSPECTED)', () => {
  const wrap = (body: string) => `
const meta = { name: 'X' };
function build() {
  const root = createRoot('X');
  ${body}
  return root;
}`;

  const radianWarnings = (code: string) =>
    validate(code).warnings.filter((w) => w.code === 'ROTATION_RADIANS_SUSPECTED');

  test('flags a numeric radian triple with the degree equivalent', () => {
    const w = radianWarnings(
      wrap(
        `createPart('Grip', boxGeo(1, 1, 1), gameMaterial(0x333333), { rotation: [0, 0, 0.785], parent: root });`,
      ),
    );
    expect(w.length).toBe(1);
    expect(w[0]!.message).toContain('[0, 0, 0.785]');
    expect(w[0]!.message).toContain('[0, 0, 45]');
    expect(w[0]!.line).toBeDefined();
    // Advisory only — the program is still valid.
    expect(
      validate(
        wrap(
          `createPart('G', boxGeo(1,1,1), gameMaterial(0x333333), { rotation: [0, 0, 0.785], parent: root });`,
        ),
      ).valid,
    ).toBe(true);
  });

  test('flags Math.PI expressions (the -Math.PI/2 fin case)', () => {
    const w = radianWarnings(
      wrap(
        `createPart('Fin', wingGeo({ span: 3 }), gameMaterial(0x445522), { rotation: [-Math.PI / 2, 0, 0], parent: root });`,
      ),
    );
    expect(w.length).toBe(1);
    expect(w[0]!.message).toContain('RADIANS');
  });

  test('does NOT flag the rad-to-deg conversion idiom (a * 180 / Math.PI)', () => {
    const w = radianWarnings(
      wrap(`const a = 0.5;
  createPart('Blade', boxGeo(0.06, 1.7, 0.27), gameMaterial(0x111111), { rotation: [a * 180 / Math.PI, 0, 0], parent: root });`),
    );
    expect(w).toEqual([]);
  });

  test('does NOT flag degree-style values', () => {
    const cases = [
      '[0, 0, 90]',
      '[0, 0, -15]',
      '[0, 0, 28.6]',
      '[0, 45, 0.5]',
      '[0, 0, 0]',
      '[0, 0, 1]',
    ];
    for (const rot of cases) {
      const w = radianWarnings(
        wrap(
          `createPart('P', boxGeo(1, 1, 1), gameMaterial(0x333333), { rotation: ${rot}, parent: root });`,
        ),
      );
      expect(w).toEqual([]);
    }
  });

  test('stays quiet on dynamic expressions it cannot read', () => {
    const w = radianWarnings(
      wrap(`const tilt = 17;
  createPart('P', boxGeo(1, 1, 1), gameMaterial(0x333333), { rotation: [0, 0, tilt], parent: root });`),
    );
    expect(w).toEqual([]);
  });

  test('covers createInstance and ignores unrelated rotation keys', () => {
    const w = radianWarnings(
      wrap(`const src = createPart('W', cylinderZGeo(0.5, 0.5, 0.3), gameMaterial(0x222222), { parent: root });
  createInstance('W2', src, { position: [1, 0, 0], rotation: [0, 1.57, 0], parent: root });
  rotationTrack('Joint_X', [{ time: 0, rotation: [0, 0, 0] }, { time: 1, rotation: [0, 0, 0.5] }]);`),
    );
    expect(w.length).toBe(1);
    expect(w[0]!.message).toContain('createInstance');
  });
});
