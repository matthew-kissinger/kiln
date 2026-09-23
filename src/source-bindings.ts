import type * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const functions = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);
const lexicalScopes = new Set([
  'Program',
  'BlockStatement',
  'StaticBlock',
  'CatchClause',
  'SwitchStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'ClassDeclaration',
  'ClassExpression',
  ...functions,
]);

/** Binding visibility for pre-execution diagnostics, not a TDZ or reachability checker. */
export function sourceBindings(ast: acorn.Program) {
  const scopes = new Map<acorn.Node, Set<string>>();
  const allNames = new Set<string>();
  const sloppyFunctions: { id: acorn.Identifier; ancestors: acorn.Node[]; scope: acorn.Node }[] =
    [];
  const bind = (scope: acorn.Node, pattern: acorn.Node | null | undefined): void => {
    if (!pattern) return;
    const node = pattern as acorn.AnyNode;
    if (node.type === 'Identifier') {
      let names = scopes.get(scope);
      if (!names) {
        names = new Set();
        scopes.set(scope, names);
      }
      names.add(node.name);
      allNames.add(node.name);
    } else if (node.type === 'ObjectPattern') {
      for (const p of node.properties) bind(scope, p.type === 'Property' ? p.value : p.argument);
    } else if (node.type === 'ArrayPattern') {
      for (const item of node.elements) bind(scope, item);
    } else if (node.type === 'AssignmentPattern') bind(scope, node.left);
    else if (node.type === 'RestElement') bind(scope, node.argument);
  };
  const scopeFor = (ancestors: acorn.Node[], variable = false): acorn.Node => {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const node = ancestors[i]!;
      if (!variable && lexicalScopes.has(node.type)) return node;
      // Body declarations cannot shadow a function's parameter initializers.
      if (
        node.type === 'Program' ||
        node.type === 'StaticBlock' ||
        (node.type === 'BlockStatement' && functions.has(ancestors[i - 1]?.type ?? ''))
      )
        return node;
    }
    return ast;
  };
  walk.ancestor(ast, {
    VariableDeclaration(node, _state, ancestors) {
      for (const declaration of node.declarations)
        bind(scopeFor(ancestors, node.kind === 'var'), declaration.id);
    },
    Function(node, _state, ancestors) {
      for (const parameter of node.params) bind(node, parameter);
      if (node.type === 'FunctionDeclaration') {
        const outer = ancestors.slice(0, -1);
        bind(scopeFor(outer), node.id);
        // Authored scripts are not implicitly strict. Annex B block functions
        // can also bind in the enclosing body; retain those legitimate locals.
        // Strictness is resolved below before adding that extra binding.
        const isStrict = ancestors.some((ancestor) => {
          if (ancestor.type === 'ClassDeclaration' || ancestor.type === 'ClassExpression')
            return true;
          const body = ancestor as acorn.Program | acorn.BlockStatement;
          return (
            Array.isArray(body.body) &&
            body.body.some(
              (statement, index, list) =>
                statement.type === 'ExpressionStatement' &&
                'directive' in statement &&
                statement.directive === 'use strict' &&
                list.slice(0, index).every((prior) => 'directive' in prior),
            )
          );
        });
        if (!isStrict && node.id)
          sloppyFunctions.push({ id: node.id, ancestors: outer, scope: scopeFor(outer) });
      } else bind(node, node.id);
    },
    Class(node, _state, ancestors) {
      bind(node, node.id);
      if (node.type === 'ClassDeclaration') bind(scopeFor(ancestors.slice(0, -1)), node.id);
    },
    CatchClause(node) {
      bind(node, node.param);
    },
  });
  // Annex B hoisting is suppressed by an intervening lexical binding. Resolve
  // this after collecting declarations so statement order cannot hide one.
  for (const { id, ancestors, scope } of sloppyFunctions) {
    const target = scopeFor(ancestors, true);
    const between = ancestors.slice(ancestors.indexOf(target) + 1);
    if (
      !between.some(
        (node) => node !== scope && node.type !== 'CatchClause' && scopes.get(node)?.has(id.name),
      )
    )
      bind(target, id);
  }
  return {
    allNames,
    has(name: string, ancestors: acorn.Node[]): boolean {
      return ancestors.some((node, index) => {
        // A switch's discriminant executes outside its case bindings.
        if (
          node.type === 'SwitchStatement' &&
          (node as acorn.SwitchStatement).discriminant === ancestors[index + 1]
        )
          return false;
        return scopes.get(node)?.has(name) ?? false;
      });
    },
  };
}
