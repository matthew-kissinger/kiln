import { KILN_SEMANTIC_ROLES, readSemanticMetadataV1FromExtras } from '../contracts';

export interface ArchitectureViewNode {
  name?: string;
  visible?: boolean;
  userData?: Record<string, unknown>;
  children?: ArchitectureViewNode[];
}

export type ArchitectureRoofSelectionMode = 'semantic' | 'legacy-name' | 'none';

export interface ArchitectureRoofSelection {
  mode: ArchitectureRoofSelectionMode;
  /** Minimal subtree roots: a selected ancestor suppresses selected descendants. */
  nodes: ArchitectureViewNode[];
}

/** Derived from the shared vocabulary so a role rename cannot desync the views. */
export const ARCHITECTURE_ROOF_ROLE_PREFIXES = Object.freeze([
  `${KILN_SEMANTIC_ROLES.roof}.`,
  `${KILN_SEMANTIC_ROLES.architectureRoof}.`,
]);

function nodeRoles(node: ArchitectureViewNode): readonly string[] {
  return readSemanticMetadataV1FromExtras(node.userData ?? {})?.roles ?? [];
}

export function hasArchitectureRoofRole(node: ArchitectureViewNode): boolean {
  return nodeRoles(node).some((role) =>
    ARCHITECTURE_ROOF_ROLE_PREFIXES.some((prefix) => role.startsWith(prefix)),
  );
}

function legacyRoofName(name: string | undefined): boolean {
  if (!name) return false;
  // Deliberately does not match "RooftopGarden" or "RoofRack". This fallback
  // exists only for historical Kiln roof naming conventions.
  return /^roof(?:$|[_. -]|(?:slope|panel|gable|ridge)|[ab](?:$|[_. -]))/i.test(name.trim());
}

function minimalMatches(
  root: ArchitectureViewNode,
  predicate: (node: ArchitectureViewNode) => boolean,
): ArchitectureViewNode[] {
  const matches: ArchitectureViewNode[] = [];
  const visit = (node: ArchitectureViewNode, ancestorMatched: boolean): void => {
    const matched = predicate(node);
    if (matched && !ancestorMatched) matches.push(node);
    for (const child of node.children ?? []) visit(child, ancestorMatched || matched);
  };
  visit(root, false);
  return matches;
}

/**
 * Resolve a separable roof from portable semantic roles. Historical name
 * inference is consulted only when the asset carries no roof semantics at all.
 */
export function selectArchitectureRoofNodes(root: unknown): ArchitectureRoofSelection {
  const candidate = root as ArchitectureViewNode;
  const semantic = minimalMatches(candidate, hasArchitectureRoofRole);
  if (semantic.length > 0) return { mode: 'semantic', nodes: semantic };
  const legacy = minimalMatches(candidate, (node) => legacyRoofName(node.name));
  return legacy.length > 0 ? { mode: 'legacy-name', nodes: legacy } : { mode: 'none', nodes: [] };
}

function setSubtreeVisibility(node: ArchitectureViewNode, visible: boolean): void {
  node.visible = visible;
  for (const child of node.children ?? []) setSubtreeVisibility(child, visible);
}

/** Hide the whole selected roof and no non-roof sibling. Returns subtree roots hidden. */
export function hideArchitectureRoofInScene(root: unknown): ArchitectureRoofSelection {
  const selection = selectArchitectureRoofNodes(root);
  for (const node of selection.nodes) setSubtreeVisibility(node, false);
  return selection;
}
